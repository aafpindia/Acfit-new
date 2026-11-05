import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

/**
 * Securely submit assessment for grading.
 * Prioritizes Supabase RPC `submit_assessment`, falls back to serverless `/api/submit-assessment`.
 */
export const submitAssessment = async ({
  courseId,
  moduleId,
  assessmentId,
  userAnswers = {},
  isFinal = false,
  rawQuestions = [],
  passingScore = 60,
  timeTaken = 0,
}) => {
  // 1. Prioritize Supabase RPC `submit_assessment` if configured
  if (isSupabaseConfigured && isValidUuid(assessmentId)) {
    try {
      const { data, error } = await supabase.rpc('submit_assessment', {
        p_course_id: isValidUuid(courseId) ? courseId : null,
        p_module_id: isValidUuid(moduleId) ? moduleId : null,
        p_assessment_id: assessmentId,
        p_answers: userAnswers,
        p_is_final: isFinal,
      });

      if (!error && data && data.success) {
        return handleSuccess({
          score: parseFloat(data.score),
          passed: Boolean(data.passed),
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          timeTaken,
          review: data.review || [],
          certificateId: data.certificateId || null,
        });
      }
    } catch (rpcErr) {
      console.warn('[assessmentService] Supabase RPC submit_assessment failed, trying backend endpoint:', rpcErr);
    }
  }

  // 2. Try serverless backend grading endpoint /api/submit-assessment
  try {
    const res = await fetch('/api/submit-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        moduleId,
        assessmentId,
        userAnswers,
        isFinal,
        rawQuestions,
        passingScore,
        timeTaken,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (isSupabaseConfigured) {
          await submitAttempt(courseId, moduleId, data.score, data.passed, assessmentId).catch(() => {});
        }
        return handleSuccess(data);
      }
    }
  } catch (apiErr) {
    console.warn('[assessmentService] /api/submit-assessment unreachable, falling back:', apiErr);
  }

  // 3. Fallback evaluation
  let correctCount = 0;
  const review = (rawQuestions || []).map((q, idx) => {
    const qId = q.id || `q-${idx}`;
    const chosenIdx = userAnswers[qId] !== undefined ? Number(userAnswers[qId]) : null;

    let correctIdx = 0;
    if (q.correctIndex !== undefined) {
      correctIdx = Number(q.correctIndex);
    } else if (Array.isArray(q.options)) {
      const foundIdx = q.options.findIndex((opt) => opt && opt.isCorrect === true);
      if (foundIdx !== -1) correctIdx = foundIdx;
    }

    const isMatch = chosenIdx !== null && chosenIdx === correctIdx;
    if (isMatch) correctCount++;

    return {
      id: qId,
      question: q.question || q.text || `Question ${idx + 1}`,
      options: (q.options || []).map((opt, oIdx) => ({
        text: typeof opt === 'string' ? opt : (opt.text || opt.title || `Option ${oIdx + 1}`),
        isCorrect: oIdx === correctIdx,
      })),
      chosenIndex: chosenIdx,
      correctIndex: correctIdx,
      isCorrect: isMatch,
      explanation: q.explanation || q.modelSolution || '',
    };
  });

  const total = rawQuestions.length || 1;
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= (passingScore || 60);

  if (isSupabaseConfigured) {
    await submitAttempt(courseId, moduleId, score, passed, assessmentId).catch(() => {});
  }

  return handleSuccess({
    score,
    passed,
    correctCount,
    totalQuestions: total,
    timeTaken,
    review,
  });
};

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
