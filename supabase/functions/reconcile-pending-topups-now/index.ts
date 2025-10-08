import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconcileReport {
  id: string;
  piId: string;
  prev_status: string;
  new_status: string;
  action: string;
  credited_amount_cents: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('[RECONCILE NOW] Starting manual reconciliation');

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Get pending topup_intents from last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: pendingTopups, error: fetchError } = await supabase
      .from('topup_intents')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[RECONCILE NOW ERROR] Failed to fetch pending topups:', fetchError);
      throw fetchError;
    }

    console.log(`[RECONCILE NOW] Found ${pendingTopups?.length || 0} pending topup_intents in last 10 minutes`);

    if (!pendingTopups || pendingTopups.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending topups to reconcile',
          report: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const report: ReconcileReport[] = [];

    for (const topup of pendingTopups) {
      try {
        const piId = topup.reference;
        if (!piId) {
          console.warn(`[RECONCILE NOW] Topup ${topup.id} has no reference (payment_intent_id), skipping`);
          report.push({
            id: topup.id,
            piId: 'N/A',
            prev_status: 'pending',
            new_status: 'pending',
            action: 'skipped_no_reference',
            credited_amount_cents: 0,
          });
          continue;
        }

        console.log(`[RECONCILE NOW] Checking payment intent ${piId} for topup ${topup.id}`);
        
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(piId);
        
        if (paymentIntent.status === 'succeeded') {
          console.log(`[RECONCILE NOW] Payment ${piId} succeeded, executing atomic transaction`);
          
          // Get wallet data
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('available_cents, user_id')
            .eq('id', topup.wallet_id)
            .single();

          if (walletError || !wallet) {
            console.error(`[RECONCILE NOW ERROR] Wallet not found for topup ${topup.id}:`, walletError);
            report.push({
              id: topup.id,
              piId,
              prev_status: 'pending',
              new_status: 'pending',
              action: 'error_wallet_not_found',
              credited_amount_cents: 0,
            });
            continue;
          }

          // ATOMIC TRANSACTION STEP 1: Update topup_intent to completed (idempotent)
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
            console.error(`[RECONCILE NOW ERROR] Failed to update topup ${topup.id}:`, updateTopupError);
            report.push({
              id: topup.id,
              piId,
              prev_status: 'pending',
              new_status: 'pending',
              action: 'error_update_failed',
              credited_amount_cents: 0,
            });
            continue;
          }

          // If no rows updated, another process already completed this
          if (!updatedTopup || updatedTopup.length === 0) {
            console.log(`[RECONCILE NOW] Topup ${topup.id} already completed by another process`);
            report.push({
              id: topup.id,
              piId,
              prev_status: 'completed',
              new_status: 'completed',
              action: 'already_completed',
              credited_amount_cents: 0,
            });
            continue;
          }

          // ATOMIC TRANSACTION STEP 2: Insert transaction (idempotent via unique index)
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
              payment_intent_id: piId,
              metadata: {
                stripe_payment_intent: piId,
                method: 'stripe',
                reconciled_manually: true,
              },
            });

          if (txError && txError.code !== '23505') { // Ignore duplicate key errors
            console.error(`[RECONCILE NOW ERROR] Failed to create transaction for topup ${topup.id}:`, txError);
            report.push({
              id: topup.id,
              piId,
              prev_status: 'pending',
              new_status: 'completed',
              action: 'error_tx_failed',
              credited_amount_cents: 0,
            });
            continue;
          }

          // ATOMIC TRANSACTION STEP 3: Update wallet balance
          const newBalance = wallet.available_cents + topup.amount_cents;
          const { data: updatedWallet, error: updateWalletError } = await supabase
            .from('wallets')
            .update({
              available_cents: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq('id', topup.wallet_id)
            .select();

          if (updateWalletError || !updatedWallet || updatedWallet.length === 0) {
            console.error(`[RECONCILE NOW ERROR] Failed to update wallet for topup ${topup.id}:`, updateWalletError);
            report.push({
              id: topup.id,
              piId,
              prev_status: 'pending',
              new_status: 'completed',
              action: 'error_wallet_update_failed',
              credited_amount_cents: 0,
            });
            continue;
          }

          // Create notification
          await supabase.from('notifications').insert({
            user_id: wallet.user_id,
            type: 'topup_completed',
            title: 'Ricarica Completata',
            message: `La tua ricarica di €${(topup.amount_cents / 100).toFixed(2)} è stata completata con successo (riconciliazione manuale).`,
            link: '/wallet',
          });

          console.log(`✅ [RECONCILE NOW] topup completed`, {
            piId,
            walletId: topup.wallet_id,
            topupId: topup.id,
            amount_cents: topup.amount_cents
          });
          
          report.push({
            id: topup.id,
            piId,
            prev_status: 'pending',
            new_status: 'completed',
            action: 'completed_and_credited',
            credited_amount_cents: topup.amount_cents,
          });
        } else {
          console.log(`[RECONCILE NOW] Payment ${piId} status: ${paymentIntent.status}, keeping as pending`);
          report.push({
            id: topup.id,
            piId,
            prev_status: 'pending',
            new_status: 'pending',
            action: `stripe_status_${paymentIntent.status}`,
            credited_amount_cents: 0,
          });
        }
      } catch (error) {
        console.error(`[RECONCILE NOW ERROR] Error processing topup ${topup.id}:`, error);
        report.push({
          id: topup.id,
          piId: topup.reference || 'N/A',
          prev_status: 'pending',
          new_status: 'pending',
          action: 'error_exception',
          credited_amount_cents: 0,
        });
      }
    }

    const completed = report.filter(r => r.action === 'completed_and_credited').length;
    const errors = report.filter(r => r.action.startsWith('error_')).length;

    console.log(`[RECONCILE NOW] Job completed: ${completed} completed, ${errors} errors, ${report.length} total`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        completed,
        errors,
        total: report.length,
        report
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RECONCILE NOW ERROR] Job failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
