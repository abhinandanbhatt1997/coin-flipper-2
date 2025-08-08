import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateOrderRequest {
  amount_inr: number; // Amount in INR
  coins_to_add: number; // Number of coins to add
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

    const { amount_inr, coins_to_add }: CreateOrderRequest = await req.json();

    // Validate input
    if (!amount_inr || amount_inr < 10 || amount_inr > 50000) {
      throw new Error('Invalid amount. Must be between ₹10 and ₹50,000');
    }

    if (!coins_to_add || coins_to_add <= 0) {
      throw new Error('Invalid coins amount');
    }

    // Validate coin conversion rate (₹10 = 1 coin)
    const expectedCoins = Math.floor(amount_inr / 10);
    if (coins_to_add !== expectedCoins) {
      throw new Error('Invalid coin conversion rate');
    }

    // Create Razorpay order (in production, you would use Razorpay API)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // For demo purposes, we'll create a mock order
    // In production, integrate with actual Razorpay API:
    /*
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount_inr * 100, // Amount in paise
        currency: 'INR',
        notes: {
          user_id: user.id,
          coins_to_add: coins_to_add.toString()
        }
      })
    });
    */

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        amount: amount_inr * 100, // Amount in paise for Razorpay
        currency: 'INR',
        coins_to_add,
        user_id: user.id
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
      JSON.stringify({ error: error.message }),
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