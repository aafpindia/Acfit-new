import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';

/**
 * Fetch all registered users directly from Supabase DB `profiles` table
 */
export const fetchUsers = async () => {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'fetchUsers profiles');
      return [];
    }

    const userList = (data || []).map((p) => ({
      id: p.id,
      fullName: p.full_name || p.fullName || (p.email ? p.email.split('@')[0] : 'Member'),
      email: p.email,
      role: (p.role || 'user').toLowerCase(),
      status: p.status || 'active',
      avatarUrl: p.avatar_url || null,
      createdAt: p.created_at,
      source: 'database'
    }));

    return userList;
  } catch (err) {
    handleSupabaseError(err, 'fetchUsers profiles exception');
    return [];
  }
};

/**
 * Create a new user directly in Supabase
 */
export const createUser = async ({ email, fullName, role = 'user', status = 'active', password = 'Password123!' }) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database not configured.' };
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanRole = role.toLowerCase().trim();
  const newId = crypto.randomUUID();

  try {
    // 1. Attempt Supabase Auth signup (which triggers handle_new_user)
    let authUserId = newId;
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password || 'Password123!',
        options: {
          data: {
            full_name: fullName.trim(),
            role: cleanRole
          }
        }
      });
      if (authData?.user?.id) {
        authUserId = authData.user.id;
      }
    } catch (_) {}

    // 2. Ensure profile exists in `profiles` table directly
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: authUserId,
        email: cleanEmail,
        full_name: fullName.trim(),
        role: cleanRole,
        status: status || 'active',
        created_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (profileErr) {
      console.warn('[userService] Profile upsert notice:', profileErr.message);
    }

    const createdUser = {
      id: profileData?.id || authUserId,
      fullName: profileData?.full_name || fullName.trim(),
      email: cleanEmail,
      role: cleanRole,
      status: status || 'active',
      createdAt: profileData?.created_at || new Date().toISOString(),
      source: 'database'
    };

    return handleSuccess(createdUser);
  } catch (err) {
    return handleSupabaseError(err, 'createUser');
  }
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
