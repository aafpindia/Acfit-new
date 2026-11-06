import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';
import { useLmsStore } from '../stores/lmsStore';

const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

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
          is_deleted: p.status === 'suspended',
          deleted_at: p.status === 'suspended' ? (p.deleted_at || p.created_at || new Date().toISOString()) : null,
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
            is_deleted: Boolean(u.is_deleted),
            deleted_at: u.deleted_at || null,
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
        bio: existing.bio || u.bio || '',
        status: existing.status || u.status || 'active',
        is_deleted: (existing.status || u.status) === 'suspended',
        deleted_at: (existing.status || u.status) === 'suspended' ? (existing.deleted_at || u.deleted_at || new Date().toISOString()) : null
      });
    }
  });

  // Cross-check with revoked blacklist so revoked users are flagged as archived/suspended
  // If the user's database status is active, the database takes precedence (un-revoked / restored)
  try {
    const revokedRaw = localStorage.getItem('_lms_revoked_users');
    if (revokedRaw) {
      let revoked = JSON.parse(revokedRaw);
      let listChanged = false;
      revoked = revoked.filter(r => {
        const revMail = (r.email || '').toLowerCase().trim();
        if (!revMail || revMail === 'admin@gmail.com') return false; // Admin is never in revoked list
        if (mergedMap.has(revMail)) {
          const usr = mergedMap.get(revMail);
          // If Supabase DB marked this user as active, the DB takes precedence: user was restored
          if (usr.source === 'database' && usr.status === 'active') {
            listChanged = true;
            return false; // remove from revoked list
          }
          if (usr.status === 'suspended') {
            mergedMap.set(revMail, {
              ...usr,
              status: 'suspended',
              is_deleted: true,
              deleted_at: usr.deleted_at || r.revokedAt || new Date().toISOString()
            });
          }
        }
        return true;
      });
      if (listChanged) {
        localStorage.setItem('_lms_revoked_users', JSON.stringify(revoked));
      }
    }
  } catch (_) {}

  // Always guarantee primary administrator (admin@gmail.com) is present and active
  if (!mergedMap.has('admin@gmail.com')) {
    mergedMap.set('admin@gmail.com', {
      id: 'admin-gmail-initial-id-001',
      fullName: 'System Administrator',
      email: 'admin@gmail.com',
      role: 'admin',
      status: 'active',
      is_deleted: false,
      deleted_at: null,
      phone: '',
      location: '',
      bio: '',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      source: 'system'
    });
  } else {
    const adminObj = mergedMap.get('admin@gmail.com');
    mergedMap.set('admin@gmail.com', {
      ...adminObj,
      role: 'admin',
      status: 'active',
      is_deleted: false,
      deleted_at: null
    });
  }

  // Purge any accidental revocation of admin@gmail.com
  try {
    const revokedRaw = localStorage.getItem('_lms_revoked_users');
    if (revokedRaw) {
      const revoked = JSON.parse(revokedRaw);
      const cleaned = revoked.filter(r => (r.email || '').toLowerCase().trim() !== 'admin@gmail.com');
      localStorage.setItem('_lms_revoked_users', JSON.stringify(cleaned));
    }
  } catch (_) {}

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
  if (cleanEmail === 'admin@gmail.com') {
    return { success: false, error: 'admin@gmail.com is reserved as the primary system administrator.' };
  }
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

      let profileData = null;
      let profileErr = null;

      if (existing?.id) {
        const res = await supabase
          .from('profiles')
          .update({
            full_name: cleanName,
            role: cleanRole,
            status: status || 'active',
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle();
        profileData = res.data;
        profileErr = res.error;
      } else {
        const res = await supabase
          .from('profiles')
          .insert({
            id: targetId,
            email: cleanEmail,
            full_name: cleanName,
            role: cleanRole,
            status: status || 'active',
            created_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();
        profileData = res.data;
        profileErr = res.error;
      }

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
      console.warn('[userService] Fallback database profile insert/update notice:', dbErr);
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
 * Update an existing user in Supabase `profiles` table and local registered users cache.
 * If status changes to 'suspended', immediately invalidates active sessions.
 */
export const updateUser = async (userId, updates, targetEmail = null) => {
  if (!userId && !targetEmail) {
    return { success: false, error: 'Invalid parameters.' };
  }

  const cleanEmail = targetEmail ? targetEmail.toLowerCase().trim() : null;
  if (cleanEmail === 'admin@gmail.com' && updates.status === 'suspended') {
    return { success: false, error: 'The primary system administrator account (admin@gmail.com) cannot be deactivated.' };
  }
  const isUUID = isValidUUID(userId);
  let updatedRecord = null;

  // 1. Update Supabase profiles table if configured
  if (isSupabaseConfigured) {
    try {
      const dbUpdates = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.role !== undefined) dbUpdates.role = updates.role.toLowerCase();
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;

      if (isUUID) {
        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId)
          .select()
          .maybeSingle();

        if (!error && data) updatedRecord = data;
      }

      if (!updatedRecord && cleanEmail) {
        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('email', cleanEmail)
          .select()
          .maybeSingle();

        if (!error && data) updatedRecord = data;
      }
    } catch (err) {
      console.warn('[userService] updateUser database update notice:', err.message);
    }
  }

  // 2. Update local registered users cache
  try {
    const raw = localStorage.getItem('_lms_registered_users');
    if (raw) {
      const users = JSON.parse(raw);
      let found = false;
      const updatedList = users.map((u) => {
        const isMatch =
          (userId && u.id === userId) ||
          (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail);

        if (isMatch) {
          found = true;
          return {
            ...u,
            fullName: updates.fullName !== undefined ? updates.fullName : u.fullName,
            role: updates.role !== undefined ? updates.role.toLowerCase() : u.role,
            status: updates.status !== undefined ? updates.status : u.status,
            is_deleted: updates.status === 'active' ? false : (updates.is_deleted !== undefined ? updates.is_deleted : u.is_deleted),
            deleted_at: updates.status === 'active' ? null : (updates.deleted_at !== undefined ? updates.deleted_at : u.deleted_at),
            avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : u.avatarUrl,
            phone: updates.phone !== undefined ? updates.phone : u.phone,
            location: updates.location !== undefined ? updates.location : u.location,
            bio: updates.bio !== undefined ? updates.bio : u.bio
          };
        }
        return u;
      });

      if (found) {
        localStorage.setItem('_lms_registered_users', JSON.stringify(updatedList));
      }
    }
  } catch (_) {}

  // 3. Handle session revocation if status set to 'suspended'
  if (updates.status === 'suspended') {
    try {
      const revokedRaw = localStorage.getItem('_lms_revoked_users');
      const revoked = revokedRaw ? JSON.parse(revokedRaw) : [];
      const alreadyRevoked = revoked.some(
        (r) => (userId && r.id === userId) || (cleanEmail && r.email === cleanEmail)
      );
      if (!alreadyRevoked) {
        revoked.push({
          id: userId || null,
          email: cleanEmail || null,
          reason: 'suspended',
          revokedAt: new Date().toISOString()
        });
        localStorage.setItem('_lms_revoked_users', JSON.stringify(revoked));
      }

      // Invalidate current session if active user was suspended
      const currRaw = localStorage.getItem('_lms_current_session');
      if (currRaw) {
        const curr = JSON.parse(currRaw);
        const isMatch =
          (userId && curr.id === userId) ||
          (cleanEmail && (curr.email || '').toLowerCase().trim() === cleanEmail);
        if (isMatch) {
          localStorage.removeItem('_lms_current_session');
          localStorage.removeItem('_lms_session_security');
          if (isSupabaseConfigured) {
            supabase.auth.signOut().catch(() => {});
          }
        }
      }

      window.dispatchEvent(new CustomEvent('lms_user_revoked', { detail: { userId, email: cleanEmail, status: 'suspended' } }));
    } catch (_) {}
  } else if (updates.status === 'active') {
    // Un-suspend from revoked list if reactivated
    try {
      const revokedRaw = localStorage.getItem('_lms_revoked_users');
      if (revokedRaw) {
        const revoked = JSON.parse(revokedRaw);
        const filtered = revoked.filter(
          (r) => (userId && r.id === userId) || (cleanEmail && r.email === cleanEmail) ? false : true
        );
        localStorage.setItem('_lms_revoked_users', JSON.stringify(filtered));
      }
    } catch (_) {}

    try {
      const delRaw = localStorage.getItem('_lms_deleted_user_ids');
      if (delRaw) {
        const delIds = JSON.parse(delRaw);
        const filtered = delIds.filter(id => id !== userId);
        localStorage.setItem('_lms_deleted_user_ids', JSON.stringify(filtered));
      }
    } catch (_) {}

    // Unban via backend administrative endpoint
    try {
      fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: cleanEmail, action: 'restore' }),
      }).catch(() => {});
    } catch (_) {}
  }

  // 4. Update Zustand store
  try {
    const store = useLmsStore.getState();
    if (store.users) {
      const storeUsers = store.users.map((u) => {
        if ((userId && u.id === userId) || (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail)) {
          return { ...u, ...updates };
        }
        return u;
      });
      store.setUsers?.(storeUsers);
    }
  } catch (_) {}

  try {
    window.dispatchEvent(new Event('lms_users_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  return handleSuccess(updatedRecord || { id: userId, email: cleanEmail, ...updates });
};

/**
 * Soft-delete / Archive a user (Problem 1 Solution: Soft-Delete Flag is_deleted, deleted_at)
 * Sets status = 'suspended', is_deleted = TRUE, deleted_at = NOW()
 * Immediately invalidates active login sessions while preserving past enrollments,
 * exam attempts, assessment scores, and certificate records for compliance & accounting.
 */
export const archiveUser = async (userId, email = null) => {
  if (!userId && !email) {
    return { success: false, error: 'User identifier is required.' };
  }

  const cleanEmail = email ? email.toLowerCase().trim() : null;
  if (cleanEmail === 'admin@gmail.com') {
    return { success: false, error: 'The primary system administrator account (admin@gmail.com) cannot be archived or revoked.' };
  }
  const isUUID = isValidUUID(userId);
  const nowIso = new Date().toISOString();

  // 1. Try local serverless / middleware endpoint (calls Supabase Auth Admin API with ban_duration)
  try {
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: cleanEmail, action: 'archive' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        console.log('[userService] Admin archive user succeeded via backend endpoint.');
      }
    }
  } catch (apiErr) {
    console.warn('[userService] /api/admin/delete-user archive notice:', apiErr.message);
  }

  // 2. Update Supabase database profile (status = 'suspended' preserves all historical data)
  if (isSupabaseConfigured) {
    const archivePayload = { status: 'suspended' };
    if (cleanEmail) {
      try {
        await supabase.from('profiles').update(archivePayload).eq('email', cleanEmail);
      } catch (dbErr) {
        console.warn('[userService] DB archive profile by email notice:', dbErr.message);
      }
    }
    if (isUUID) {
      try {
        await supabase.from('profiles').update(archivePayload).eq('id', userId);
      } catch (dbErr) {
        console.warn('[userService] DB archive profile by UUID notice:', dbErr.message);
      }
    }
  }

  // 4. Update local registered users cache (Keep user record, mark is_deleted = true)
  try {
    const raw = localStorage.getItem('_lms_registered_users');
    if (raw) {
      const users = JSON.parse(raw);
      const updatedList = users.map((u) => {
        const isMatch =
          (userId && u.id === userId) ||
          (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail);
        if (isMatch) {
          return {
            ...u,
            status: 'suspended',
            is_deleted: true,
            deleted_at: nowIso,
          };
        }
        return u;
      });
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedList));
    }
  } catch (_) {}

  // 5. Add user to revoked access blacklist to invalidate active sessions immediately across all tabs
  try {
    const revokedRaw = localStorage.getItem('_lms_revoked_users');
    const revoked = revokedRaw ? JSON.parse(revokedRaw) : [];
    const alreadyRevoked = revoked.some(
      (r) => (userId && r.id === userId) || (cleanEmail && r.email === cleanEmail)
    );
    if (!alreadyRevoked) {
      revoked.push({
        id: userId || null,
        email: cleanEmail || null,
        reason: 'archived',
        revokedAt: nowIso,
      });
      localStorage.setItem('_lms_revoked_users', JSON.stringify(revoked));
    }
  } catch (_) {}

  // 6. Update user in Zustand store (PRESERVE enrollments, progress, and attempts!)
  try {
    const store = useLmsStore.getState();
    if (store.users) {
      const updatedUsers = store.users.map((u) => {
        if ((userId && u.id === userId) || (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail)) {
          return { ...u, status: 'suspended', is_deleted: true, deleted_at: nowIso };
        }
        return u;
      });
      store.setUsers?.(updatedUsers);
    }
  } catch (_) {}

  // 7. Invalidate current active session if the deleted user is currently logged in
  try {
    const currRaw = localStorage.getItem('_lms_current_session');
    if (currRaw) {
      const curr = JSON.parse(currRaw);
      const isMatch =
        (userId && curr.id === userId) ||
        (cleanEmail && (curr.email || '').toLowerCase().trim() === cleanEmail);
      if (isMatch) {
        localStorage.removeItem('_lms_current_session');
        localStorage.removeItem('_lms_session_security');
        if (isSupabaseConfigured) {
          supabase.auth.signOut().catch(() => {});
        }
      }
    }
  } catch (_) {}

  // 8. Dispatch multi-channel revocation events for real-time reactivity
  try {
    window.dispatchEvent(new CustomEvent('lms_user_revoked', { detail: { userId, email: cleanEmail } }));
    window.dispatchEvent(new Event('lms_users_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  return handleSuccess(true);
};

export const deleteUser = archiveUser;

/**
 * Restore an archived / revoked user back to the Active Directory.
 * Re-enables login access while retaining all historical progress, exam attempts, and certificates.
 */
export const restoreUser = async (userId, email = null) => {
  if (!userId && !email) {
    return { success: false, error: 'User identifier is required.' };
  }

  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const isUUID = isValidUUID(userId);

  // 1. Try local serverless / middleware endpoint (calls Supabase Auth Admin API unban)
  try {
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: cleanEmail, action: 'restore' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        console.log('[userService] Admin restore user succeeded via backend endpoint.');
      }
    }
  } catch (apiErr) {
    console.warn('[userService] /api/admin/delete-user restore notice:', apiErr.message);
  }

  // 2. Direct client-side Supabase database update (status = 'active')
  if (isSupabaseConfigured) {
    const restorePayload = { status: 'active' };
    if (cleanEmail) {
      try {
        await supabase.from('profiles').update(restorePayload).eq('email', cleanEmail);
      } catch (dbErr) {
        console.warn('[userService] DB restore profile by email notice:', dbErr.message);
      }
    }
    if (isUUID) {
      try {
        await supabase.from('profiles').update(restorePayload).eq('id', userId);
      } catch (dbErr) {
        console.warn('[userService] DB restore profile by UUID notice:', dbErr.message);
      }
    }
  }

  // 4. Update local registered users cache
  try {
    const raw = localStorage.getItem('_lms_registered_users');
    if (raw) {
      const users = JSON.parse(raw);
      const updatedList = users.map((u) => {
        const isMatch =
          (userId && u.id === userId) ||
          (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail);
        if (isMatch) {
          return {
            ...u,
            status: 'active',
            is_deleted: false,
            deleted_at: null,
          };
        }
        return u;
      });
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedList));
    }
  } catch (_) {}

  // 5. Remove from revoked blacklist
  try {
    const revokedRaw = localStorage.getItem('_lms_revoked_users');
    if (revokedRaw) {
      const revoked = JSON.parse(revokedRaw);
      const filtered = revoked.filter((r) => {
        if (userId && r.id === userId) return false;
        if (cleanEmail && (r.email || '').toLowerCase().trim() === cleanEmail) return false;
        return true;
      });
      localStorage.setItem('_lms_revoked_users', JSON.stringify(filtered));
    }
  } catch (_) {}

  // 6. Remove from deleted user IDs
  try {
    const delRaw = localStorage.getItem('_lms_deleted_user_ids');
    if (delRaw) {
      const del = JSON.parse(delRaw);
      const filtered = del.filter((id) => id !== userId);
      localStorage.setItem('_lms_deleted_user_ids', JSON.stringify(filtered));
    }
  } catch (_) {}

  // 7. Update user in Zustand store
  try {
    const store = useLmsStore.getState();
    if (store.users) {
      const updatedUsers = store.users.map((u) => {
        if ((userId && u.id === userId) || (cleanEmail && (u.email || '').toLowerCase().trim() === cleanEmail)) {
          return { ...u, status: 'active', is_deleted: false, deleted_at: null };
        }
        return u;
      });
      store.setUsers?.(updatedUsers);
    }
  } catch (_) {}

  // 8. Dispatch reactivity events
  try {
    window.dispatchEvent(new Event('lms_users_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (_) {}

  return handleSuccess(true);
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
