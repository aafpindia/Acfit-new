import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Mark a lesson as complete for the current user.
 */
export const markLessonComplete = async (courseId, lessonId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId) || !isValidUuid(lessonId)) {
    return { success: true, data: null };
  }

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

  if (error) return handleSupabaseError(error, 'markLessonComplete');
  return handleSuccess(data);
};

/**
 * Fetch progress for a specific course for the current user.
 * Returns a map of { lessonId: true } for completed lessons.
 */
export const fetchCourseProgress = async (courseId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
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
 * Fetch ALL progress for all users across all courses.
 * Returns a nested map: { [courseId]: { [lessonId]: true }, [userId]: { [courseId]: { [lessonId]: true } } }
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

    if (cid && lid) {
      // 1. Aggregated course level map
      if (!progressMap[cid]) progressMap[cid] = {};
      progressMap[cid][lid] = true;

      // 2. User-specific course progress map
      if (uid) {
        if (!progressMap[uid]) progressMap[uid] = {};
        if (!progressMap[uid][cid]) progressMap[uid][cid] = {};
        progressMap[uid][cid][lid] = true;
      }
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
