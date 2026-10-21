import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

// Course slug/alias mapping to valid DB UUIDs
const COURSE_ALIAS_MAP = {
  'course-cardio-hiit': '20202020-2020-2020-2020-202020202020',
  'course-strength-training': '10101010-1010-1010-1010-101010101010'
};

const resolveValidCourseId = (id) => {
  if (!id) return null;
  if (COURSE_ALIAS_MAP[id]) return COURSE_ALIAS_MAP[id];
  return id;
};

/**
 * Ensure user profile exists in `profiles` to satisfy foreign key constraints
 */
const ensureUserProfile = async (userId, userEmail = null, fullName = 'Student') => {
  if (!userId || !isValidUuid(userId)) return null;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // Insert profile if missing
    const { data: created } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail || `${userId}@gym.com`,
        full_name: fullName || 'Student',
        role: 'user',
        status: 'active'
      }, { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    return created?.id || userId;
  } catch (_) {
    return userId;
  }
};

/**
 * Mark a lesson as complete for the current user directly in Supabase DB `progress` table.
 */
export const markLessonComplete = async (courseId, lessonId, explicitUserId = null) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  let userId = explicitUserId || await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'User unauthenticated' };
  }

  // Lookup profile by email if non-UUID
  if (!isValidUuid(userId) && String(userId).includes('@')) {
    try {
      const { data: p } = await supabase.from('profiles').select('id').eq('email', userId.toLowerCase()).maybeSingle();
      if (p?.id) userId = p.id;
    } catch (_) {}
  }

  const validCourseId = resolveValidCourseId(courseId);
  const validLessonId = lessonId;

  if (isValidUuid(userId) && isValidUuid(validCourseId) && isValidUuid(validLessonId)) {
    try {
      // Ensure user profile exists to satisfy foreign key
      await ensureUserProfile(userId);

      const { data, error } = await supabase
        .from('progress')
        .upsert({
          user_id: userId,
          course_id: validCourseId,
          lesson_id: validLessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[progressService] Supabase markLessonComplete warning:', error.message);
        return handleSupabaseError(error, 'markLessonComplete');
      }
      return handleSuccess(data);
    } catch (err) {
      console.warn('[progressService] Supabase markLessonComplete exception:', err.message);
      return handleSupabaseError(err, 'markLessonComplete');
    }
  }

  return { success: true, data: null };
};

/**
 * Fetch progress for a specific course for a user directly from Supabase DB.
 * Returns a map of { [lessonId]: true }
 */
export const fetchCourseProgress = async (courseId, explicitUserId = null) => {
  if (!isSupabaseConfigured) return { success: true, data: {} };

  let userId = explicitUserId || await getCurrentUserId();
  const validCourseId = resolveValidCourseId(courseId);

  if (!userId || !isValidUuid(userId) || !isValidUuid(validCourseId)) {
    return { success: true, data: {} };
  }

  try {
    const { data, error } = await supabase
      .from('progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .eq('course_id', validCourseId)
      .eq('completed', true);

    if (error) return handleSupabaseError(error, 'fetchCourseProgress');

    const progressMap = {};
    (data || []).forEach((p) => {
      progressMap[p.lesson_id] = true;
    });
    return handleSuccess(progressMap);
  } catch (err) {
    return handleSupabaseError(err, 'fetchCourseProgress');
  }
};

/**
 * Fetch all progress for a single user across all courses directly from Supabase DB.
 * Returns { [courseId]: { [lessonId]: true } }
 */
export const fetchUserProgress = async (explicitUserId = null) => {
  if (!isSupabaseConfigured) return { success: true, data: {} };

  const userId = explicitUserId || await getCurrentUserId();
  if (!userId || !isValidUuid(userId)) {
    return { success: true, data: {} };
  }

  try {
    const { data, error } = await supabase
      .from('progress')
      .select('course_id, lesson_id, completed')
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) return handleSupabaseError(error, 'fetchUserProgress');

    const progressMap = {};
    (data || []).forEach((p) => {
      const cid = p.course_id;
      const lid = p.lesson_id;
      if (cid && lid) {
        if (!progressMap[cid]) progressMap[cid] = {};
        progressMap[cid][lid] = true;
      }
    });

    return handleSuccess(progressMap);
  } catch (err) {
    return handleSupabaseError(err, 'fetchUserProgress');
  }
};

/**
 * Fetch ALL progress for all users directly from Supabase DB.
 * Returns a nested map: { [userId]: { [courseId]: { [lessonId]: true } } }
 */
export const fetchAllProgress = async () => {
  if (!isSupabaseConfigured) return { success: true, data: {} };

  try {
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
  } catch (err) {
    return handleSupabaseError(err, 'fetchAllProgress');
  }
};

/**
 * Helper to resolve user progress map safely across all nested keys
 */
export const getUserCourseProgress = (userId, courseId, progressStore = {}) => {
  if (!progressStore) return {};

  const validCourseId = resolveValidCourseId(courseId);

  // 1. Direct nested lookup: progress[userId][courseId]
  if (userId && validCourseId && progressStore[userId]?.[validCourseId]) {
    return progressStore[userId][validCourseId];
  }

  if (userId && courseId && progressStore[userId]?.[courseId]) {
    return progressStore[userId][courseId];
  }

  // 2. Direct course lookup: progress[courseId]
  if (validCourseId && progressStore[validCourseId]) {
    const directObj = progressStore[validCourseId];
    if (typeof directObj === 'object' && !Array.isArray(directObj)) {
      return directObj;
    }
  }

  if (courseId && progressStore[courseId]) {
    const directObj = progressStore[courseId];
    if (typeof directObj === 'object' && !Array.isArray(directObj)) {
      return directObj;
    }
  }

  return {};
};
