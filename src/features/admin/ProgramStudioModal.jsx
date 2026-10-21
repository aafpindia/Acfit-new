import React, { useState, useEffect, useMemo } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import {
  Layers,
  Eye,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  MoveUp,
  MoveDown,
  ArrowLeft,
  BookMarked,
  Users,
  Video,
  Type,
  HelpCircle,
  FileText,
  Presentation,
  ChevronDown,
  ChevronRight,
  Globe,
  Upload,
  Play,
  X,
  Star,
  FileCode,
  Image as ImageIcon,
  Grid,
  Check,
  MoreHorizontal,
  Info,
  Link2,
  FileUp,
  Award,
  BookOpen,
  MessageSquare,
  BarChart2,
  Download,
  CheckCircle2,
  ArrowRight,
  Clock,
  Settings
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown';
import { StudentCoursePlayerPreviewModal } from './StudentCoursePlayerPreviewModal';
import { VideoPlayer } from '../courses/players/VideoPlayer';
import { processBunnyVideoWorkflow, getHlsUrl } from '../../services/bunnyService';

const DEFAULT_COVER_PRESETS = [];

const DEFAULT_CATEGORIES = [
  'Strength & Conditioning',
  'Cardio & HIIT',
  'Yoga & Wellness',
  'Nutrition & Diet',
  'General'
];

// Content Types with explicit icons requested by user
const LESSON_CONTENT_TYPES = [
  { id: 'video', title: 'Video', desc: 'Video lecture & BunnyStream upload', icon: Video, color: 'text-orange-500 bg-orange-50' },
  { id: 'ppt', title: 'PPT', desc: 'Presentation & slide upload', icon: Presentation, color: 'text-blue-600 bg-blue-50' },
  { id: 'pdf', title: 'PDF', desc: 'PDF manual & document upload', icon: FileText, color: 'text-rose-600 bg-rose-50' },
  { id: 'text', title: 'Text', desc: 'Written text & file import', icon: Type, color: 'text-amber-500 bg-amber-50' },
  { id: 'quiz', title: 'Quiz', desc: 'Interactive assessment & questions', icon: HelpCircle, color: 'text-cyan-500 bg-cyan-50' }
];

export const ProgramStudioModal = ({
  isOpen,
  onClose,
  courseId = null,
  initialStep = 1,
  initialTab = null,
  onSaveSuccess = () => {}
}) => {
  const { success, error } = useToast();
  const { courses, categories: storeCategories, createCourse, updateCourse, syncFromSupabase, enrollments } = useLmsStore();

  // Navigation Tabs matching Zoho Learn subheader
  const [activeTab, setActiveTab] = useState(initialTab || (initialStep === 2 ? 'MODULE' : 'OVERVIEW')); // 'OVERVIEW' | 'MODULE' | 'FINAL_EXAM'
  const [isPreviewPlayerOpen, setIsPreviewPlayerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (initialStep === 1) {
        setActiveTab('OVERVIEW');
      } else if (initialStep === 2) {
        setActiveTab('MODULE');
      }
    }
  }, [isOpen, initialStep, initialTab]);

  // Category Selection State
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');

  useEffect(() => {
    if (courses && courses.length > 0) {
      const existingCategories = courses.map((c) => c.category).filter(Boolean);
      setCategoriesList((prev) => Array.from(new Set([...prev, ...existingCategories])));
    }
  }, [courses]);

  const handleAddCustomCategory = () => {
    if (!newCategoryText.trim()) return;
    const catName = newCategoryText.trim();
    if (!categoriesList.includes(catName)) {
      setCategoriesList((prev) => [...prev, catName]);
    }
    setFormData((prev) => ({ ...prev, category: catName }));
    setNewCategoryText('');
    setIsAddingNewCategory(false);
    success(`Category "${catName}" added!`);
  };

  // Form State
  const existingCourse = useMemo(() => {
    return courses.find((c) => c.id === courseId) || null;
  }, [courses, courseId]);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    code: '',
    description: '',
    instructor: '',
    price: '',
    published: false,
    difficulty: '',
    thumbnail: '',
    modules: [], // Starts EMPTY for new courses!
    finalExam: {
      title: '',
      passingPercentage: '',
      timerSeconds: '',
      questions: []
    }
  });

  // Populate data when editing existing course vs start empty when adding new course
  useEffect(() => {
    if (isOpen) {
      if (existingCourse) {
        const loadedExam = existingCourse.finalExam || existingCourse.finalAssessment || {
          id: `fe-${existingCourse.id || Date.now()}`,
          title: '',
          passingPercentage: '',
          timerSeconds: '',
          questions: []
        };

        setFormData({
          title: existingCourse.title || '',
          category: existingCourse.category || '',
          code: existingCourse.code || '',
          description: existingCourse.description || '',
          instructor: existingCourse.instructor || '',
          price: existingCourse.price !== undefined ? existingCourse.price : '',
          published: Boolean(existingCourse.published),
          difficulty: existingCourse.difficulty || '',
          thumbnail: existingCourse.thumbnail || '',
          modules: existingCourse.modules || [],
          finalExam: loadedExam,
          finalAssessment: loadedExam
        });
      } else {
        // EMPTY START FOR NEW COURSE CREATION - all fields empty so only placeholders show
        const defaultExam = {
          id: `fe-${Date.now()}`,
          title: '',
          passingPercentage: '',
          timerSeconds: '',
          questions: []
        };

        setFormData({
          title: '',
          category: '',
          code: '',
          description: '',
          instructor: '',
          price: '',
          published: false,
          difficulty: '',
          thumbnail: '',
          modules: [],
          finalExam: defaultExam,
          finalAssessment: defaultExam
        });
      }
    }
  }, [existingCourse, courseId, isOpen]);

  // Editing Module Title State
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterTitleInput, setChapterTitleInput] = useState('');

  const handleRenameChapter = (moduleId, newTitle) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.id === moduleId ? { ...m, title: newTitle } : m))
    }));
    setEditingChapterId(null);
  };

  // Editing Content Item Modal State
  const [editingContentItem, setEditingContentItem] = useState(null);
  const [contentFormData, setContentFormData] = useState({
    title: '',
    body: '',
    videoUrl: '',
    bunnyVideoId: '',
    fileUrl: '',
    passingPercentage: 70,
    timerMinutes: 10,
    feedbackText: '',
    questions: []
  });
  const [bunnyProgress, setBunnyProgress] = useState(null);

  const totalLessons = useMemo(() => {
    return formData.modules.reduce((acc, mod) => acc + (mod.lessons ? mod.lessons.length : 0), 0);
  }, [formData.modules]);

  // ----------------------------------------------------
  // MODULE HANDLERS
  // ----------------------------------------------------
  const handleAddModule = () => {
    const newChapNum = formData.modules.length + 1;
    const newModule = {
      id: `mod-${Date.now()}`,
      title: `Module ${newChapNum}: Section Name`,
      duration: '15 Mins',
      order: newChapNum,
      lessons: []
    };
    setFormData((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    success(`Module ${newChapNum} added`);
  };

  const handleDeleteModule = (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((m) => m.id !== moduleId)
    }));
    success('Module removed');
  };

  // ----------------------------------------------------
  // LESSON HANDLERS
  // ----------------------------------------------------
  const handleAddLessonWithType = (moduleId, contentTypeId) => {
    const targetModule = formData.modules.find((m) => m.id === moduleId) || formData.modules[0];
    if (!targetModule) return;

    const lesNum = (targetModule.lessons || []).length + 1;
    const contentTypeObj = LESSON_CONTENT_TYPES.find((t) => t.id === contentTypeId) || LESSON_CONTENT_TYPES[0];

    const newLesson = {
      id: `les-${Date.now()}`,
      title: `${contentTypeObj.title} Lesson ${lesNum}`,
      type: contentTypeId,
      duration: '',
      commentsCount: 0,
      items: [
        {
          id: `ci-${Date.now()}`,
          type: contentTypeId,
          title: `${contentTypeObj.title} Content`
        }
      ]
    };

    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id === targetModule.id) {
          return { ...m, lessons: [...(m.lessons || []), newLesson] };
        }
        return m;
      })
    }));

    // Open detail editor for the lesson
    setEditingContentItem({
      isNew: true,
      type: contentTypeId,
      moduleId: targetModule.id,
      lessonId: newLesson.id,
      itemId: newLesson.items[0].id
    });
    setContentFormData({
      title: '',
      body: '',
      videoUrl: '',
      bunnyVideoId: '',
      fileUrl: '',
      passingPercentage: '',
      timerMinutes: '',
      feedbackText: '',
      questions: contentTypeId === 'quiz' ? [
        {
          id: `q-${Date.now()}`,
          format: 'single-choice',
          text: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          correctAnswerText: '',
          modelSolution: ''
        }
      ] : []
    });
  };

  const handleEditLesson = (moduleId, lessonId) => {
    const targetModule = formData.modules.find((m) => m.id === moduleId);
    const targetLesson = targetModule?.lessons?.find((l) => l.id === lessonId);
    const item = targetLesson?.items?.[0] || null;

    setEditingContentItem({
      isNew: !item,
      type: targetLesson?.type || item?.type || 'video',
      moduleId: moduleId,
      lessonId: lessonId,
      itemId: item?.id
    });

    const rawQuestions = item?.questions || targetLesson?.assessment?.questions || targetLesson?.questions || [];
    const normalizedQuestions = (rawQuestions || []).map((q, idx) => {
      const opts = (q.options || []).map((o) => {
        if (typeof o === 'object' && o !== null) {
          return o.text !== undefined && o.text !== null ? String(o.text) : '';
        }
        return String(o ?? '');
      });
      let correctIdx = q.correctIndex;
      if (correctIdx === undefined && Array.isArray(q.options)) {
        const found = q.options.findIndex(o => typeof o === 'object' && o?.isCorrect);
        if (found !== -1) correctIdx = found;
      }
      return {
        id: q.id || `q-${idx}`,
        format: q.format || (q.type === 'multi-mcq' ? 'multiple-choice' : (q.type === 'fill-in-blank' ? 'fill-in-blank' : (q.type === 'descriptive' ? 'descriptive' : 'single-choice'))),
        text: q.text || q.question || '',
        question: q.text || q.question || '',
        options: opts.length > 0 ? opts : ['', '', '', ''],
        correctIndex: correctIdx !== undefined ? correctIdx : 0,
        correctAnswerText: q.correctAnswerText || '',
        modelSolution: q.modelSolution || q.explanation || ''
      };
    });

    setContentFormData({
      title: targetLesson?.title || item?.title || '',
      body: item?.body || targetLesson?.body || '',
      videoUrl: item?.videoUrl || targetLesson?.videoUrl || '',
      bunnyVideoId: item?.bunnyVideoId || targetLesson?.bunnyVideoId || '',
      fileUrl: item?.fileUrl || targetLesson?.fileUrl || '',
      passingPercentage: item?.passingPercentage !== undefined ? item.passingPercentage : (targetLesson?.passingPercentage !== undefined ? targetLesson.passingPercentage : ''),
      timerMinutes: item?.timerMinutes !== undefined ? item.timerMinutes : (targetLesson?.timerMinutes !== undefined ? targetLesson.timerMinutes : ''),
      feedbackText: item?.feedbackText || targetLesson?.feedbackText || '',
      questions: normalizedQuestions
    });
  };

  const handleDeleteLesson = (moduleId, lessonId) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
        }
        return m;
      })
    }));
    success('Lesson removed');
  };

  const handleMoveLesson = (moduleId, lessonId, direction) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id !== moduleId) return m;
        const index = m.lessons.findIndex((l) => l.id === lessonId);
        if (index === -1) return m;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= m.lessons.length) return m;

        const newLessons = [...m.lessons];
        const [movedLesson] = newLessons.splice(index, 1);
        newLessons.splice(newIndex, 0, movedLesson);

        return { ...m, lessons: newLessons };
      })
    }));
  };

  // ----------------------------------------------------
  // VIDEO (BUNNYSTREAM), PPT & TEXT FILE UPLOAD HANDLERS
  // ----------------------------------------------------
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local blob preview
    const blobUrl = URL.createObjectURL(file);
    setContentFormData((prev) => ({ ...prev, _blobPreview: blobUrl }));

    // Dynamically calculate and store true video duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = blobUrl;
    tempVideo.onloadedmetadata = () => {
      const sec = Math.round(tempVideo.duration);
      if (sec > 0) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const durStr = `${m}:${s < 10 ? '0' : ''}${s}`;
        setContentFormData((prev) => ({ ...prev, duration: durStr }));
        if (activeLesson) {
          setFormData((prev) => ({
            ...prev,
            modules: prev.modules.map((mod) => ({
              ...mod,
              lessons: mod.lessons.map((les) =>
                les.id === activeLesson.id ? { ...les, duration: durStr } : les
              )
            }))
          }));
        }
      }
    };

    setBunnyProgress({ step: 1, message: 'Preparing video upload...', pct: 5 });
    try {
      const res = await processBunnyVideoWorkflow(file, contentFormData.title || file.name, (p) => setBunnyProgress(p));
      if (res.success && res.data) {
        // Store HLS stream URL for production
        const hlsUrl = res.data.hlsUrl || getHlsUrl(res.data.videoId) || '';
        setContentFormData((prev) => ({
          ...prev,
          bunnyVideoId: res.data.videoId,
          videoUrl: hlsUrl,
          hlsUrl,
          // Keep _blobPreview active for immediate zero-lag playback in studio
        }));
        success('Video uploaded! Stream ready.');
      } else {
        error(res?.error || 'BunnyStream upload failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      error(err?.message || 'Video upload error.');
    } finally {
      setTimeout(() => setBunnyProgress(null), 1500);
    }
  };

  const handlePptFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setContentFormData((prev) => ({
        ...prev,
        fileUrl: dataUrl,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
      success(`Presentation / Document file "${file.name}" attached!`);
    };
    reader.onerror = () => {
      error('Could not read presentation file.');
    };
    reader.readAsDataURL(file);
  };

  const handleTextFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setContentFormData((prev) => ({
        ...prev,
        body: text,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '')
      }));
      success(`Text from "${file.name}" imported!`);
    };
    reader.readAsText(file);
  };

  // ----------------------------------------------------
  // QUIZ QUESTION BUILDER HANDLERS
  // ----------------------------------------------------
  const handleQuestionTextChange = (qIdx, text) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => (idx === qIdx ? { ...q, text, question: text } : q))
    }));
  };

  const handleOptionChange = (qIdx, oIdx, text) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => {
        if (idx !== qIdx) return q;
        const updated = [...(q.options || [])];
        const existing = updated[oIdx];
        if (typeof existing === 'object' && existing !== null) {
          updated[oIdx] = { ...existing, text };
        } else {
          updated[oIdx] = text;
        }
        return { ...q, options: updated };
      })
    }));
  };
  const handleOptionTextChange = handleOptionChange;

  const handleCorrectIndexChange = (qIdx, oIdx) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => (idx === qIdx ? { ...q, correctIndex: oIdx } : q))
    }));
  };

  const handleMarkCorrectAnswer = (qIdx, optIdx, format) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => {
        if (idx !== qIdx) return q;
        if (format === 'multiple-choice') {
          const currentList = Array.isArray(q.correctIndex)
            ? q.correctIndex
            : (q.correctIndex !== undefined ? [q.correctIndex] : []);
          const nextList = currentList.includes(optIdx)
            ? currentList.filter((i) => i !== optIdx)
            : [...currentList, optIdx];
          return { ...q, correctIndex: nextList };
        }
        return { ...q, correctIndex: optIdx };
      })
    }));
  };

  const handleQuestionFormatChange = (qIdx, format) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => (idx === qIdx ? { ...q, format } : q))
    }));
  };

  const handleAddQuestion = () => {
    setContentFormData((prev) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        {
          id: `q-${Date.now()}`,
          format: 'single-choice',
          text: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          correctAnswerText: '',
          modelSolution: ''
        }
      ]
    }));
  };
  const handleAddQuizQuestion = handleAddQuestion;

  const handleDeleteQuestion = (qIdx) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((_, idx) => idx !== qIdx)
    }));
  };
  const handleRemoveQuizQuestion = handleDeleteQuestion;

  const handleAddOption = (qIdx) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => {
        if (idx !== qIdx) return q;
        const opts = q.options || [];
        if (opts.length >= 6) return q;
        return { ...q, options: [...opts, ''] };
      })
    }));
  };

  const handleRemoveOption = (qIdx, oIdx) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => {
        if (idx !== qIdx) return q;
        const opts = (q.options || []).filter((_, i) => i !== oIdx);
        let cIdx = q.correctIndex || 0;
        if (cIdx >= opts.length) cIdx = Math.max(0, opts.length - 1);
        return { ...q, options: opts, correctIndex: cIdx };
      })
    }));
  };

  const handleFillInAnswerChange = (qIdx, text) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => (idx === qIdx ? { ...q, correctAnswerText: text } : q))
    }));
  };

  const handleDescriptiveSolutionChange = (qIdx, text) => {
    setContentFormData((prev) => ({
      ...prev,
      questions: (prev.questions || []).map((q, idx) => (idx === qIdx ? { ...q, modelSolution: text } : q))
    }));
  };

  const handleSaveContentItem = () => {
    if (!editingContentItem) return;

    const formattedQuestions = (contentFormData.questions || []).map((q, idx) => {
      const qFormat = q.format || 'single-choice';
      const isMulti = qFormat === 'multiple-choice';
      const correctList = Array.isArray(q.correctIndex) ? q.correctIndex : [q.correctIndex ?? 0];

      return {
        id: q.id || `q-${Date.now()}-${idx}`,
        question: q.text || q.question || 'Question',
        text: q.text || q.question || 'Question',
        format: qFormat,
        type: qFormat === 'multiple-choice' ? 'multi-mcq' : (qFormat === 'fill-in-blank' ? 'fill-in-blank' : (qFormat === 'descriptive' ? 'descriptive' : 'mcq')),
        options: (q.options || []).map((opt, oIdx) => {
          const optText = typeof opt === 'object' && opt !== null ? (opt.text ?? '') : String(opt ?? '');
          const isCorrect = isMulti
            ? correctList.includes(oIdx)
            : (q.correctIndex !== undefined ? q.correctIndex === oIdx : (typeof opt === 'object' ? Boolean(opt.isCorrect) : oIdx === 0));
          return {
            text: optText,
            isCorrect
          };
        }),
        correctAnswerText: q.correctAnswerText || '',
        modelSolution: q.modelSolution || '',
        explanation: q.modelSolution || q.explanation || q.feedbackText || ''
      };
    });

    const newItem = {
      id: editingContentItem.itemId || `ci-${Date.now()}`,
      type: editingContentItem.type,
      title: contentFormData.title || 'Untitled Lesson',
      body: contentFormData.body || '',
      videoUrl: contentFormData.videoUrl || '',
      bunnyVideoId: contentFormData.bunnyVideoId || '',
      fileUrl: contentFormData.fileUrl || '',
      passingPercentage: contentFormData.passingPercentage !== '' ? Number(contentFormData.passingPercentage) : 70,
      timerMinutes: contentFormData.timerMinutes !== '' ? Number(contentFormData.timerMinutes) : 10,
      feedbackText: contentFormData.feedbackText || '',
      questions: formattedQuestions
    };

    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => {
        if (m.id === editingContentItem.moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) => {
              if (l.id === editingContentItem.lessonId) {
                const isQuiz = editingContentItem.type === 'quiz';
                const constructedAssessment = isQuiz ? {
                  id: `quiz-${l.id}`,
                  title: contentFormData.title || l.title || 'Lesson Quiz',
                  passingPercentage: contentFormData.passingPercentage !== '' ? Number(contentFormData.passingPercentage) : 70,
                  timerSeconds: (contentFormData.timerMinutes !== '' ? Number(contentFormData.timerMinutes) : 10) * 60,
                  questions: formattedQuestions
                } : l.assessment;

                return {
                  ...l,
                  title: contentFormData.title || l.title || 'Untitled Lesson',
                  type: editingContentItem.type || l.type,
                  fileUrl: contentFormData.fileUrl || l.fileUrl || '',
                  videoUrl: contentFormData.videoUrl || l.videoUrl || '',
                  bunnyVideoId: contentFormData.bunnyVideoId || l.bunnyVideoId || '',
                  body: contentFormData.body || l.body || '',
                  passingPercentage: contentFormData.passingPercentage,
                  timerMinutes: contentFormData.timerMinutes,
                  questions: formattedQuestions,
                  assessment: constructedAssessment,
                  items: [{
                    ...newItem,
                    questions: formattedQuestions
                  }]
                };
              }
              return l;
            })
          };
        }
        return m;
      })
    }));

    setEditingContentItem(null);
    success('Lesson details saved');
  };

  // Save & Publish Handler
  const handleSaveAndPublish = async (shouldPublish = null, closeOnSave = true) => {
    if (!formData.title.trim()) {
      error('Please enter a course title before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const publishState = shouldPublish !== null ? shouldPublish : formData.published;
      
      const rawExam = formData.finalExam || formData.finalAssessment || {};
      const formattedExamQuestions = (rawExam.questions || []).map((q, idx) => ({
        id: q.id || `fe-q-${idx}`,
        question: q.question || q.text || 'Exam Question',
        text: q.question || q.text || 'Exam Question',
        options: (q.options || []).map((opt, oIdx) => ({
          text: typeof opt === 'string' ? opt : opt.text || `Option ${oIdx + 1}`,
          isCorrect: typeof opt === 'object' ? Boolean(opt.isCorrect) : (oIdx === (q.correctIndex || 0))
        })),
        explanation: q.explanation || q.modelSolution || ''
      }));

      const finalExamObj = {
        id: rawExam.id || `fe-quiz-${courseId || Date.now()}`,
        title: rawExam.title || 'Final Certification Exam',
        passingPercentage: Number(rawExam.passingPercentage) || 70,
        timerSeconds: Number(rawExam.timerSeconds) || 600,
        questions: formattedExamQuestions
      };

      const updatedPayload = {
        ...formData,
        published: publishState,
        finalExam: finalExamObj,
        finalAssessment: finalExamObj
      };

      setFormData((prev) => ({ ...prev, published: publishState }));

      if (courseId && existingCourse) {
        await updateCourse(courseId, updatedPayload);
      } else {
        await createCourse(updatedPayload);
      }

      await syncFromSupabase();
      success(publishState ? 'Course published live!' : 'Course draft saved successfully!');
      onSaveSuccess();
      if (closeOnSave) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      error(err.message || 'Error saving course');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] text-[#202124] flex flex-col font-sans overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* ─── 1. TOP HEADER BANNER (EXACT ZOHO LEARN BLUE PATTERN CANVAS) ───────── */}
      <div className="bg-gradient-to-r from-[#0F2042] via-[#1E3A8A] to-[#1E1B4B] text-white p-5 sm:p-6 shrink-0 relative overflow-hidden shadow-sm">
        {/* Subtle Grid Line Texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '16px 16px'
          }}
        />

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          
          {/* Left Cover Card + Title Info */}
          <div className="flex items-center gap-4 min-w-0">
            {/* White Cover Frame */}
            <div className="w-36 sm:w-44 h-20 bg-white rounded-lg p-1.5 shadow-md border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={formData.thumbnail || DEFAULT_COVER_PRESETS[0]}
                alt={formData.title || 'Course'}
                className="w-full h-full object-cover rounded-md"
              />
            </div>

            {/* Title & Metadata */}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-200 bg-white/10 px-2 py-0.5 rounded border border-white/15">
                  {formData.code || 'WE101'}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  {formData.title || 'New Course Title'}
                </h1>
              </div>

              <p className="text-xs text-slate-300 font-normal truncate">
                {formData.category || 'Programming & Development'} • {formData.difficulty} • Coach {formData.instructor || 'Alex Stone'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsPreviewPlayerOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndPublish(false, false)}
              disabled={isSaving}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-1.5 rounded-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveAndPublish(true, true)}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-md shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Publishing...' : 'Publish Course'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Close Builder"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. SUB-HEADER NAVIGATION TABS BAR ───────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 h-14 flex items-center justify-between shrink-0 shadow-xs gap-2 overflow-x-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-sans text-xs shrink-0">
          {[
            { id: 'OVERVIEW', label: 'OVERVIEW', icon: BookOpen },
            { id: 'MODULE', label: 'MODULE', icon: Layers },
            { id: 'FINAL_EXAM', label: 'FINAL EXAM', icon: Award }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-8 sm:h-9 px-2.5 sm:px-4 rounded-lg font-extrabold text-[11px] sm:text-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions depending on active tab */}
        {activeTab === 'MODULE' && (
          <button
            onClick={handleAddModule}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Add Module</span>
          </button>
        )}
      </div>

      {/* ─── 3. WORKSPACE CANVAS ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F7F8FA]">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ─── OVERVIEW TAB ─────────────────────────────────────────── */}
          {activeTab === 'OVERVIEW' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-200 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#2563EB]" />
                <span>Course Overview & Basic Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Course Title *</label>
                  <Input
                    placeholder="e.g. CPT101 - Certified Personal Trainer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-10 text-xs text-slate-900 font-semibold border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Course Code</label>
                  <Input
                    placeholder="e.g. AC-FIT-101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="h-10 text-xs text-slate-900 font-semibold border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Category</label>
                    {!isAddingNewCategory && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategory(true)}
                        className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Category
                      </button>
                    )}
                  </div>

                  {isAddingNewCategory ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter new category name..."
                        value={newCategoryText}
                        onChange={(e) => setNewCategoryText(e.target.value)}
                        className="h-10 text-xs text-slate-900 font-semibold border-slate-300 flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="h-10 px-4 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shrink-0 shadow-xs"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingNewCategory(false)}
                        className="h-10 px-3 text-xs border-slate-300 text-slate-700 font-bold cursor-pointer shrink-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingNewCategory(true);
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full h-10 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer shadow-2xs"
                    >
                      <option value="">Select a Category...</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="font-semibold text-[#2563EB]">
                        + Add New Category...
                      </option>
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Instructor Name</label>
                  <Input
                    placeholder="e.g. Master Fitness Trainer"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="h-10 text-xs text-slate-900 font-semibold border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Price (INR ₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 2499 (0 for Free)"
                    value={formData.price !== undefined ? formData.price : ''}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="h-10 text-xs text-slate-900 font-semibold border-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Difficulty Tier</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] cursor-pointer shadow-2xs"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider block">Course Description</label>
                  <Textarea
                    placeholder="Write a clear summary of what students will learn in this course..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="text-xs text-slate-900 font-semibold border-slate-300"
                  />
                </div>
              </div>

              {/* ─── PROGRAM THUMBNAIL UPLOAD SECTION ─────────────────── */}
              <div className="space-y-3 pt-3 border-t border-[#E4E7EB]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#202124] text-xs flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-[#2563EB]" />
                    Program Cover Art & Thumbnail Media
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recommended 16:9 Widescreen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50/70 p-4 rounded-xl border border-[#E4E7EB]">
                  {/* Left Upload / URL Controls */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0 shadow-xs">
                        <Upload className="h-4 w-4 text-white" />
                        <span>Upload Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setFormData((prev) => ({ ...prev, thumbnail: evt.target.result }));
                                success('Thumbnail image uploaded successfully!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {formData.thumbnail && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, thumbnail: '' }));
                            success('Thumbnail image removed.');
                          }}
                          className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Or Paste Image URL</span>
                      <Input
                        placeholder="https://example.com/cover.png"
                        value={formData.thumbnail || ''}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                        className="h-8 text-xs border-[#E4E7EB] bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Right Cover Art Live Preview */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shadow-2xs flex items-center justify-center">
                    {formData.thumbnail ? (
                      <img src={formData.thumbnail} alt="Cover Art Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-3 text-slate-400 space-y-1">
                        <BookOpen className="h-8 w-8 mx-auto text-slate-300" />
                        <span className="text-[10px] font-semibold block text-slate-400">No Image Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E4E7EB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSaveAndPublish(false, false)}
                  isLoading={isSaving}
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 cursor-pointer"
                >
                  Save Draft
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    if (!formData.title.trim()) {
                      error('Please enter a course title before proceeding.');
                      return;
                    }
                    setActiveTab('MODULE');
                  }}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold h-9 px-5 gap-1.5 cursor-pointer"
                >
                  <span>Save & Next</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── FINAL EXAM TAB (DEDICATED CERTIFICATION EXAM BUILDER) ─── */}
          {activeTab === 'FINAL_EXAM' && (
            <div className="bg-white rounded-xl border border-[#E4E7EB] p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E7EB] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Course Completion Certificate Trigger
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#202124] flex items-center gap-2">
                    <Award className="h-5 w-5 text-[#2563EB]" />
                    <span>Final Certification Exam Builder</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure the required final exam that students must pass to earn their official completion certificate.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    onClick={() => {
                      const newQ = {
                        id: `fe-q-${Date.now()}`,
                        question: '',
                        text: '',
                        type: 'mcq',
                        options: [
                          { text: '', isCorrect: true },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false }
                        ],
                        explanation: ''
                      };
                      setFormData(prev => ({
                        ...prev,
                        finalExam: {
                          ...(prev.finalExam || {}),
                          questions: [...(prev.finalExam?.questions || []), newQ]
                        }
                      }));
                      success('New question added to Final Exam');
                    }}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-white" />
                    <span>Add Question</span>
                  </Button>
                </div>
              </div>

              {/* Exam Settings Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs bg-slate-50/70 p-4 rounded-xl border border-[#E4E7EB]">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#202124]">Exam Title</label>
                  <Input
                    placeholder="e.g. Final Certification Exam"
                    value={formData.finalExam?.title || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      finalExam: { ...(prev.finalExam || {}), title: e.target.value }
                    }))}
                    className="h-9 text-xs border-[#E4E7EB] bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#202124]">Passing Threshold (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="75"
                    value={formData.finalExam?.passingPercentage !== undefined && formData.finalExam?.passingPercentage !== '' && formData.finalExam?.passingPercentage !== null ? formData.finalExam.passingPercentage : ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      finalExam: { ...(prev.finalExam || {}), passingPercentage: e.target.value === '' ? '' : Number(e.target.value) }
                    }))}
                    className="h-9 text-xs border-[#E4E7EB] bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#202124]">Time Limit (Minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.finalExam?.timerSeconds !== undefined && formData.finalExam?.timerSeconds !== '' && formData.finalExam?.timerSeconds !== null ? Math.round(Number(formData.finalExam.timerSeconds) / 60) : ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      finalExam: { ...(prev.finalExam || {}), timerSeconds: e.target.value === '' ? '' : (Number(e.target.value) || 0) * 60 }
                    }))}
                    className="h-9 text-xs border-[#E4E7EB] bg-white font-medium"
                  />
                </div>
              </div>

              {/* Exam Questions List */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Exam Questions ({formData.finalExam?.questions?.length || 0})
                  </h3>
                </div>

                {(!formData.finalExam?.questions || formData.finalExam.questions.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-2">
                    <HelpCircle className="h-8 w-8 text-slate-400 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-700">No Questions Added Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Click "+ Add Question" to add questions to this Final Certification Exam.
                    </p>
                  </div>
                ) : (
                  formData.finalExam.questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="border border-[#E4E7EB] rounded-xl p-4 space-y-3 bg-white shadow-2xs">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-extrabold text-xs text-[#2563EB] shrink-0 mt-2">Q{qIdx + 1}.</span>
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Enter question text..."
                            value={q.question || q.text || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...(formData.finalExam?.questions || [])];
                              updatedQuestions[qIdx] = { ...q, question: e.target.value, text: e.target.value };
                              setFormData(prev => ({
                                ...prev,
                                finalExam: { ...(prev.finalExam || {}), questions: updatedQuestions }
                              }));
                            }}
                            className="h-9 text-xs font-bold border-[#E4E7EB] text-[#202124]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedQuestions = (formData.finalExam?.questions || []).filter((_, idx) => idx !== qIdx);
                            setFormData(prev => ({
                              ...prev,
                              finalExam: { ...(prev.finalExam || {}), questions: updatedQuestions }
                            }));
                            success('Question deleted');
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Options Editor */}
                      <div className="pl-6 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Options Choices</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, oIdx) => {
                            const optText = typeof opt === 'object' && opt !== null ? (opt.text ?? '') : String(opt ?? '');
                            const isCorrect = typeof opt === 'object' && opt !== null ? Boolean(opt.isCorrect) : (q.correctIndex !== undefined ? q.correctIndex === oIdx : oIdx === 0);

                            return (
                              <div key={oIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <input
                                  type="radio"
                                  name={`correct-${q.id || qIdx}`}
                                  checked={isCorrect}
                                  onChange={() => {
                                    const updatedOptions = (q.options || []).map((o, idx) => ({
                                      text: typeof o === 'object' && o !== null ? (o.text ?? '') : String(o ?? ''),
                                      isCorrect: idx === oIdx
                                    }));
                                    const updatedQuestions = [...(formData.finalExam?.questions || [])];
                                    updatedQuestions[qIdx] = { ...q, options: updatedOptions };
                                    setFormData(prev => ({
                                      ...prev,
                                      finalExam: { ...(prev.finalExam || {}), questions: updatedQuestions }
                                    }));
                                  }}
                                  className="w-4 h-4 text-[#2563EB] focus:ring-0 cursor-pointer shrink-0"
                                  title="Mark as correct answer"
                                />
                                <Input
                                  placeholder={`Option ${oIdx + 1}`}
                                  value={optText}
                                  onChange={(e) => {
                                    const updatedOptions = (q.options || []).map((o, idx) => {
                                      const text = idx === oIdx ? e.target.value : (typeof o === 'object' && o !== null ? (o.text ?? '') : String(o ?? ''));
                                      const correct = typeof o === 'object' && o !== null ? Boolean(o.isCorrect) : (q.correctIndex !== undefined ? q.correctIndex === idx : idx === 0);
                                      return { text, isCorrect: correct };
                                    });
                                    const updatedQuestions = [...(formData.finalExam?.questions || [])];
                                    updatedQuestions[qIdx] = { ...q, options: updatedOptions };
                                    setFormData(prev => ({
                                      ...prev,
                                      finalExam: { ...(prev.finalExam || {}), questions: updatedQuestions }
                                    }));
                                  }}
                                  className="h-7 text-xs border-none bg-transparent shadow-none font-medium text-slate-800"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rationale Explanation */}
                      <div className="pl-6 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Explanation Rationale</label>
                        <Input
                          placeholder="Why is this answer correct?"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const updatedQuestions = [...(formData.finalExam?.questions || [])];
                            updatedQuestions[qIdx] = { ...q, explanation: e.target.value };
                            setFormData(prev => ({
                              ...prev,
                              finalExam: { ...(prev.finalExam || {}), questions: updatedQuestions }
                            }));
                          }}
                          className="h-8 text-xs border-[#E4E7EB] bg-slate-50/50"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E4E7EB]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('MODULE')}
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Modules</span>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveAndPublish(false, false)}
                    isLoading={isSaving}
                    className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 cursor-pointer"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSaveAndPublish(true, true)}
                    isLoading={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-6 gap-2 shadow-xs cursor-pointer"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Publish Course</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── MODULE TAB (ZOHO LEARN MODULE BUILDER) ──── */}
          {activeTab === 'MODULE' && (
            <div className="space-y-6">

              {/* MODULE LIST BUILDER */}
              {formData.modules.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-[#E4E7EB] p-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#202124]">No Modules Added Yet</h3>
                  <p className="text-xs text-[#5F6368] max-w-sm mx-auto">
                    This course is currently empty. Click "+ Add Module" below to create your first curriculum section.
                  </p>
                  <Button onClick={handleAddModule} leftIcon={<Plus className="h-4 w-4" />} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 h-9">
                    Add First Module
                  </Button>
                </div>
              ) : (
                formData.modules.map((moduleItem, mIdx) => (
                  <div key={moduleItem.id} className="bg-white rounded-xl border border-[#E4E7EB] shadow-2xs overflow-hidden">
                    
                    {/* Module Header Bar */}
                    <div className="bg-white px-4 py-3 border-b border-[#E4E7EB] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="h-4 w-4 text-slate-400 cursor-grab shrink-0" />
                        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                        
                        {/* Module Title with Pen Icon Edit Option */}
                        {editingChapterId === moduleItem.id ? (
                          <input
                            type="text"
                            value={chapterTitleInput}
                            onChange={(e) => setChapterTitleInput(e.target.value)}
                            onBlur={() => handleRenameChapter(moduleItem.id, chapterTitleInput)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameChapter(moduleItem.id, chapterTitleInput)}
                            autoFocus
                            className="bg-slate-50 border border-[#2563EB] text-[#202124] text-xs font-bold px-2.5 py-1 rounded-md w-60 focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingChapterId(moduleItem.id);
                              setChapterTitleInput(moduleItem.title);
                            }}
                            className="flex items-center gap-2 group/mod cursor-pointer min-w-0"
                            title="Click to rename module"
                          >
                            <span className="font-bold text-sm text-[#202124] group-hover/mod:text-[#2563EB] transition-colors truncate">
                              {moduleItem.title}
                            </span>
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-[#2563EB] rounded-md transition-colors shrink-0"
                              title="Edit module name"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {moduleItem.duration && (
                          <span className="text-xs text-[#8A8F98] font-normal shrink-0">{moduleItem.duration}</span>
                        )}
                      </div>

                      {/* Right Module Actions: + Add Lesson Dropdown with Specific Icons */}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#E5DFFF] px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Lesson</span>
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 font-sans text-xs p-1">
                            {LESSON_CONTENT_TYPES.map((ct) => {
                              const Icon = ct.icon;
                              return (
                                <DropdownMenuItem
                                  key={ct.id}
                                  onClick={() => handleAddLessonWithType(moduleItem.id, ct.id)}
                                  className="cursor-pointer flex items-center gap-2.5 p-2 rounded-md hover:bg-slate-50"
                                >
                                  <div className={`p-1 rounded ${ct.color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[#202124] block">{ct.title}</span>
                                    <span className="text-[10px] text-[#8A8F98] block">{ct.desc}</span>
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={() => handleDeleteModule(moduleItem.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Delete Module"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons List inside Module */}
                    <div className="divide-y divide-slate-100">
                      {(moduleItem.lessons || []).length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 italic">
                          No lessons added in this module yet. Click "+ Add Lesson" to choose Video, PPT, Text, or Quiz.
                        </div>
                      ) : (
                        (moduleItem.lessons || []).map((lesson) => {
                          const iconObj = LESSON_CONTENT_TYPES.find((t) => t.id === lesson.type) || LESSON_CONTENT_TYPES[0];
                          const IconComp = iconObj.icon;

                          return (
                            <div
                              key={lesson.id}
                              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group relative"
                            >
                              {/* Left Vertical Accent Line */}
                              <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2563EB] rounded-r" />

                              <div className="flex items-center gap-3 min-w-0 pl-2">
                                <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab shrink-0" />
                                <div className={`p-1 rounded ${iconObj.color} shrink-0`}>
                                  <IconComp className="h-3.5 w-3.5" />
                                </div>
                                <span
                                  onClick={() => handleEditLesson(moduleItem.id, lesson.id)}
                                  className="text-xs font-semibold text-[#202124] hover:text-[#2563EB] transition-colors cursor-pointer truncate"
                                >
                                  {lesson.title}
                                </span>
                                {lesson.duration && (
                                  <span className="text-[11px] text-[#8A8F98] shrink-0">{lesson.duration}</span>
                                )}
                                <span className="text-[11px] text-[#8A8F98] flex items-center gap-1 shrink-0">
                                  <MessageSquare className="h-3 w-3 text-slate-300" />
                                  <span>0</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditLesson(moduleItem.id, lesson.id)}
                                  className="text-xs text-[#2563EB] hover:bg-[#EFF6FF] px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                                >
                                  Edit Content
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(moduleItem.id, lesson.id)}
                                  className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Module Tab Footer Controls: Back & Save & Next */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E4E7EB] bg-white p-4 rounded-xl shadow-2xs">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Overview</span>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveAndPublish(false, false)}
                    isLoading={isSaving}
                    className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold h-9 px-4 cursor-pointer"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('FINAL_EXAM')}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold h-9 px-5 gap-1.5 cursor-pointer"
                  >
                    <span>Save & Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}





        </div>
      </div>

      {/* ─── CONTENT ITEM EDITOR (FULL SCREEN AUTHORING STUDIO FOR QUIZ, VIDEO, PPT & TEXT) ─ */}
      {editingContentItem && (
        <div className="fixed inset-0 z-[60] bg-[#F7F8FA] text-[#202124] flex flex-col font-sans overflow-hidden select-none animate-in fade-in duration-200">
          
          {/* Top Full-Screen Navigation Header */}
          <div className="bg-white border-b border-[#E4E7EB] px-6 h-14 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingContentItem(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
                title="Back to Course Studio"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-4 w-px bg-[#E4E7EB]" />
              <Badge className="bg-[#2563EB] text-white uppercase text-[10px] font-bold px-2 py-0.5 tracking-wide">
                {editingContentItem.type}
              </Badge>
              <h3 className="font-bold text-base text-[#202124]">
                {editingContentItem.type === 'quiz'
                  ? 'Quiz Authoring Studio'
                  : editingContentItem.type === 'video'
                  ? 'BunnyStream Video Setup'
                  : editingContentItem.type === 'ppt'
                  ? 'Presentation Deck Setup'
                  : 'Text Lesson Editor'}
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={() => setEditingContentItem(null)}
                className="text-xs h-8 px-4 border-[#E4E7EB] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveContentItem}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-5 font-semibold shadow-xs cursor-pointer"
              >
                Save Lesson Content
              </Button>
            </div>
          </div>

          {/* Full Screen Scrollable Body Content Workspace */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F7F8FA]">
            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-[#E4E7EB] p-6 sm:p-8 shadow-2xs space-y-6">
              
              <div className="space-y-1 pb-4 border-b border-[#E4E7EB]">
                <label className="font-bold text-xs text-[#202124] uppercase tracking-wide">Lesson Title</label>
                <Input
                  value={contentFormData.title}
                  onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                  placeholder="Enter lesson title..."
                  className="h-10 text-sm border-[#E4E7EB] font-semibold"
                />
              </div>

              {/* 🎥 VIDEO CONTENT EDITOR (BunnyStream CDN Upload + Auto-Play Preview) */}
              {editingContentItem.type === 'video' && (
                <div className="space-y-4 border-t border-[#E4E7EB] pt-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#202124] flex items-center justify-between">
                      <span>🎥 Upload Video to BunnyStream CDN</span>
                      {bunnyProgress && (
                        <span className="text-[10px] text-[#2563EB] font-mono font-bold animate-pulse">
                          {bunnyProgress.message} ({bunnyProgress.pct}%)
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={Boolean(bunnyProgress)}
                      onChange={handleVideoFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EFF6FF] file:text-[#2563EB] hover:file:bg-[#E5DFFF] cursor-pointer disabled:opacity-50"
                    />
                    {bunnyProgress && (
                      <div className="w-full space-y-1 pt-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300 rounded-full"
                            style={{ width: `${bunnyProgress.pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>TUS Resumable Chunks (High Speed)</span>
                          <span className="font-bold text-blue-600">{bunnyProgress.pct}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#202124]">Video Embed / Stream URL</label>
                    <Input
                      placeholder="https://iframe.mediadelivery.net/embed/... or YouTube URL"
                      value={contentFormData.videoUrl}
                      onChange={(e) => setContentFormData({ ...contentFormData, videoUrl: e.target.value })}
                      className="h-9 text-xs border-[#E4E7EB]"
                    />
                  </div>

                  {(contentFormData._blobPreview || contentFormData.videoUrl) && (
                    <div className="pt-2">
                      <div className="rounded-xl overflow-hidden bg-black border border-[#E4E7EB]">
                        <VideoPlayer
                          content={{
                            videoUrl: contentFormData._blobPreview || contentFormData.videoUrl,
                            _blobPreview: contentFormData._blobPreview,
                            bunnyVideoId: contentFormData.bunnyVideoId,
                            title: contentFormData.title || 'Lesson Video'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📊 PPT PRESENTATION EDITOR */}
              {editingContentItem.type === 'ppt' && (
                <div className="space-y-4 border-t border-[#E4E7EB] pt-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#202124]">📊 Upload Presentation (.ppt, .pptx, .pdf)</label>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf"
                      onChange={handlePptFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EFF6FF] file:text-[#2563EB] hover:file:bg-[#E5DFFF] cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      Upload PowerPoint decks or presentation slides. Files are securely packaged for student viewing.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#202124]">Presentation Slide Embed / File URL</label>
                    <Input
                      placeholder="https://docs.google.com/presentation/d/... or attached slide URL"
                      value={contentFormData.fileUrl}
                      onChange={(e) => setContentFormData({ ...contentFormData, fileUrl: e.target.value })}
                      className="h-9 text-xs border-[#E4E7EB]"
                    />
                  </div>

                  {contentFormData.fileUrl && (
                    <div className="space-y-1">
                      <label className="font-semibold text-[#202124] text-[11px]">PPT Presentation Live Preview</label>
                      <div className="h-52 bg-slate-900 rounded-xl border border-[#E4E7EB] overflow-hidden flex items-center justify-center text-white">
                        {contentFormData.fileUrl.startsWith('http') || contentFormData.fileUrl.startsWith('data:application/pdf') ? (
                          <iframe src={contentFormData.fileUrl} className="w-full h-full border-0" title="Presentation Preview" />
                        ) : (
                          <div className="text-center p-4 text-xs space-y-2">
                            <Presentation className="h-10 w-10 text-blue-400 mx-auto" />
                            <span className="font-bold block text-white">Presentation File Attached:</span>
                            <span className="text-slate-300 font-mono text-[11px] block">{contentFormData.fileName || 'Presentation Slide Deck (.pptx)'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📑 PDF DOCUMENT EDITOR */}
              {editingContentItem.type === 'pdf' && (
                <div className="space-y-4 border-t border-[#E4E7EB] pt-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#202124]">📑 Upload PDF Document (.pdf)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePptFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EFF6FF] file:text-[#2563EB] hover:file:bg-[#E5DFFF] cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">
                      Upload course reading documents, handouts, or reference guidelines.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#202124]">PDF Document Embed / Hosted URL</label>
                    <Input
                      placeholder="https://.../document.pdf or attached PDF URL"
                      value={contentFormData.fileUrl}
                      onChange={(e) => setContentFormData({ ...contentFormData, fileUrl: e.target.value })}
                      className="h-9 text-xs border-[#E4E7EB]"
                    />
                  </div>

                  {contentFormData.fileUrl && (
                    <div className="space-y-1">
                      <label className="font-semibold text-[#202124] text-[11px]">PDF Document Live Preview</label>
                      <div className="h-56 bg-slate-100 rounded-xl border border-[#E4E7EB] overflow-hidden">
                        <iframe src={contentFormData.fileUrl} className="w-full h-full border-0" title="PDF Document Preview" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📄 TEXT EXPLANATION EDITOR */}
              {editingContentItem.type === 'text' && (
                <div className="space-y-4 border-t border-[#E4E7EB] pt-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#202124]">📄 Import Content from .txt File</label>
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleTextFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EFF6FF] file:text-[#2563EB] hover:file:bg-[#E5DFFF] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#202124]">Written Lesson Explanation Text</label>
                    <Textarea
                      rows={10}
                      placeholder="Type or paste written lesson explanation text here..."
                      value={contentFormData.body}
                      onChange={(e) => setContentFormData({ ...contentFormData, body: e.target.value })}
                      className="text-xs border-[#E4E7EB] font-sans leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* 🧠 INTERACTIVE QUIZ BUILDER */}
              {editingContentItem.type === 'quiz' && (
                <div className="space-y-6 border-t border-[#E4E7EB] pt-4">
                  
                  {/* Quiz Settings Bar */}
                  <div className="bg-[#EFF6FF] p-4 rounded-xl border border-[#2563EB]/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-[#2563EB]">Passing Score (%)</label>
                      <Input
                        type="number"
                        value={contentFormData.passingPercentage || 70}
                        onChange={(e) => setContentFormData({ ...contentFormData, passingPercentage: Number(e.target.value) || 70 })}
                        className="h-9 text-xs bg-white border-[#E4E7EB]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#2563EB]">Timer (Minutes)</label>
                      <Input
                        type="number"
                        value={contentFormData.timerMinutes || 10}
                        onChange={(e) => setContentFormData({ ...contentFormData, timerMinutes: Number(e.target.value) || 10 })}
                        className="h-9 text-xs bg-white border-[#E4E7EB]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-[#2563EB]">Custom Feedback / Explanation</label>
                      <Input
                        placeholder="e.g. Great job! Review chapter 2 for more details."
                        value={contentFormData.feedbackText || ''}
                        onChange={(e) => setContentFormData({ ...contentFormData, feedbackText: e.target.value })}
                        className="h-9 text-xs bg-white border-[#E4E7EB]"
                      />
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#202124]">
                        Quiz Questions ({contentFormData.questions?.length || 0})
                      </h4>

                      <Button
                        type="button"
                        onClick={handleAddQuizQuestion}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3.5 gap-1.5 rounded-md cursor-pointer font-semibold"
                      >
                        <Plus className="h-4 w-4" /> Add a question
                      </Button>
                    </div>

                    {(contentFormData.questions || []).map((q, qIdx) => (
                      <div key={q.id || qIdx} className="bg-slate-50 border border-[#E4E7EB] p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#202124]">Q{qIdx + 1}. Question Format</span>
                          
                          {/* Format Selector */}
                          <select
                            value={q.format || 'single-choice'}
                            onChange={(e) => handleQuestionFormatChange(qIdx, e.target.value)}
                            className="h-8 px-3 text-xs font-semibold bg-white border border-[#E4E7EB] rounded-md text-[#2563EB]"
                          >
                            <option value="single-choice">Single-Choice (Radio)</option>
                            <option value="multiple-choice">Multiple-Choice (Checkboxes)</option>
                            <option value="fill-in-blank">Fill-in-the-blank</option>
                            <option value="descriptive">Descriptive / Essay</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuizQuestion(qIdx)}
                            className="text-rose-600 hover:bg-rose-100 p-1.5 rounded transition-colors cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-1">
                          <Input
                            placeholder="Type your question text here..."
                            value={q.text || q.question || ''}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            className="h-9 text-xs bg-white border-[#E4E7EB]"
                          />
                        </div>

                        {/* Choices & Correct Mark */}
                        {(q.format === 'single-choice' || q.format === 'multiple-choice' || !q.format) && (
                          <div className="space-y-2.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-600 block">
                              Answer Choices & Mark Correct Answer:
                            </span>
                            {(q.options || []).map((opt, optIdx) => {
                              const optText = typeof opt === 'object' && opt !== null ? (opt.text ?? '') : String(opt ?? '');
                              const isChecked = q.format === 'multiple-choice'
                                ? (Array.isArray(q.correctIndex) ? q.correctIndex.includes(optIdx) : (typeof opt === 'object' && Boolean(opt.isCorrect)))
                                : (q.correctIndex !== undefined ? q.correctIndex === optIdx : (typeof opt === 'object' ? Boolean(opt.isCorrect) : optIdx === 0));

                              return (
                                <div key={optIdx} className="flex items-center gap-2.5">
                                  <input
                                    type={q.format === 'multiple-choice' ? 'checkbox' : 'radio'}
                                    name={`q-${qIdx}-correct`}
                                    checked={isChecked}
                                    onChange={() => handleMarkCorrectAnswer(qIdx, optIdx, q.format)}
                                    className="w-4 h-4 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                                  />
                                  <Input
                                    placeholder={`Choice ${optIdx + 1}`}
                                    value={optText}
                                    onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                                    className="h-8 text-xs bg-white border-[#E4E7EB] flex-1"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.format === 'fill-in-blank' && (
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-semibold text-slate-600">Expected Correct Answer:</label>
                            <Input
                              placeholder="Enter exact expected word or phrase"
                              value={q.correctAnswerText || ''}
                              onChange={(e) => handleFillInAnswerChange(qIdx, e.target.value)}
                              className="h-9 text-xs bg-white border-[#E4E7EB]"
                            />
                          </div>
                        )}

                        {q.format === 'descriptive' && (
                          <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-semibold text-slate-600">Model Solution / Criteria:</label>
                            <Textarea
                              rows={3}
                              placeholder="Enter model solution notes..."
                              value={q.modelSolution || ''}
                              onChange={(e) => handleDescriptiveSolutionChange(qIdx, e.target.value)}
                              className="text-xs bg-white border-[#E4E7EB]"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}



              <div className="flex justify-end gap-3 pt-4 border-t border-[#E4E7EB]">
                <Button variant="outline" onClick={() => setEditingContentItem(null)} className="text-xs h-9 px-4 cursor-pointer">
                  Cancel
                </Button>
                <Button onClick={handleSaveContentItem} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 px-6 font-semibold cursor-pointer">
                  Save Lesson Content
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Preview Modal */}
      {isPreviewPlayerOpen && (
        <StudentCoursePlayerPreviewModal
          isOpen={isPreviewPlayerOpen}
          onClose={() => setIsPreviewPlayerOpen(false)}
          courseData={formData}
        />
      )}

    </div>
  );
};

export default ProgramStudioModal;
