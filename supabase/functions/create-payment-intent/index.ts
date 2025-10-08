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

    const { amount_cents, metadata = {} } = await req.json();

    if (!amount_cents || amount_cents < 50) {
      throw new Error('Invalid amount (minimum 50 cents)');
    }

    console.log(`Creating payment intent for user ${user.id}, amount: ${amount_cents} cents`);

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured');
    }

    // Create PaymentIntent with Stripe API
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount_cents.toString(),
        currency: 'eur',
        'automatic_payment_methods[enabled]': 'true',
        'metadata[type]': 'wallet_topup',
        'metadata[user_id]': user.id,
        'metadata[wallet_id]': wallet.id,
        ...Object.fromEntries(
          Object.entries(metadata).map(([key, value]) => [`metadata[${key}]`, String(value)])
        ),
      }),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      console.error('Stripe error:', error);
      throw new Error('Failed to create payment intent');
    }

    const paymentIntent = await stripeResponse.json();

    console.log(`Payment intent created: ${paymentIntent.id}, waiting for successful payment before creating topup_intent`);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
