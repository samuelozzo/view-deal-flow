import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { payout_request_id } = await req.json();

    if (!payout_request_id) {
      throw new Error('Missing payout_request_id');
    }

    console.log(`Processing payout request: ${payout_request_id}`);

    // Get payout request with user profile for Stripe Connect account
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        wallets!inner(
          user_id,
          profiles!inner(
            stripe_connect_account_id,
            stripe_connect_payouts_enabled
          )
        )
      `)
      .eq('id', payout_request_id)
      .eq('status', 'pending')
      .single();

    if (payoutError || !payoutRequest) {
      throw new Error('Payout request not found or already processed');
    }

    const userProfile = (payoutRequest.wallets as any).profiles;
    if (!userProfile.stripe_connect_account_id) {
      throw new Error('User has not completed Stripe Connect onboarding');
    }

    if (!userProfile.stripe_connect_payouts_enabled) {
      throw new Error('Stripe Connect payouts not enabled for this user');
    }

    // Verify user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      throw new Error('Unauthorized: Admin access required');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    console.log(`Creating Stripe Connect transfer for ${payoutRequest.amount_cents} cents to account: ${userProfile.stripe_connect_account_id}`);

    // Import Stripe
    const Stripe = (await import('https://esm.sh/stripe@18.5.0')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Create Stripe Transfer to Connected Account
    let stripeTransferId: string;
    try {
      const transfer = await stripe.transfers.create({
        amount: payoutRequest.amount_cents,
        currency: 'eur',
        destination: userProfile.stripe_connect_account_id,
        description: `Payout to creator - Request ID: ${payout_request_id}`,
        metadata: {
          payout_request_id: payout_request_id,
          user_id: (payoutRequest.wallets as any).user_id,
        },
      });

      stripeTransferId = transfer.id;
      console.log(`✅ Stripe transfer created successfully: ${stripeTransferId}`);
      console.log(`💶 Funds will be paid out automatically to the creator's bank account by Stripe`);
      
    } catch (stripeError: any) {
      console.error('❌ Stripe transfer creation failed:', stripeError);
      
      // Revert wallet changes if Stripe fails
      await supabase
        .from('wallets')
        .update({
          available_cents: supabase.rpc('increment', { x: payoutRequest.amount_cents }),
          reserved_cents: supabase.rpc('increment', { x: -payoutRequest.amount_cents }),
        })
        .eq('id', payoutRequest.wallet_id);

      // Update payout request to failed
      await supabase
        .from('payout_requests')
        .update({
          status: 'pending',
          admin_note: `Stripe error: ${stripeError.message}`,
        })
        .eq('id', payout_request_id);

      throw new Error(`Stripe transfer failed: ${stripeError.message}`);
    }

    const payoutId = stripeTransferId;

    // Update wallet transaction to completed
    await supabase
      .from('wallet_transactions')
      .update({ status: 'completed' })
      .eq('reference_type', 'payout_request')
      .eq('reference_id', payout_request_id);

    // Update payout request
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        admin_note: `Bonifico eseguito con successo. Stripe Payout ID: ${payoutId}`,
      })
      .eq('id', payout_request_id);

    if (updateError) {
      console.error('Error updating payout request:', updateError);
      throw updateError;
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: (payoutRequest.wallets as any).user_id,
      type: 'payout_completed',
      title: 'Prelievo Completato',
      message: `Il tuo prelievo di €${(payoutRequest.amount_cents / 100).toFixed(2)} è stato elaborato con successo. I fondi arriveranno sul tuo conto bancario entro 1-3 giorni lavorativi.`,
      link: '/wallet',
    });

    console.log(`Payout processed successfully: ${payout_request_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        payout_id: payoutId,
        message: 'Payout processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-creator-payout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
