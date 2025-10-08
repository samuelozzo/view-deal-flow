import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-OFFER-WITH-ESCROW] ${step}${detailsStr}`);
};

interface CreateOfferRequest {
  title: string;
  description: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube';
  reward_type: 'cash' | 'discount' | 'free';
  total_reward_cents: number;
  required_views: number;
  category: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key for transaction
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const offerData: CreateOfferRequest = await req.json();
    logStep("Offer data received", offerData);

    // Validate that user has business role
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'business')
      .single();

    if (!roles) {
      throw new Error("User is not a business user");
    }

    // For cash rewards, perform atomic transaction
    if (offerData.reward_type === 'cash' && offerData.total_reward_cents > 0) {
      logStep("Processing cash reward offer", { amount_cents: offerData.total_reward_cents });

      // Get wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .select('id, available_cents, reserved_cents')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        throw new Error("Wallet not found");
      }

      logStep("Wallet found", { wallet_id: wallet.id, available_cents: wallet.available_cents });

      // Check sufficient funds
      if (wallet.available_cents < offerData.total_reward_cents) {
        throw new Error(`Insufficient funds. Available: €${(wallet.available_cents / 100).toFixed(2)}, Required: €${(offerData.total_reward_cents / 100).toFixed(2)}`);
      }

      // Start atomic transaction: Create offer, deduct from wallet, create escrow
      const { data: newOffer, error: offerError } = await supabaseClient
        .from('offers')
        .insert({
          business_id: user.id,
          title: offerData.title,
          description: offerData.description,
          platform: offerData.platform,
          reward_type: offerData.reward_type,
          total_reward_cents: offerData.total_reward_cents,
          required_views: offerData.required_views,
          category: offerData.category,
          status: 'open',
          escrow_funded: true,
        })
        .select('id')
        .single();

      if (offerError) {
        logStep("ERROR creating offer", { error: offerError });
        throw new Error(`Failed to create offer: ${offerError.message}`);
      }

      logStep("Offer created", { offer_id: newOffer.id });

      // Deduct from wallet
      const { error: walletUpdateError } = await supabaseClient
        .from('wallets')
        .update({
          available_cents: wallet.available_cents - offerData.total_reward_cents,
          reserved_cents: wallet.reserved_cents + offerData.total_reward_cents,
        })
        .eq('id', wallet.id)
        .eq('available_cents', wallet.available_cents); // Optimistic locking

      if (walletUpdateError) {
        logStep("ERROR updating wallet", { error: walletUpdateError });
        // Rollback offer
        await supabaseClient.from('offers').delete().eq('id', newOffer.id);
        throw new Error(`Failed to deduct wallet funds: ${walletUpdateError.message}`);
      }

      logStep("Wallet updated", { 
        new_available: wallet.available_cents - offerData.total_reward_cents,
        new_reserved: wallet.reserved_cents + offerData.total_reward_cents 
      });

      // Create escrow transaction
      const { error: escrowError } = await supabaseClient
        .from('escrow_transactions')
        .insert({
          offer_id: newOffer.id,
          amount_cents: offerData.total_reward_cents,
          status: 'funded',
          duration_days: 14,
        });

      if (escrowError) {
        logStep("ERROR creating escrow", { error: escrowError });
        // Rollback wallet and offer
        await supabaseClient
          .from('wallets')
          .update({
            available_cents: wallet.available_cents,
            reserved_cents: wallet.reserved_cents,
          })
          .eq('id', wallet.id);
        await supabaseClient.from('offers').delete().eq('id', newOffer.id);
        throw new Error(`Failed to create escrow: ${escrowError.message}`);
      }

      logStep("Escrow created successfully");

      // Create wallet transaction record
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'escrow_reserve',
          direction: 'out',
          amount_cents: offerData.total_reward_cents,
          status: 'completed',
          reference_type: 'offer',
          reference_id: newOffer.id,
          metadata: {
            offer_title: offerData.title,
            action: 'offer_created'
          }
        });

      logStep("Transaction complete");

      return new Response(JSON.stringify({ 
        success: true, 
        offer_id: newOffer.id,
        escrow_funded: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      // Non-cash rewards: simple offer creation
      logStep("Processing non-cash reward offer");

      const { data: newOffer, error: offerError } = await supabaseClient
        .from('offers')
        .insert({
          business_id: user.id,
          title: offerData.title,
          description: offerData.description,
          platform: offerData.platform,
          reward_type: offerData.reward_type,
          total_reward_cents: offerData.total_reward_cents,
          required_views: offerData.required_views,
          category: offerData.category,
          status: 'open',
          escrow_funded: false,
        })
        .select('id')
        .single();

      if (offerError) {
        throw new Error(`Failed to create offer: ${offerError.message}`);
      }

      logStep("Non-cash offer created", { offer_id: newOffer.id });

      return new Response(JSON.stringify({ 
        success: true, 
        offer_id: newOffer.id,
        escrow_funded: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-offer-with-escrow", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
