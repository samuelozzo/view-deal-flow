import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Starting escrow release process...')

    // Find all escrows that should be released (funded and past scheduled_release_at)
    const { data: escrows, error: fetchError } = await supabase
      .from('escrow_transactions')
      .select(`
        id,
        amount_cents,
        creator_id,
        submission_id,
        offer_id,
        scheduled_release_at
      `)
      .eq('status', 'funded')
      .lte('scheduled_release_at', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching escrows:', fetchError)
      throw fetchError
    }

    console.log(`Found ${escrows?.length || 0} escrows to release`)

    const results = []
    
    for (const escrow of escrows || []) {
      console.log(`Processing escrow ${escrow.id}...`)
      
      try {
        // Get submission details
        const { data: submission, error: submissionError } = await supabase
          .from('submissions')
          .select(`
            id,
            application_id,
            applications!inner(
              id,
              creator_id,
              offer_id,
              offers!inner(
                id,
                title,
                business_id
              )
            )
          `)
          .eq('id', escrow.submission_id)
          .single()

        if (submissionError || !submission) {
          console.error(`Submission not found: ${escrow.submission_id}`)
          results.push({ escrow_id: escrow.id, status: 'failed', error: 'Submission not found' })
          continue
        }

        const application = submission.applications as any
        const offer = application.offers as any
        const businessId = offer.business_id

        // Get creator wallet
        const { data: creatorWallet, error: walletError } = await supabase
          .from('wallets')
          .select('id, available_cents, reserved_cents')
          .eq('user_id', escrow.creator_id)
          .single()

        if (walletError || !creatorWallet) {
          console.error(`Wallet not found for creator ${escrow.creator_id}`)
          results.push({ escrow_id: escrow.id, status: 'failed', error: 'Wallet not found' })
          continue
        }

        // Get business wallet to unreserve
        const { data: businessWallet, error: businessWalletError } = await supabase
          .from('wallets')
          .select('id, reserved_cents')
          .eq('user_id', businessId)
          .single()

        if (businessWalletError || !businessWallet) {
          console.error(`Business wallet not found for ${businessId}`)
          results.push({ escrow_id: escrow.id, status: 'failed', error: 'Business wallet not found' })
          continue
        }

        // Start transaction-like operations
        // 1. Credit creator wallet and unreserve
        const { error: updateCreatorError } = await supabase
          .from('wallets')
          .update({
            available_cents: creatorWallet.available_cents + escrow.amount_cents,
            reserved_cents: Math.max(0, creatorWallet.reserved_cents - escrow.amount_cents)
          })
          .eq('id', creatorWallet.id)

        if (updateCreatorError) {
          console.error('Error updating creator wallet:', updateCreatorError)
          results.push({ escrow_id: escrow.id, status: 'failed', error: 'Failed to credit creator' })
          continue
        }

        // 2. Unreserve from business wallet
        const { error: updateBusinessError } = await supabase
          .from('wallets')
          .update({
            reserved_cents: Math.max(0, businessWallet.reserved_cents - escrow.amount_cents)
          })
          .eq('id', businessWallet.id)

        if (updateBusinessError) {
          console.error('Error updating business wallet:', updateBusinessError)
        }

        // 3. Create wallet transaction for creator
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: creatorWallet.id,
            type: 'escrow_release',
            direction: 'in',
            amount_cents: escrow.amount_cents,
            status: 'completed',
            reference_type: 'escrow',
            reference_id: escrow.id,
            metadata: {
              submission_id: escrow.submission_id,
              offer_id: escrow.offer_id
            }
          })

        if (transactionError) {
          console.error('Error creating transaction:', transactionError)
        }

        // 4. Update escrow status
        const { error: escrowUpdateError } = await supabase
          .from('escrow_transactions')
          .update({
            status: 'released',
            released_at: new Date().toISOString()
          })
          .eq('id', escrow.id)

        if (escrowUpdateError) {
          console.error('Error updating escrow:', escrowUpdateError)
          results.push({ escrow_id: escrow.id, status: 'failed', error: 'Failed to update escrow' })
          continue
        }

        // 5. Update submission status to paid
        const { error: submissionUpdateError } = await supabase
          .from('submissions')
          .update({ status: 'paid' })
          .eq('id', escrow.submission_id)

        if (submissionUpdateError) {
          console.error('Error updating submission:', submissionUpdateError)
        }

        // 6. Send notification to creator
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: escrow.creator_id,
            type: 'payout_released',
            title: 'Payout Rilasciato',
            message: `Il tuo pagamento di €${(escrow.amount_cents / 100).toFixed(2)} per "${offer.title}" è stato accreditato sul tuo wallet.`,
            link: '/dashboard'
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
        }

        // 7. Send notification to business
        const { error: businessNotificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: businessId,
            type: 'escrow_completed',
            title: 'Escrow Completato',
            message: `L'escrow di €${(escrow.amount_cents / 100).toFixed(2)} per "${offer.title}" è stato completato.`,
            link: `/offers/${escrow.offer_id}`
          })

        if (businessNotificationError) {
          console.error('Error creating business notification:', businessNotificationError)
        }

        console.log(`Successfully released escrow ${escrow.id}`)
        results.push({ escrow_id: escrow.id, status: 'success' })
        
      } catch (error: any) {
        console.error(`Error processing escrow ${escrow.id}:`, error)
        results.push({ escrow_id: escrow.id, status: 'failed', error: error?.message || 'Unknown error' })
      }
    }

    console.log('Escrow release process completed')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in release-escrows function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})