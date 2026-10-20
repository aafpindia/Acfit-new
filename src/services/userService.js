import { supabase, isSupabaseConfigured, handleSupabaseError } from './supabaseService';

/**
 * Fetch all registered users/students from Supabase DB profiles & local state
 */
export const fetchUsers = async () => {
  let userList = [];
  const seenEmails = new Set();

  // 1. Try fetching from Supabase DB `profiles` table
  if (isSupabaseConfigured) {
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 2000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        result.data.forEach((p) => {
          const email = (p.email || '').toLowerCase().trim();
          if (email && !seenEmails.has(email)) {
            seenEmails.add(email);
            userList.push({
              id: p.id,
              fullName: p.full_name || p.fullName || email.split('@')[0],
              email: p.email,
              role: p.role || 'user',
              status: p.status || 'active',
              source: 'database'
            });
          }
        });
      }
    } catch (err) {
      handleSupabaseError(err, 'fetchUsers profiles');
    }
  }

  // 2. Merge registered users from localStorage
  try {
    const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
    regUsers.forEach((reg) => {
      const email = (reg.email || '').toLowerCase().trim();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        userList.push({
          id: reg.id || `reg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          fullName: reg.fullName || reg.name || email.split('@')[0],
          email: reg.email,
          role: reg.role || 'user',
          status: 'active',
          source: 'local'
        });
      }
    });
  } catch (_) {}

  // 3. Merge mock users from localStorage
  try {
    const mockUsers = JSON.parse(localStorage.getItem('_lms_mock_users') || '[]');
    mockUsers.forEach((m) => {
      const email = (m.email || '').toLowerCase().trim();
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        userList.push({
          id: m.id || `mock-${Date.now()}`,
          fullName: m.fullName || m.name || email.split('@')[0],
          email: m.email,
          role: m.role || 'user',
          status: 'active',
          source: 'mock'
        });
      }
    });
  } catch (_) {}

  // 4. Default fallback users if list is empty or minimal
  const defaultFallbackUsers = [
    { id: 'u1', fullName: 'Rahul Sharma', email: 'rahul.sharma@example.com', role: 'user', status: 'active', source: 'default' },
    { id: 'u2', fullName: 'Priya Patel', email: 'priya.patel@example.com', role: 'user', status: 'active', source: 'default' },
    { id: 'u3', fullName: 'Amit Verma', email: 'amit.verma@example.com', role: 'user', status: 'active', source: 'default' },
    { id: 'u4', fullName: 'Neha Singh', email: 'neha.singh@example.com', role: 'user', status: 'active', source: 'default' }
  ];

  defaultFallbackUsers.forEach((d) => {
    const email = d.email.toLowerCase();
    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      userList.push(d);
    }
  });

  return userList;
};
