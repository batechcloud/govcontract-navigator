import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { feature_code, increment_usage } = await req.json();

    if (!feature_code) {
      return new Response(JSON.stringify({ error: 'feature_code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Checking feature access for user ${user.id}, feature: ${feature_code}`);

    // Check feature access using the database function
    const { data: accessData, error: accessError } = await supabase
      .rpc('check_feature_access', {
        _user_id: user.id,
        _feature_code: feature_code,
      });

    if (accessError) {
      console.error('Error checking feature access:', accessError);
      return new Response(JSON.stringify({ error: 'Failed to check feature access' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const access = accessData?.[0] || { has_access: false, usage_limit: null, current_usage: 0, is_override: false };

    // Check if usage limit is exceeded
    const withinLimit = access.usage_limit === null || access.current_usage < access.usage_limit;
    const canUse = access.has_access && withinLimit;

    // If requested and allowed, increment usage
    if (increment_usage && canUse) {
      const { data: newCount, error: usageError } = await supabase
        .rpc('increment_feature_usage', {
          _user_id: user.id,
          _feature_code: feature_code,
        });

      if (usageError) {
        console.error('Error incrementing usage:', usageError);
      } else {
        access.current_usage = newCount;
      }
    }

    const response = {
      has_access: access.has_access,
      can_use: canUse,
      usage_limit: access.usage_limit,
      current_usage: access.current_usage,
      remaining: access.usage_limit ? Math.max(0, access.usage_limit - access.current_usage) : null,
      is_override: access.is_override,
    };

    console.log(`Feature access result:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-feature-access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
