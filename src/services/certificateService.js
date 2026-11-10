import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

const mapCertificateRow = (c) => ({
  id: c.id,
  userId: c.user_id,
  courseId: c.course_id,
  fullName: c.full_name,
  courseTitle: c.course_title,
  date: c.issued_at,
  issuedAt: c.issued_at,
  issueDate: c.issued_at,
});

/**
 * Issue a certificate for the current user on a course.
 */
export const issueCertificate = async (courseId, fullName, courseTitle) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const userId = await getCurrentUserId();
  if (!userId || !isValidUuid(userId) || !isValidUuid(courseId)) return { success: false, error: 'Not authenticated or valid IDs.' };

  // Check if already issued (enforce single claim per user/course)
  const { data: existing } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return handleSuccess(mapCertificateRow(existing));

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

  return handleSuccess(mapCertificateRow(data));
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

  return handleSuccess(data.map(mapCertificateRow));
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

  return handleSuccess(data.map(mapCertificateRow));
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

  // Attempt to fetch score from final exam attempts if available
  let examScore = data.score || null;
  if (!examScore && data.user_id && data.course_id) {
    try {
      const { data: att } = await supabase
        .from('attempts')
        .select('score')
        .eq('user_id', data.user_id)
        .eq('course_id', data.course_id)
        .is('module_id', null)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (att && att.score !== undefined) {
        examScore = parseFloat(att.score);
      }
    } catch (_) {}
  }

  return handleSuccess({
    ...mapCertificateRow(data),
    created_at: data.issued_at,
    score: examScore,
  });
};
