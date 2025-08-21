import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateOrderRequest {
  amount: number; // Amount in INR
  userId: string;
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

    const { amount, userId }: CreateOrderRequest = await req.json();

    // Validate input
    if (!amount || amount < 100 || amount > 100000) {
      throw new Error('Invalid amount. Must be between ₹100 and ₹1,00,000');
    }

    if (!userId || userId !== user.id) {
      throw new Error('Invalid user ID');
    }

    // Razorpay credentials
    const RAZORPAY_KEY_ID = 'rzp_test_R7vb9wFN6wVXig';
    const RAZORPAY_KEY_SECRET = 'E4jxva6D1znde3bIKQCKIveF';

    // Create Razorpay order
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user.id.slice(0, 8)}`,
      notes: {
        user_id: user.id,
        purpose: 'wallet_topup'
      }
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('Razorpay API error:', errorData);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Store pending transaction in database
    const { error: transactionError } = await supabaseClient
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: Math.floor(amount / 10), // Convert INR to coins (₹10 = 1 coin)
        balance_before: 0, // Will be updated when payment is verified
        balance_after: 0, // Will be updated when payment is verified
        reference_id: razorpayOrder.id,
        razorpay_payment_id: null,
        status: 'pending'
      });

    if (transactionError) {
      console.error('Database error:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Create order error:', error);
    
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