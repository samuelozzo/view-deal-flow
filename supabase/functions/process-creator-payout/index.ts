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

    // Get payout request
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*, wallets!inner(user_id)')
      .eq('id', payout_request_id)
      .eq('status', 'pending')
      .single();

    if (payoutError || !payoutRequest) {
      throw new Error('Payout request not found or already processed');
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

    // Create Stripe Payout (simplified - in production use Stripe Connect)
    // For now, we'll mark as completed and log
    console.log(`Would create Stripe payout for ${payoutRequest.amount_cents} cents to ${payoutRequest.iban}`);

    // In a real implementation with Stripe Connect:
    // 1. Create a transfer to the connected account
    // 2. Or create a payout to their bank account
    
    // For this demo, we'll simulate successful payout
    const payoutId = `payout_${Date.now()}`;

    // Update payout request
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        admin_note: `Processed by admin. Stripe payout: ${payoutId}`,
      })
      .eq('id', payout_request_id);

    if (updateError) {
      console.error('Error updating payout request:', updateError);
      throw updateError;
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: payoutRequest.wallets.user_id,
      type: 'payout_completed',
      title: 'Prelievo Completato',
      message: `Il tuo prelievo di €${(payoutRequest.amount_cents / 100).toFixed(2)} è stato elaborato con successo.`,
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
