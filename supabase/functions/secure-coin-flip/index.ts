import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CoinFlipRequest {
  user_choice: 'heads' | 'tails';
  coins_bet: number;
  multiplier?: number;
}

interface CoinFlipResponse {
  success: boolean;
  result?: {
    user_choice: string;
    actual_result: string;
    is_winner: boolean;
    coins_bet: number;
    coins_won: number;
    new_balance: number;
    game_id: string;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for secure operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { user_choice, coins_bet, multiplier = 2.0 }: CoinFlipRequest = await req.json();

    // Validate input
    if (!user_choice || !['heads', 'tails'].includes(user_choice)) {
      throw new Error('Invalid user choice. Must be "heads" or "tails"');
    }

    if (!coins_bet || coins_bet <= 0 || coins_bet > 1000) {
      throw new Error('Invalid bet amount. Must be between 1 and 1000 coins');
    }

    // Get user's current wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('coin_balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.coin_balance < coins_bet) {
      throw new Error('Insufficient coin balance');
    }

    // Generate secure random result using Web Crypto API
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomValue = randomArray[0] / (0xFFFFFFFF + 1); // Convert to 0-1 range
    
    const actual_result: 'heads' | 'tails' = randomValue < 0.5 ? 'heads' : 'tails';
    const is_winner = user_choice === actual_result;
    const coins_won = is_winner ? Math.floor(coins_bet * multiplier) : 0;

    // Start transaction
    const { data: gameResult, error: gameError } = await supabaseClient
      .from('game_results')
      .insert({
        user_id: user.id,
        game_type: 'coin_flip',
        user_choice,
        actual_result,
        is_winner,
        coins_bet,
        coins_won,
        multiplier
      })
      .select()
      .single();

    if (gameError) {
      throw new Error('Failed to create game result');
    }

    // Deduct bet amount
    const { error: betError } = await supabaseClient
      .rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: -coins_bet,
        p_type: 'game_bet',
        p_reference_id: gameResult.id
      });

    if (betError) {
      throw new Error('Failed to deduct bet amount');
    }

    // Add winnings if won
    if (is_winner && coins_won > 0) {
      const { error: winError } = await supabaseClient
        .rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: coins_won,
          p_type: 'game_win',
          p_reference_id: gameResult.id
        });

      if (winError) {
        throw new Error('Failed to add winnings');
      }
    }

    // Get updated balance
    const { data: updatedWallet, error: balanceError } = await supabaseClient
      .from('wallets')
      .select('coin_balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError) {
      throw new Error('Failed to get updated balance');
    }

    const response: CoinFlipResponse = {
      success: true,
      result: {
        user_choice,
        actual_result,
        is_winner,
        coins_bet,
        coins_won,
        new_balance: updatedWallet.coin_balance,
        game_id: gameResult.id
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Coin flip error:', error);
    
    const errorResponse: CoinFlipResponse = {
      success: false,
      error: error.message || 'Internal server error'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});