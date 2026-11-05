// Supabase Edge Function: Admin Create User
// Deploy with: supabase functions deploy create-user
// Safe administrative user provisioning without mutating client-side browser sessions.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase Service Role configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const {
      email,
      fullName = 'Member',
      role = 'user',
      status = 'active',
      password = 'Password123!',
    } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role.toLowerCase().trim();
    const cleanName = fullName.trim() || 'Member';

    // 1. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password || 'Password123!',
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: cleanRole,
      },
    });

    let userId = authData?.user?.id;

    if (authError) {
      // If user already exists in auth.users, find their existing ID
      if (authError.message?.toLowerCase().includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          userId = existing.id;
        }
      } else {
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to obtain user ID from Auth' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Upsert profile into public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: cleanEmail,
        full_name: cleanName,
        role: cleanRole,
        status: status || 'active',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (profileError) {
      console.error('[create-user] Profile upsert error:', profileError);
    }

    const result = {
      id: userId,
      fullName: profile?.full_name || cleanName,
      email: cleanEmail,
      role: cleanRole,
      status: status || 'active',
      createdAt: profile?.created_at || new Date().toISOString(),
      source: 'database',
    };

    return new Response(
      JSON.stringify({ success: true, user: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

