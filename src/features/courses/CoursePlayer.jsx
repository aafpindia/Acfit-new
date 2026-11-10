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
  const { courses, enrollments, payments = [], progress, attempts, certificates, markLessonComplete, syncFromSupabase } = useLmsStore();

  // On mobile screens (< 1024px), sidebar defaults to closed so player content is immediately visible
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // { type: 'lesson' | 'quiz' | 'final', id, moduleId }
  const [selectedLessonMediaTab, setSelectedLessonMediaTab] = useState('video');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'checklist' | 'discussion' | 'resources'
  const [completedTasks, setCompletedTasks] = useState({});

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

  // Multi-Media tabs available in current lesson (Hook called unconditionally)
  const lessonMediaTabs = useMemo(() => {
    if (!currentLesson) return [];
    const tabs = [];

    const hasVideo = Boolean(
      currentLesson.videoUrl ||
      currentLesson.bunnyVideoId ||
      currentLesson.type === 'video' ||
      currentLesson.items?.some((i) => i.type === 'video')
    );
    if (hasVideo) {
      tabs.push({ id: 'video', label: 'Video Lecture', icon: Play, count: null });
    }

    const hasPpt = Boolean(
      currentLesson.pptUrl ||
      currentLesson.type === 'ppt' ||
      (currentLesson.fileUrl && (currentLesson.fileUrl.endsWith('.ppt') || currentLesson.fileUrl.endsWith('.pptx'))) ||
      currentLesson.items?.some((i) => i.type === 'ppt')
    );
    if (hasPpt) {
      tabs.push({ id: 'ppt', label: 'Presentation', icon: BookOpen, count: null });
    }

    const hasPdf = Boolean(
      currentLesson.pdfUrl ||
      currentLesson.type === 'pdf' ||
      (currentLesson.fileUrl && currentLesson.fileUrl.endsWith('.pdf')) ||
      currentLesson.items?.some((i) => i.type === 'pdf')
    );
    if (hasPdf) {
      tabs.push({ id: 'pdf', label: 'PDF Manual', icon: FileText, count: null });
    }

    const hasText = Boolean(
      (currentLesson.body && currentLesson.body.trim()) ||
      currentLesson.type === 'text' ||
      currentLesson.type === 'rich-text' ||
      currentLesson.items?.some((i) => i.type === 'text' || i.type === 'rich-text')
    );
    if (hasText) {
      tabs.push({ id: 'text', label: 'Study Notes', icon: FileText, count: null });
    }

    const quizQuestions = currentLesson.questions || currentLesson.assessment?.questions || currentLesson.items?.find((i) => i.type === 'quiz')?.questions || [];
    const hasQuiz = Boolean(
      quizQuestions.length > 0 ||
      currentLesson.assessment ||
      currentLesson.type === 'quiz' ||
      currentLesson.items?.some((i) => i.type === 'quiz')
    );
    if (hasQuiz) {
      tabs.push({
        id: 'quiz',
        label: 'Lesson Quiz',
        icon: Award,
        count: quizQuestions.length > 0 ? `${quizQuestions.length} Qs` : null
      });
    }

    return tabs;
  }, [currentLesson]);

  const isTabCompleted = (lessonId, tabId) => {
    if (!lessonId || !tabId) return false;
    if (userProgress[lessonId]) return true;
    return Boolean(completedLessonSubItems[lessonId]?.[tabId]);
  };

  const isTabUnlocked = (lessonId, tabId, tabIndex) => {
    if (!lessonId) return true;
    if (userProgress[lessonId]) return true;
    if (tabIndex === 0) return true;
    const prevTab = lessonMediaTabs[tabIndex - 1];
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
  const finalExamObj = course.finalAssessment || course.finalExam || { id: `fe-${course.id}`, title: 'Final Certification Exam' };

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
    const prevQuizPassed = !prevModule.assessment || isQuizPassed(prevModule.assessment.id);

    return prevLessonsComplete && prevQuizPassed;
  };

  const isFinalUnlocked = (extraLessonId = null) => {
    if (isAdmin) return true;
    if (!course?.modules || course.modules.length === 0) return true;
    
    const allLessons = course.modules.flatMap((m) => m.lessons || []);
    if (allLessons.length === 0) return true;

    const allCompleted = allLessons.every((l) => {
      if (extraLessonId && l.id === extraLessonId) return true;
      return Boolean(userProgress[l.id] || userProgress[l.id?.toString()]);
    });

    const extraCount = (extraLessonId && !userProgress[extraLessonId]) ? 1 : 0;
    const totalLessons = allLessons.length;
    const completedCount = Object.keys(userProgress).filter(k => userProgress[k]).length + extraCount;
    const countCompleted = totalLessons > 0 && completedCount >= totalLessons;

    return allCompleted || countCompleted;
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

  const isCertificateUnlocked = () => {
    return userAttempts.some((a) => a.moduleId === null && a.passed);
  };

  const totalLessonsCount = course.modules?.flatMap((m) => m.lessons || []).length || 0;
  const completedLessonsCount = Object.keys(userProgress).filter(k => userProgress[k]).length;
  const overallProgressPercentage = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  const handleMarkComplete = () => {
    if (activeItem?.type === 'lesson') {
      const currentLessonId = activeItem.id;
      markLessonComplete(courseId, currentLessonId, user.id);
      success('Lesson marked complete!');
      loadNextItem(currentLessonId);
    }
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

    // If there is another sub-item in this lesson, advance to it
    if (currentTabIndex < lessonMediaTabs.length - 1) {
      const nextTab = lessonMediaTabs[currentTabIndex + 1];
      setSelectedLessonMediaTab(nextTab.id);
      success(`✓ ${lessonMediaTabs[currentTabIndex].label} completed! Next: ${nextTab.label}`);
    } else {
      // Last sub-item in this lesson -> complete the entire lesson!
      handleMarkComplete();
    }
  };

  const handleFinalPassed = () => {
    const cert = certificates.find(c => c.courseId === courseId && (c.userId === user?.id || !c.userId)) || certificates[certificates.length - 1];
    if (cert) {
      navigate(`/certificates/${cert.id}`);
    } else {
      success('Congratulations! Official Certificate is available in your sidebar.');
    }
  };

  const getAllSyllabusItems = () => {
    const items = [];
    (course.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((l) => {
        items.push({ type: 'lesson', id: l.id, moduleId: mod.id, title: l.title });
      });
      if (mod.assessment && (mod.assessment.title || (mod.assessment.questions && mod.assessment.questions.length > 0))) {
        items.push({ type: 'quiz', id: mod.assessment.id, moduleId: mod.id, title: mod.assessment.title });
      }
    });
    return items;
  };

  const loadNextItem = (justCompletedLessonId = null) => {
    const allItems = getAllSyllabusItems();
    const currentIndex = allItems.findIndex(
      (item) => item.type === activeItem?.type && item.id === activeItem?.id
    );

    if (currentIndex !== -1 && currentIndex < allItems.length - 1) {
      setActiveItem(allItems[currentIndex + 1]);
    } else {
      if (isFinalUnlocked(justCompletedLessonId) && finalExamObj) {
        setActiveItem({ type: 'final', id: finalExamObj.id });
        success('🎉 All syllabus lessons completed! Opening Final Certification Exam now...');
      } else {
        const uncompleted = findFirstUncompletedLesson();
        if (uncompleted && uncompleted.id !== justCompletedLessonId) {
          setActiveItem(uncompleted);
        }
      }
    }
  };

  const loadPrevItem = () => {
    const allItems = getAllSyllabusItems();
    if (activeItem?.type === 'final') {
      if (allItems.length > 0) {
        setActiveItem(allItems[allItems.length - 1]);
      }
      return;
    }

    const currentIndex = allItems.findIndex(
      (item) => item.type === activeItem?.type && item.id === activeItem?.id
    );

    if (currentIndex > 0) {
      setActiveItem(allItems[currentIndex - 1]);
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
      
      {/* ─── STICKY FULL SCREEN LEARNING STUDIO HEADER BAR ─────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-xs select-none gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs h-9 px-2.5 sm:px-3.5 gap-1.5 cursor-pointer shadow-2xs shrink-0"
            leftIcon={<ArrowLeft className="h-4 w-4 text-slate-600 shrink-0" />}
          >
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-9 px-2.5 sm:px-3 rounded-xl border transition-colors focus:outline-none shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              sidebarOpen
                ? 'bg-[#EFF6FF] border-[#2563EB]/40 text-[#2563EB]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Course Syllabus"
          >
            <Menu className="h-4 w-4" />
            <span className="text-xs font-extrabold">Syllabus</span>
          </button>

          <div className="hidden lg:flex items-center gap-2.5 border-l border-slate-200 pl-3 truncate">
            <h1 className="font-extrabold text-sm text-slate-900 truncate max-w-xs xl:max-w-md">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Header Right Actions & Quick Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Progress Pill Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-sans text-xs font-bold">
            <span className="text-slate-600">{completedLessonsCount}/{totalLessonsCount} Lessons</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 font-extrabold">{overallProgressPercentage}%</span>
          </div>

          {/* Full Screen Mode & Sequential Prev/Next Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFullscreenMode(!isFullscreenMode);
                if (!isFullscreenMode) setSidebarOpen(false);
              }}
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                isFullscreenMode
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 shadow-2xs'
              }`}
              title={isFullscreenMode ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreenMode ? (
                <>
                  <Minimize className="h-4 w-4 text-rose-600" />
                  <span className="hidden md:inline">Exit</span>
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4 text-[#2563EB]" />
                  <span className="hidden md:inline">Full Screen</span>
                </>
              )}
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadPrevItem}
              className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs gap-1 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden md:inline">Prev</span>
            </Button>
            <Button
              size="sm"
              onClick={loadNextItem}
              className="h-9 px-3 sm:px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs gap-1 cursor-pointer shadow-xs"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── MAIN PLAYER BODY LAYOUT (CATALOG SIDEBAR + CONTENT CANVAS) ────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 relative overflow-hidden">
        
        {/* Mobile Backdrop for Syllabus Overlay */}
        {sidebarOpen && !isFullscreenMode && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          />
        )}

        {/* LEFT COURSE CATALOG SYLLABUS SIDEBAR: Responsive drawer on mobile, inline panel on lg */}
        <aside
          className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out h-full select-none ${
            isFullscreenMode ? 'hidden' : ''
          } ${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm shadow-2xl lg:shadow-none lg:static lg:w-88 lg:z-20'
              : 'hidden lg:flex lg:w-0 lg:overflow-hidden lg:border-none'
          }`}
        >
          {/* Syllabus Progress Card with mobile close button */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between font-sans text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Layers className="h-4 w-4 text-[#2563EB]" />
                <span className="font-extrabold">Syllabus Completion</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[#2563EB] font-black">{overallProgressPercentage}%</span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Close Syllabus"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
            
            <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-sans text-[10px] text-slate-500 font-semibold">
              <span>{completedLessonsCount} of {totalLessonsCount} Items Completed</span>
              <span className="text-emerald-600 font-bold">
                {overallProgressPercentage === 100 ? '● COMPLETE' : 'IN PROGRESS'}
              </span>
            </div>
          </div>

          {/* Modules Accordion List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
            {course.modules?.map((mod, modIdx) => {
              const unlocked = isModuleUnlocked(modIdx);
              const modLessons = mod.lessons || [];
              const modCompletedCount = modLessons.filter(l => Boolean(userProgress[l.id])).length;
              
              return (
                <div key={mod.id} className={`space-y-2 ${!unlocked ? 'opacity-65' : ''}`}>
                  
                  {/* Module Header Pill */}
                  <div
                    onClick={() => {
                      if (!unlocked) {
                        error(`Module ${modIdx + 1} is locked. Complete all lessons in Module ${modIdx} first.`);
                      }
                    }}
                    className="flex items-center justify-between px-2 py-1 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        MODULE 0{modIdx + 1}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        • {modCompletedCount}/{modLessons.length}
                      </span>
                    </div>
                    {!unlocked && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>

                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug px-2 line-clamp-1">
                    {mod.title}
                  </h4>
                  
                  {/* Lessons List */}
                  <div className="space-y-1 pt-1">
                    {modLessons.map((les) => {
                      const active = activeItem?.type === 'lesson' && activeItem.id === les.id;
                      const complete = Boolean(userProgress[les.id]);
                      const LesIcon = les.assessment ? Award : getLessonIcon(les.type);

                      return (
                        <button
                          key={les.id}
                          onClick={() => {
                            if (!unlocked) {
                              error(`Module ${modIdx + 1} is locked. Complete previous modules first.`);
                              return;
                            }
                            selectItem({ type: 'lesson', id: les.id, moduleId: mod.id });
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer border text-left transition-all duration-200 group ${
                            active
                              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-[#2563EB]/20 scale-[1.01]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#2563EB]'
                            }`}>
                              <LesIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate leading-tight font-bold">{les.title}</span>
                          </div>

                          {complete ? (
                            <CheckCircle className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-emerald-500'}`} />
                          ) : (
                            <span className={`font-mono text-[9px] ${active ? 'text-white/80' : 'text-slate-400'}`}>
                              {les.duration || '10m'}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Module Assessment Trigger */}
                    {mod.assessment && (
                      <button
                        onClick={() => {
                          if (!unlocked) {
                            error(`Module ${modIdx + 1} is locked. Complete previous modules first.`);
                            return;
                          }
                          selectItem({ type: 'quiz', id: mod.assessment.id, moduleId: mod.id });
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer border text-left transition-all ${
                          activeItem?.type === 'quiz' && activeItem.id === mod.assessment.id
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md'
                            : 'bg-amber-50 border-amber-200/80 text-amber-900 hover:bg-amber-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 shrink-0 text-amber-500" />
                          <span>Module Assessment</span>
                        </div>
                        {isQuizPassed(mod.assessment.id) && (
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Final Exam Access Section */}
            {finalExamObj && (
              <div className={`pt-4 border-t border-slate-200 space-y-2 ${!isFinalUnlocked() ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between px-2 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>CERTIFICATION EXAM</span>
                  {!isFinalUnlocked() && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                </div>

                <button
                  onClick={() => {
                    if (!isFinalUnlocked()) {
                      const remaining = totalLessonsCount - completedLessonsCount;
                      error(`Certificate Exam Locked: Complete all ${totalLessonsCount} lessons first to unlock (${remaining} remaining).`);
                      return;
                    }
                    selectItem({ type: 'final', id: finalExamObj.id });
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold border cursor-pointer text-left transition-all ${
                    activeItem?.type === 'final'
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md'
                      : isFinalUnlocked()
                      ? 'bg-amber-50 border-amber-200/80 text-amber-900 hover:bg-amber-100/80'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                    <span>{finalExamObj.title || 'Final Certification Exam'}</span>
                  </div>
                  {isQuizPassed(finalExamObj.id) ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : !isFinalUnlocked() ? (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : null}
                </button>

                {/* View Certificate Link */}
                {isCertificateUnlocked() && (
                  <Link
                    to={`/certificates/${(certificates.find(c => c.courseId === courseId && (c.userId === user?.id || !c.userId)) || certificates[certificates.length - 1])?.id}`}
                    className="block w-full p-3 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 text-center hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                  >
                    View Official Certificate 🎓
                  </Link>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PLAYER VIEWER CANVAS (FULL SCREEN CAPABLE) */}
        <main className={`flex-1 overflow-y-auto w-full font-sans transition-all duration-300 ${
          isFullscreenMode ? 'p-0 bg-slate-950 flex flex-col h-full min-h-0' : 'p-4 sm:p-6 lg:p-8 space-y-6 pb-24 bg-[#F8FAFC]'
        }`}>
          
          {/* Active Lesson View */}
          {activeItem?.type === 'lesson' && currentLesson && (
            <div className={isFullscreenMode ? 'h-full flex flex-col justify-between space-y-0 w-full' : 'space-y-6 max-w-5xl mx-auto'}>
              
              {/* Lesson Title Header Card */}
              <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isFullscreenMode ? 'hidden' : ''
              }`}>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-mono text-[9px] font-extrabold uppercase tracking-wider">
                      ● {currentLesson.type?.toUpperCase() || 'LESSON'}
                    </span>
                    {currentModule && (
                      <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[220px] sm:max-w-none">
                        [ MODULE: {currentModule.title} ]
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {currentLesson.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {currentLesson.duration && (
                    <div className="px-2.5 py-1.5 bg-slate-100 rounded-xl font-mono text-xs font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{currentLesson.duration}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsFullscreenMode(!isFullscreenMode)}
                    className="h-9 sm:h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Toggle Full Screen"
                  >
                    <Maximize className="h-4 w-4 text-[#2563EB]" />
                    <span className="hidden sm:inline">Full Screen</span>
                  </button>

                  {(() => {
                    const currentTabIndex = lessonMediaTabs.findIndex((t) => t.id === selectedLessonMediaTab);
                    const isMulti = lessonMediaTabs.length > 1;
                    const isLessonDone = Boolean(userProgress[currentLesson.id]);
                    const isCurrentTabDone = isTabCompleted(currentLesson.id, selectedLessonMediaTab);
                    const isLastTab = currentTabIndex === lessonMediaTabs.length - 1;

                    let btnText = isLessonDone ? 'Completed ✓' : 'Mark Complete & Next';
                    if (!isLessonDone && isMulti) {
                      if (!isLastTab) {
                        btnText = isCurrentTabDone ? 'Next Material →' : 'Complete & Next Material →';
                      } else {
                        btnText = 'Complete Lesson & Next →';
                      }
                    }

                    return (
                      <Button
                        type="button"
                        onClick={isMulti ? handleSubItemOrLessonComplete : handleMarkComplete}
                        className={`rounded-xl text-xs font-bold h-9 sm:h-10 px-3.5 sm:px-4 gap-1.5 sm:gap-2 cursor-pointer transition-all ${
                          isLessonDone
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs font-extrabold'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{btnText}</span>
                      </Button>
                    );
                  })()}
                </div>
              </div>

              {/* ─── MULTIMEDIA SWITCHER TABS (Sequential one-by-one completion) ─── */}
              {lessonMediaTabs.length > 1 && (
                <div className={`p-1.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-md flex items-center gap-2 overflow-x-auto ${
                  isFullscreenMode ? 'm-3' : ''
                }`}>
                  {lessonMediaTabs.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = selectedLessonMediaTab === tab.id;
                    const isDone = isTabCompleted(currentLesson.id, tab.id);
                    const isUnlocked = isTabUnlocked(currentLesson.id, tab.id, idx);

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (!isUnlocked) {
                            error('Please complete the previous material first to unlock this step.');
                            return;
                          }
                          setSelectedLessonMediaTab(tab.id);
                        }}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isActive
                            ? 'bg-[#2563EB] text-white shadow-sm cursor-pointer'
                            : isDone
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 cursor-pointer'
                            : isUnlocked
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer'
                            : 'text-slate-500 bg-slate-900/50 opacity-60 cursor-not-allowed'
                        }`}
                        title={!isUnlocked ? 'Complete previous material to unlock' : tab.label}
                      >
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : !isUnlocked ? (
                          <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        ) : (
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{tab.label}</span>
                        {isDone && (
                          <span className="text-[10px] font-mono text-emerald-400">✓</span>
                        )}
                        {tab.count && !isDone && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Content Player View Frame (Full Screen Capable) */}
              {(() => {
                const lessonItems = Array.isArray(currentLesson.items) ? currentLesson.items : [];
                const videoItem = lessonItems.find((i) => i.type === 'video');
                const pptItem = lessonItems.find((i) => i.type === 'ppt');
                const pdfItem = lessonItems.find((i) => i.type === 'pdf');
                const textItem = lessonItems.find((i) => i.type === 'text' || i.type === 'rich-text');
                const lessonNotes = currentLesson.body || textItem?.body || currentLesson.notes || currentLesson.content || '';

                return (
                  <>
                    <div className={`transition-all duration-300 ${
                      isFullscreenMode
                        ? 'flex-1 w-full bg-black p-0 relative overflow-y-auto flex flex-col justify-center'
                        : 'rounded-2xl bg-black border border-slate-800/80 shadow-2xl overflow-hidden relative'
                    }`}>
                      <div className={isFullscreenMode ? 'w-full h-full min-h-0 bg-black flex flex-col justify-center' : 'bg-black rounded-2xl overflow-hidden'}>
                        {selectedLessonMediaTab === 'quiz' ? (
                          <AssessmentPlayer
                            moduleId={activeItem.moduleId}
                            courseId={courseId}
                            isFinal={false}
                            onPassed={handleSubItemOrLessonComplete}
                            lessonId={currentLesson.id}
                          />
                        ) : selectedLessonMediaTab === 'video' ? (
                          <VideoPlayer
                            content={{
                              videoUrl: currentLesson.videoUrl || videoItem?.videoUrl || (currentLesson.type === 'video' ? currentLesson.fileUrl : '') || '',
                              bunnyVideoId: currentLesson.bunnyVideoId || videoItem?.bunnyVideoId || '',
                              title: currentLesson.title
                            }}
                            onComplete={handleSubItemOrLessonComplete}
                          />
                        ) : selectedLessonMediaTab === 'ppt' ? (
                          <div className="space-y-3">
                            <PptPlayer
                              content={{
                                title: currentLesson.title,
                                fileUrl: currentLesson.pptUrl || pptItem?.fileUrl || (currentLesson.type === 'ppt' ? currentLesson.fileUrl : '') || '',
                                pdfUrl: currentLesson.pptPdfUrl || pptItem?.pdfUrl || (currentLesson.type === 'ppt' ? currentLesson.pdfUrl : '') || '',
                                fileName: currentLesson.pptFileName || pptItem?.fileName || currentLesson.fileName || 'presentation.pptx',
                                slides: currentLesson.slides || pptItem?.slides || [],
                                duration: currentLesson.duration || pptItem?.duration || ''
                              }}
                              onComplete={handleSubItemOrLessonComplete}
                            />
                            {lessonMediaTabs.length > 1 && !isFullscreenMode && (
                              <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">Finished reviewing this presentation?</span>
                                <Button
                                  type="button"
                                  onClick={handleSubItemOrLessonComplete}
                                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold h-8 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>{lessonMediaTabs.findIndex(t => t.id === 'ppt') === lessonMediaTabs.length - 1 ? 'Complete Lesson & Next →' : 'Complete & Next Material →'}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : selectedLessonMediaTab === 'pdf' ? (
                          <div className="space-y-3">
                            <PdfPlayer
                              content={{
                                title: currentLesson.title,
                                fileUrl: currentLesson.pdfUrl || pdfItem?.fileUrl || (currentLesson.type === 'pdf' ? currentLesson.fileUrl : '') || '',
                                fileName: currentLesson.pdfFileName || pdfItem?.fileName || currentLesson.fileName || 'document.pdf',
                                duration: currentLesson.duration || pdfItem?.duration || ''
                              }}
                              onComplete={handleSubItemOrLessonComplete}
                            />
                            {lessonMediaTabs.length > 1 && !isFullscreenMode && (
                              <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">Finished reading this document?</span>
                                <Button
                                  type="button"
                                  onClick={handleSubItemOrLessonComplete}
                                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold h-8 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>{lessonMediaTabs.findIndex(t => t.id === 'pdf') === lessonMediaTabs.length - 1 ? 'Complete Lesson & Next →' : 'Complete & Next Material →'}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : selectedLessonMediaTab === 'text' ? (
                          <div className="p-6 sm:p-8 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap font-sans text-sm">
                            <p>{lessonNotes || 'No written notes provided for this lesson.'}</p>
                            {lessonMediaTabs.length > 1 && (
                              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
                                <Button
                                  type="button"
                                  onClick={handleSubItemOrLessonComplete}
                                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold h-9 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <span>{lessonMediaTabs.findIndex(t => t.id === 'text') === lessonMediaTabs.length - 1 ? 'Complete Lesson & Next →' : 'Complete Notes & Next Material →'}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          renderContentItem(currentLesson.type, currentLesson.content || currentLesson, currentLesson.title, handleSubItemOrLessonComplete, currentLesson)
                        )}
                      </div>
                    </div>

                    {/* Study Notes & Key Takeaways Card (Visible below video/slides if notes are provided) */}
                    {lessonNotes && lessonNotes.trim() && selectedLessonMediaTab !== 'text' && !isFullscreenMode && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2.5">
                          <FileText className="h-4 w-4 text-[#2563EB]" />
                          <span>Lesson Study Notes & Key Concepts</span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                          {lessonNotes}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

            </div>
          )}

          {/* Module Quiz View in Player Canvas */}
          {activeItem?.type === 'quiz' && (
            <div className={isFullscreenMode ? 'h-full w-full' : 'max-w-4xl mx-auto'}>
              <AssessmentPlayer
                moduleId={activeItem.moduleId}
                courseId={courseId}
                isFinal={false}
                onPassed={handleMarkComplete}
              />
            </div>
          )}

          {/* Final Exam View in Player Canvas */}
          {activeItem?.type === 'final' && (
            <div className={isFullscreenMode ? 'h-full w-full' : 'max-w-4xl mx-auto'}>
              <AssessmentPlayer
                courseId={courseId}
                isFinal={true}
                onPassed={handleFinalPassed}
              />
            </div>
          )}
        </main>
      </div>

      {/* ─── MOBILE STICKY BOTTOM QUICK ACTION DOCK ─────────────────── */}
      {!isFullscreenMode && (
        <div className="md:hidden shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-2 z-30 shadow-lg">
          <button
            type="button"
            onClick={loadPrevItem}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          {activeItem?.type === 'lesson' && currentLesson && (() => {
            const currentTabIndex = lessonMediaTabs.findIndex((t) => t.id === selectedLessonMediaTab);
            const isMulti = lessonMediaTabs.length > 1;
            const isLessonDone = Boolean(userProgress[currentLesson.id]);
            const isCurrentTabDone = isTabCompleted(currentLesson.id, selectedLessonMediaTab);
            const isLastTab = currentTabIndex === lessonMediaTabs.length - 1;

            let btnText = isLessonDone ? 'Completed ✓' : 'Mark Complete';
            if (!isLessonDone && isMulti) {
              btnText = !isLastTab
                ? (isCurrentTabDone ? 'Next Material →' : 'Complete & Next →')
                : 'Complete Lesson & Next →';
            }

            return (
              <button
                type="button"
                onClick={isMulti ? handleSubItemOrLessonComplete : handleMarkComplete}
                className={`h-9 px-3 flex-1 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer truncate transition-all ${
                  isLessonDone
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{btnText}</span>
              </button>
            );
          })()}

          <button
            type="button"
            onClick={loadNextItem}
            className="h-9 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
};

export default CoursePlayer;
