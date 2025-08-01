import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateOrderRequest {
  amount: number;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId }: CreateOrderRequest = await req.json();

    if (!amount || amount < 100) {
      throw new Error('Minimum amount is ₹100');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // For demo purposes, we'll create a mock order ID
    // In production, you would integrate with Razorpay API here
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the pending transaction
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        reference_id: orderId
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        amount: amount * 100 // Razorpay expects amount in paise
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating payment order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});