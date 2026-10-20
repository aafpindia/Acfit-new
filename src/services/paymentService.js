import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Standardize payment object schema across DB & local store records
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
 * Record a payment after successful checkout.
 */
export const createPayment = async (paymentData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

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

  // If no valid UUID is available, return normalized record safely without violating NOT NULL constraint
  if (!finalUserId || !isValidUuid(finalUserId)) {
    return handleSuccess(normalizePaymentRecord(paymentData));
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: finalUserId,
      course_id: (paymentData?.courseId && isValidUuid(paymentData.courseId)) ? paymentData.courseId : null,
      student_name: paymentData?.studentName || 'Student',
      student_email: paymentData?.studentEmail || 'student@gym.com',
      course_title: paymentData?.courseTitle || 'Training Program',
      amount: paymentData?.amount || 0,
      currency: paymentData?.currency || 'INR',
      status: paymentData?.status || 'successful',
      method: paymentData?.method || 'Free Enrollment',
      razorpay_order_id: paymentData?.razorpayOrderId || null,
      razorpay_payment_id: paymentData?.razorpayPaymentId || null,
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createPayment');

  return handleSuccess(normalizePaymentRecord(data));
};

/**
 * Fetch all payments (admin view).
 */
export const fetchAllPayments = async () => {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchAllPayments');

  return handleSuccess((data || []).map(normalizePaymentRecord));
};

/**
 * Fetch payments for the current user.
 */
export const fetchUserPayments = async (userEmail = null) => {
  if (!isSupabaseConfigured) return { success: true, data: [] };

  const userId = await getCurrentUserId();
  let query = supabase.from('payments').select('*');

  if (userId && isValidUuid(userId)) {
    query = query.eq('user_id', userId);
  } else if (userEmail) {
    query = query.eq('student_email', userEmail);
  } else {
    return { success: true, data: [] };
  }

  const { data, error } = await query.order('paid_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchUserPayments');

  return handleSuccess((data || []).map(normalizePaymentRecord));
};
