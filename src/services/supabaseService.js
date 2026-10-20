import { supabase, isSupabaseConfigured } from '../config/supabase';

/**
 * Base service wrapper providing consistent error handling
 * and dual-mode (Supabase / Mock) support.
 */

export const handleSupabaseError = (error, context = '') => {
  const message = error?.message || 'An unexpected error occurred.';
  console.error(`[SupabaseService] ${context}:`, message);
  return { success: false, error: message };
};

export const handleSuccess = (data) => {
  return { success: true, data };
};

/**
 * Get the current authenticated user's ID.
 * Returns null if not authenticated.
 */
export const getCurrentUserId = async () => {
  // Check active current session first
  const currentSession = localStorage.getItem('_lms_current_session');
  if (currentSession) {
    try {
      const parsed = JSON.parse(currentSession);
      if (parsed?.id) return parsed.id;
    } catch (e) {}
  }

  // Check if a bypass or mock session is active
  const bypassSession = localStorage.getItem('_lms_bypass_session');
  if (bypassSession) {
    try {
      const parsed = JSON.parse(bypassSession);
      if (parsed?.id) return parsed.id;
    } catch (e) {}
  }

  const mockSession = localStorage.getItem('_lms_mock_session');
  if (mockSession) {
    try {
      const parsed = JSON.parse(mockSession);
      if (parsed?.id) return parsed.id;
    } catch (e) {}
  }

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch (_) {}
  }

  return null;
};

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const isValidUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

/**
 * Check if we're running against real Supabase.
 */
export { isSupabaseConfigured };
export { supabase };
