import { supabase, isSupabaseConfigured, handleSupabaseError } from './supabaseService';

/**
 * Fetch all registered users/students from Supabase DB profiles & local state
 */
export const fetchUsers = async () => {
  let userList = [];
  const seenEmails = new Set();

  const deletedUserIds = new Set(JSON.parse(localStorage.getItem('_lms_deleted_user_ids') || '[]'));

  // 1. Try fetching from Supabase DB `profiles` table
  if (isSupabaseConfigured) {
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 5000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        result.data.forEach((p) => {
          const email = (p.email || '').toLowerCase().trim();
          if (email && !seenEmails.has(email) && !deletedUserIds.has(p.id) && p.status !== 'deleted') {
            seenEmails.add(email);
            userList.push({
              id: p.id,
              fullName: p.full_name || p.fullName || email.split('@')[0],
              email: p.email,
              role: p.role || 'user',
              status: p.status || 'active',
              createdAt: p.created_at,
              source: 'database'
            });
          }
        });
      }
    } catch (err) {
      handleSupabaseError(err, 'fetchUsers profiles');
    }
  }

  // 2. Merge registered auth users from localStorage (excluding deleted and dummy accounts)
  try {
    const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
    regUsers.forEach((reg) => {
      const email = (reg.email || '').toLowerCase().trim();
      const isDummy = email === 'admin@lms.com' || email === 'student@lms.com';
      if (email && !isDummy && !seenEmails.has(email) && !deletedUserIds.has(reg.id) && reg.status !== 'deleted') {
        seenEmails.add(email);
        userList.push({
          id: reg.id,
          fullName: reg.fullName || reg.name || email.split('@')[0],
          email: reg.email,
          role: (reg.role || 'user').toLowerCase(),
          status: reg.status || 'active',
          createdAt: reg.createdAt,
          source: 'local'
        });
      }
    });
  } catch (_) {}

  return userList;
};
