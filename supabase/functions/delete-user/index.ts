// Supabase Edge Function: Admin Delete User & Revoke Session
// Deploy with: supabase functions deploy delete-user

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
    const { userId, email } = body;

    if (!userId && !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const found = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) targetUserId = found.id;
    }

    // 1. Delete user from auth.users (revokes all active sessions & refresh tokens)
    if (targetUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      } catch (err) {
        console.warn('[delete-user edge] Auth delete notice:', err);
      }
    }

    // 2. Cascade delete from profiles and student records
    try {
      if (targetUserId) {
        await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
        await supabaseAdmin.from('enrollments').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('progress').delete().eq('user_id', targetUserId);
        await supabaseAdmin.from('attempts').delete().eq('user_id', targetUserId);
      }
      if (email) {
        await supabaseAdmin.from('profiles').delete().eq('email', email.toLowerCase());
      }
    } catch (dbErr) {
      console.warn('[delete-user edge] DB cleanup notice:', dbErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted and credentials revoked.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

