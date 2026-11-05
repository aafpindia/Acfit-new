/**
 * Serverless / Middleware Endpoint: Admin User Creation
 *
 * Creates users using Supabase Auth Admin API (supabase.auth.admin.createUser)
 * using the Service Role Key. Prevents client-side session mutation and
 * avoids foreign key constraint violations on profiles table.
 */

import { createClient } from '@supabase/supabase-js';
import { parseRequestBody, sendResponse, handleCors } from '../_utils.js';

export async function handleAdminCreateUser(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const {
      email,
      fullName = 'Member',
      role = 'user',
      status = 'active',
      password = 'Password123!',
    } = body;

    if (!email) {
      return sendResponse(res, 400, { success: false, error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role.toLowerCase().trim();
    const cleanName = fullName.trim() || 'Member';

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // 1. If Service Role Key is configured, use official Supabase Auth Admin API
    if (supabaseUrl && serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      // Create pre-confirmed user without affecting any client browser session
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password || 'Password123!',
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: cleanRole,
        },
      });

      if (authError) {
        console.error('[Admin Create User Auth Error]', authError);
        return sendResponse(res, 400, { success: false, error: authError.message });
      }

      const userId = authData.user.id;

      // Ensure profile is recorded in profiles table
      const { data: profile, error: profError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: cleanEmail,
            full_name: cleanName,
            role: cleanRole,
            status: status || 'active',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      if (profError) {
        console.warn('[Admin Create User Profile Upsert Notice]', profError);
      }

      return sendResponse(res, 200, {
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
          fullName: profile?.full_name || cleanName,
          role: cleanRole,
          status: status || 'active',
          createdAt: profile?.created_at || new Date().toISOString(),
          source: 'database',
        },
      });
    }

    // 2. Development / Fallback mode: Use Anon Key with direct DB upsert or simulated user
    if (supabaseUrl && anonKey) {
      const supabaseClient = createClient(supabaseUrl, anonKey);
      const generatedId = crypto.randomUUID();

      const { data: profile, error: dbError } = await supabaseClient
        .from('profiles')
        .upsert(
          {
            id: generatedId,
            email: cleanEmail,
            full_name: cleanName,
            role: cleanRole,
            status: status || 'active',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();

      if (!dbError && profile) {
        return sendResponse(res, 200, {
          success: true,
          user: {
            id: profile.id,
            email: cleanEmail,
            fullName: profile.full_name || cleanName,
            role: cleanRole,
            status: profile.status || status || 'active',
            createdAt: profile.created_at || new Date().toISOString(),
            source: 'database',
          },
        });
      }
    }

    // 3. Offline / simulated user fallback
    const mockId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    return sendResponse(res, 200, {
      success: true,
      user: {
        id: mockId,
        email: cleanEmail,
        fullName: cleanName,
        role: cleanRole,
        status: status || 'active',
        createdAt: new Date().toISOString(),
        source: 'simulated',
      },
    });
  } catch (err) {
    console.error('[Admin Create User Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'Internal server error while creating user',
    });
  }
}

export default handleAdminCreateUser;

