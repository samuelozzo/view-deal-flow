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

    console.log(`Creating Stripe Connect account for user: ${user.id}`);

    // Get existing Stripe account ID using secure function
    const { data: existingAccountId } = await supabase
      .rpc('get_user_stripe_account', { p_user_id: user.id });

    // Get display name from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Profile not found');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });

    let accountId = existingAccountId;

    // Create Stripe Connect account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'IT',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: profile.display_name || user.email,
        },
        metadata: {
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Save account ID using secure function
      await supabase.rpc('set_user_stripe_account', {
        p_user_id: user.id,
        p_account_id: accountId,
      });

      console.log(`✅ Created Stripe Connect account: ${accountId}`);
    } else {
      console.log(`Using existing Stripe Connect account: ${accountId}`);
    }

    // Create account link for onboarding
    const origin = req.headers.get('origin') || 'https://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/wallet`,
      return_url: `${origin}/wallet?connect=success`,
      type: 'account_onboarding',
    });

    console.log(`✅ Created account link for onboarding`);

    return new Response(
      JSON.stringify({
        success: true,
        account_id: accountId,
        onboarding_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-connect-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});