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
 * Standardize payment object schema from DB record
 */
export const normalizePaymentRecord = (p) => {
  if (!p) return null;
  const rawDate = p.paid_at || p.date || p.createdAt || p.created_at || p.paidAt || new Date().toISOString();
  const rawStatus = (p.status || 'successful').toString().toLowerCase();
  const normalizedStatus = (rawStatus === 'paid' || rawStatus === 'success' || rawStatus === 'completed') ? 'successful' : rawStatus;

  return {
    id: p.id || p.razorpay_payment_id || p.razorpayPaymentId || `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: p.user_id || p.userId || null,
    user_id: p.user_id || p.userId || null,
    courseId: p.course_id || p.courseId || null,
    course_id: p.course_id || p.courseId || null,
    studentName: p.student_name || p.studentName || p.fullName || 'Student',
    studentEmail: p.student_email || p.studentEmail || p.email || 'student@gym.com',
    courseTitle: p.course_title || p.courseTitle || p.title || 'Training Program',
    amount: parseFloat(p.amount) || 0,
    currency: p.currency || 'INR',
    status: normalizedStatus,
    method: p.method || (parseFloat(p.amount) > 0 ? 'Razorpay' : 'Free Enrollment'),
    razorpayOrderId: p.razorpay_order_id || p.razorpayOrderId || null,
    razorpayPaymentId: p.razorpay_payment_id || p.razorpayPaymentId || p.id || null,
    date: rawDate,
    paidAt: rawDate,
    createdAt: rawDate,
    created_at: rawDate,
  };
};

/**
 * Record a payment directly into Supabase DB `payments` table.
 */
export const createPayment = async (paymentData) => {
  const fallbackRecord = normalizePaymentRecord(paymentData);
  if (!isSupabaseConfigured) return handleSuccess(fallbackRecord);

  let finalUserId = paymentData?.userId || paymentData?.user_id;
  if (!finalUserId || !isValidUuid(finalUserId)) {
    finalUserId = await getCurrentUserId();
  }

  // Attempt profile lookup by student email if user_id is not a valid UUID
  if ((!finalUserId || !isValidUuid(finalUserId)) && paymentData?.studentEmail) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', paymentData.studentEmail.toLowerCase())
        .maybeSingle();
      if (prof?.id && isValidUuid(prof.id)) {
        finalUserId = prof.id;
      }
    } catch (_) {}
  }

  const dbCourseId = resolveValidCourseId(paymentData?.courseId || paymentData?.course_id);

  if (!finalUserId || !isValidUuid(finalUserId) || !dbCourseId || !isValidUuid(dbCourseId)) {
    console.warn('[paymentService] Cannot insert payment: missing valid UUIDs', { finalUserId, dbCourseId });
    return handleSuccess(fallbackRecord);
  }

  try {
    // Ensure profile exists for foreign key constraint
    await ensureUserProfile(finalUserId, paymentData?.studentEmail, paymentData?.studentName);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: finalUserId,
        course_id: dbCourseId,
        student_name: paymentData?.studentName || paymentData?.student_name || 'Student',
        student_email: paymentData?.studentEmail || paymentData?.student_email || 'student@gym.com',
        course_title: paymentData?.courseTitle || paymentData?.course_title || 'Training Program',
        amount: parseFloat(paymentData?.amount) || 0,
        currency: paymentData?.currency || 'INR',
        status: paymentData?.status || 'successful',
        method: paymentData?.method || 'Razorpay',
        razorpay_order_id: paymentData?.razorpayOrderId || paymentData?.razorpay_order_id || null,
        razorpay_payment_id: paymentData?.razorpayPaymentId || paymentData?.razorpay_payment_id || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[paymentService] Supabase payment insert warning:', error.message);
      return handleSupabaseError(error, 'createPayment');
    }

    const savedRecord = data ? normalizePaymentRecord(data) : fallbackRecord;
    return handleSuccess(savedRecord);
  } catch (err) {
    return handleSupabaseError(err, 'createPayment exception');
  }
};

/**
 * Fetch all payments (admin view) directly from Supabase DB `payments` table.
 */
export const fetchAllPayments = async () => {
  if (!isSupabaseConfigured) return handleSuccess([]);

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('paid_at', { ascending: false });

    if (error) {
      return handleSupabaseError(error, 'fetchAllPayments');
    }

    const list = (data || []).map(normalizePaymentRecord);
    return handleSuccess(list);
  } catch (err) {
    return handleSupabaseError(err, 'fetchAllPayments exception');
  }
};

/**
 * Fetch payments for a specific user directly from Supabase DB `payments` table.
 */
export const fetchUserPayments = async (userEmail = null, explicitUserId = null) => {
  if (!isSupabaseConfigured) return handleSuccess([]);

  const userId = explicitUserId || await getCurrentUserId();

  try {
    let query = supabase.from('payments').select('*');
    if (userId && isValidUuid(userId)) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('student_email', userEmail.toLowerCase().trim());
    } else {
      return handleSuccess([]);
    }

    const { data, error } = await query.order('paid_at', { ascending: false });
    if (error) {
      return handleSupabaseError(error, 'fetchUserPayments');
    }

    const list = (data || []).map(normalizePaymentRecord);
    return handleSuccess(list);
  } catch (err) {
    return handleSupabaseError(err, 'fetchUserPayments exception');
  }
};

/**
 * Delete a payment record directly from Supabase DB `payments` table.
 */
export const deletePaymentDb = async (paymentId) => {
  if (!isSupabaseConfigured || !paymentId) return handleSuccess(true);
  try {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) return handleSupabaseError(error, 'deletePaymentDb');
    return handleSuccess(true);
  } catch (err) {
    return handleSupabaseError(err, 'deletePaymentDb');
  }
};
