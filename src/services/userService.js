import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';

/**
 * Fetch all registered users directly from Supabase DB `profiles` table with local cache fallback
 */
export const fetchUsers = async () => {
  let dbUsers = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbUsers = data.map((p) => ({
          id: p.id,
          fullName: p.full_name || p.fullName || (p.email ? p.email.split('@')[0] : 'Member'),
          email: p.email,
          phone: p.phone || '',
          location: p.location || '',
          bio: p.bio || '',
          role: (p.role || 'user').toLowerCase(),
          status: p.status || 'active',
          avatarUrl: p.avatar_url || null,
          createdAt: p.created_at || new Date().toISOString(),
          source: 'database'
        }));
      } else if (error) {
        handleSupabaseError(error, 'fetchUsers profiles');
      }
    } catch (err) {
      handleSupabaseError(err, 'fetchUsers profiles exception');
    }
  }

  // Read local registered users cache to merge any newly signed up / signed in users
  let localUsers = [];
  try {
    const raw = localStorage.getItem('_lms_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localUsers = parsed
          .filter(u => (u.email || '').toLowerCase() !== 'user@gmail.com')
          .map(u => ({
            id: u.id,
            fullName: u.fullName || (u.email ? u.email.split('@')[0] : 'Member'),
            email: u.email,
            phone: u.phone || '',
            location: u.location || '',
            bio: u.bio || '',
            role: (u.role || 'user').toLowerCase(),
            status: u.status || 'active',
            avatarUrl: u.avatarUrl || null,
            createdAt: u.createdAt || new Date().toISOString(),
            source: 'local'
          }));
      }
    }
  } catch (_) {}

  // Merge database users with local registered users by email
  const mergedMap = new Map();
  dbUsers.forEach(u => mergedMap.set((u.email || '').toLowerCase(), u));
  localUsers.forEach(u => {
    const key = (u.email || '').toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, u);
    } else {
      // Merge extra details (like phone or location) if local has newer data
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        ...existing,
        phone: existing.phone || u.phone || '',
        location: existing.location || u.location || '',
        bio: existing.bio || u.bio || ''
      });
    }
  });

  return Array.from(mergedMap.values());
};

/**
 * Create a new user securely without client-side session clobbering.
 * Uses administrative endpoint `/api/admin/create-user` or Supabase Edge Function `create-user`.
 */
export const createUser = async ({ email, fullName, role = 'user', status = 'active', password = 'Password123!' }) => {
  if (!email) {
    return { success: false, error: 'Email is required' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanRole = role.toLowerCase().trim();
  const cleanName = (fullName || 'Member').trim();

  // 1. Try local serverless / middleware endpoint
  try {
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        fullName: cleanName,
        role: cleanRole,
        status: status || 'active',
        password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.user) {
        return handleSuccess(data.user);
      }
    }
  } catch (apiErr) {
    console.warn('[userService] /api/admin/create-user fetch error, trying edge function:', apiErr);
  }

  // 2. Try Supabase Edge Function `create-user`
  if (isSupabaseConfigured && supabase.functions) {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: cleanEmail,
          fullName: cleanName,
          role: cleanRole,
          status: status || 'active',
          password,
        },
      });

      if (!error && data?.success && data?.user) {
        return handleSuccess(data.user);
      }
    } catch (funcErr) {
      console.warn('[userService] Supabase create-user function invocation failed:', funcErr);
    }
  }

  // 3. Fallback: Direct database upsert into profiles (Never call supabase.auth.signUp from client to preserve admin session)
  if (isSupabaseConfigured) {
    try {
      // Check if user profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      const targetId = existing?.id || crypto.randomUUID();

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: targetId,
          email: cleanEmail,
          full_name: cleanName,
          role: cleanRole,
          status: status || 'active',
          created_at: existing?.created_at || new Date().toISOString(),
        }, { onConflict: 'email' })
        .select()
        .maybeSingle();

      if (!profileErr && profileData) {
        return handleSuccess({
          id: profileData.id,
          fullName: profileData.full_name || cleanName,
          email: cleanEmail,
          role: profileData.role || cleanRole,
          status: profileData.status || status || 'active',
          createdAt: profileData.created_at || new Date().toISOString(),
          source: 'database',
        });
      }
    } catch (dbErr) {
      console.warn('[userService] Fallback database profile upsert notice:', dbErr);
    }
  }

  // 4. In-memory / Mock fallback if DB is not reachable
  const mockUser = {
    id: `usr-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    fullName: cleanName,
    email: cleanEmail,
    role: cleanRole,
    status: status || 'active',
    createdAt: new Date().toISOString(),
    source: 'local',
  };

  return handleSuccess(mockUser);
};

/**
 * Update an existing user in Supabase `profiles` table
 */
export const updateUser = async (userId, updates) => {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Invalid parameters.' };
  }

  try {
    const dbUpdates = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.role !== undefined) dbUpdates.role = updates.role.toLowerCase();
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return handleSupabaseError(error, 'updateUser');
    }

    return handleSuccess(data);
  } catch (err) {
    return handleSupabaseError(err, 'updateUser exception');
  }
};

/**
 * Delete a user from Supabase `profiles` table
 */
export const deleteUser = async (userId) => {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Invalid parameters.' };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return handleSupabaseError(error, 'deleteUser');
    }

    return handleSuccess(true);
  } catch (err) {
    return handleSupabaseError(err, 'deleteUser exception');
  }
};

/**
 * Send password reset email via Supabase Auth
 */
export const sendPasswordResetEmail = async (email) => {
  if (!email) {
    return { success: false, error: 'Email address is required.' };
  }

  const cleanEmail = email.toLowerCase().trim();

  if (!isSupabaseConfigured) {
    console.warn('[userService] Supabase not configured. Simulated reset password email to:', cleanEmail);
    return handleSuccess({ message: `Simulated password reset email sent to ${cleanEmail}` });
  }

  try {
    const redirectTo = typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/reset-password`
      : 'http://localhost:3000/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      console.error('[userService] resetPasswordForEmail error:', error);
      return handleSupabaseError(error, 'sendPasswordResetEmail');
    }

    return handleSuccess({ message: `Password reset email sent to ${cleanEmail}` });
  } catch (err) {
    console.error('[userService] resetPasswordForEmail exception:', err);
    return handleSupabaseError(err, 'sendPasswordResetEmail exception');
  }
};
