import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  userId: string;
  amount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature, 
      userId, 
      amount 
    }: VerifyPaymentRequest = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !userId || !amount) {
      throw new Error('Missing required parameters');
    }

    // In production, you would verify the signature with Razorpay here
    // For demo purposes, we'll assume the payment is valid

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

    // Update user wallet balance
    const newBalance = user.wallet_balance + amount;
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Update transaction status
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .update({ 
        status: 'completed',
        reference_id: razorpay_payment_id
      })
      .eq('reference_id', razorpay_order_id)
      .eq('user_id', userId);

    if (transactionError) throw transactionError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        newBalance,
        paymentId: razorpay_payment_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});