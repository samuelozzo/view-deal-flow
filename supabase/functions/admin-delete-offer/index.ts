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
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Utente non autenticato' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Solo gli admin possono eliminare offerte' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { offer_id, admin_message } = await req.json();

    if (!offer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'offer_id è richiesto' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[admin-delete-offer] Admin ${user.id} deleting offer ${offer_id}`);

    // Get offer details
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .select('*')
      .eq('id', offer_id)
      .single();

    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Offerta non trovata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check for pending applications
    const { data: pendingApplications } = await supabaseClient
      .from('applications')
      .select('id, creator_id')
      .eq('offer_id', offer_id)
      .eq('status', 'pending');

    const hasPendingApplications = (pendingApplications?.length || 0) > 0;

    // Calculate remaining reward for cash offers
    const remainingRewardCents = offer.total_reward_cents - offer.claimed_reward_cents;

    // If cash offer with remaining funds, release from escrow
    if (offer.reward_type === 'cash' && remainingRewardCents > 0) {
      console.log(`[admin-delete-offer] Releasing ${remainingRewardCents} cents from escrow`);

      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', offer.business_id)
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
          available_cents: wallet.available_cents + remainingRewardCents,
          reserved_cents: wallet.reserved_cents - remainingRewardCents,
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

      // Create wallet transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'escrow_release',
          direction: 'in',
          amount_cents: remainingRewardCents,
          status: 'completed',
          reference_type: 'offer',
          reference_id: offer_id,
          metadata: {
            reason: 'admin_deleted_offer',
            admin_id: user.id,
            admin_message: admin_message || 'Offerta eliminata dall\'amministratore',
            offer_title: offer.title,
          },
        });

      // Update escrow transaction status
      await supabaseClient
        .from('escrow_transactions')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('offer_id', offer_id)
        .eq('status', 'funded');

      console.log(`[admin-delete-offer] Funds released successfully`);
    }

    // Reject pending applications and notify creators
    if (hasPendingApplications && pendingApplications) {
      console.log(`[admin-delete-offer] Rejecting ${pendingApplications.length} pending applications`);
      
      for (const app of pendingApplications) {
        // Update application status
        await supabaseClient
          .from('applications')
          .update({ status: 'rejected' })
          .eq('id', app.id);

        // Notify creator
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: app.creator_id,
            type: 'application_rejected',
            title: 'Applicazione rifiutata',
            message: `La tua applicazione per "${offer.title}" è stata rifiutata perché l'offerta è stata chiusa dall'amministratore.`,
            link: `/offers/${offer_id}`,
          });
      }
    }

    // Notify business user
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: offer.business_id,
        type: 'offer_deleted_by_admin',
        title: 'Offerta eliminata',
        message: admin_message || `La tua offerta "${offer.title}" è stata eliminata dall'amministratore.`,
        link: '/dashboard',
      });

    // Delete the offer (cascade will delete related data)
    const { error: deleteError } = await supabaseClient
      .from('offers')
      .delete()
      .eq('id', offer_id);

    if (deleteError) {
      console.error('Error deleting offer:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Errore durante l\'eliminazione' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`[admin-delete-offer] Offer ${offer_id} deleted successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        funds_released: offer.reward_type === 'cash' ? remainingRewardCents : 0,
        applications_rejected: pendingApplications?.length || 0,
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
