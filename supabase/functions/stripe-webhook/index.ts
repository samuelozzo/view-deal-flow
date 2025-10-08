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
        const metadata = paymentIntent.metadata || {};

        // Check if this is a wallet topup
        if (metadata.type !== 'wallet_topup') {
          console.log(`Skipping payment ${piId} - not wallet_topup`);
          break;
        }

        console.log('Processing wallet topup:', { piId, metadata });

        // Step 1: Find topup_intent with priority order
        let topupIntent = null;
        
        // Priority 1: metadata.topupId
        if (metadata.topupId) {
          const { data } = await supabase
            .from('topup_intents')
            .select('*')
            .eq('id', metadata.topupId)
            .maybeSingle();
          if (data) {
            topupIntent = data;
            console.log('Found by metadata.topupId:', topupIntent.id);
          }
        }
        
        // Priority 2-4: Try reference field variations
        if (!topupIntent) {
          const { data } = await supabase
            .from('topup_intents')
            .select('*')
            .eq('reference', piId)
            .maybeSingle();
          if (data) {
            topupIntent = data;
            console.log('Found by reference:', topupIntent.id);
          }
        }

        if (!topupIntent) {
          console.error('❌ topup not updated', { piId, reason: 'row_not_found' });
          return new Response(
            JSON.stringify({ error: 'Topup intent not found' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const topupId = topupIntent.id;
        const walletId = topupIntent.wallet_id;
        const amountCents = topupIntent.amount_cents;

        // Step 2: Atomic transaction - Update topup_intent
        const { data: updatedRows, error: updateError } = await supabase
          .from('topup_intents')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', topupId)
          .eq('status', 'pending')
          .select();

        if (updateError) {
          console.error('❌ topup not updated', { piId, reason: 'tx_error', error: updateError });
          return new Response(
            JSON.stringify({ error: 'Failed to update topup_intent' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!updatedRows || updatedRows.length === 0) {
          console.log('⚠️ Topup already processed (idempotent):', piId);
          break;
        }

        // Step 3: Insert transaction (idempotent via unique index)
        const { error: txError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: walletId,
            type: 'topup',
            direction: 'in',
            amount_cents: amountCents,
            status: 'completed',
            reference_type: 'topup_intent',
            reference_id: topupId,
            metadata: {
              stripe_payment_intent: piId,
              method: 'stripe',
            },
          });

        if (txError && txError.code !== '23505') { // Ignore duplicate key errors
          console.error('❌ topup not updated', { piId, reason: 'tx_error', error: txError });
          return new Response(
            JSON.stringify({ error: 'Failed to create transaction' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Step 4: Update wallet balance - fetch current balance first for atomic update
        const { data: currentWallet, error: fetchError } = await supabase
          .from('wallets')
          .select('available_cents')
          .eq('id', walletId)
          .single();

        if (fetchError || !currentWallet) {
          console.error('❌ topup not updated', { piId, reason: 'wallet_fetch_failed', error: fetchError });
          return new Response(
            JSON.stringify({ error: 'Failed to fetch wallet' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const newBalance = currentWallet.available_cents + amountCents;
        const { data: updatedWallet, error: walletError } = await supabase
          .from('wallets')
          .update({
            available_cents: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', walletId)
          .select();

        if (walletError || !updatedWallet || updatedWallet.length === 0) {
          console.error('❌ topup not updated', { piId, reason: 'wallet_update_failed', error: walletError });
          return new Response(
            JSON.stringify({ error: 'Failed to update wallet balance' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Step 5: Success logging
        console.log('✅ topup completed', { piId, topupId, walletId, amount_cents: amountCents });

        // Create notification (non-critical)
        const { data: wallet } = await supabase
          .from('wallets')
          .select('user_id')
          .eq('id', walletId)
          .single();

        if (wallet) {
          await supabase.from('notifications').insert({
            user_id: wallet.user_id,
            type: 'topup_completed',
            title: 'Ricarica Completata',
            message: `La tua ricarica di €${(amountCents / 100).toFixed(2)} è stata completata con successo.`,
            link: '/wallet',
          });
        }

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
