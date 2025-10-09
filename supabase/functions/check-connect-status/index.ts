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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile.stripe_connect_account_id) {
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
    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

    const onboardingCompleted = account.details_submitted || false;
    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;

    // Update profile with latest status
    await supabase
      .from('profiles')
      .update({
        stripe_connect_onboarding_completed: onboardingCompleted,
        stripe_connect_charges_enabled: chargesEnabled,
        stripe_connect_payouts_enabled: payoutsEnabled,
      })
      .eq('id', user.id);

    console.log(`✅ Connect status for ${user.id}: onboarding=${onboardingCompleted}, charges=${chargesEnabled}, payouts=${payoutsEnabled}`);

    return new Response(
      JSON.stringify({
        connected: true,
        account_id: profile.stripe_connect_account_id,
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