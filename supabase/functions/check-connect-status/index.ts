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

    // Get Stripe account ID using secure function
    const { data: accountId, error: accountError } = await supabase
      .rpc('get_user_stripe_account', { p_user_id: user.id });

    if (accountError || !accountId) {
      return new Response(
        JSON.stringify({
          connected: false,
          onboarding_completed: false,
          charges_enabled: false,
          payouts_enabled: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    const onboardingCompleted = account.details_submitted || false;
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;

    // Update profile status flags using secure function
    await supabase.rpc('set_user_stripe_account', {
      p_user_id: user.id,
      p_account_id: accountId,
      p_onboarding_completed: onboardingCompleted,
      p_charges_enabled: chargesEnabled,
      p_payouts_enabled: payoutsEnabled,
    });

    console.log(`✅ Connect status for ${user.id}: onboarding=${onboardingCompleted}, charges=${chargesEnabled}, payouts=${payoutsEnabled}`);

    return new Response(
      JSON.stringify({
        connected: true,
        account_id: accountId,
        onboarding_completed: onboardingCompleted,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-connect-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});