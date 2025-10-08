import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('[RECONCILE] Starting reconciliation job');

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Get pending topup_intents from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pendingTopups, error: fetchError } = await supabase
      .from('topup_intents')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[RECONCILE ERROR] Failed to fetch pending topups:', fetchError);
      throw fetchError;
    }

    console.log(`[RECONCILE] Found ${pendingTopups?.length || 0} pending topup_intents`);

    if (!pendingTopups || pendingTopups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending topups to reconcile',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const topup of pendingTopups) {
      try {
        const piId = topup.reference;
        if (!piId) {
          console.warn(`[RECONCILE] Topup ${topup.id} has no reference (payment_intent_id), skipping`);
          continue;
        }

        console.log(`[RECONCILE] Checking payment intent ${piId} for topup ${topup.id}`);
        
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(piId);
        
        if (paymentIntent.status === 'succeeded') {
          console.log(`[RECONCILE] Payment ${piId} succeeded, promoting to completed`);
          
          // Get wallet data
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('available_cents, user_id')
            .eq('id', topup.wallet_id)
            .single();

          if (walletError || !wallet) {
            console.error(`[RECONCILE ERROR] Wallet not found for topup ${topup.id}:`, walletError);
            errors++;
            continue;
          }

          // Update topup_intent to completed (idempotent)
          const { data: updatedTopup, error: updateTopupError } = await supabase
            .from('topup_intents')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', topup.id)
            .eq('status', 'pending') // Only update if still pending
            .select();

          if (updateTopupError) {
            console.error(`[RECONCILE ERROR] Failed to update topup ${topup.id}:`, updateTopupError);
            errors++;
            continue;
          }

          // If no rows updated, another process already completed this
          if (!updatedTopup || updatedTopup.length === 0) {
            console.log(`[RECONCILE] Topup ${topup.id} already completed by another process`);
            continue;
          }

          // Update wallet balance
          const newBalance = wallet.available_cents + topup.amount_cents;
          const { error: updateWalletError } = await supabase
            .from('wallets')
            .update({
              available_cents: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('id', topup.wallet_id);

          if (updateWalletError) {
            console.error(`[RECONCILE ERROR] Failed to update wallet for topup ${topup.id}:`, updateWalletError);
            errors++;
            continue;
          }

          // Create transaction record (idempotent via unique constraint)
          const { error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: topup.wallet_id,
              type: 'topup',
              direction: 'in',
              amount_cents: topup.amount_cents,
              status: 'completed',
              reference_type: 'topup_intent',
              reference_id: topup.id,
              metadata: {
                stripe_payment_intent: piId,
                method: 'stripe',
                reconciled: true,
              },
            });

          if (txError && txError.code !== '23505') { // Ignore duplicate key errors
            console.error(`[RECONCILE ERROR] Failed to create transaction for topup ${topup.id}:`, txError);
          }

          // Create notification
          await supabase.from('notifications').insert({
            user_id: wallet.user_id,
            type: 'topup_completed',
            title: 'Ricarica Completata',
            message: `La tua ricarica di €${(topup.amount_cents / 100).toFixed(2)} è stata completata con successo.`,
            link: '/wallet',
          });

          console.log(`✅ [RECONCILE] topup completed`, {
            piId,
            walletId: topup.wallet_id,
            topupId: topup.id,
            amount_cents: topup.amount_cents
          });
          
          processed++;
        } else {
          console.log(`[RECONCILE] Payment ${piId} status: ${paymentIntent.status}, keeping as pending`);
        }
      } catch (error) {
        console.error(`[RECONCILE ERROR] Error processing topup ${topup.id}:`, error);
        errors++;
      }
    }

    console.log(`[RECONCILE] Job completed: ${processed} processed, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        errors,
        total: pendingTopups.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RECONCILE ERROR] Job failed:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
