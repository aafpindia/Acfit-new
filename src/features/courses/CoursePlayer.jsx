import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLmsStore } from '../../stores/lmsStore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import apiClient from '../../lib/apiClient';
import { fetchCourseById } from '../../services/courseService';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Lock,
  CheckCircle,
  Play,
  FileText,
  FileCode,
  Award,
  Video,
  ExternalLink,
  BookOpen,
  Users,
  CheckSquare,
  Sparkles,
  Zap,
  Download,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Clock,
  Layers,
  ListTodo,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Copy,
  RefreshCw,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

// Players sub-components imports
import VideoPlayer from './players/VideoPlayer';
import RichTextPlayer from './players/RichTextPlayer';
import PdfPlayer from './players/PdfPlayer';
import PptPlayer from './players/PptPlayer';
import ImagePlayer from './players/ImagePlayer';
import DownloadPlayer from './players/DownloadPlayer';
import ExternalLinkPlayer from './players/ExternalLinkPlayer';
import LiveClassPlayer from './players/LiveClassPlayer';
import AssessmentPlayer from './players/AssessmentPlayer';

export const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const { courses, enrollments, payments = [], progress, attempts, certificates, markLessonComplete, submitFinalAssessmentAttempt, syncFromSupabase } = useLmsStore();

  // On mobile screens (< 1024px), sidebar defaults to closed so player content is immediately visible
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // { type: 'lesson' | 'quiz' | 'final' | 'complete', id, moduleId }
  const [selectedLessonMediaTab, setSelectedLessonMediaTab] = useState('video');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'checklist' | 'discussion' | 'resources'
  const [completedTasks, setCompletedTasks] = useState({});
  const [collapsedModules, setCollapsedModules] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});

  // Track sub-item completions within lessons: { [lessonId]: { [tabId]: true } }
  const [completedLessonSubItems, setCompletedLessonSubItems] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const storageKey = `_lms_subitems_${courseId}_${user?.id || 'guest'}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Hydrate sub-item completions once user ID loads after refresh
  useEffect(() => {
    if (typeof window === 'undefined' || !courseId || !user?.id) return;
    try {
      const storageKey = `_lms_subitems_${courseId}_${user.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompletedLessonSubItems((prev) => ({ ...prev, ...parsed }));
      }
    } catch (_) {}
  }, [courseId, user?.id]);

  // Auto-expand currently active lesson & module in the syllabus tree
  useEffect(() => {
    if (activeItem?.id) {
      if (activeItem.type === 'lesson') {
        setExpandedLessons((prev) => ({ ...prev, [activeItem.id]: true }));
      }
      if (activeItem.moduleId) {
        setCollapsedModules((prev) => ({ ...prev, [activeItem.moduleId]: false }));
      }
    }
  }, [activeItem?.id, activeItem?.moduleId, activeItem?.type]);

  const markSubItemComplete = (lessonId, tabId) => {
    if (!lessonId || !tabId) return;
    setCompletedLessonSubItems((prev) => {
      const lessonItems = { ...(prev[lessonId] || {}), [tabId]: true };
      const updated = { ...prev, [lessonId]: lessonItems };
      try {
        const storageKey = `_lms_subitems_${courseId}_${user?.id || 'guest'}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Helper to select a syllabus item and auto-close sidebar on mobile
  const selectItem = (item) => {
    setActiveItem(item);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const storeCourse = courses.find((c) => c.id === courseId ||
    (courseId === 'course-cardio-hiit' && c.id === '20202020-2020-2020-2020-202020202020') ||
    (courseId === '20202020-2020-2020-2020-202020202020' && c.id === 'course-cardio-hiit'));

  const [dbCourse, setDbCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(!storeCourse);

  const course = storeCourse || dbCourse;

  useEffect(() => {
    let active = true;
    if (!storeCourse && courseId) {
      setCourseLoading(true);
      fetchCourseById(courseId).then((res) => {
        if (active && res.success && res.data) {
          setDbCourse(res.data);
        }
      }).finally(() => {
        if (active) setCourseLoading(false);
      });
    } else if (storeCourse) {
      setCourseLoading(false);
    }
    return () => { active = false; };
  }, [storeCourse, courseId]);

  const [isAuthorized, setIsAuthorized] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  const userProgress = useMemo(() => {
    if (user?.id && progress[user.id] && progress[user.id][courseId]) {
      return progress[user.id][courseId];
    }
    if (user?.id && progress[courseId] && !progress[user.id]) {
      return progress[courseId];
    }
    return progress[courseId] || {};
  }, [user, progress, courseId]);

  // Sync Supabase state on load
  useEffect(() => {
    if (user) {
      syncFromSupabase(user);
    }
  }, [user, courseId]);

  // Verify backend enrollment & learning access authorization
  useEffect(() => {
    let active = true;
    const checkBackendAuthorization = async () => {
      if (authLoading) return;

      if (!user) {
        if (active) {
          setIsAuthorized(false);
          setAuthChecking(false);
        }
        return;
      }

      const userIsAdmin = (user.role || '').toUpperCase() === 'ADMIN';
      if (userIsAdmin) {
        if (active) {
          setIsAuthorized(true);
          setAuthChecking(false);
        }
        return;
      }

      const matchesCourse = (c) => {
        const str1 = String(c || '').toLowerCase();
        const str2 = String(courseId || '').toLowerCase();
        if (str1 === str2) return true;
        if ((str1 === 'course-cardio-hiit' && str2 === '20202020-2020-2020-2020-202020202020') ||
            (str2 === 'course-cardio-hiit' && str1 === '20202020-2020-2020-2020-202020202020')) {
          return true;
        }
        return false;
      };

      const matchesUser = (item) => {
        if (!item) return false;
        const uId = String(item.userId || item.user_id || '');
        if (uId && uId === String(user.id)) return true;
        if (user.email && item.studentEmail && item.studentEmail.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
        return false;
      };

      // 1. Free Course check: if price is 0, permit learning
      if (course && (parseFloat(course.price) === 0 || !course.price)) {
        if (active) {
          setIsAuthorized(true);
          setAuthChecking(false);
        }
        return;
      }

      // 2. Database enrollments check (from syncFromSupabase)
      const isDbEnrolled = (enrollments || []).some(
        e => matchesCourse(e.courseId || e.course_id) && matchesUser(e)
      );
      if (isDbEnrolled) {
        if (active) {
          setIsAuthorized(true);
          setAuthChecking(false);
        }
        return;
      }

      // 3. Database payments check (from syncFromSupabase)
      const isDbPaid = (payments || []).some(
        p => matchesCourse(p.courseId || p.course_id) &&
             matchesUser(p) &&
             ['successful', 'paid', 'completed'].includes((p.status || '').toLowerCase())
      );
      if (isDbPaid) {
        if (active) {
          setIsAuthorized(true);
          setAuthChecking(false);
        }
        return;
      }

      // 4. Supabase DB direct check via API client
      try {
        const res = await apiClient.courses.getProtectedLearningContent(courseId, user.id);
        if (active) {
          setIsAuthorized(Boolean(res?.authorized || isDbEnrolled || isDbPaid || userIsAdmin));
          setAuthChecking(false);
        }
      } catch (err) {
        if (active) {
          setIsAuthorized(Boolean(isDbEnrolled || isDbPaid || userIsAdmin));
          setAuthChecking(false);
        }
      }
    };

    checkBackendAuthorization();
    return () => { active = false; };
  }, [courseId, user, authLoading, enrollments, payments, course]);

  // Load target or first uncompleted lesson initially
  useEffect(() => {
    if (course && course.modules && !activeItem) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetLessonId = urlParams.get('lessonId');

      if (targetLessonId) {
        for (const mod of course.modules) {
          const found = mod.lessons?.find(l => l.id === targetLessonId);
          if (found) {
            setActiveItem({ type: 'lesson', id: found.id, moduleId: mod.id });
            return;
          }
        }
      }

      const userProgressMap = (user && progress[user.id] && progress[user.id][courseId]) || {};
      for (const mod of course.modules) {
        for (const les of mod.lessons || []) {
          if (!userProgressMap[les.id]) {
            setActiveItem({ type: 'lesson', id: les.id, moduleId: mod.id });
            return;
          }
        }
      }

      if (course.modules[0] && course.modules[0].lessons[0]) {
        const firstLesson = course.modules[0].lessons[0];
        setActiveItem({
          type: 'lesson',
          id: firstLesson.id,
          moduleId: course.modules[0].id
        });
      }
    }
  }, [course?.id, activeItem?.id, user?.id, courseId]);

  // Resolve current lesson and module cleanly (Hook called unconditionally)
  const { currentLesson, currentModule } = useMemo(() => {
    if (!course?.modules || activeItem?.type !== 'lesson') {
      return { currentLesson: null, currentModule: null };
    }
    for (const m of course.modules) {
      const found = (m.lessons || []).find((l) => l.id === activeItem.id);
      if (found) {
        return { currentLesson: found, currentModule: m };
      }
    }
    return { currentLesson: null, currentModule: null };
  }, [course, activeItem]);

  // Trim redundant parent lesson prefixes like "Lesson 1 (Video)" -> "Video"
  const formatSubLabel = (rawLabel, lessonTitle, defaultLabel) => {
    if (!rawLabel) return defaultLabel;
    const trimmed = String(rawLabel).trim();
    const lTitle = String(lessonTitle || '').trim();
    if (lTitle && trimmed.toLowerCase().startsWith(lTitle.toLowerCase())) {
      const rest = trimmed.slice(lTitle.length).trim();
      const parenMatch = rest.match(/^\((.+)\)$/);
      if (parenMatch) return parenMatch[1].trim() || defaultLabel;
      if (!rest) return defaultLabel;
      return rest.replace(/^[-–—:]\s*/, '').trim() || defaultLabel;
    }
    return trimmed;
  };

  // Avoid duplicate prefixes like "1. Module" + "Module 1: Section Name"
  const cleanModuleTitle = (title, modIdx) => {
    const raw = String(title || `Module ${modIdx + 1}`).trim();
    const stripped = raw.replace(/^(?:module\s*\d+\s*[:\-–—.]?\s*|\d+\.\s*(?:module\s*[:\-–—.]?\s*)?)/i, '').trim();
    return stripped || raw;
  };

  // Helper to extract multi-media sub-items/topics for ANY lesson
  const getLessonSubItems = (les) => {
    if (!les) return [];
    const items = [];

    // Check if lesson has explicit multi-step items in les.items
    if (Array.isArray(les.items) && les.items.length > 0) {
      const typeCounts = {};
      les.items.forEach((it) => {
        const t = it.type || 'text';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });

      les.items.forEach((item, idx) => {
        const mediaType = item.type || 'text';
        let defaultLabel = 'Study Notes';
        let icon = FileText;
        let count = null;

        if (mediaType === 'video') {
          defaultLabel = 'Video Lecture';
          icon = Play;
          count = item.duration || null;
        } else if (mediaType === 'ppt') {
          defaultLabel = 'Presentation';
          icon = BookOpen;
        } else if (mediaType === 'pdf') {
          defaultLabel = 'PDF Manual';
          icon = FileText;
        } else if (mediaType === 'quiz') {
          defaultLabel = 'Checkpoint Quiz';
          icon = Award;
          count = item.questions?.length ? `${item.questions.length} Qs` : null;
        } else {
          defaultLabel = 'Study Notes';
          icon = FileText;
        }

        const label = formatSubLabel(item.title || item.name, les.title, defaultLabel);
        const stepId = typeCounts[mediaType] > 1 ? `${mediaType}-${idx}` : mediaType;

        items.push({
          id: stepId,
          mediaType,
          itemData: item,
          label,
          icon,
          count
        });
      });
      return items;
    }

    const hasVideo = Boolean(
      les.videoUrl ||
      les.bunnyVideoId ||
      les.type === 'video'
    );
    if (hasVideo) {
      items.push({ id: 'video', mediaType: 'video', itemData: les, label: 'Video Lecture', icon: Play, count: les.duration || null });
    }

    const hasPpt = Boolean(
      les.pptUrl ||
      les.type === 'ppt' ||
      (les.fileUrl && (les.fileUrl.endsWith('.ppt') || les.fileUrl.endsWith('.pptx')))
    );
    if (hasPpt) {
      items.push({ id: 'ppt', mediaType: 'ppt', itemData: les, label: 'Presentation', icon: BookOpen, count: null });
    }

    const hasPdf = Boolean(
      les.pdfUrl ||
      les.type === 'pdf' ||
      (les.fileUrl && les.fileUrl.endsWith('.pdf'))
    );
    if (hasPdf) {
      items.push({ id: 'pdf', mediaType: 'pdf', itemData: les, label: 'PDF Manual', icon: FileText, count: null });
    }

    const hasText = Boolean(
      (les.body && les.body.trim()) ||
      les.type === 'text' ||
      les.type === 'rich-text'
    );
    if (hasText) {
      items.push({ id: 'text', mediaType: 'text', itemData: les, label: 'Study Notes', icon: FileText, count: null });
    }

    const quizQuestions = les.questions || les.assessment?.questions || [];
    const hasQuiz = Boolean(
      quizQuestions.length > 0 ||
      les.assessment ||
      les.type === 'quiz'
    );
    if (hasQuiz) {
      items.push({
        id: 'quiz',
        mediaType: 'quiz',
        itemData: les,
        label: 'Lesson Quiz',
        icon: Award,
        count: quizQuestions.length > 0 ? `${quizQuestions.length} Qs` : null
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'text',
        mediaType: 'text',
        itemData: les,
        label: les.title || 'Learning Content',
        icon: Play,
        count: les.duration || null
      });
    }

    return items;
  };

  // Only return REAL module-level assessments (never duplicate a multi-part lesson quiz or invent empty fallbacks)
  const getModuleAssessmentInfo = (mod) => {
    if (!mod || !mod.assessment) return null;
    const qList = mod.assessment.questions || [];
    if (!mod.assessment.title && qList.length === 0) return null;
    if (qList.length === 0) return null;
    return {
      id: mod.assessment.id || `quiz-mod-${mod.id}`,
      title: mod.assessment.title || 'Module Assessment',
      questionsCount: qList.length,
      hasAssessment: true,
      raw: mod.assessment
    };
  };

  // Resolve real final certification exam only when configured with questions
  const rawFinalExam = course?.finalAssessment || course?.finalExam;
  const hasRealFinalExam = Boolean(rawFinalExam && Array.isArray(rawFinalExam.questions) && rawFinalExam.questions.length > 0);
  const finalExamObj = hasRealFinalExam ? rawFinalExam : null;

  // Unified ordered step sequence across all modules, lessons, sub-items, module quizzes, and final exam
  const learningSteps = useMemo(() => {
    if (!course?.modules) return [];
    const steps = [];
    course.modules.forEach((mod, modIdx) => {
      const modLessons = mod.lessons || [];
      modLessons.forEach((les, lIdx) => {
        const subs = getLessonSubItems(les);
        subs.forEach((sub, sIdx) => {
          steps.push({
            key: `lesson-${les.id}-${sub.id}`,
            type: 'lesson',
            lessonId: les.id,
            subItemId: sub.id,
            mediaType: sub.mediaType,
            moduleId: mod.id,
            modIdx,
            lIdx,
            sIdx,
            totalSubsInLesson: subs.length,
            code: subs.length > 1 ? `${modIdx + 1}.${lIdx + 1}.${sIdx + 1}` : `${modIdx + 1}.${lIdx + 1}`,
            title: les.title,
            subLabel: sub.label,
          });
        });
      });

      const modQuiz = getModuleAssessmentInfo(mod);
      if (modQuiz) {
        steps.push({
          key: `quiz-${modQuiz.id}`,
          type: 'quiz',
          id: modQuiz.id,
          moduleId: mod.id,
          modIdx,
          code: `${modIdx + 1}.Q`,
          title: modQuiz.title,
          subLabel: `${modQuiz.questionsCount} ${modQuiz.questionsCount === 1 ? 'Question' : 'Questions'}`,
        });
      }
    });

    if (hasRealFinalExam) {
      steps.push({
        key: `final-${finalExamObj.id}`,
        type: 'final',
        id: finalExamObj.id,
        code: 'FINAL',
        title: finalExamObj.title || 'Final Certification Exam',
        subLabel: `${finalExamObj.questions.length} ${finalExamObj.questions.length === 1 ? 'Question' : 'Questions'}`,
      });
    }

    return steps;
  }, [course, hasRealFinalExam, finalExamObj]);

  // Multi-Media tabs available in current lesson (Hook called unconditionally)
  const lessonMediaTabs = useMemo(() => {
    return getLessonSubItems(currentLesson);
  }, [currentLesson]);

  const currentStepIndex = useMemo(() => {
    if (!learningSteps.length || !activeItem) return -1;
    if (activeItem.type === 'lesson') {
      const exact = learningSteps.findIndex(
        (s) => s.type === 'lesson' && s.lessonId === activeItem.id && s.subItemId === selectedLessonMediaTab
      );
      if (exact !== -1) return exact;
      return learningSteps.findIndex((s) => s.type === 'lesson' && s.lessonId === activeItem.id);
    }
    if (activeItem.type === 'quiz') {
      return learningSteps.findIndex(
        (s) => s.type === 'quiz' && (s.id === activeItem.id || s.moduleId === activeItem.moduleId)
      );
    }
    if (activeItem.type === 'final') {
      return learningSteps.findIndex((s) => s.type === 'final');
    }
    return -1;
  }, [learningSteps, activeItem, selectedLessonMediaTab]);

  const isTabCompleted = (lessonId, tabId) => {
    if (!lessonId || !tabId) return false;
    if (userProgress[lessonId]) return true;
    return Boolean(completedLessonSubItems[lessonId]?.[tabId]);
  };

  const isTabUnlocked = (lessonId, tabId, tabIndex, customTabs = null) => {
    if (!lessonId) return true;
    if (userProgress[lessonId]) return true;
    if (tabIndex === 0) return true;
    const tabs = customTabs || lessonMediaTabs;
    const prevTab = tabs[tabIndex - 1];
    if (!prevTab) return true;
    return isTabCompleted(lessonId, prevTab.id);
  };

  // Keep selected tab valid and advance to first uncompleted tab for current lesson (Hook called unconditionally)
  useEffect(() => {
    if (lessonMediaTabs.length > 0 && currentLesson) {
      const currentIdx = lessonMediaTabs.findIndex((t) => t.id === selectedLessonMediaTab);
      const isCurrentUnlocked = currentIdx !== -1 && isTabUnlocked(currentLesson.id, selectedLessonMediaTab, currentIdx);

      if (!isCurrentUnlocked) {
        const firstAvailable = lessonMediaTabs.find(
          (t, idx) => !isTabCompleted(currentLesson.id, t.id) && isTabUnlocked(currentLesson.id, t.id, idx)
        ) || lessonMediaTabs[0];
        setSelectedLessonMediaTab(firstAvailable.id);
      }
    }
  }, [currentLesson?.id, lessonMediaTabs]);

  if (authChecking || courseLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center graph-paper-bg text-[#202124] font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-tactile-sm">
          <Menu className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">
          [ Loading Blueprint Learning Workspace... ]
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center graph-paper-bg text-[#202124] p-6 font-sans text-center">
        <div className="max-w-md bg-white border border-border rounded-2xl p-8 shadow-tactile corner-crosshair space-y-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <span className="sticker-tag-yellow text-[9px]">[ 403 ACCESS RESTRICTED ]</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#202124]">Blueprint Enrollment Required</h2>
          </div>
          <p className="font-mono text-xs text-slate-500 leading-relaxed">
            Your account is not currently enrolled in this training blueprint. Enroll now to unlock high-definition video modules, syllabus tracking, and official certifications.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="tactile-btn-primary rounded-xl w-full text-xs font-mono font-bold h-11 bg-primary text-white shadow-tactile-sm"
            >
              View Blueprint & Enroll Now →
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/app/dashboard')}
              className="rounded-xl w-full text-xs font-mono font-bold h-11 border-border text-slate-700 hover:bg-slate-50 bg-white"
            >
              Back to My Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-8 text-center text-[#202124] bg-background min-h-screen font-sans font-bold">Course not found.</div>;
  }

  const userAttempts = (user && attempts.filter((a) => a.userId === user.id && a.courseId === courseId)) || attempts.filter((a) => a.courseId === courseId) || [];

  const isQuizPassed = (quizId) => {
    return userAttempts.some((a) => {
      if (a.passed) {
        if (a.moduleId === quizId) return true;
        if (a.quizId === quizId || a.assessmentId === quizId) return true;
        
        const module = course.modules?.find(m => m.id === a.moduleId);
        if (module && module.assessment?.id === quizId) return true;

        if (a.moduleId === null && (finalExamObj?.id === quizId || quizId === 'final')) return true;
      }
      return false;
    });
  };

  const isModuleUnlocked = (moduleIndex) => {
    if (moduleIndex === 0 || isAdmin) return true;
    const prevModule = course.modules[moduleIndex - 1];
    if (!prevModule) return true;
    
    const prevLessons = prevModule.lessons || [];
    if (prevLessons.length === 0) return true;

    const prevLessonsComplete = prevLessons.every((l) => Boolean(userProgress[l.id]));
    const prevQuiz = getModuleAssessmentInfo(prevModule);
    const prevQuizPassed = !prevQuiz || isQuizPassed(prevQuiz.id) || isQuizPassed(prevModule.id);

    return prevLessonsComplete && prevQuizPassed;
  };

  const isCourseContentComplete = (extraLessonId = null, extraQuizModuleId = null) => {
    if (!course?.modules || course.modules.length === 0) return true;
    const allLessons = course.modules.flatMap((m) => m.lessons || []);
    const lessonsDone = allLessons.every((l) => {
      if (extraLessonId && l.id === extraLessonId) return true;
      return Boolean(userProgress[l.id] || userProgress[l.id?.toString()]);
    });
    const quizzesDone = course.modules.every((m) => {
      const modQuiz = getModuleAssessmentInfo(m);
      if (!modQuiz) return true;
      if (extraQuizModuleId && m.id === extraQuizModuleId) return true;
      return isQuizPassed(modQuiz.id) || isQuizPassed(m.id);
    });
    return lessonsDone && quizzesDone;
  };

  const isFinalUnlocked = (extraLessonId = null) => {
    if (isAdmin) return true;
    return isCourseContentComplete(extraLessonId);
  };

  const findFirstUncompletedLesson = () => {
    for (const mod of course.modules || []) {
      for (const les of mod.lessons || []) {
        if (!userProgress[les.id]) {
          return { type: 'lesson', id: les.id, moduleId: mod.id };
        }
      }
    }
    return null;
  };

  const userCourseCertificate = certificates.find(
    (c) => c.courseId === courseId && (c.userId === user?.id || !c.userId)
  );

  const isCertificateUnlocked = () => {
    return Boolean(userCourseCertificate) || userAttempts.some((a) => a.moduleId === null && a.passed);
  };

  const allCourseLessons = course.modules?.flatMap((m) => m.lessons || []) || [];
  const totalLessonsCount = allCourseLessons.length;
  const completedLessonsCount = allCourseLessons.filter(l => Boolean(userProgress[l.id])).length;
  const overallProgressPercentage = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  const isStepCompleted = (step) => {
    if (!step) return false;
    if (step.type === 'lesson') {
      return Boolean(userProgress[step.lessonId]) || isTabCompleted(step.lessonId, step.subItemId);
    }
    if (step.type === 'quiz') {
      return isQuizPassed(step.id) || isQuizPassed(step.moduleId);
    }
    if (step.type === 'final') {
      return isQuizPassed(step.id) || isCertificateUnlocked();
    }
    return false;
  };

  const navigateToStep = (step) => {
    if (!step) return;
    if (step.type === 'lesson') {
      selectItem({ type: 'lesson', id: step.lessonId, moduleId: step.moduleId });
      setSelectedLessonMediaTab(step.subItemId);
    } else if (step.type === 'quiz') {
      selectItem({ type: 'quiz', id: step.id, moduleId: step.moduleId });
    } else if (step.type === 'final') {
      selectItem({ type: 'final', id: step.id });
    } else if (step.type === 'complete') {
      selectItem({ type: 'complete', id: 'course-complete' });
    }
  };

  const handleFinishCourse = async () => {
    const alreadyCertified = isCertificateUnlocked();
    if (alreadyCertified) {
      selectItem({ type: 'complete', id: 'course-complete' });
      return;
    }

    if (hasRealFinalExam && !isQuizPassed(finalExamObj?.id) && !isAdmin) {
      error('Please pass the Final Certification Exam first to complete the course and unlock your certificate.');
      selectItem({ type: 'final', id: finalExamObj.id });
      return;
    }

    if (user) {
      const studentName = user?.fullName || user?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Graduate Member');
      try {
        await submitFinalAssessmentAttempt(courseId, 100, true, user.id, studentName, finalExamObj?.id || 'course-completion');
      } catch (e) {
        console.warn('[CoursePlayer] Course completion save warning:', e);
      }
    }
    selectItem({ type: 'complete', id: 'course-complete' });
    success('🎓 Congratulations! You have completed the entire course!');
  };

  const advanceAfterStep = (completedStepIdx, extraLessonId = null, extraQuizModuleId = null) => {
    const nextStep = completedStepIdx !== -1 ? learningSteps[completedStepIdx + 1] : null;
    if (nextStep) {
      if (nextStep.type === 'final') {
        if (isCertificateUnlocked() || isQuizPassed(finalExamObj?.id)) {
          selectItem({ type: 'complete', id: 'course-complete' });
        } else if (isCourseContentComplete(extraLessonId, extraQuizModuleId)) {
          navigateToStep(nextStep);
          success('🎉 All lessons & quizzes complete! Opening Final Certification Exam...');
        } else {
          const uncompleted = findFirstUncompletedLesson();
          if (uncompleted) selectItem(uncompleted);
        }
      } else {
        navigateToStep(nextStep);
      }
    } else {
      // No next step -> reached the end of course curriculum!
      if (isCertificateUnlocked()) {
        selectItem({ type: 'complete', id: 'course-complete' });
      } else if (!hasRealFinalExam && isCourseContentComplete(extraLessonId, extraQuizModuleId)) {
        handleFinishCourse();
      } else {
        const uncompleted = findFirstUncompletedLesson();
        if (uncompleted && uncompleted.id !== extraLessonId) {
          selectItem(uncompleted);
        } else {
          handleFinishCourse();
        }
      }
    }
  };

  const handleMarkComplete = () => {
    if (activeItem?.type === 'lesson') {
      const currentLessonId = activeItem.id;
      if (user?.id) {
        markLessonComplete(courseId, currentLessonId, user.id);
      }
      success('Lesson completed ✓');
      advanceAfterStep(currentStepIndex, currentLessonId);
    }
  };

  const handleModuleQuizPassed = () => {
    const completedModId = activeItem?.moduleId;
    advanceAfterStep(currentStepIndex, null, completedModId);
  };

  const handleSubItemOrLessonComplete = () => {
    if (!currentLesson) return;

    if (lessonMediaTabs.length <= 1) {
      handleMarkComplete();
      return;
    }

    const currentTabIndex = lessonMediaTabs.findIndex((t) => t.id === selectedLessonMediaTab);
    if (currentTabIndex === -1) {
      handleMarkComplete();
      return;
    }

    // Mark current sub-item complete
    markSubItemComplete(currentLesson.id, selectedLessonMediaTab);

    // If there is another sub-item in this lesson, advance cleanly to it
    if (currentTabIndex < lessonMediaTabs.length - 1) {
      const nextTab = lessonMediaTabs[currentTabIndex + 1];
      setSelectedLessonMediaTab(nextTab.id);
      success(`✓ ${lessonMediaTabs[currentTabIndex].label} completed! Next: ${nextTab.label}`);
    } else {
      // Last sub-item in this lesson -> complete entire lesson and advance!
      handleMarkComplete();
    }
  };

  const handleFinalPassed = () => {
    setActiveItem({ type: 'complete', id: 'course-complete' });
    success('🎓 Official Certificate unlocked!');
  };

  const loadNextItem = () => {
    if (currentStepIndex === -1) return;
    const currentStep = learningSteps[currentStepIndex];
    const nextStep = learningSteps[currentStepIndex + 1];

    if (!isAdmin && !isStepCompleted(currentStep)) {
      if (currentStep?.type === 'quiz' || currentStep?.type === 'final') {
        error('Please pass this assessment first to unlock the next section.');
      } else {
        error('Click "Complete & Continue" to finish this step before advancing.');
      }
      return;
    }

    if (nextStep) {
      navigateToStep(nextStep);
    } else if (isCourseContentComplete()) {
      handleFinishCourse();
    }
  };

  const loadPrevItem = () => {
    if (activeItem?.type === 'complete') {
      if (learningSteps.length > 0) {
        navigateToStep(learningSteps[learningSteps.length - 1]);
      }
      return;
    }
    if (currentStepIndex > 0) {
      navigateToStep(learningSteps[currentStepIndex - 1]);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return Play;
      case 'rich-text':
      case 'text': return FileText;
      case 'pdf': return FileText;
      case 'ppt': return BookOpen;
      case 'image': return ImageIcon;
      case 'live-class': return Users;
      case 'download': return FileCode;
      case 'external-link': return ExternalLink;
      case 'quiz': return Award;
      default: return Play;
    }
  };

  const renderContentItem = (itemType, itemContent, lessonTitle, onComplete, fullItem = null) => {
    const normType = (itemType || '').toLowerCase();

    if (normType === 'video') {
      const videoObj = {
        ...(typeof itemContent === 'object' ? itemContent : {}),
        videoUrl: itemContent?.videoUrl || fullItem?.videoUrl || (typeof itemContent === 'string' ? itemContent : ''),
        bunnyVideoId: itemContent?.bunnyVideoId || fullItem?.bunnyVideoId || itemContent?.videoId || fullItem?.videoId,
        libraryId: itemContent?.libraryId || fullItem?.libraryId,
        title: lessonTitle
      };
      return <VideoPlayer content={videoObj} onComplete={onComplete} />;
    }

    if (normType === 'rich-text' || normType === 'text') {
      const richContent = typeof itemContent === 'string'
        ? { body: itemContent }
        : (itemContent || { body: fullItem?.body || fullItem?.textContent || fullItem?.description || '' });
      return <RichTextPlayer content={richContent} />;
    }

    if (normType === 'image') {
      const imgContent = typeof itemContent === 'string'
        ? { images: [itemContent] }
        : (itemContent || { images: fullItem?.fileUrl ? [fullItem.fileUrl] : (fullItem?.images || []) });
      return <ImagePlayer content={imgContent} />;
    }

    if (normType === 'ppt') {
      const pptContent = {
        title: lessonTitle,
        fileUrl: itemContent?.fileUrl || fullItem?.fileUrl || '',
        pdfUrl: itemContent?.pdfUrl || fullItem?.pdfUrl || '',
        isConverted: itemContent?.isConverted || fullItem?.isConverted || false,
        body: itemContent?.body || fullItem?.body || '',
        notes: itemContent?.notes || fullItem?.notes || '',
        instructions: itemContent?.instructions || fullItem?.instructions || '',
        slides: itemContent?.slides || fullItem?.slides || [],
        duration: fullItem?.duration || '',
        moduleTitle: currentModule?.title || '',
        ...(typeof fullItem === 'object' ? fullItem : {}),
        ...(typeof itemContent === 'object' ? itemContent : {})
      };
      return <PptPlayer content={pptContent} onComplete={onComplete} />;
    }

    if (normType === 'pdf' || normType === 'document') {
      const pdfContent = {
        title: lessonTitle,
        fileUrl: itemContent?.fileUrl || fullItem?.fileUrl || (typeof itemContent === 'string' ? itemContent : ''),
        body: itemContent?.body || fullItem?.body || '',
        notes: itemContent?.notes || fullItem?.notes || '',
        instructions: itemContent?.instructions || fullItem?.instructions || '',
        duration: fullItem?.duration || '',
        moduleTitle: currentModule?.title || '',
        ...(typeof fullItem === 'object' ? fullItem : {}),
        ...(typeof itemContent === 'object' ? itemContent : {})
      };
      return <PdfPlayer content={pdfContent} onComplete={onComplete} />;
    }

    if (normType === 'live-class') {
      return <LiveClassPlayer content={itemContent || fullItem || {}} />;
    }

    if (normType === 'download') {
      const downloadContent = {
        files: itemContent?.files || [{ name: fullItem?.title || lessonTitle || 'Download Resource File', url: itemContent?.fileUrl || fullItem?.fileUrl || itemContent?.url || '#' }],
        fileUrl: itemContent?.fileUrl || fullItem?.fileUrl || '',
        ...(typeof itemContent === 'object' ? itemContent : {})
      };
      return <DownloadPlayer content={downloadContent} />;
    }

    if (normType === 'external-link') {
      const linkContent = {
        url: itemContent?.url || itemContent?.fileUrl || fullItem?.fileUrl || (typeof itemContent === 'string' ? itemContent : '#'),
        title: lessonTitle,
        ...(typeof itemContent === 'object' ? itemContent : {})
      };
      return <ExternalLinkPlayer content={linkContent} />;
    }

    if (normType === 'quiz' || normType === 'assessment') {
      return (
        <AssessmentPlayer
          moduleId={activeItem?.moduleId}
          courseId={courseId}
          isFinal={false}
          onPassed={handleMarkComplete}
          lessonId={currentLesson?.id}
        />
      );
    }

    if (normType === 'text' || normType === 'rich-text') {
      const textBody = typeof itemContent === 'string' ? itemContent : (itemContent?.body || fullItem?.body || fullItem?.instructions || '');
      return <RichTextPlayer content={{ body: textBody, title: lessonTitle }} />;
    }

    const videoUrl = itemContent?.videoUrl || fullItem?.videoUrl || (typeof itemContent === 'string' && itemContent.startsWith('http') ? itemContent : '');
    const bunnyVideoId = itemContent?.bunnyVideoId || fullItem?.bunnyVideoId || itemContent?.videoId;
    if (videoUrl || bunnyVideoId) {
      return (
        <VideoPlayer
          content={{ videoUrl, bunnyVideoId, title: lessonTitle }}
          onComplete={onComplete}
        />
      );
    }

    const fallbackText = typeof itemContent === 'string' ? itemContent : (itemContent?.body || fullItem?.body || fullItem?.instructions || '');
    return <RichTextPlayer content={{ body: fallbackText || '<p>Lesson content loaded.</p>' }} />;
  };

  const toggleTaskCheckbox = (taskId) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#2563EB] selection:text-white select-none">
      
      {/* ─── SLIM LEARNING STUDIO HEADER BAR ─────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 shadow-2xs select-none gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs h-8.5 px-2.5 sm:px-3 gap-1.5 cursor-pointer shrink-0"
            leftIcon={<ArrowLeft className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
          >
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-8.5 px-2.5 sm:px-3 rounded-xl border transition-colors focus:outline-none shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              sidebarOpen
                ? 'bg-[#EFF6FF] border-[#2563EB]/40 text-[#2563EB]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Course Syllabus"
          >
            <Menu className="h-3.5 w-3.5" />
            <span>Syllabus</span>
          </button>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3 min-w-0">
            <h1 className="font-extrabold text-sm text-slate-900 truncate max-w-xs lg:max-w-md">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Header Right: Progress Pill & Full Screen */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold">
            <span className="hidden sm:inline text-slate-600">{completedLessonsCount}/{totalLessonsCount} Lessons</span>
            <span className={`w-2 h-2 rounded-full ${overallProgressPercentage === 100 ? 'bg-emerald-500' : 'bg-[#2563EB] animate-pulse'}`} />
            <span className="text-slate-900 font-extrabold">{overallProgressPercentage}%</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFullscreenMode(!isFullscreenMode);
              if (!isFullscreenMode) setSidebarOpen(false);
            }}
            className={`h-8.5 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isFullscreenMode
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isFullscreenMode ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreenMode ? (
              <>
                <Minimize className="h-3.5 w-3.5 text-rose-600" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="h-3.5 w-3.5 text-[#2563EB]" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── MAIN PLAYER BODY LAYOUT (COMPACT SIDEBAR + CONTENT WORKSPACE) ────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 relative overflow-hidden">
        
        {/* Mobile Backdrop for Syllabus Overlay */}
        {sidebarOpen && !isFullscreenMode && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          />
        )}

        {/* COMPACT LEFT SYLLABUS SIDEBAR (lg:w-80) */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out h-full select-none ${
            isFullscreenMode ? 'hidden' : ''
          } ${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[330px] shadow-2xl lg:shadow-none lg:static lg:w-80 lg:z-20'
              : 'hidden lg:flex lg:w-0 lg:overflow-hidden lg:border-none'
          }`}
        >
          {/* Compact Syllabus Progress Card */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Layers className="h-3.5 w-3.5 text-[#2563EB]" />
                <span className="font-extrabold">Course Syllabus</span>
              </span>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold ${overallProgressPercentage === 100 ? 'text-emerald-600' : 'text-[#2563EB]'}`}>
                  {overallProgressPercentage}%
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close Syllabus"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="h-1.5 bg-slate-200/90 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallProgressPercentage === 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'
                }`}
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>{completedLessonsCount} of {totalLessonsCount} Lessons</span>
              <span className={overallProgressPercentage === 100 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                {overallProgressPercentage === 100 ? '✓ Completed' : 'In Progress'}
              </span>
            </div>
          </div>

          {/* Compact Hierarchical Modules -> Lessons -> Sub-Items -> Quiz Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
            {course.modules?.map((mod, modIdx) => {
              const unlocked = isModuleUnlocked(modIdx);
              const modLessons = mod.lessons || [];
              const modCompletedCount = modLessons.filter(l => Boolean(userProgress[l.id])).length;
              const allModLessonsComplete = modLessons.length > 0 && modCompletedCount === modLessons.length;
              const isModCollapsed = Boolean(collapsedModules[mod.id]);
              const modQuiz = getModuleAssessmentInfo(mod);
              const modQuizPassed = modQuiz ? (isQuizPassed(modQuiz.id) || isQuizPassed(mod.id)) : true;
              const isModuleFullyDone = allModLessonsComplete && modQuizPassed;
              const modTitleText = cleanModuleTitle(mod.title, modIdx);

              return (
                <div key={mod.id || modIdx} className={`rounded-xl border border-slate-200/80 bg-slate-50/40 overflow-hidden ${!unlocked ? 'opacity-65' : ''}`}>
                  
                  {/* Module Accordion Header */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!unlocked) {
                        error(`Module ${modIdx + 1} is locked. Complete all items in Module ${modIdx} first.`);
                      }
                      setCollapsedModules(prev => ({ ...prev, [mod.id]: !isModCollapsed }));
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-slate-50/80 text-left cursor-pointer transition-colors border-b border-slate-100"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-black shrink-0 ${
                        isModuleFullyDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : !unlocked
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-[#2563EB]'
                      }`}>
                        {isModuleFullyDone ? '✓' : modIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {modIdx + 1}. {modTitleText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {modCompletedCount}/{modLessons.length}
                      </span>
                      {!unlocked && <Lock className="h-3 w-3 text-amber-500" />}
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isModCollapsed ? '-rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Module Contents: Lessons + Nested Sub-items + Module Quiz */}
                  {!isModCollapsed && (
                    <div className="p-2 space-y-1.5">
                      {modLessons.map((les, lIdx) => {
                        const active = activeItem?.type === 'lesson' && activeItem.id === les.id;
                        const complete = Boolean(userProgress[les.id]);
                        const subItems = getLessonSubItems(les);
                        const hasMultiSubs = subItems.length > 1;
                        const isLessonExpanded = hasMultiSubs && (expandedLessons[les.id] ?? active);

                        return (
                          <div key={les.id || lIdx} className="space-y-1">
                            {/* Compact Lesson Row */}
                            <div
                              className={`flex items-center justify-between rounded-xl border px-2.5 py-2 transition-all ${
                                active
                                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                                  : complete
                                  ? 'bg-white border-emerald-200/80 text-slate-800 hover:bg-slate-50'
                                  : 'bg-white border-slate-200/90 text-slate-800 hover:border-blue-300 hover:bg-slate-50/70'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (!unlocked) {
                                    error(`Module ${modIdx + 1} is locked. Complete previous modules first.`);
                                    return;
                                  }
                                  selectItem({ type: 'lesson', id: les.id, moduleId: mod.id });
                                  setExpandedLessons(prev => ({ ...prev, [les.id]: true }));
                                  const firstPending = subItems.find(s => !isTabCompleted(les.id, s.id)) || subItems[0];
                                  if (firstPending) {
                                    setSelectedLessonMediaTab(firstPending.id);
                                  }
                                }}
                                className="flex-1 flex items-center gap-2 min-w-0 text-left cursor-pointer"
                              >
                                <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                  active
                                    ? 'bg-white/20 text-white'
                                    : complete
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-blue-50 text-[#2563EB]'
                                }`}>
                                  {modIdx + 1}.{lIdx + 1}
                                </span>
                                <span className="font-bold text-xs truncate">
                                  {les.title}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                {complete ? (
                                  <CheckCircle className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-emerald-500'}`} />
                                ) : (
                                  <span className={`font-mono text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}`}>
                                    {les.duration || (hasMultiSubs ? `${subItems.length}p` : '10m')}
                                  </span>
                                )}

                                {hasMultiSubs && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedLessons(prev => ({ ...prev, [les.id]: !isLessonExpanded }));
                                    }}
                                    className={`p-0.5 rounded cursor-pointer transition-colors ${
                                      active ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'
                                    }`}
                                    title={isLessonExpanded ? 'Collapse parts' : 'Show parts'}
                                  >
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLessonExpanded ? '' : '-rotate-90'}`} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Compact Indented Sub-Items List (1.1.1, 1.1.2, ...) */}
                            {hasMultiSubs && isLessonExpanded && (
                              <div className="ml-3 pl-2.5 border-l-2 border-slate-200 space-y-0.5 py-0.5">
                                {subItems.map((sub, sIdx) => {
                                  const isSubComplete = isTabCompleted(les.id, sub.id);
                                  const isSubUnlocked = isAdmin || (unlocked && (complete || sIdx === 0 || isTabCompleted(les.id, subItems[sIdx - 1]?.id)));
                                  const isSubActive = active && selectedLessonMediaTab === sub.id;

                                  return (
                                    <button
                                      key={sub.id || sIdx}
                                      type="button"
                                      onClick={() => {
                                        if (!unlocked) {
                                          error(`Module ${modIdx + 1} is locked.`);
                                          return;
                                        }
                                        if (!isSubUnlocked) {
                                          error(`Complete ${modIdx + 1}.${lIdx + 1}.${sIdx} first.`);
                                          return;
                                        }
                                        selectItem({ type: 'lesson', id: les.id, moduleId: mod.id });
                                        setSelectedLessonMediaTab(sub.id);
                                      }}
                                      disabled={!isSubUnlocked}
                                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-[11px] transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#EFF6FF] text-[#1D4ED8] font-extrabold border border-blue-200'
                                          : isSubComplete
                                          ? 'text-slate-700 hover:bg-white font-semibold'
                                          : isSubUnlocked
                                          ? 'text-slate-600 hover:bg-white font-medium'
                                          : 'opacity-50 cursor-not-allowed text-slate-400'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate pr-1">
                                        <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                                          {modIdx + 1}.{lIdx + 1}.{sIdx + 1}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </div>

                                      <div className="shrink-0 ml-1">
                                        {isSubComplete ? (
                                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : !isSubUnlocked ? (
                                          <Lock className="h-3 w-3 text-slate-400" />
                                        ) : isSubActive ? (
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] block animate-pulse" />
                                        ) : null}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Real Module Assessment Quiz Row (Only when mod.assessment is configured) */}
                      {modQuiz && (() => {
                        const quizActive = activeItem?.type === 'quiz' && (activeItem.id === modQuiz.id || activeItem.moduleId === mod.id);
                        const isQuizUnlocked = isAdmin || (unlocked && allModLessonsComplete);

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (!unlocked) {
                                error(`Module ${modIdx + 1} is locked.`);
                                return;
                              }
                              if (!isQuizUnlocked) {
                                error(`Complete all lessons in Module ${modIdx + 1} first to unlock this Quiz.`);
                                return;
                              }
                              selectItem({ type: 'quiz', id: modQuiz.id, moduleId: mod.id });
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              quizActive
                                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs font-extrabold'
                                : modQuizPassed
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold'
                                : isQuizUnlocked
                                ? 'bg-amber-50/70 border-amber-200/80 text-amber-900 hover:bg-amber-100/70 font-bold'
                                : 'bg-slate-100 border-slate-200 text-slate-500 opacity-75 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <Award className={`h-3.5 w-3.5 shrink-0 ${quizActive ? 'text-white' : 'text-amber-500'}`} />
                              <span className="truncate">{modQuiz.title}</span>
                              <span className={`font-mono text-[10px] shrink-0 ${quizActive ? 'text-white/80' : 'text-slate-400'}`}>
                                ({modQuiz.questionsCount} Qs)
                              </span>
                            </div>

                            {modQuizPassed ? (
                              <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${quizActive ? 'text-white' : 'text-emerald-500'}`} />
                            ) : !isQuizUnlocked ? (
                              <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                            ) : null}
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Certification Exam OR Direct Course Completion Card */}
            {hasRealFinalExam ? (
              <div className={`pt-2 space-y-2 ${!isFinalUnlocked() ? 'opacity-80' : ''}`}>
                <div className="flex items-center justify-between px-1 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Certification Exam</span>
                  {!isFinalUnlocked() && <Lock className="h-3 w-3 text-amber-500" />}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isCertificateUnlocked() || isQuizPassed(finalExamObj.id)) {
                      selectItem({ type: 'complete', id: 'course-complete' });
                      return;
                    }
                    if (!isFinalUnlocked()) {
                      const remaining = totalLessonsCount - completedLessonsCount;
                      error(`Certificate Exam Locked: Complete all ${totalLessonsCount} lessons first (${remaining} remaining).`);
                      return;
                    }
                    selectItem({ type: 'final', id: finalExamObj.id });
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border cursor-pointer text-left transition-all ${
                    activeItem?.type === 'final'
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                      : isCertificateUnlocked() || isQuizPassed(finalExamObj.id)
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
                      : isFinalUnlocked()
                      ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Award className={`h-4 w-4 shrink-0 ${activeItem?.type === 'final' ? 'text-white' : isCertificateUnlocked() || isQuizPassed(finalExamObj.id) ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="truncate">
                      {isCertificateUnlocked() || isQuizPassed(finalExamObj.id)
                        ? `${finalExamObj.title || 'Final Exam'} (Certified)`
                        : (finalExamObj.title || 'Final Certification Exam')}
                    </span>
                  </div>
                  {isCertificateUnlocked() || isQuizPassed(finalExamObj.id) ? (
                    <CheckCircle className={`h-4 w-4 shrink-0 ${activeItem?.type === 'final' ? 'text-white' : 'text-emerald-500'}`} />
                  ) : !isFinalUnlocked() ? (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : null}
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCourseContentComplete() && !isAdmin) {
                      const remaining = totalLessonsCount - completedLessonsCount;
                      error(`Complete all remaining lessons (${remaining} left) to finish the course.`);
                      return;
                    }
                    handleFinishCourse();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border cursor-pointer text-left transition-all ${
                    activeItem?.type === 'complete'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : isCourseContentComplete() || isCertificateUnlocked()
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Award className={`h-4 w-4 shrink-0 ${activeItem?.type === 'complete' ? 'text-white' : 'text-emerald-600'}`} />
                    <span className="truncate">
                      {isCertificateUnlocked() || isCourseContentComplete() ? 'Course Complete & Certificate' : 'Finish Course & Certify'}
                    </span>
                  </div>
                  {isCertificateUnlocked() || isCourseContentComplete() ? (
                    <CheckCircle className={`h-4 w-4 shrink-0 ${activeItem?.type === 'complete' ? 'text-white' : 'text-emerald-500'}`} />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                </button>
              </div>
            )}

            {/* Direct Certificate Link Once Unlocked */}
            {userCourseCertificate && (
              <Link
                to={`/certificates/${userCourseCertificate.id}`}
                className="block w-full p-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-all shadow-xs cursor-pointer"
              >
                View Official Certificate 🎓
              </Link>
            )}
          </div>
        </aside>

        {/* RIGHT WORKSPACE: SCROLLABLE PLAYER CANVAS + PERSISTENT BOTTOM NAV BAR */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <main className={`flex-1 overflow-y-auto w-full font-sans transition-all duration-300 ${
            isFullscreenMode ? 'p-0 bg-slate-950 flex flex-col h-full min-h-0' : 'p-3 sm:p-5 lg:p-6 space-y-4 bg-[#F8FAFC]'
          }`}>
            
            {/* ─── ACTIVE LESSON VIEW ─── */}
            {activeItem?.type === 'lesson' && currentLesson && (() => {
              const activeSubItem = lessonMediaTabs.find((t) => t.id === selectedLessonMediaTab) || lessonMediaTabs[0];
              const activeMediaType = activeSubItem?.mediaType || 'text';
              const activeItemData = activeSubItem?.itemData || currentLesson;
              const currentStep = currentStepIndex !== -1 ? learningSteps[currentStepIndex] : null;
              const lessonNotes = currentLesson.body || currentLesson.items?.find((i) => i.type === 'text' || i.type === 'rich-text')?.body || currentLesson.notes || currentLesson.content || '';
              const showSeparateNotesCard = Boolean(
                lessonNotes &&
                lessonNotes.trim() &&
                activeMediaType !== 'text' &&
                !lessonMediaTabs.some((t) => t.mediaType === 'text') &&
                !isFullscreenMode
              );

              return (
                <div className={isFullscreenMode ? 'h-full flex flex-col justify-between space-y-0 w-full' : 'space-y-4 max-w-5xl mx-auto'}>
                  
                  {/* Compact Step Breadcrumb Header Card */}
                  {!isFullscreenMode && (
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {currentStep && (
                            <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-mono text-[10px] font-extrabold tracking-wide">
                              {currentStep.code} · {activeSubItem?.label || 'Lesson'}
                            </span>
                          )}
                          {currentModule && (
                            <span className="text-[11px] font-semibold text-slate-500 truncate">
                              {cleanModuleTitle(currentModule.title, currentStep?.modIdx || 0)}
                            </span>
                          )}
                        </div>
                        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                          {currentLesson.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {(activeItemData?.duration || currentLesson.duration) && (
                          <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-mono text-[11px] font-bold text-slate-600 border border-slate-200/80 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{activeItemData?.duration || currentLesson.duration}</span>
                          </span>
                        )}
                        {Boolean(userProgress[currentLesson.id]) && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Content Player Frame */}
                  <div className={`transition-all duration-300 ${
                    isFullscreenMode
                      ? 'flex-1 w-full bg-black p-0 relative overflow-y-auto flex flex-col justify-center'
                      : 'rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative'
                  }`}>
                    <div className={isFullscreenMode ? 'w-full h-full min-h-0 bg-black flex flex-col justify-center' : 'overflow-hidden'}>
                      {activeMediaType === 'quiz' ? (
                        <div className="p-3 sm:p-5 bg-[#F8FAFC]">
                          <AssessmentPlayer
                            key={`quiz-${currentLesson.id}-${selectedLessonMediaTab}`}
                            moduleId={activeItem.moduleId}
                            courseId={courseId}
                            isFinal={false}
                            onPassed={handleSubItemOrLessonComplete}
                            lessonId={currentLesson.id}
                            courseData={course}
                          />
                        </div>
                      ) : activeMediaType === 'video' ? (
                        <div className="bg-black">
                          <VideoPlayer
                            key={`video-${currentLesson.id}-${selectedLessonMediaTab}`}
                            content={{
                              videoUrl: activeItemData?.videoUrl || currentLesson.videoUrl || (currentLesson.type === 'video' ? currentLesson.fileUrl : '') || '',
                              bunnyVideoId: activeItemData?.bunnyVideoId || currentLesson.bunnyVideoId || '',
                              title: activeSubItem?.label || currentLesson.title
                            }}
                            onComplete={handleSubItemOrLessonComplete}
                          />
                        </div>
                      ) : activeMediaType === 'ppt' ? (
                        <PptPlayer
                          key={`ppt-${currentLesson.id}-${selectedLessonMediaTab}`}
                          content={{
                            title: activeSubItem?.label || currentLesson.title,
                            fileUrl: activeItemData?.fileUrl || currentLesson.pptUrl || (currentLesson.type === 'ppt' ? currentLesson.fileUrl : '') || '',
                            pdfUrl: activeItemData?.pdfUrl || currentLesson.pptPdfUrl || (currentLesson.type === 'ppt' ? currentLesson.pdfUrl : '') || '',
                            fileName: activeItemData?.fileName || currentLesson.pptFileName || currentLesson.fileName || 'presentation.pptx',
                            slides: activeItemData?.slides || currentLesson.slides || [],
                            duration: activeItemData?.duration || currentLesson.duration || ''
                          }}
                          onComplete={handleSubItemOrLessonComplete}
                        />
                      ) : activeMediaType === 'pdf' ? (
                        <PdfPlayer
                          key={`pdf-${currentLesson.id}-${selectedLessonMediaTab}`}
                          content={{
                            title: activeSubItem?.label || currentLesson.title,
                            fileUrl: activeItemData?.fileUrl || currentLesson.pdfUrl || (currentLesson.type === 'pdf' ? currentLesson.fileUrl : '') || '',
                            fileName: activeItemData?.fileName || currentLesson.pdfFileName || currentLesson.fileName || 'document.pdf',
                            duration: activeItemData?.duration || currentLesson.duration || ''
                          }}
                          onComplete={handleSubItemOrLessonComplete}
                        />
                      ) : activeMediaType === 'text' ? (
                        <RichTextPlayer
                          key={`text-${currentLesson.id}-${selectedLessonMediaTab}`}
                          content={{
                            body: activeItemData?.body || lessonNotes || 'No written notes provided for this lesson.',
                            title: activeSubItem?.label || currentLesson.title
                          }}
                        />
                      ) : (
                        renderContentItem(currentLesson.type, currentLesson.content || currentLesson, currentLesson.title, handleSubItemOrLessonComplete, currentLesson)
                      )}
                    </div>
                  </div>

                  {/* Study Notes Card (only when lesson has notes alongside single video/slides without dedicated Notes step) */}
                  {showSeparateNotesCard && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                        <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Study Notes</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                        {lessonNotes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── MODULE QUIZ VIEW ─── */}
            {activeItem?.type === 'quiz' && (
              <div className={isFullscreenMode ? 'h-full w-full p-4' : 'max-w-4xl mx-auto py-2'}>
                <AssessmentPlayer
                  key={`modquiz-${activeItem.moduleId}-${activeItem.id}`}
                  moduleId={activeItem.moduleId}
                  courseId={courseId}
                  isFinal={false}
                  onPassed={handleModuleQuizPassed}
                  courseData={course}
                />
              </div>
            )}

            {/* ─── FINAL EXAM VIEW ─── */}
            {activeItem?.type === 'final' && (
              <div className={isFullscreenMode ? 'h-full w-full p-4' : 'max-w-4xl mx-auto py-2'}>
                <AssessmentPlayer
                  key={`final-${courseId}`}
                  courseId={courseId}
                  isFinal={true}
                  onPassed={handleFinalPassed}
                  courseData={course}
                />
              </div>
            )}

            {/* ─── COURSE COMPLETED & CERTIFICATE CELEBRATION VIEW ─── */}
            {activeItem?.type === 'complete' && (
              <div className="max-w-2xl mx-auto py-8">
                <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-10 shadow-md text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <Award className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-black uppercase tracking-wider">
                      ✓ 100% Course Completed
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Congratulations, {user?.fullName || user?.name || 'Graduate'}!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      You have completed all <span className="font-bold text-slate-900">{totalLessonsCount}</span> syllabus lessons and assessments for <span className="font-bold text-slate-900">{course.title}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Completion</span>
                      <span className="text-base font-black text-emerald-600">100%</span>
                    </div>
                    <div className="sm:border-x border-slate-200">
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Lessons</span>
                      <span className="text-base font-black text-slate-900">{completedLessonsCount}/{totalLessonsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] block">Certified On</span>
                      <span className="text-xs font-extrabold text-slate-900 block pt-0.5">
                        {(() => {
                          const rawTs = userCourseCertificate?.issuedAt || userCourseCertificate?.date || userCourseCertificate?.issueDate || userCourseCertificate?.created_at;
                          const d = rawTs ? new Date(rawTs) : new Date();
                          return isNaN(d.getTime())
                            ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {userCourseCertificate && (
                      <Button
                        type="button"
                        onClick={() => navigate(`/certificates/${userCourseCertificate.id}`)}
                        className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-2 cursor-pointer shadow-sm"
                      >
                        <Award className="h-4 w-4" />
                        <span>View Official Certificate 🎓</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/app/dashboard')}
                      className="w-full sm:w-auto h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      Back to My Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ─── UNIFIED PERSISTENT BOTTOM STEP NAVIGATION BAR ─────────────────── */}
          {!isFullscreenMode && (
            <div className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 z-20 shadow-2xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentStepIndex <= 0 && activeItem?.type !== 'complete'}
                onClick={loadPrevItem}
                className="h-9 px-3 sm:px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              {/* Step Context Pill */}
              {currentStepIndex !== -1 && learningSteps[currentStepIndex] && (
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-semibold truncate">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    Step {currentStepIndex + 1} / {learningSteps.length}
                  </span>
                  <span className="truncate max-w-xs">
                    {learningSteps[currentStepIndex].subLabel || learningSteps[currentStepIndex].title}
                  </span>
                </div>
              )}

              {/* Primary Contextual Next / Complete Action */}
              {(() => {
                if (activeItem?.type === 'complete') {
                  return (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate('/app/dashboard')}
                      className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <span>Done · Go to Dashboard</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  );
                }

                const currentStep = currentStepIndex !== -1 ? learningSteps[currentStepIndex] : null;
                const isLastStepInCourse = currentStepIndex !== -1 && currentStepIndex === learningSteps.length - 1;
                const isCurrentStepDone = isStepCompleted(currentStep);

                const lessonHasRealQuiz = Boolean(
                  (currentLesson?.questions && currentLesson.questions.length > 0) ||
                  (currentLesson?.assessment?.questions && currentLesson.assessment.questions.length > 0) ||
                  currentLesson?.items?.some((i) => i.type === 'quiz' && Array.isArray(i.questions) && i.questions.length > 0)
                );

                // For active unpassed quizzes/exams with questions, prompt taking the quiz
                if ((activeItem?.type === 'quiz' || activeItem?.type === 'final' || (activeItem?.type === 'lesson' && currentStep?.mediaType === 'quiz' && lessonHasRealQuiz)) && !isCurrentStepDone && !isAdmin) {
                  return (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0">
                      <span>Pass Quiz Above to Continue</span>
                    </div>
                  );
                }

                if (activeItem?.type === 'lesson' && currentLesson) {
                  const alreadyCertified = isCertificateUnlocked();
                  let btnText = 'Complete & Continue';
                  if (isCurrentStepDone) {
                    btnText = isLastStepInCourse && !hasRealFinalExam
                      ? (alreadyCertified ? 'View Completion & Certificate 🎓' : 'Finish Course & Claim Certificate 🎓')
                      : 'Next Step';
                  } else if (isLastStepInCourse && !hasRealFinalExam) {
                    btnText = alreadyCertified ? 'View Completion & Certificate 🎓' : 'Complete Course & Claim Certificate 🎓';
                  }

                  return (
                    <Button
                      type="button"
                      size="sm"
                      onClick={isCurrentStepDone ? loadNextItem : handleSubItemOrLessonComplete}
                      className={`h-9 px-3.5 sm:px-5 rounded-xl font-extrabold text-xs gap-1.5 cursor-pointer shadow-xs shrink-0 transition-all ${
                        isLastStepInCourse && !hasRealFinalExam
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : isCurrentStepDone
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{btnText}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Button>
                  );
                }

                return (
                  <Button
                    type="button"
                    size="sm"
                    onClick={loadNextItem}
                    className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs gap-1 cursor-pointer shadow-xs shrink-0"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                );
              })()}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CoursePlayer;
