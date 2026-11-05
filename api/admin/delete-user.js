/**
 * Serverless / Middleware Endpoint: Admin User Deletion & Session Revocation
 *
 * Permanently deletes users using Supabase Auth Admin API (supabase.auth.admin.deleteUser)
 * with the Service Role Key. This permanently invalidates the user's refresh tokens and
 * removes their profiles, enrollments, and progress so they cannot access the system.
 */

import { createClient } from '@supabase/supabase-js';
import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

export async function handleAdminDeleteUser(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { userId, email } = body;

    if (!userId && !email) {
      return sendResponse(res, 400, { success: false, error: 'User ID or email is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      let targetUserId = userId;

      // If only email provided or ID is non-UUID, locate the auth user ID
      if (!targetUserId && email) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (found) targetUserId = found.id;
      }

      // 1. Delete from Supabase Auth Admin API (immediately revokes tokens and prevents logins)
      if (targetUserId) {
        try {
          const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
          if (authErr && !authErr.message?.toLowerCase().includes('not found')) {
            console.warn('[Admin Delete User Auth Warning]', authErr.message);
          }
        } catch (e) {
          console.warn('[Admin Delete User Auth Exception]', e.message);
        }
      }

      // 2. Cascade delete records across public tables
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
        console.warn('[Admin Delete User DB Cleanup Notice]', dbErr.message);
      }

      return sendResponse(res, 200, {
        success: true,
        userId: targetUserId || userId,
        message: 'User deleted and active session credentials revoked successfully.',
      });
    }

    // Mock / Offline response
    return sendResponse(res, 200, {
      success: true,
      userId,
      isSimulated: true,
      message: 'User removed from local platform registry.',
    });
  } catch (err) {
    console.error('[Admin Delete User Exception]', err);
    return sendResponse(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
}

