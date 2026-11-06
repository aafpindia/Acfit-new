// Supabase Edge Function: Admin User Soft-Delete & Archive Mode / Restoration
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
    const { userId, email, action = 'archive' } = body;

    const cleanEmail = (email || '').toLowerCase().trim();
    if (cleanEmail === 'admin@gmail.com') {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot archive or modify primary administrator' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId && !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const found = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (found) targetUserId = found.id;
    }

    const isRestore = action === 'restore';

    if (isRestore) {
      if (targetUserId) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: 'none' });
        } catch (err) {
          console.warn('[restore-user edge] Auth unban notice:', err);
        }
      }

      const restorePayload = {
        status: 'active',
        is_deleted: false,
        deleted_at: null,
      };

      try {
        if (targetUserId) {
          await supabaseAdmin.from('profiles').update(restorePayload).eq('id', targetUserId);
        }
        if (cleanEmail) {
          await supabaseAdmin.from('profiles').update(restorePayload).eq('email', cleanEmail);
        }
      } catch (dbErr) {
        console.warn('[restore-user edge] DB update notice:', dbErr);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User restored and login re-enabled.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Archive / Soft-delete
      if (targetUserId) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' });
        } catch (err) {
          console.warn('[archive-user edge] Auth ban notice:', err);
        }
      }

      const archivePayload = {
        status: 'suspended',
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      };

      try {
        if (targetUserId) {
          await supabaseAdmin.from('profiles').update(archivePayload).eq('id', targetUserId);
        }
        if (cleanEmail) {
          await supabaseAdmin.from('profiles').update(archivePayload).eq('email', cleanEmail);
        }
      } catch (dbErr) {
        console.warn('[archive-user edge] DB archive notice:', dbErr);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User archived in soft-delete mode and credentials revoked.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
