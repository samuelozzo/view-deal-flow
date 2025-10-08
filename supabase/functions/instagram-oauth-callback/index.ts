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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const userId = url.searchParams.get('state'); // We'll pass user ID as state

    if (!code) {
      throw new Error('No authorization code provided');
    }

    const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID');
    const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET');
    const redirectUri = `${url.origin}/auth/instagram/callback`;

    // Exchange code for short-lived token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
    );

    const longLivedData = await longLivedResponse.json();

    if (!longLivedData.access_token) {
      throw new Error('Failed to get long-lived token');
    }

    // Get user info
    const userInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedData.access_token}`
    );

    const userInfo = await userInfoResponse.json();

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('profiles')
      .update({
        instagram_access_token: longLivedData.access_token,
        instagram_user_id: userInfo.id,
      })
      .eq('id', userId);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Redirect back to settings page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${url.origin}/account-settings?instagram=connected`,
      },
    });

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
