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
        method: string;
        created_at: number;
        notes: {
          user_id?: string;
          purpose?: string;
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
    
    // Verify webhook signature
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || 'your_webhook_secret_here';
    
    if (signature && RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = await createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        throw new Error('Invalid webhook signature');
      }
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);
    console.log('Webhook received:', payload.event);

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const userId = payment.notes.user_id;
      
      if (!userId) {
        console.error('No user_id in payment notes');
        throw new Error('Missing user_id in payment notes');
      }

      const amountInINR = payment.amount / 100; // Convert paise to INR
      const coinsToAdd = Math.floor(amountInINR / 10); // ₹10 = 1 coin

      // Check if this payment has already been processed
      const { data: existingTransaction } = await supabaseClient
        .from('coin_transactions')
        .select('id, status')
        .eq('razorpay_payment_id', payment.id)
        .single();

      if (existingTransaction && existingTransaction.status === 'completed') {
        console.log('Payment already processed:', payment.id);
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('coin_balance')
        .eq('user_id', userId)
        .single();

      if (walletError) {
        // Create wallet if it doesn't exist
        const { error: createWalletError } = await supabaseClient
          .from('wallets')
          .insert({
            user_id: userId,
            coin_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0
          });

        if (createWalletError) {
          throw new Error('Failed to create wallet');
        }
      }

      const currentBalance = wallet?.coin_balance || 0;
      const newBalance = currentBalance + coinsToAdd;

      // Update wallet balance and total deposited
      const { error: updateWalletError } = await supabaseClient
        .from('wallets')
        .upsert({
          user_id: userId,
          coin_balance: newBalance,
          total_deposited: supabaseClient.raw(`COALESCE(total_deposited, 0) + ${amountInINR}`),
          updated_at: new Date().toISOString()
        });

      if (updateWalletError) {
        throw new Error('Failed to update wallet balance');
      }

      // Update or create transaction record
      if (existingTransaction) {
        // Update existing transaction
        const { error: updateTransactionError } = await supabaseClient
          .from('coin_transactions')
          .update({
            balance_before: currentBalance,
            balance_after: newBalance,
            razorpay_payment_id: payment.id,
            status: 'completed'
          })
          .eq('id', existingTransaction.id);

        if (updateTransactionError) {
          console.error('Failed to update transaction:', updateTransactionError);
        }
      } else {
        // Create new transaction record
        const { error: createTransactionError } = await supabaseClient
          .from('coin_transactions')
          .insert({
            user_id: userId,
            type: 'deposit',
            amount: coinsToAdd,
            balance_before: currentBalance,
            balance_after: newBalance,
            reference_id: payment.order_id,
            razorpay_payment_id: payment.id,
            status: 'completed'
          });

        if (createTransactionError) {
          console.error('Failed to create transaction:', createTransactionError);
        }
      }

      console.log(`Successfully processed payment ${payment.id} for user ${userId}: +${coinsToAdd} coins`);
    }

    // Handle payment.failed event
    else if (payload.event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const userId = payment.notes.user_id;

      if (userId) {
        // Update transaction status to failed
        const { error: updateError } = await supabaseClient
          .from('coin_transactions')
          .update({
            razorpay_payment_id: payment.id,
            status: 'failed'
          })
          .eq('reference_id', payment.order_id)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Failed to update failed transaction:', updateError);
        }

        console.log(`Payment failed for user ${userId}: ${payment.id}`);
      }
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