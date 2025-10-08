import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CacheEntry {
  views: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

function extractMediaIdFromPermalink(permalink: string): string | null {
  // Instagram permalink formats:
  // https://www.instagram.com/p/CODE/
  // https://www.instagram.com/reel/CODE/
  const match = permalink.match(/instagram\.com\/(p|reel)\/([^/?]+)/);
  return match ? match[2] : null;
}

async function getMediaId(shortcode: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://graph.instagram.com/v18.0/media?fields=id&access_token=${accessToken}&shortcode=${shortcode}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }
  
  return data.id;
}

async function getMediaViews(mediaId: string, mediaType: 'VIDEO' | 'REEL', accessToken: string): Promise<number> {
  const metric = mediaType === 'REEL' ? 'plays' : 'video_views';
  
  const response = await fetch(
    `https://graph.instagram.com/v18.0/${mediaId}/insights?metric=${metric}&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }
  
  return data.data?.[0]?.values?.[0]?.value || 0;
}

async function getMediaType(mediaId: string, accessToken: string): Promise<'VIDEO' | 'REEL'> {
  const response = await fetch(
    `https://graph.instagram.com/v18.0/${mediaId}?fields=media_type,media_product_type&access_token=${accessToken}`
  );
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`);
  }
  
  // Check if it's a reel
  if (data.media_product_type === 'REELS') {
    return 'REEL';
  }
  
  return 'VIDEO';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { permalink } = await req.json();

    if (!permalink) {
      throw new Error('Permalink is required');
    }

    // Check cache
    const cacheKey = `${user.id}:${permalink}`;
    const cachedEntry = cache.get(cacheKey);
    
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log('Returning cached views for:', permalink);
      return new Response(
        JSON.stringify({ views: cachedEntry.views, cached: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's Instagram credentials
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('instagram_access_token, instagram_user_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.instagram_access_token) {
      throw new Error('Instagram not connected. Please connect your Instagram account in settings.');
    }

    // Extract shortcode from permalink
    const shortcode = extractMediaIdFromPermalink(permalink);
    
    if (!shortcode) {
      throw new Error('Invalid Instagram permalink');
    }

    // Get media ID from shortcode
    const mediaId = await getMediaId(shortcode, profile.instagram_access_token);
    
    // Get media type
    const mediaType = await getMediaType(mediaId, profile.instagram_access_token);
    
    // Get views
    const views = await getMediaViews(mediaId, mediaType, profile.instagram_access_token);

    // Cache the result
    cache.set(cacheKey, { views, timestamp: Date.now() });

    console.log(`Retrieved ${views} views for ${mediaType}:`, permalink);

    return new Response(
      JSON.stringify({ views, mediaType, cached: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching Instagram views:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
