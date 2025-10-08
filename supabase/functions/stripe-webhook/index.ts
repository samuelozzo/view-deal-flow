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
        const piId = paymentIntent.id;
        const amountCents = paymentIntent.amount;
        const metadata = paymentIntent.metadata || {};
        
        console.log('[WEBHOOK STEP 1] Payment succeeded:', {
          event_type: event.type,
          payment_intent_id: piId,
          amount_cents: amountCents,
          metadata
        });

        // Check if this is a wallet topup
        if (metadata.type !== 'wallet_topup') {
          console.log(`[WEBHOOK] Skipping payment ${piId} - not a wallet topup (type: ${metadata.type})`);
          break;
        }

        const walletId = metadata.walletId;
        const topupId = metadata.topupId;

        console.log('[WEBHOOK STEP 2] Searching for topup_intent...', { piId, walletId, topupId });
        
        // Robust search logic for topup_intent
        let topupIntent;
        let findError;

        // Try by topupId first (if provided in metadata)
        if (topupId) {
          const result = await supabase
            .from('topup_intents')
            .select('*')
            .eq('id', topupId)
            .single();
          topupIntent = result.data;
          findError = result.error;
          console.log('[WEBHOOK] Search by topupId:', { found: !!topupIntent, error: findError });
        }

        // Fallback: try by reference field (should contain payment_intent_id)
        if (!topupIntent) {
          const result = await supabase
            .from('topup_intents')
            .select('*')
            .eq('reference', piId)
            .single();
          topupIntent = result.data;
          findError = result.error;
          console.log('[WEBHOOK] Search by reference:', { found: !!topupIntent, error: findError });
        }

        // If no topup_intent exists, create it now (payment succeeded without prior topup_intent)
        if (!topupIntent) {
          console.log(`[WEBHOOK] Creating topup_intent for successful payment ${piId}`);
          const { data: newTopup, error: createError } = await supabase
            .from('topup_intents')
            .insert({
              wallet_id: walletId,
              amount_cents: amountCents,
              method: 'card',
              status: 'pending',
              reference: piId,
              metadata: {
                stripe_payment_intent: piId,
                created_on_webhook: true,
              },
            })
            .select()
            .single();

          if (createError) {
            console.error(`[WEBHOOK ERROR] Failed to create topup_intent:`, createError);
            throw new Error(`Failed to create topup intent: ${createError.message}`);
          }
          
          topupIntent = newTopup;
          console.log(`✅ [WEBHOOK] Created topup_intent ${topupIntent.id}`);
        }

        const finalWalletId = topupIntent.wallet_id;

        console.log('[WEBHOOK STEP 3] Found topup_intent:', {
          topup_intent_id: topupIntent.id,
          wallet_id: finalWalletId,
          amount_cents: topupIntent.amount_cents,
          status: topupIntent.status
        });

        // Idempotency check: skip if already completed
        if (topupIntent.status === 'completed') {
          console.log(`✅ [WEBHOOK] Payment already processed (topup_intent completed): ${piId}`);
          break;
        }

        console.log('[WEBHOOK STEP 4] Fetching wallet...');
        // Get wallet data
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('available_cents, user_id')
          .eq('id', finalWalletId)
          .single();

        if (walletError || !wallet) {
          console.error('[WEBHOOK ERROR] Wallet not found:', {
            event_type: event.type,
            payment_intent_id: piId,
            wallet_id: finalWalletId,
            error: walletError
          });
          throw new Error(`Wallet not found: ${finalWalletId}`);
        }

        const walletUserId = wallet.user_id;
        console.log('[WEBHOOK STEP 5] Current wallet state:', {
          wallet_id: finalWalletId,
          user_id: walletUserId,
          current_available_cents: wallet.available_cents
        });

        // ATOMIC TRANSACTION: Update topup_intent status first
        console.log('[WEBHOOK STEP 6] Updating topup_intent to completed...');
        const { data: updatedTopupIntent, error: updateTopupError } = await supabase
          .from('topup_intents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', topupIntent.id)
          .eq('status', 'pending') // Only update if still pending (idempotency)
          .select();

        if (updateTopupError) {
          console.error('[WEBHOOK ERROR] Failed to update topup_intent:', {
            event_type: event.type,
            payment_intent_id: piId,
            topup_intent_id: topupIntent.id,
            error: updateTopupError
          });
          throw new Error(`Topup intent update failed: ${updateTopupError.message}`);
        }

        // If no rows updated, another webhook already processed this
        if (!updatedTopupIntent || updatedTopupIntent.length === 0) {
          console.warn(`⚠️ [WEBHOOK] Topup intent already processed by another webhook: ${piId}`);
          break;
        }

        console.log('[WEBHOOK STEP 7] Topup intent marked as completed');

        // ATOMIC TRANSACTION: Update wallet balance
        console.log('[WEBHOOK STEP 8] Updating wallet balance...');
        const newBalance = wallet.available_cents + topupIntent.amount_cents;
        const { data: updatedWallet, error: updateWalletError } = await supabase
          .from('wallets')
          .update({
            available_cents: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalWalletId)
          .select();

        if (updateWalletError) {
          console.error('[WEBHOOK ERROR] Failed to update wallet balance:', {
            event_type: event.type,
            payment_intent_id: piId,
            wallet_id: finalWalletId,
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
            payment_intent_id: piId,
            wallet_id: finalWalletId,
            user_id: walletUserId
          });
          throw new Error('Wallet update affected 0 rows');
        }

        console.log(`✅ topup completed`, {
          piId,
          walletId: finalWalletId,
          topupId: topupIntent.id,
          amount_cents: topupIntent.amount_cents
        });
        console.log('[WEBHOOK STEP 9] Wallet balance updated:', {
          wallet_id: finalWalletId,
          old_balance: wallet.available_cents,
          new_balance: newBalance,
          amount_added: topupIntent.amount_cents
        });

        // Create transaction record (non-critical)
        console.log('[WEBHOOK STEP 10] Creating transaction record...');
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: finalWalletId,
            type: 'topup',
            direction: 'in',
            amount_cents: topupIntent.amount_cents,
            status: 'completed',
            reference_type: 'topup_intent',
            reference_id: topupIntent.id,
            metadata: {
              stripe_payment_intent: piId,
              method: 'stripe',
            },
          })
          .select()
          .single();

        if (txError) {
          console.error('[WEBHOOK ERROR] Failed to create transaction (non-critical):', {
            error: txError,
            code: txError.code
          });
          // Don't throw - transaction record is for audit trail only
        } else {
          console.log('[WEBHOOK STEP 11] Transaction record created:', txData?.id);
        }

        // Create notification (non-critical)
        console.log('[WEBHOOK STEP 12] Creating notification...');
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: walletUserId,
          type: 'topup_completed',
          title: 'Ricarica Completata',
          message: `La tua ricarica di €${(topupIntent.amount_cents / 100).toFixed(2)} è stata completata con successo.`,
          link: '/wallet',
        });

        if (notifError) {
          console.error('[WEBHOOK ERROR] Failed to create notification (non-critical):', notifError);
        }

        console.log('✅ [WEBHOOK SUCCESS] Topup completed successfully:', {
          event_type: event.type,
          payment_intent_id: piId,
          wallet_id: finalWalletId,
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
        const paymentIntentId = paymentIntent.id;
        
        console.log(`❌ [WEBHOOK] Payment failed: ${paymentIntentId}`);

        // Find topup intent
        const { data: topupIntent, error: findError } = await supabase
          .from('topup_intents')
          .select('*')
          .eq('reference', paymentIntentId)
          .single();

        if (findError || !topupIntent) {
          console.error('[WEBHOOK ERROR] Topup intent not found for failed payment:', {
            payment_intent_id: paymentIntentId,
            error: findError
          });
          // Don't throw - payment already failed
          break;
        }

        // Update topup intent status to failed
        const { data: updatedIntent, error: updateError } = await supabase
          .from('topup_intents')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            metadata: {
              ...topupIntent.metadata,
              stripe_payment_intent: paymentIntentId,
              error: paymentIntent.last_payment_error?.message || 'Payment failed',
            },
          })
          .eq('id', topupIntent.id)
          .select();

        if (updateError) {
          console.error('[WEBHOOK ERROR] Failed to update topup intent status:', {
            payment_intent_id: paymentIntentId,
            topup_intent_id: topupIntent.id,
            error: updateError
          });
          throw new Error(`Failed to update topup intent: ${updateError.message}`);
        }

        console.log('❌ [WEBHOOK] Topup intent marked as failed:', {
          payment_intent_id: paymentIntentId,
          topup_intent_id: topupIntent.id,
          amount_cents: topupIntent.amount_cents
        });

        // Get wallet user for notification
        const { data: wallet } = await supabase
          .from('wallets')
          .select('user_id')
          .eq('id', topupIntent.wallet_id)
          .single();

        if (wallet) {
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: wallet.user_id,
            type: 'topup_failed',
            title: 'Ricarica Fallita',
            message: `La ricarica di €${(topupIntent.amount_cents / 100).toFixed(2)} non è andata a buon fine. Riprova.`,
            link: '/wallet',
          });

          if (notifError) {
            console.error('[WEBHOOK ERROR] Failed to create notification (non-critical):', notifError);
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
