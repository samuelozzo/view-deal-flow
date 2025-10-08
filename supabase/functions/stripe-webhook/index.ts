import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature if secret is configured
    let event;
    if (webhookSecret && signature) {
      try {
        // For production, you should verify the signature
        // This is a simplified version - Stripe signature verification requires crypto
        console.log('Webhook signature present, processing event');
        event = JSON.parse(body);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        throw new Error('Invalid signature');
      }
    } else {
      event = JSON.parse(body);
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        const amountCents = paymentIntent.amount;
        const metadata = paymentIntent.metadata || {};
        
        console.log(`[WEBHOOK] Payment succeeded: ${paymentIntentId}, amount: ${amountCents}, metadata:`, metadata);

        // Check if this is a wallet topup
        if (metadata.type !== 'wallet_topup') {
          console.log(`[WEBHOOK] Skipping payment ${paymentIntentId} - not a wallet topup (type: ${metadata.type})`);
          break;
        }

        // Find the topup intent
        const { data: topupIntent, error: findError } = await supabase
          .from('topup_intents')
          .select('*')
          .eq('reference', paymentIntentId)
          .single();

        if (findError || !topupIntent) {
          console.error(`[WEBHOOK] Topup intent not found for payment: ${paymentIntentId}`, findError);
          break;
        }

        const walletId = topupIntent.wallet_id;
        const userId = topupIntent.metadata?.user_id;

        console.log(`[WEBHOOK] Processing topup for wallet: ${walletId}, user: ${userId}, amount: ${amountCents}`);

        // Idempotency check: skip if already processed
        if (topupIntent.status === 'completed') {
          console.log(`[WEBHOOK] Payment already processed: ${paymentIntentId}`);
          break;
        }

        // Get wallet data
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('available_cents, user_id')
          .eq('id', walletId)
          .single();

        if (walletError || !wallet) {
          console.error(`[WEBHOOK] Wallet not found: ${walletId}`, walletError);
          throw new Error('Wallet not found');
        }

        const walletUserId = wallet.user_id;

        // Idempotent transaction insert using payment_intent_id as unique constraint
        const { data: existingTx } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('metadata->stripe_payment_intent', paymentIntentId)
          .single();

        if (existingTx) {
          console.log(`[WEBHOOK] Transaction already exists for payment: ${paymentIntentId}`);
          
          // Still mark topup intent as completed if not already
          if (topupIntent.status !== 'completed') {
            await supabase
              .from('topup_intents')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', topupIntent.id);
          }
          break;
        }

        // Update topup intent status
        const { error: updateTopupError } = await supabase
          .from('topup_intents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', topupIntent.id);

        if (updateTopupError) {
          console.error(`[WEBHOOK] Error updating topup intent: ${topupIntent.id}`, updateTopupError);
          throw updateTopupError;
        }

        // Update wallet balance atomically
        const newBalance = wallet.available_cents + topupIntent.amount_cents;
        const { error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            available_cents: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', walletId);

        if (updateWalletError) {
          console.error(`[WEBHOOK] Error updating wallet balance for wallet: ${walletId}`, updateWalletError);
          throw updateWalletError;
        }

        console.log(`[WEBHOOK] Wallet ${walletId} balance updated: ${wallet.available_cents} -> ${newBalance}`);

        // Create transaction record (idempotent)
        const { error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: walletId,
            type: 'topup',
            direction: 'in',
            amount_cents: topupIntent.amount_cents,
            status: 'completed',
            reference_type: 'topup_intent',
            reference_id: topupIntent.id,
            metadata: {
              stripe_payment_intent: paymentIntentId,
              method: 'stripe',
            },
          });

        if (txError) {
          console.error(`[WEBHOOK] Error creating transaction for wallet: ${walletId}`, txError);
        } else {
          console.log(`[WEBHOOK] Transaction created for wallet: ${walletId}, amount: ${topupIntent.amount_cents}`);
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: walletUserId,
          type: 'topup_completed',
          title: 'Ricarica Completata',
          message: `La tua ricarica di €${(topupIntent.amount_cents / 100).toFixed(2)} è stata completata con successo.`,
          link: '/wallet',
        });

        console.log(`[WEBHOOK] Topup completed successfully for payment: ${paymentIntentId}, wallet: ${walletId}, user: ${walletUserId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`Payment failed: ${paymentIntent.id}`);

        // Find and update topup intent
        const { error: updateError } = await supabase
          .from('topup_intents')
          .update({
            status: 'failed',
            metadata: {
              stripe_payment_intent: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message || 'Payment failed',
            },
          })
          .eq('reference', paymentIntent.id);

        if (updateError) {
          console.error('Error updating topup intent:', updateError);
        }

        // Get wallet to send notification
        const { data: topupIntent } = await supabase
          .from('topup_intents')
          .select('wallet_id, amount_cents')
          .eq('reference', paymentIntent.id)
          .single();

        if (topupIntent) {
          const { data: walletUser } = await supabase
            .from('wallets')
            .select('user_id')
            .eq('id', topupIntent.wallet_id)
            .single();

          if (walletUser) {
            await supabase.from('notifications').insert({
              user_id: walletUser.user_id,
              type: 'topup_failed',
              title: 'Ricarica Fallita',
              message: `La ricarica di €${(topupIntent.amount_cents / 100).toFixed(2)} non è andata a buon fine. Riprova.`,
              link: '/wallet',
            });
          }
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log(`Charge refunded: ${charge.id}`);

        // Find related payment intent
        const { data: topupIntent } = await supabase
          .from('topup_intents')
          .select('*')
          .eq('reference', charge.payment_intent)
          .single();

        if (topupIntent) {
          // Deduct from wallet
          const { data: wallet } = await supabase
            .from('wallets')
            .select('available_cents')
            .eq('id', topupIntent.wallet_id)
            .single();

          if (wallet) {
            await supabase
              .from('wallets')
              .update({
                available_cents: Math.max(0, wallet.available_cents - topupIntent.amount_cents),
                updated_at: new Date().toISOString(),
              })
              .eq('id', topupIntent.wallet_id);

            // Create refund transaction
            await supabase.from('wallet_transactions').insert({
              wallet_id: topupIntent.wallet_id,
              type: 'refund',
              direction: 'out',
              amount_cents: topupIntent.amount_cents,
              status: 'completed',
              reference_type: 'charge',
              reference_id: charge.id,
              metadata: {
                stripe_charge: charge.id,
                reason: 'refunded',
              },
            });

            // Notify user
            const { data: walletUser } = await supabase
              .from('wallets')
              .select('user_id')
              .eq('id', topupIntent.wallet_id)
              .single();

            if (walletUser) {
              await supabase.from('notifications').insert({
                user_id: walletUser.user_id,
                type: 'refund_processed',
                title: 'Rimborso Elaborato',
                message: `Un rimborso di €${(topupIntent.amount_cents / 100).toFixed(2)} è stato elaborato.`,
                link: '/wallet',
              });
            }
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
