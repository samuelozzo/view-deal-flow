import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
    
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { amount_cents } = await req.json()

    if (!amount_cents || amount_cents <= 0) {
      throw new Error('Invalid request parameters')
    }

    // Get user profile to check for Stripe Connect
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Failed to fetch user profile')
    }

    // For Stripe Connect users, IBAN is not needed (managed by Stripe)
    const isStripeConnect = profile?.stripe_connect_payouts_enabled && profile?.stripe_connect_account_id

    // Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, available_cents')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.available_cents < amount_cents) {
      throw new Error('Insufficient balance')
    }

    // Reserve amount from available balance
    const { error: reserveError } = await supabase
      .from('wallets')
      .update({
        available_cents: wallet.available_cents - amount_cents,
        reserved_cents: supabase.rpc('increment', { x: amount_cents })
      })
      .eq('id', wallet.id)

    if (reserveError) {
      throw reserveError
    }

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        wallet_id: wallet.id,
        amount_cents,
        iban: isStripeConnect ? 'STRIPE_CONNECT' : null,
        status: 'pending'
      })
      .select()
      .single()

    if (payoutError) {
      throw payoutError
    }

    // Create wallet transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'payout',
        direction: 'out',
        amount_cents,
        status: 'pending',
        reference_type: 'payout_request',
        reference_id: payoutRequest.id
      })

    console.log(`Created payout request ${payoutRequest.id} for user ${user.id}`)

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'payout_requested',
        title: 'Richiesta Prelievo',
        message: `La tua richiesta di prelievo di €${(amount_cents / 100).toFixed(2)} è in elaborazione.`,
        link: '/wallet'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        payout_request: {
          id: payoutRequest.id,
          amount_cents: payoutRequest.amount_cents,
          status: payoutRequest.status
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in wallet-payout function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})