import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Mark a lesson as complete for the current user.
 */
export const markLessonComplete = async (courseId, lessonId, explicitUserId = null) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = explicitUserId || await getCurrentUserId();
  if (!userId) {
    return { success: true, data: null };
  }

  if (isValidUuid(userId) && isValidUuid(courseId) && isValidUuid(lessonId)) {
    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) {
        console.warn('[progressService] Supabase markLessonComplete warning:', error.message);
        return handleSupabaseError(error, 'markLessonComplete');
      }
      return handleSuccess(data);
    } catch (err) {
      console.warn('[progressService] Supabase markLessonComplete exception:', err.message);
    }
  }

  return { success: true, data: null };
};

/**
 * Fetch progress for a specific course for the current user.
 * Returns a map of { lessonId: true } for completed lessons.
 */
export const fetchCourseProgress = async (courseId, explicitUserId = null) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = explicitUserId || await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId)) {
    return { success: true, data: {} };
  }

  const { data, error } = await supabase
    .from('progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('completed', true);

  if (error) return handleSupabaseError(error, 'fetchCourseProgress');

  const progressMap = {};
  (data || []).forEach(p => {
    progressMap[p.lesson_id] = true;
  });
  return handleSuccess(progressMap);
};

/**
 * Fetch ALL progress for users strictly partitioned by user_id and course_id.
 * Returns a nested map: { [userId]: { [courseId]: { [lessonId]: true } } }
 */
export const fetchAllProgress = async () => {
  if (!isSupabaseConfigured) return { success: true, data: {} };

  const { data, error } = await supabase
    .from('progress')
    .select('user_id, course_id, lesson_id, completed')
    .eq('completed', true);

  if (error) return handleSupabaseError(error, 'fetchAllProgress');

  const progressMap = {};
  (data || []).forEach((p) => {
    const uid = p.user_id;
    const cid = p.course_id;
    const lid = p.lesson_id;

    if (uid && cid && lid) {
      if (!progressMap[uid]) progressMap[uid] = {};
      if (!progressMap[uid][cid]) progressMap[uid][cid] = {};
      progressMap[uid][cid][lid] = true;
    }
  });

  return handleSuccess(progressMap);
};

/**
 * Helper to resolve user progress map safely across all nested keys
 */
export const getUserCourseProgress = (userId, courseId, progressStore = {}) => {
  if (!progressStore) return {};

  // 1. Direct nested lookup: progress[userId][courseId]
  if (userId && courseId && progressStore[userId]?.[courseId]) {
    return progressStore[userId][courseId];
  }

  // 2. Direct course lookup: progress[courseId]
  if (courseId && progressStore[courseId]) {
    const directObj = progressStore[courseId];
    if (typeof directObj === 'object' && !Array.isArray(directObj)) {
      return directObj;
    }
  }

  // 3. Fallback search across all user keys in progressStore
  if (courseId && typeof progressStore === 'object') {
    for (const key of Object.keys(progressStore)) {
      if (progressStore[key] && progressStore[key][courseId] && Object.keys(progressStore[key][courseId]).length > 0) {
        return progressStore[key][courseId];
      }
    }
  }

  return {};
};
