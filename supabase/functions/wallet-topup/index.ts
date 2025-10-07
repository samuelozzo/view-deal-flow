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

    const { method, amount_cents } = await req.json()

    if (!method || !amount_cents || amount_cents <= 0) {
      throw new Error('Invalid request parameters')
    }

    // Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (walletError || !wallet) {
      throw new Error('Wallet not found')
    }

    // Create topup intent
    const { data: intent, error: intentError } = await supabase
      .from('topup_intents')
      .insert({
        wallet_id: wallet.id,
        method,
        amount_cents,
        status: 'pending',
        reference: `TOPUP-${Date.now()}`
      })
      .select()
      .single()

    if (intentError) {
      throw intentError
    }

    console.log(`Created topup intent ${intent.id} for user ${user.id}`)

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'topup_initiated',
        title: 'Ricarica Iniziata',
        message: `La tua richiesta di ricarica di €${(amount_cents / 100).toFixed(2)} è in attesa di conferma.`,
        link: '/wallet'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        intent: {
          id: intent.id,
          reference: intent.reference,
          amount_cents: intent.amount_cents,
          method: intent.method,
          instructions: method === 'bank_transfer' 
            ? 'Effettua il bonifico con causale: ' + intent.reference
            : 'Procedi con il pagamento tramite carta'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in wallet-topup function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})