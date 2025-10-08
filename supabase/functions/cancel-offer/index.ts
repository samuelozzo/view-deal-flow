import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Utente non autenticato' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { offer_id } = await req.json();

    if (!offer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'offer_id è richiesto' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[cancel-offer] User ${user.id} cancelling offer ${offer_id}`);

    // Verify user owns the offer and is business user
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isBusiness = userRoles?.some(r => r.role === 'business');
    if (!isBusiness) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solo gli utenti business possono annullare offerte' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get offer details
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .select('*')
      .eq('id', offer_id)
      .eq('business_id', user.id)
      .single();

    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Offerta non trovata o non autorizzato' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check for active/pending applications
    const { data: applications } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('offer_id', offer_id)
      .in('status', ['pending', 'accepted']);

    if ((applications?.length || 0) > 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non puoi annullare un\'offerta con applicazioni attive o in attesa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // If offer has cash reward, release funds from escrow
    if (offer.reward_type === 'cash' && offer.total_reward_cents > 0) {
      console.log(`[cancel-offer] Releasing ${offer.total_reward_cents} cents from escrow for offer ${offer_id}`);

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        return new Response(
          JSON.stringify({ success: false, error: 'Wallet non trovato' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update wallet: move from reserved back to available
      const { error: walletUpdateError } = await supabaseClient
        .from('wallets')
        .update({
          available_cents: wallet.available_cents + offer.total_reward_cents,
          reserved_cents: wallet.reserved_cents - offer.total_reward_cents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (walletUpdateError) {
        console.error('Error updating wallet:', walletUpdateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Errore aggiornamento wallet' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Create wallet transaction for the release
      const { error: txError } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'escrow_release',
          direction: 'in',
          amount_cents: offer.total_reward_cents,
          status: 'completed',
          reference_type: 'offer',
          reference_id: offer_id,
          metadata: {
            reason: 'offer_cancelled',
            offer_title: offer.title,
          },
        });

      if (txError) {
        console.error('Error creating transaction:', txError);
        // Continue anyway - wallet was updated
      }

      // Update escrow transaction status to refunded
      const { error: escrowError } = await supabaseClient
        .from('escrow_transactions')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('offer_id', offer_id)
        .eq('status', 'funded');

      if (escrowError) {
        console.error('Error updating escrow:', escrowError);
        // Continue anyway
      }

      console.log(`[cancel-offer] Funds released successfully`);
    }

    // Delete the offer
    const { error: deleteError } = await supabaseClient
      .from('offers')
      .delete()
      .eq('id', offer_id);

    if (deleteError) {
      console.error('Error deleting offer:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Errore durante l\'eliminazione dell\'offerta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[cancel-offer] Offer ${offer_id} cancelled successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        funds_released: offer.reward_type === 'cash' ? offer.total_reward_cents : 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
