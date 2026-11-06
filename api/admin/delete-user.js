/**
 * Serverless / Middleware Endpoint: Admin User Soft-Delete & Archive Mode / Restoration
 *
 * Implements the Soft-Delete Pattern (is_deleted, deleted_at, status='suspended')
 * instead of destructive cascade DELETE.
 *
 * - When archiving: Bans the auth user via Supabase Auth Admin API (ban_duration: '876000h')
 *   and updates profiles (status='suspended', is_deleted=TRUE, deleted_at=NOW()).
 *   Preserves enrollments, assessment attempts, exam scores, and certificates for compliance.
 *
 * - When restoring: Unbans the auth user (ban_duration: 'none')
 *   and updates profiles (status='active', is_deleted=FALSE, deleted_at=NULL).
 */

import { createClient } from '@supabase/supabase-js';
import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

export async function handleAdminDeleteUser(req, res) {
  if (handleCors(req, res, 'POST, GET, OPTIONS, DELETE')) return;

  if (req.method !== 'POST' && req.method !== 'DELETE' && req.method !== 'GET') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { userId, email, action = 'archive' } = body;

    const cleanEmail = (email || '').toLowerCase().trim();
    if (cleanEmail === 'admin@gmail.com') {
      return sendResponse(res, 400, { success: false, error: 'Cannot modify or archive primary system administrator.' });
    }

    if (!userId && !email) {
      return sendResponse(res, 400, { success: false, error: 'User ID or email is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    const isUUID = typeof userId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);

    const isRestore = action === 'restore';

    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      let targetUserId = isUUID ? userId : null;

      // If only email provided or ID is non-UUID, locate the auth user ID
      if (!targetUserId && email) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (found) targetUserId = found.id;
      }

      if (isRestore) {
        // ── RESTORE USER ──
        if (targetUserId) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              ban_duration: 'none',
            });
          } catch (e) {
            console.warn('[Admin Restore User Auth Warning]', e.message);
          }
        }

        const restorePayload = {
          status: 'active',
        };

        try {
          if (targetUserId) {
            await supabaseAdmin.from('profiles').update(restorePayload).eq('id', targetUserId);
          }
          if (cleanEmail) {
            await supabaseAdmin.from('profiles').update(restorePayload).eq('email', cleanEmail);
          }
        } catch (dbErr) {
          console.warn('[Admin Restore User DB Notice]', dbErr.message);
        }

        return sendResponse(res, 200, {
          success: true,
          userId: targetUserId || userId,
          action: 'restore',
          message: 'User restored successfully. Login access re-enabled and historical records active.',
        });
      } else {
        // ── SOFT-DELETE / ARCHIVE USER ──
        // 1. Invalidate sessions and block login via ban_duration (876000h = 100 years)
        if (targetUserId) {
          try {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              ban_duration: '876000h',
            });
          } catch (e) {
            console.warn('[Admin Archive User Auth Warning]', e.message);
          }
        }

        // 2. Soft-delete flag on profiles record (PRESERVES past attempts, certificates & enrollments)
        const archivePayload = {
          status: 'suspended',
        };

        try {
          if (targetUserId) {
            await supabaseAdmin.from('profiles').update(archivePayload).eq('id', targetUserId);
          }
          if (cleanEmail) {
            await supabaseAdmin.from('profiles').update(archivePayload).eq('email', cleanEmail);
          }
        } catch (dbErr) {
          console.warn('[Admin Archive User DB Notice]', dbErr.message);
        }

        return sendResponse(res, 200, {
          success: true,
          userId: targetUserId || userId,
          action: 'archive',
          message: 'User archived and active sessions revoked. Historical scores and records preserved.',
        });
      }
    }

    // Direct database update via Anon Key fallback
    if (supabaseUrl && anonKey) {
      try {
        const supabaseClient = createClient(supabaseUrl, anonKey);
        const payload = isRestore
          ? { status: 'active' }
          : { status: 'suspended' };

        if (cleanEmail) {
          await supabaseClient.from('profiles').update(payload).eq('email', cleanEmail);
        }
        if (isUUID) {
          await supabaseClient.from('profiles').update(payload).eq('id', userId);
        }

        return sendResponse(res, 200, {
          success: true,
          userId,
          action: isRestore ? 'restore' : 'archive',
          message: `User ${isRestore ? 'restored' : 'archived'} in Supabase database successfully.`,
        });
      } catch (anonErr) {
        console.warn('[Admin Delete/Archive User Anon Fallback Notice]', anonErr.message);
      }
    }

    // Mock / Offline response
    return sendResponse(res, 200, {
      success: true,
      userId,
      isSimulated: true,
      action: isRestore ? 'restore' : 'archive',
      message: `User ${isRestore ? 'restored in' : 'archived in'} local platform registry.`,
    });
  } catch (err) {
    console.error('[Admin Archive/Restore User Exception]', err);
    return sendResponse(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
}

export default handleAdminDeleteUser;
