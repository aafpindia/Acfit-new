import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Submit an assessment attempt (module quiz or final exam).
 */
export const submitAttempt = async (courseId, moduleId, score, passed, assessmentId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId)) return { success: true, data: null };

  const { data, error } = await supabase
    .from('attempts')
    .insert({
      user_id: userId,
      course_id: courseId,
      module_id: isValidUuid(moduleId) ? moduleId : null,
      assessment_id: isValidUuid(assessmentId) ? assessmentId : null,
      score,
      passed,
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'submitAttempt');
  return handleSuccess(data);
};

/**
 * Fetch all attempts for the current user for a specific course.
 */
export const fetchCourseAttempts = async (courseId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId)) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('submitted_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchCourseAttempts');

  return handleSuccess(data.map(a => ({
    userId: a.user_id,
    courseId: a.course_id,
    moduleId: a.module_id,
    score: parseFloat(a.score),
    passed: a.passed,
    date: a.submitted_at,
  })));
};

/**
 * Fetch ALL attempts (admin view or current user's).
 */
export const fetchAllAttempts = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchAllAttempts');

  return handleSuccess(data.map(a => ({
    userId: a.user_id,
    courseId: a.course_id,
    moduleId: a.module_id,
    score: parseFloat(a.score),
    passed: a.passed,
    date: a.submitted_at,
  })));
};
