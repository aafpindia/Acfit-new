import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Issue a certificate for the current user on a course.
 */
export const issueCertificate = async (courseId, fullName, courseTitle) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId)) return { success: false, error: 'Not authenticated or valid IDs.' };

  // Check if already issued
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return handleSuccess(existing);

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      full_name: fullName,
      course_title: courseTitle,
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'issueCertificate');

  return handleSuccess({
    id: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    fullName: data.full_name,
    courseTitle: data.course_title,
    date: data.issued_at,
  });
};

/**
 * Fetch all certificates for the current user.
 */
export const fetchUserCertificates = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId)) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchUserCertificates');

  return handleSuccess(data.map(c => ({
    id: c.id,
    userId: c.user_id,
    courseId: c.course_id,
    fullName: c.full_name,
    courseTitle: c.course_title,
    date: c.issued_at,
  })));
};

/**
 * Fetch ALL certificates (admin view).
 */
export const fetchAllCertificates = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('issued_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchAllCertificates');

  return handleSuccess(data.map(c => ({
    id: c.id,
    userId: c.user_id,
    courseId: c.course_id,
    fullName: c.full_name,
    courseTitle: c.course_title,
    date: c.issued_at,
  })));
};

/**
 * Verify a certificate by ID (public).
 */
export const verifyCertificate = async (certId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certId)
    .maybeSingle();

  if (error) return handleSupabaseError(error, 'verifyCertificate');
  if (!data) return { success: false, error: 'Certificate not found.' };

  return handleSuccess({
    id: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    fullName: data.full_name,
    courseTitle: data.course_title,
    date: data.issued_at,
  });
};
