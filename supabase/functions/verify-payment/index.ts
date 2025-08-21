import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
  amount: number; // Amount in INR
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId, 
      amount 
    }: VerifyPaymentRequest = await req.json();

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment details');
    }

    if (!userId || userId !== user.id) {
      throw new Error('Invalid user ID');
    }

    // Verify signature using HMAC SHA256
    const RAZORPAY_KEY_SECRET = 'E4jxva6D1znde3bIKQCKIveF';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = await createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Log failed verification
      await supabaseClient
        .from('coin_transactions')
        .update({
          razorpay_payment_id: razorpay_payment_id,
          status: 'failed'
        })
        .eq('reference_id', razorpay_order_id)
        .eq('user_id', user.id);

      throw new Error('Invalid payment signature');
    }

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabaseClient
      .from('wallets')
      .select('coin_balance')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      // Create wallet if it doesn't exist
      const { error: createWalletError } = await supabaseClient
        .from('wallets')
        .insert({
          user_id: user.id,
          coin_balance: 0,
          total_deposited: 0,
          total_withdrawn: 0
        });

      if (createWalletError) {
        throw new Error('Failed to create wallet');
      }
    }

    const currentBalance = wallet?.coin_balance || 0;
    const coinsToAdd = Math.floor(amount / 10); // ₹10 = 1 coin
    const newBalance = currentBalance + coinsToAdd;

    // Update wallet balance and total deposited
    const { error: updateWalletError } = await supabaseClient
      .from('wallets')
      .upsert({
        user_id: user.id,
        coin_balance: newBalance,
        total_deposited: supabaseClient.raw(`COALESCE(total_deposited, 0) + ${amount}`),
        updated_at: new Date().toISOString()
      });

    if (updateWalletError) {
      throw new Error('Failed to update wallet balance');
    }

    // Update transaction record
    const { error: transactionError } = await supabaseClient
      .from('coin_transactions')
      .update({
        balance_before: currentBalance,
        balance_after: newBalance,
        razorpay_payment_id: razorpay_payment_id,
        status: 'completed'
      })
      .eq('reference_id', razorpay_order_id)
      .eq('user_id', user.id);

    if (transactionError) {
      console.error('Transaction update error:', transactionError);
      // Don't throw error here as payment is already successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        coinsAdded: coinsToAdd,
        newBalance: newBalance,
        paymentId: razorpay_payment_id
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
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