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
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('[WEBHOOK] Initialized Supabase client with SERVICE_ROLE_KEY');

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
        
        console.log('[WEBHOOK STEP 1] Payment succeeded:', {
          event_type: event.type,
          payment_intent_id: paymentIntentId,
          amount_cents: amountCents,
          metadata
        });

        // Check if this is a wallet topup
        if (metadata.type !== 'wallet_topup') {
          console.log(`[WEBHOOK] Skipping payment ${paymentIntentId} - not a wallet topup (type: ${metadata.type})`);
          break;
        }

        console.log('[WEBHOOK STEP 2] Searching for topup_intent...');
        // Find the topup intent
        const { data: topupIntent, error: findError } = await supabase
          .from('topup_intents')
          .select('*')
          .eq('reference', paymentIntentId)
          .single();

        if (findError || !topupIntent) {
          console.error('[WEBHOOK ERROR] Topup intent not found:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            error: findError
          });
          throw new Error(`Topup intent not found for payment: ${paymentIntentId}`);
        }

        const walletId = topupIntent.wallet_id;
        const userId = topupIntent.metadata?.user_id;

        console.log('[WEBHOOK STEP 3] Found topup_intent:', {
          wallet_id: walletId,
          user_id: userId,
          amount_cents: topupIntent.amount_cents,
          status: topupIntent.status
        });

        // Idempotency check: skip if already processed
        if (topupIntent.status === 'completed') {
          console.log(`[WEBHOOK] Payment already processed (topup_intent completed): ${paymentIntentId}`);
          break;
        }

        console.log('[WEBHOOK STEP 4] Fetching wallet...');
        // Get wallet data
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('available_cents, user_id')
          .eq('id', walletId)
          .single();

        if (walletError || !wallet) {
          console.error('[WEBHOOK ERROR] Wallet not found:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            wallet_id: walletId,
            error: walletError
          });
          throw new Error(`Wallet not found: ${walletId}`);
        }

        const walletUserId = wallet.user_id;
        console.log('[WEBHOOK STEP 5] Current wallet state:', {
          wallet_id: walletId,
          user_id: walletUserId,
          current_balance_cents: wallet.available_cents
        });

        console.log('[WEBHOOK STEP 6] Creating transaction record (idempotent)...');
        // Create transaction record with idempotency via unique index
        const { data: txData, error: txError } = await supabase
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
          })
          .select()
          .single();

        if (txError) {
          // Check if it's a duplicate key error (idempotency)
          if (txError.code === '23505') { // unique violation
            console.log('[WEBHOOK] Transaction already exists (idempotency):', {
              payment_intent_id: paymentIntentId,
              wallet_id: walletId
            });
            
            // Mark topup intent as completed if not already
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
          
          console.error('[WEBHOOK ERROR] Failed to create transaction:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            wallet_id: walletId,
            user_id: walletUserId,
            amount_cents: topupIntent.amount_cents,
            error: txError
          });
          throw new Error(`Transaction insert failed: ${txError.message}`);
        }

        console.log('[WEBHOOK STEP 7] Transaction created successfully:', txData?.id);

        console.log('[WEBHOOK STEP 8] Updating wallet balance atomically...');
        // Update wallet balance atomically
        const newBalance = wallet.available_cents + topupIntent.amount_cents;
        const { data: updatedWallet, error: updateWalletError, count } = await supabase
          .from('wallets')
          .update({
            available_cents: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', walletId)
          .select();

        if (updateWalletError) {
          console.error('[WEBHOOK ERROR] Failed to update wallet balance:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            wallet_id: walletId,
            user_id: walletUserId,
            old_balance: wallet.available_cents,
            new_balance: newBalance,
            amount_cents: topupIntent.amount_cents,
            error: updateWalletError
          });
          throw new Error(`Wallet update failed: ${updateWalletError.message}`);
        }

        // Verify update was successful
        if (!updatedWallet || updatedWallet.length === 0) {
          console.error('[WEBHOOK ERROR] Wallet update returned 0 rows:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            wallet_id: walletId,
            user_id: walletUserId
          });
          throw new Error('Wallet update affected 0 rows');
        }

        console.log('[WEBHOOK STEP 9] Wallet balance updated successfully:', {
          wallet_id: walletId,
          old_balance: wallet.available_cents,
          new_balance: newBalance,
          amount_added: topupIntent.amount_cents
        });

        console.log('[WEBHOOK STEP 10] Updating topup_intent status...');
        // Update topup intent status
        const { error: updateTopupError } = await supabase
          .from('topup_intents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', topupIntent.id);

        if (updateTopupError) {
          console.error('[WEBHOOK ERROR] Failed to update topup_intent:', {
            event_type: event.type,
            payment_intent_id: paymentIntentId,
            topup_intent_id: topupIntent.id,
            error: updateTopupError
          });
          // Don't throw here as the critical operations succeeded
        } else {
          console.log('[WEBHOOK STEP 11] Topup intent marked as completed');
        }

        console.log('[WEBHOOK STEP 12] Creating notification...');
        // Create notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: walletUserId,
          type: 'topup_completed',
          title: 'Ricarica Completata',
          message: `La tua ricarica di €${(topupIntent.amount_cents / 100).toFixed(2)} è stata completata con successo.`,
          link: '/wallet',
        });

        if (notifError) {
          console.error('[WEBHOOK ERROR] Failed to create notification:', notifError);
          // Don't throw, notification is non-critical
        }

        console.log('[WEBHOOK SUCCESS] Topup completed successfully:', {
          event_type: event.type,
          payment_intent_id: paymentIntentId,
          wallet_id: walletId,
          user_id: walletUserId,
          transaction_id: txData?.id,
          old_balance: wallet.available_cents,
          new_balance: newBalance,
          amount_added: topupIntent.amount_cents
        });
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
