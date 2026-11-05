/**
 * Serverless / Middleware Endpoint: Submit Assessment Evaluation
 *
 * Secure server-side grading of assessment attempts.
 * Computes scores and passing evaluation on the server so client browsers
 * never receive plaintext answer keys before submission.
 */

import { parseRequestBody, sendResponse, handleCors } from './_utils.js';

export async function handleSubmitAssessment(req, res) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const {
      courseId,
      moduleId,
      assessmentId,
      userAnswers = {},
      rawQuestions = [],
      passingScore = 60,
      timeTaken = 0,
    } = body;

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return sendResponse(res, 400, {
        success: false,
        error: 'Assessment has no configured questions for evaluation',
      });
    }

    let correctCount = 0;
    const review = rawQuestions.map((q, idx) => {
      const qId = q.id || `q-${idx}`;
      const chosenIdx = userAnswers[qId] !== undefined ? Number(userAnswers[qId]) : null;

      // Determine correct index from question definition
      let correctIdx = 0;
      if (q.correctIndex !== undefined) {
        correctIdx = Number(q.correctIndex);
      } else if (Array.isArray(q.options)) {
        const found = q.options.findIndex((opt) => opt && opt.isCorrect === true);
        if (found !== -1) correctIdx = found;
      }

      const isMatch = chosenIdx !== null && chosenIdx === correctIdx;
      if (isMatch) correctCount++;

      // Post-exam review item (only sent back to client after submission)
      return {
        id: qId,
        question: q.question || q.text || q.prompt || `Question ${idx + 1}`,
        options: (q.options || []).map((opt, oIdx) => ({
          text: typeof opt === 'string' ? opt : (opt.text || opt.title || `Option ${oIdx + 1}`),
          isCorrect: oIdx === correctIdx,
        })),
        chosenIndex: chosenIdx,
        correctIndex: correctIdx,
        isCorrect: isMatch,
        explanation: q.explanation || q.modelSolution || q.rationale || '',
      };
    });

    const totalQuestions = rawQuestions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= Number(passingScore);

    return sendResponse(res, 200, {
      success: true,
      score,
      passed,
      correctCount,
      totalQuestions,
      timeTaken,
      courseId,
      moduleId,
      assessmentId,
      review,
    });
  } catch (err) {
    console.error('[Submit Assessment Exception]', err);
    return sendResponse(res, 500, {
      success: false,
      error: err.message || 'Internal server error while grading assessment',
    });
  }
}

export default handleSubmitAssessment;

