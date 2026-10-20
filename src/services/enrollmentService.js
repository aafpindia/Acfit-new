import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Enroll the current user in a course.
 * Uses upsert to handle duplicate enrollments gracefully.
 */
export const enrollUser = async (courseId, explicitUserId = null) => {
  const userId = explicitUserId || (await getCurrentUserId());
  if (!userId) return { success: false, error: 'Not authenticated.' };

  const fallbackEnrollment = {
    user_id: userId,
    course_id: courseId,
    enrolled_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && isValidUuid(userId)) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .upsert(
          { user_id: userId, course_id: courseId },
          { onConflict: 'user_id,course_id' }
        )
        .select()
        .maybeSingle();

      if (error) {
        if (
          error.code === '23505' ||
          error.status === 409 ||
          (error.message && error.message.includes('duplicate')) ||
          (error.message && error.message.includes('already'))
        ) {
          return { success: true, data: fallbackEnrollment };
        }
        console.warn('[enrollmentService] Supabase enroll warning, falling back to store:', error.message);
        return { success: true, data: fallbackEnrollment };
      }

      try {
        const { data: course } = await supabase.from('courses').select('students').eq('id', courseId).maybeSingle();
        if (course) {
          await supabase.from('courses').update({ students: (course.students || 0) + 1 }).eq('id', courseId);
        }
      } catch (_) {}

      return handleSuccess(data || fallbackEnrollment);
    } catch (e) {
      console.warn('[enrollmentService] enrollUser caught error, using fallback:', e);
      return { success: true, data: fallbackEnrollment };
    }
  }

  return handleSuccess(fallbackEnrollment);
};

/**
 * Fetch all enrollments for the current user.
 */
export const fetchUserEnrollments = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId)) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    if (error.status === 409 || error.status === 403) {
      console.warn('[enrollmentService] RLS blocked read, returning empty:', error.message);
      return { success: true, data: [] };
    }
    return handleSupabaseError(error, 'fetchUserEnrollments');
  }
  
  return handleSuccess(data.map(e => ({
    id: e.id,
    userId: e.user_id,
    courseId: e.course_id,
    enrolledAt: e.enrolled_at,
  })));
};

/**
 * Fetch ALL enrollments (admin view).
 */
export const fetchAllEnrollments = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .order('enrolled_at', { ascending: false });

  if (error) {
    if (error.status === 409 || error.status === 403) {
      console.warn('[enrollmentService] RLS blocked admin read, returning empty:', error.message);
      return { success: true, data: [] };
    }
    return handleSupabaseError(error, 'fetchAllEnrollments');
  }

  return handleSuccess(data.map(e => ({
    id: e.id,
    userId: e.user_id,
    courseId: e.course_id,
    enrolledAt: e.enrolled_at,
  })));
};

/**
 * Check if the current user is enrolled in a course.
 */
export const checkEnrollment = async (courseId) => {
  if (!isSupabaseConfigured) return false;

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId)) return false;

  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  return !!data;
};
