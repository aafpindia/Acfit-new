import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

const COURSE_ALIAS_MAP = {
  'course-cardio-hiit': '20202020-2020-2020-2020-202020202020',
  'course-strength-training': '10101010-1010-1010-1010-101010101010'
};

const resolveValidCourseId = (id) => {
  if (!id) return null;
  if (COURSE_ALIAS_MAP[id]) return COURSE_ALIAS_MAP[id];
  return id;
};

const ensureUserProfile = async (userId, userEmail = null, fullName = 'Student') => {
  if (!userId || !isValidUuid(userId)) return null;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing?.id) return existing.id;

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
 * Enroll a user in a course directly in Supabase DB `enrollments` table.
 */
export const enrollUser = async (courseId, explicitUserId = null) => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Database unconfigured' };
  }

  let userId = explicitUserId || (await getCurrentUserId());
  if (!userId) return { success: false, error: 'Not authenticated.' };

  if (!isValidUuid(userId) && String(userId).includes('@')) {
    try {
      const { data: p } = await supabase.from('profiles').select('id').eq('email', userId.toLowerCase()).maybeSingle();
      if (p?.id) userId = p.id;
    } catch (_) {}
  }

  const validCourseId = resolveValidCourseId(courseId);

  if (!isValidUuid(userId) || !isValidUuid(validCourseId)) {
    return { success: false, error: 'Invalid user ID or course ID' };
  }

  try {
    // Ensure profile exists for foreign key constraint
    await ensureUserProfile(userId);

    const { data, error } = await supabase
      .from('enrollments')
      .upsert(
        { user_id: userId, course_id: validCourseId },
        { onConflict: 'user_id,course_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      if (
        error.code === '23505' ||
        error.status === 409 ||
        (error.message && error.message.includes('duplicate'))
      ) {
        return handleSuccess({
          id: `enr-${userId}-${validCourseId}`,
          userId,
          user_id: userId,
          courseId: validCourseId,
          course_id: validCourseId,
          enrolledAt: new Date().toISOString()
        });
      }
      return handleSupabaseError(error, 'enrollUser');
    }

    // Increment students count on course
    try {
      const { data: course } = await supabase.from('courses').select('students').eq('id', validCourseId).maybeSingle();
      if (course) {
        await supabase.from('courses').update({ students: (course.students || 0) + 1 }).eq('id', validCourseId);
      }
    } catch (_) {}

    const record = {
      id: data?.id || `enr-${userId}-${validCourseId}`,
      userId: data?.user_id || userId,
      user_id: data?.user_id || userId,
      courseId: data?.course_id || validCourseId,
      course_id: data?.course_id || validCourseId,
      enrolledAt: data?.enrolled_at || new Date().toISOString(),
      enrolled_at: data?.enrolled_at || new Date().toISOString()
    };

    return handleSuccess(record);
  } catch (err) {
    return handleSupabaseError(err, 'enrollUser exception');
  }
};

/**
 * Fetch all enrollments for a user directly from Supabase DB `enrollments` table.
 */
export const fetchUserEnrollments = async (explicitUserId = null) => {
  if (!isSupabaseConfigured) {
    return handleSuccess([]);
  }

  let userId = explicitUserId || (await getCurrentUserId());
  if (!userId) return handleSuccess([]);

  if (!isValidUuid(userId) && String(userId).includes('@')) {
    try {
      const { data: p } = await supabase.from('profiles').select('id').eq('email', userId.toLowerCase()).maybeSingle();
      if (p?.id) userId = p.id;
    } catch (_) {}
  }

  if (!isValidUuid(userId)) {
    return handleSuccess([]);
  }

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error, 'fetchUserEnrollments');
    }

    const list = (data || []).map((e) => ({
      id: e.id,
      userId: e.user_id,
      user_id: e.user_id,
      courseId: e.course_id,
      course_id: e.course_id,
      enrolledAt: e.enrolled_at,
      enrolled_at: e.enrolled_at
    }));

    return handleSuccess(list);
  } catch (err) {
    return handleSupabaseError(err, 'fetchUserEnrollments exception');
  }
};

/**
 * Fetch ALL enrollments (admin view) directly from Supabase DB `enrollments` table.
 */
export const fetchAllEnrollments = async () => {
  if (!isSupabaseConfigured) {
    return handleSuccess([]);
  }

  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error, 'fetchAllEnrollments');
    }

    const list = (data || []).map((e) => ({
      id: e.id,
      userId: e.user_id,
      user_id: e.user_id,
      courseId: e.course_id,
      course_id: e.course_id,
      enrolledAt: e.enrolled_at,
      enrolled_at: e.enrolled_at
    }));

    return handleSuccess(list);
  } catch (err) {
    return handleSupabaseError(err, 'fetchAllEnrollments exception');
  }
};

/**
 * Check if the user is enrolled in a course directly from Supabase DB.
 */
export const checkEnrollment = async (courseId, explicitUserId = null) => {
  if (!isSupabaseConfigured) return false;

  let userId = explicitUserId || (await getCurrentUserId());
  if (!userId) return false;

  if (!isValidUuid(userId) && String(userId).includes('@')) {
    try {
      const { data: p } = await supabase.from('profiles').select('id').eq('email', userId.toLowerCase()).maybeSingle();
      if (p?.id) userId = p.id;
    } catch (_) {}
  }

  const validCourseId = resolveValidCourseId(courseId);

  if (isValidUuid(userId) && isValidUuid(validCourseId)) {
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', validCourseId)
        .maybeSingle();

      return !!data;
    } catch (_) {}
  }

  return false;
};
