import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        notes: {
          user_id: string;
          coins_to_add: string;
        };
      };
    };
  };
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

    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    // Verify webhook signature (in production)
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const expectedSignature = await createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const userId = payment.notes.user_id;
      const coinsToAdd = parseInt(payment.notes.coins_to_add);
      
      if (!userId || !coinsToAdd) {
        throw new Error('Missing user_id or coins_to_add in payment notes');
      }

      // Add coins to user's wallet
      const { error: walletError } = await supabaseClient
        .rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: coinsToAdd,
          p_type: 'purchase',
          p_reference_id: payment.id
        });

      if (walletError) {
        throw new Error('Failed to update wallet balance');
      }

      // Update total deposited amount
      const { error: depositError } = await supabaseClient
        .from('wallets')
        .update({
          total_deposited: supabaseClient.raw(`total_deposited + ${payment.amount / 100}`)
        })
        .eq('user_id', userId);

      if (depositError) {
        console.error('Failed to update total deposited:', depositError);
      }

      console.log(`Successfully added ${coinsToAdd} coins to user ${userId}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    
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