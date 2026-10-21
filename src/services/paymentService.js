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

export const PAYMENTS_KEY = '_lms_payments';

/**
 * Fetch payments stored in localStorage
 */
export const getLocalPayments = () => {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

/**
 * Save a payment persistently in localStorage
 */
export const saveLocalPayment = (payment) => {
  if (!payment) return null;
  const normalized = normalizePaymentRecord(payment);
  try {
    const list = getLocalPayments();
    const idx = list.findIndex(
      (p) => (normalized.id && p.id === normalized.id) ||
             (normalized.razorpayPaymentId && (p.razorpayPaymentId === normalized.razorpayPaymentId || p.id === normalized.razorpayPaymentId)) ||
             (p.courseId === normalized.courseId && (p.userId === normalized.userId || (p.studentEmail && p.studentEmail.toLowerCase() === (normalized.studentEmail || '').toLowerCase())))
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...normalized };
    } else {
      list.unshift(normalized);
    }
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
  } catch (_) {}
  return normalized;
};

/**
 * Record a payment after successful checkout.
 */
export const createPayment = async (paymentData) => {
  const normalized = saveLocalPayment(paymentData) || normalizePaymentRecord(paymentData);

  if (!isSupabaseConfigured) return handleSuccess(normalized);

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

  // If no valid UUID is available, return normalized record safely
  if (!finalUserId || !isValidUuid(finalUserId)) {
    return handleSuccess(normalized);
  }

  let dbCourseId = paymentData?.courseId;
  if (dbCourseId === 'course-cardio-hiit') {
    dbCourseId = '20202020-2020-2020-2020-202020202020';
  }

  if (!dbCourseId || !isValidUuid(dbCourseId)) {
    return handleSuccess(normalized);
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: finalUserId,
        course_id: dbCourseId,
        student_name: paymentData?.studentName || 'Student',
        student_email: paymentData?.studentEmail || 'student@gym.com',
        course_title: paymentData?.courseTitle || 'Training Program',
        amount: paymentData?.amount || 0,
        currency: paymentData?.currency || 'INR',
        status: paymentData?.status || 'successful',
        method: paymentData?.method || 'Razorpay',
        razorpay_order_id: paymentData?.razorpayOrderId || null,
        razorpay_payment_id: paymentData?.razorpayPaymentId || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[paymentService] Supabase payment insert notice, using local record:', error.message);
      return handleSuccess(normalized);
    }

    const savedRecord = data ? normalizePaymentRecord(data) : normalized;
    saveLocalPayment(savedRecord);
    return handleSuccess(savedRecord);
  } catch (err) {
    console.warn('[paymentService] createPayment error fallback to local:', err);
    return handleSuccess(normalized);
  }
};

/**
 * Fetch all payments (admin view).
 */
export const fetchAllPayments = async () => {
  const localList = getLocalPayments();

  if (!isSupabaseConfigured) return handleSuccess(localList);

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('paid_at', { ascending: false });

    if (error) {
      console.warn('[paymentService] fetchAllPayments warning:', error.message);
      return handleSuccess(localList);
    }

    const dbPayments = (data || []).map(normalizePaymentRecord);
    const merged = [...dbPayments];

    localList.forEach((loc) => {
      const exists = merged.some(
        (m) => (m.id && m.id === loc.id) ||
               (m.razorpayPaymentId && (m.razorpayPaymentId === loc.razorpayPaymentId || m.razorpayPaymentId === loc.id))
      );
      if (!exists) {
        merged.push(loc);
      }
    });

    return handleSuccess(merged);
  } catch (_) {
    return handleSuccess(localList);
  }
};

/**
 * Fetch payments for the current user.
 */
export const fetchUserPayments = async (userEmail = null) => {
  const userId = await getCurrentUserId();
  const localList = getLocalPayments().filter((p) => {
    if (userId && (String(p.userId) === String(userId) || String(p.user_id) === String(userId))) return true;
    if (userEmail && p.studentEmail && p.studentEmail.toLowerCase() === userEmail.toLowerCase()) return true;
    return false;
  });

  if (!isSupabaseConfigured) return handleSuccess(localList);

  try {
    let query = supabase.from('payments').select('*');
    if (userId && isValidUuid(userId)) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('student_email', userEmail);
    } else {
      return handleSuccess(localList);
    }

    const { data, error } = await query.order('paid_at', { ascending: false });
    if (error) {
      return handleSuccess(localList);
    }

    const dbPayments = (data || []).map(normalizePaymentRecord);
    const merged = [...dbPayments];

    localList.forEach((loc) => {
      const exists = merged.some(
        (m) => (m.id && m.id === loc.id) ||
               (m.razorpayPaymentId && (m.razorpayPaymentId === loc.razorpayPaymentId || m.razorpayPaymentId === loc.id))
      );
      if (!exists) {
        merged.push(loc);
      }
    });

    return handleSuccess(merged);
  } catch (_) {
    return handleSuccess(localList);
  }
};

/**
 * Delete a payment record (Admin action or cascading user deletion).
 */
export const deletePaymentDb = async (paymentId) => {
  try {
    const list = getLocalPayments().filter(p => p.id !== paymentId && p.razorpayPaymentId !== paymentId);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
  } catch (_) {}

  if (!isSupabaseConfigured) return handleSuccess(true);
  try {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) return handleSupabaseError(error, 'deletePaymentDb');
    return handleSuccess(true);
  } catch (err) {
    return handleSupabaseError(err, 'deletePaymentDb');
  }
};


