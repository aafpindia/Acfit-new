import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLmsStore } from '../../../stores/lmsStore';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { AlertCircle, Clock, CheckCircle2, XCircle, Award, RotateCcw, ChevronRight, Check, X, FileCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';

export const AssessmentPlayer = ({ moduleId, courseId, isFinal = false, onPassed, lessonId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { courses, submitAssessmentAttempt, submitFinalAssessmentAttempt, certificates } = useLmsStore();

  const course = courses.find((c) => c.id === courseId);
  
  let quiz = null;
  let resolvedModuleId = moduleId;
  
  if (isFinal) {
    quiz = course?.finalAssessment || course?.finalExam;
  } else if (lessonId) {
    course?.modules?.forEach((m) => {
      const lesson = m.lessons?.find((l) => l.id === lessonId);
      if (lesson) {
        resolvedModuleId = m.id;
        if (lesson.assessment) {
          quiz = lesson.assessment;
        } else if (
          lesson.type === 'quiz' ||
          lesson.items?.[0]?.type === 'quiz' ||
          (lesson.questions && lesson.questions.length > 0) ||
          (lesson.items?.[0]?.questions && lesson.items[0].questions.length > 0)
        ) {
          const item = lesson.items?.[0] || lesson;
          quiz = {
            id: lesson.id,
            title: lesson.title,
            passingPercentage: item.passingPercentage || lesson.passingPercentage || 70,
            timerSeconds: (item.timerMinutes || lesson.timerMinutes || 10) * 60,
            questions: item.questions || lesson.questions || []
          };
        }
      }
    });
  } else if (moduleId) {
    const targetMod = course?.modules?.find((m) => m.id === moduleId);
    if (targetMod) {
      if (targetMod.assessment) {
        quiz = targetMod.assessment;
      } else if (targetMod.lessons) {
        const quizLesson = targetMod.lessons.find(
          (l) => l.type === 'quiz' || l.assessment || l.items?.[0]?.type === 'quiz' || (l.questions && l.questions.length > 0)
        );
        if (quizLesson) {
          if (quizLesson.assessment) {
            quiz = quizLesson.assessment;
          } else {
            const item = quizLesson.items?.[0] || quizLesson;
            quiz = {
              id: quizLesson.id,
              title: quizLesson.title,
              passingPercentage: item.passingPercentage || quizLesson.passingPercentage || 70,
              timerSeconds: (item.timerMinutes || quizLesson.timerMinutes || 10) * 60,
              questions: item.questions || quizLesson.questions || []
            };
          }
        }
      }
    }
  }

  const [quizState, setQuizState] = useState('intro'); // 'intro' | 'quizzing' | 'result'
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { [questionId]: optionIdx }
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [scoreResult, setScoreResult] = useState(null); // { score, passed, correctCount, timeTaken }
  const timerRef = useRef(null);

  // Reset quiz states on module, lesson or quiz changes
  useEffect(() => {
    setQuizState('intro');
    setCurrentQuestionIdx(0);
    setSelectedOptions({});
    setShowSubmitConfirm(false);
    setShowReview(false);
    setScoreResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [moduleId, courseId, isFinal, lessonId]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!quiz) {
    return (
      <Card className="border-border text-center py-10 font-sans">
        <CardContent className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h3 className="font-bold text-[#202124]">Quiz Specifications Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active questions have been configured for this quiz section yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rawQuestions = quiz.questions || [];
  const questions = rawQuestions.map((q, qIdx) => {
    const rawOptions = q.options || [];
    const formattedOptions = rawOptions.map((opt, oIdx) => {
      if (typeof opt === 'string') {
        return {
          text: opt,
          isCorrect: oIdx === (q.correctIndex !== undefined ? q.correctIndex : 0)
        };
      }
      return {
        text: opt.text || opt.title || `Option ${oIdx + 1}`,
        isCorrect: Boolean(opt.isCorrect || (q.correctIndex !== undefined && q.correctIndex === oIdx))
      };
    });

    return {
      ...q,
      id: q.id || `q-${qIdx}`,
      question: q.question || q.text || q.prompt || `Question ${qIdx + 1}`,
      options: formattedOptions,
      explanation: q.explanation || q.modelSolution || q.rationale || ''
    };
  });

  const timeLimit = quiz.timerSeconds || 120;
  const passingScore = quiz.passingPercentage || 60;

  const startQuiz = () => {
    setQuizState('quizzing');
    setCurrentQuestionIdx(0);
    setSelectedOptions({});
    setShowSubmitConfirm(false);
    setShowReview(false);
    setTimeLeft(timeLimit);

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitQuiz(true); // force submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSelectOption = (questionId, optionIdx) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionIdx
    });
  };

  const handleSubmitQuiz = (isTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSubmitConfirm(false);

    if (isTimeout) {
      error('Time has expired! Submitting assessment automatically.');
    }

    let correctCount = 0;
    questions.forEach((q) => {
      const chosenIdx = selectedOptions[q.id];
      if (chosenIdx !== undefined && q.options[chosenIdx]?.isCorrect) {
        correctCount++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const passed = score >= passingScore;
    const timeTaken = Math.max(0, timeLimit - timeLeft);

    setScoreResult({
      score,
      passed,
      correctCount,
      timeTaken
    });

    setQuizState('result');

    if (isFinal) {
      const studentName = user?.fullName || user?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Graduate Member');
      submitFinalAssessmentAttempt(courseId, score, passed, user?.id, studentName, quiz.id);
    } else {
      submitAssessmentAttempt(courseId, resolvedModuleId || moduleId, score, passed, user?.id, quiz.id);
    }

    if (passed) {
      success('Congratulations! You passed the assessment.');
    } else {
      error('Failed to meet passing score guidelines. Please review and try again.');
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // INTRO STATE VIEW
  if (quizState === 'intro') {
    return (
      <Card className="border-border bg-white font-sans max-w-xl mx-auto shadow-md">
        <CardHeader className="text-center">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 w-fit mx-auto mb-4">
            <Award className="h-8 w-8 text-[#1E65B8]" />
          </div>
          <CardTitle className="text-xl font-extrabold text-[#202124]">{quiz.title}</CardTitle>
          <CardDescription className="text-xs text-slate-500">Knowledge assessment & skill validation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid grid-cols-3 gap-4 border border-border p-4 rounded-xl text-center text-xs bg-slate-50/50">
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Questions</span>
              <span className="text-base font-extrabold text-[#202124]">{questions.length} items</span>
            </div>
            <div className="space-y-1 border-x border-border">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Time Limit</span>
              <span className="text-base font-extrabold text-[#202124]">{formatTimer(timeLimit)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Passing Score</span>
              <span className="text-base font-extrabold text-[#1E65B8]">{passingScore}%</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
            <span className="font-bold text-[#202124] block mb-1">Assessment Guidelines:</span>
            <p>• Answer all questions before submitting your assessment.</p>
            <p>• The timer runs continuously once you click Begin Quiz.</p>
            <p>• You need at least {passingScore}% to pass and advance to the next step.</p>
          </div>

          <Button variant="primary" onClick={startQuiz} className="w-full justify-center h-11 text-xs font-bold shadow-xs bg-[#1E65B8] hover:bg-[#1976D2] text-white">
            Begin Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // QUIZZING STATE VIEW
  if (quizState === 'quizzing') {
    const activeQuestion = questions[currentQuestionIdx];

    if (!activeQuestion) {
      return (
        <Card className="border-border bg-white font-sans max-w-xl mx-auto shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <p className="font-bold text-sm text-[#202124]">No questions found for this assessment.</p>
            <Button variant="outline" onClick={() => setQuizState('intro')}>← Go Back</Button>
          </CardContent>
        </Card>
      );
    }

    const hasChosen = selectedOptions[activeQuestion.id] !== undefined;
    const answeredCount = Object.keys(selectedOptions).length;

    return (
      <div className="relative font-sans max-w-xl mx-auto space-y-4">
        
        {/* Main Quiz Question Card */}
        <Card className="border-border bg-white shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-3.5 px-6 bg-slate-50/60">
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Question {currentQuestionIdx + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E65B8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <Clock className="h-4 w-4 text-[#1E65B8] animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            
            {/* Question Prompt */}
            <h3 className="font-bold text-base text-[#202124] leading-snug">
              {activeQuestion.question}
            </h3>

            {/* Options List */}
            <div className="flex flex-col gap-3">
              {activeQuestion.options.map((opt, oIdx) => {
                const selected = selectedOptions[activeQuestion.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(activeQuestion.id, oIdx)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer text-left transition-all ${
                      selected
                        ? 'bg-blue-50 border-[#1E65B8] text-[#1E65B8] shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#202124]'
                    }`}
                  >
                    <span>{opt.text}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selected ? 'border-[#1E65B8] bg-[#1E65B8]' : 'border-slate-300'
                    }`}>
                      {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Question Index Stepper Pills (1  2  3  4  5) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>QUESTION NAVIGATOR</span>
                <span>{answeredCount} / {questions.length} Answered</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {questions.map((q, idx) => {
                  const isAns = selectedOptions[q.id] !== undefined;
                  const isCurr = idx === currentQuestionIdx;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isCurr
                          ? 'bg-[#1E65B8] text-white ring-2 ring-blue-300 shadow-xs'
                          : isAns
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nav Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIdx((p) => Math.max(p - 1, 0))}
                disabled={currentQuestionIdx === 0}
                className="text-xs h-9 px-4 font-semibold text-slate-700"
              >
                Previous
              </Button>

              {currentQuestionIdx < questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                  disabled={!hasChosen}
                  className="text-xs h-9 px-4 font-bold bg-[#1E65B8] text-white hover:bg-[#1976D2]"
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={!hasChosen}
                  className="text-xs h-9 px-5 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Submit Quiz
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center font-sans">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold text-xl">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#202124]">Submit Quiz?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You answered <span className="font-bold text-slate-800">{answeredCount} of {questions.length}</span> questions.
                  Are you sure you want to finalize your submission?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="w-1/2 text-xs font-semibold h-9"
                >
                  Go Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSubmitQuiz(false)}
                  className="w-1/2 text-xs font-extrabold h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Submit Now
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // RESULTS STATE VIEW
  if (quizState === 'result' && scoreResult) {
    const requiredCorrect = Math.ceil((passingScore / 100) * questions.length);
    const neededMore = Math.max(0, requiredCorrect - scoreResult.correctCount);

    return (
      <div className="space-y-6 max-w-xl mx-auto font-sans">
        
        {/* 🎉 Real-time Certificate Release Card when Final Exam Passed */}
        {isFinal && scoreResult.passed && (
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-7 text-center space-y-4 shadow-lg relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Award className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/80 px-3.5 py-1 rounded-full border border-emerald-300/80">
                🎓 OFFICIAL CERTIFICATE RELEASED & ACCREDITED
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Congratulations, {user?.fullName || user?.name || 'Graduate Student'}!
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                You have successfully completed the certification examination for <span className="font-bold text-slate-900">{course?.title || quiz.title}</span>. Your accredited certificate is released and verified.
              </p>
            </div>

            {/* Real-time credentials metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 text-xs text-left shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Awarded To</span>
                <span className="font-bold text-slate-800 truncate block">{user?.fullName || user?.name || 'Student Member'}</span>
              </div>
              <div className="space-y-0.5 border-t sm:border-t-0 sm:border-x border-slate-200 pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Issue Date</span>
                <span className="font-bold text-slate-800 block">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="space-y-0.5 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Exam Result</span>
                <span className="font-bold text-emerald-700 block">{scoreResult.score}% (Passed)</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  const targetCert = certificates.find(c => c.courseId === courseId && (c.userId === user?.id || !c.userId)) || certificates[certificates.length - 1];
                  if (targetCert) {
                    navigate(`/certificates/${targetCert.id}`);
                  } else if (onPassed) {
                    onPassed();
                  }
                }}
                className="w-full justify-center h-11 text-xs font-extrabold bg-[#1E65B8] hover:bg-[#1976D2] text-white shadow-md gap-2 cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>View & Print Official Certificate 🎓</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </div>
          </div>
        )}

        {/* Results Overview Card */}
        <Card className="border-border bg-white text-center shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-6">
            <div className={`p-4 rounded-2xl border ${
              scoreResult.passed 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {scoreResult.passed ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
            </div>

            <div className="space-y-1.5">
              <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                scoreResult.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {scoreResult.passed ? '✓ PASSED' : '✕ NOT PASSED'}
              </span>

              <h2 className="text-3xl font-black text-[#202124] pt-1">
                {scoreResult.score}%
              </h2>

              <p className="text-xs text-slate-500 font-medium">
                {scoreResult.correctCount} of {questions.length} Correct • Passing Score: {passingScore}%
              </p>

              {!scoreResult.passed && neededMore > 0 && (
                <p className="text-xs font-bold text-rose-600 pt-1">
                  You need {neededMore} more correct answer{neededMore > 1 ? 's' : ''} to pass this quiz.
                </p>
              )}
            </div>

            {/* Stat Chips */}
            <div className="grid grid-cols-3 gap-3 w-full border border-slate-200 p-3 rounded-xl text-center text-xs bg-slate-50/70">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Correct</span>
                <span className="text-sm font-extrabold text-emerald-600">✓ {scoreResult.correctCount}</span>
              </div>
              <div className="space-y-0.5 border-x border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Incorrect</span>
                <span className="text-sm font-extrabold text-rose-600">✕ {questions.length - scoreResult.correctCount}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Time Taken</span>
                <span className="text-sm font-extrabold text-slate-700">{formatTimer(scoreResult.timeTaken || 0)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 w-full border-t border-slate-100 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowReview(!showReview)}
                className="flex-1 justify-center text-xs h-10 font-bold border-slate-200 text-slate-700"
              >
                {showReview ? 'Hide Answers' : 'Review Answers'}
              </Button>

              <Button
                variant="outline"
                onClick={startQuiz}
                leftIcon={<RotateCcw className="h-4 w-4" />}
                className="flex-1 justify-center text-xs h-10 font-bold border-slate-200 text-slate-700"
              >
                Retake Quiz
              </Button>

              {scoreResult.passed && (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (isFinal) {
                      const targetCert = certificates.find(c => c.courseId === courseId && (c.userId === user?.id || !c.userId)) || certificates[certificates.length - 1];
                      if (targetCert) {
                        navigate(`/certificates/${targetCert.id}`);
                        return;
                      }
                    }
                    if (onPassed) onPassed();
                  }}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  className="w-full justify-center text-xs h-10 font-bold bg-[#1E65B8] hover:bg-[#1976D2] text-white"
                >
                  {isFinal ? 'Claim Official Certificate 🎓' : 'Continue Next Step'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Questions Review Accordion */}
        {showReview && (
          <div className="space-y-3.5 pt-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Detailed Answer Review</h4>
            
            {questions.map((q, idx) => {
              const chosenOptIdx = selectedOptions[q.id];
              const isCorrect = chosenOptIdx !== undefined && q.options[chosenOptIdx]?.isCorrect;

              return (
                <Card key={q.id || idx} className="border-border rounded-xl bg-white shadow-2xs">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5">Q{idx + 1}.</span>
                      <h5 className="font-bold text-xs sm:text-sm text-[#202124] flex-1 leading-snug">{q.question}</h5>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                      </span>
                    </div>

                    {/* Options review */}
                    <div className="grid grid-cols-1 gap-2 pl-5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const selected = chosenOptIdx === oIdx;
                        const correct = opt.isCorrect;

                        let optStyles = 'bg-slate-50 border-slate-200 text-slate-600';
                        if (selected && correct) optStyles = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
                        else if (selected && !correct) optStyles = 'bg-rose-50 border-rose-300 text-rose-800 font-bold';
                        else if (correct) optStyles = 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-semibold';

                        return (
                          <div key={oIdx} className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between ${optStyles}`}>
                            <span>{opt.text}</span>
                            <div className="shrink-0 flex items-center justify-center">
                              {correct && <Check className="h-4 w-4 text-emerald-600" />}
                              {selected && !correct && <X className="h-4 w-4 text-rose-600" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation text */}
                    {q.explanation && (
                      <div className="pl-5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-[#202124] block mb-0.5">Explanation:</span>
                        {q.explanation}
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default AssessmentPlayer;
