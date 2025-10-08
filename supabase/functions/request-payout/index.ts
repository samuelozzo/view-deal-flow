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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { amount_cents, iban } = await req.json();

    if (!amount_cents || amount_cents < 1000) {
      throw new Error('Minimum payout amount is €10.00');
    }

    if (!iban || iban.trim().length === 0) {
      throw new Error('IBAN is required');
    }

    console.log(`Processing payout request: ${amount_cents} cents for user ${user.id}`);

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, available_cents, user_id')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    // Check if user has sufficient funds
    if (wallet.available_cents < amount_cents) {
      throw new Error(`Insufficient funds. Available: €${(wallet.available_cents / 100).toFixed(2)}`);
    }

    // Check if user is a creator
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'creator')
      .single();

    if (!userRole) {
      throw new Error('Only creators can request payouts');
    }

    // Deduct amount from wallet
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        available_cents: wallet.available_cents - amount_cents,
      })
      .eq('id', wallet.id);

    if (updateError) {
      throw new Error('Failed to deduct from wallet');
    }

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        wallet_id: wallet.id,
        amount_cents,
        iban: iban.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (payoutError) {
      // Rollback wallet deduction
      await supabase
        .from('wallets')
        .update({
          available_cents: wallet.available_cents,
        })
        .eq('id', wallet.id);
      throw new Error('Failed to create payout request');
    }

    // Create wallet transaction
    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'payout_request',
      direction: 'out',
      amount_cents,
      status: 'pending',
      reference_type: 'payout_request',
      reference_id: payoutRequest.id,
      metadata: {
        iban: iban.substring(0, 4) + '****' + iban.substring(iban.length - 4),
      },
    });

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'payout_requested',
      title: 'Richiesta Payout Inviata',
      message: `La tua richiesta di payout di €${(amount_cents / 100).toFixed(2)} è in elaborazione.`,
      link: '/wallet',
    });

    console.log(`Payout request created: ${payoutRequest.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        payout_request_id: payoutRequest.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in request-payout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
