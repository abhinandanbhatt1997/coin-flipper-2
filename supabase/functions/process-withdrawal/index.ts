import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WithdrawalRequest {
  amount: number;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId }: WithdrawalRequest = await req.json();

    if (!amount || amount < 100) {
      throw new Error('Minimum withdrawal amount is ₹100');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current user balance
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (userError) throw new Error('User not found');

    if (user.wallet_balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update user wallet balance
    const newBalance = user.wallet_balance - amount;
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create withdrawal transaction
    const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: -amount,
        status: 'completed', // In production, this might be 'pending'
        reference_id: withdrawalId
      });

    if (transactionError) throw transactionError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        newBalance,
        withdrawalId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});