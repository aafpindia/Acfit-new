import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';

const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_URL_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

const DEFAULT_COURSES_SEED = [
  {
    id: '10101010-1010-1010-1010-101010101010',
    title: '30-Day Lean Muscle & Strength Blueprint',
    description: 'Master progressive overload, lift with correct form, and build a strong foundation using compound exercises.',
    category: 'Strength Training',
    difficulty: 'Beginner',
    price: 0,
    instructor: 'Coach Alex Stone',
    rating: 4.9,
    students: 2450,
    duration: '4 weeks',
    thumbnail: '',
    featured: true,
    modules: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Compound Lift Mechanics',
        order: 1,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111111a',
            title: 'Squat Form & Core Bracing Guide',
            type: 'rich-text',
            order: 1,
            content: { body: '<h1>Proper Squat Form</h1><p>Barbell squat posture and diaphragmatic bracing guide.</p>' }
          },
          {
            id: '11111111-1111-1111-1111-11111111111b',
            title: 'Barbell Deadlift Setup (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: { videoUrl: SAMPLE_VIDEO_URL, videoId: 'bunny-strength-deadlift-01', bunnyVideoId: 'bunny-strength-deadlift-01', duration: '3:45' }
          }
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111112',
        title: 'Squat & Leg Mechanics',
        order: 2,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111112a',
            title: 'Quad Drive & Balance',
            type: 'rich-text',
            order: 1,
            content: { body: '<h1>Quad Drive & Hip Depth</h1><p>Achieving quad hypertrophy safely.</p>' }
          },
          {
            id: '11111111-1111-1111-1111-11111111112b',
            title: 'Squat Depth Breakdown (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: { videoUrl: SAMPLE_VIDEO_URL_2, videoId: 'bunny-squat-depth-02', bunnyVideoId: 'bunny-squat-depth-02', duration: '4:12' }
          }
        ]
      }
    ],
    finalAssessment: {
      id: 'quiz-strength-final',
      title: 'ACFIT Academy Certified Strength Foundations Exam',
      passingPercentage: 75,
      timerSeconds: 300,
      questions: [
        {
          id: 'q-sf-1',
          question: 'What is progressive overload?',
          type: 'mcq',
          options: [
            { text: 'Gradually increasing load, volume, or difficulty over time', isCorrect: true },
            { text: 'Lifting maximum load to failure every session', isCorrect: false }
          ],
          explanation: 'Progressive overload continuously challenges muscles to trigger growth.'
        }
      ]
    }
  },
  {
    id: '20202020-2020-2020-2020-202020202020',
    title: 'HIIT Cardio & Athletic Conditioning Masterclass',
    description: 'High-intensity interval circuits to burn fat, boost aerobic thresholds, and optimize metabolic conditioning.',
    category: 'Cardio & HIIT',
    difficulty: 'Advanced',
    price: 29,
    instructor: 'Coach Sarah Jenkins',
    rating: 4.8,
    students: 1580,
    duration: '6.2 hours',
    thumbnail: '',
    featured: true,
    modules: [
      {
        id: '22222222-2222-2222-2222-222222222221',
        title: 'Aerobic Foundations & Zone 2',
        order: 1,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222221a',
            title: 'Zone 2 Heart Rate Baselines',
            type: 'rich-text',
            order: 1,
            content: { body: '<h1>Zone 2 Aerobic Base</h1><p>LISS builds stroke volume and recovery limits.</p>' }
          },
          {
            id: '22222222-2222-2222-2222-22222222221b',
            title: 'Cardio Warmup Circuits (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: { videoUrl: SAMPLE_VIDEO_URL, videoId: 'bunny-cardio-warmup-01', bunnyVideoId: 'bunny-cardio-warmup-01', duration: '4:10' }
          }
        ]
      }
    ]
  }
];

export const seedDefaultCoursesToSupabase = async () => {
  if (!isSupabaseConfigured) return;
  try {
    for (const course of DEFAULT_COURSES_SEED) {
      await supabase.from('courses').upsert({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        price: course.price,
        instructor: course.instructor,
        rating: course.rating,
        students: course.students,
        duration: course.duration,
        thumbnail: course.thumbnail,
        featured: course.featured,
        published: true
      }, { onConflict: 'id' });

      if (course.modules) {
        for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
          const mod = course.modules[mIdx];
          await supabase.from('modules').upsert({
            id: mod.id,
            course_id: course.id,
            title: mod.title,
            sort_order: mod.order || mIdx + 1
          }, { onConflict: 'id' });

          if (mod.lessons) {
            for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
              const les = mod.lessons[lIdx];
              await supabase.from('lessons').upsert({
                id: les.id,
                module_id: mod.id,
                title: les.title,
                type: les.type,
                sort_order: les.order || lIdx + 1,
                content: les.content || {}
              }, { onConflict: 'id' });
            }
          }
        }
      }

      if (course.finalAssessment) {
        await supabase.from('assessments').upsert({
          id: course.finalAssessment.id,
          course_id: course.id,
          module_id: null,
          title: course.finalAssessment.title,
          passing_percentage: course.finalAssessment.passingPercentage || 75,
          timer_seconds: course.finalAssessment.timerSeconds || 300,
          questions: course.finalAssessment.questions || [],
          is_final: true
        }, { onConflict: 'id' });
      }
    }
  } catch (e) {
    console.warn('[courseService] Auto seed warning:', e);
  }
};

/**
 * Fetch all courses with nested modules, lessons, and assessments directly from Supabase DB.
 */
export const fetchCourses = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  let { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchCourses');

  // Return empty array if database has 0 courses
  if (!courses || courses.length === 0) {
    return handleSuccess([]);
  }

  const courseIds = (courses || []).map(c => c.id);
  if (courseIds.length === 0) {
    return handleSuccess([]);
  }

  const [modulesRes, assessmentsRes] = await Promise.all([
    supabase.from('modules').select('*').in('course_id', courseIds).order('sort_order'),
    supabase.from('assessments').select('*').in('course_id', courseIds),
  ]);

  const moduleIds = (modulesRes.data || []).map(m => m.id);
  const lessonsRes = moduleIds.length > 0
    ? await supabase.from('lessons').select('*').in('module_id', moduleIds).order('sort_order')
    : { data: [] };

  // Assemble nested structure
  const assembled = courses.map(course => {
    const courseModules = (modulesRes.data || []).filter(m => m.course_id === course.id);
    const courseAssessments = (assessmentsRes.data || []).filter(a => a.course_id === course.id);
    const finalAssessment = courseAssessments.find(a => a.is_final) || null;

    const modulesWithLessons = courseModules.map(mod => {
      const modLessons = (lessonsRes.data || []).filter(l => l.module_id === mod.id);
      const modAssessment = courseAssessments.find(a => a.module_id === mod.id && !a.is_final) || null;

      return {
        id: mod.id,
        title: mod.title,
        order: mod.sort_order,
        lessons: modLessons.map(l => {
          const lessonAssessment = courseAssessments.find(a => a.lesson_id === l.id) || null;
          const contentObj = l.content || {};
          return {
            id: l.id,
            title: l.title,
            type: l.type,
            order: l.sort_order,
            duration: contentObj.duration || '15 mins',
            videoUrl: contentObj.videoUrl || contentObj.embedUrl || contentObj.url || '',
            videoId: contentObj.videoId || contentObj.bunnyVideoId || contentObj.bunny_video_id || '',
            bunnyVideoId: contentObj.bunnyVideoId || contentObj.videoId || contentObj.bunny_video_id || '',
            content: typeof contentObj.content !== 'undefined' ? contentObj.content : (contentObj.body || ''),
            items: Array.isArray(contentObj.items) ? contentObj.items : (contentObj.contentItems || []),
            ...contentObj,
            assessment: lessonAssessment ? {
              id: lessonAssessment.id,
              title: lessonAssessment.title,
              passingPercentage: lessonAssessment.passing_percentage,
              timerSeconds: lessonAssessment.timer_seconds,
              questions: lessonAssessment.questions || []
            } : null
          };
        }),
        assessment: modAssessment ? {
          id: modAssessment.id,
          title: modAssessment.title,
          passingPercentage: modAssessment.passing_percentage,
          timerSeconds: modAssessment.timer_seconds,
          questions: modAssessment.questions || []
        } : null
      };
    });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      price: parseFloat(course.price) || 0,
      instructor: course.instructor,
      rating: parseFloat(course.rating) || 5.0,
      students: course.students || 0,
      duration: course.duration,
      thumbnail: course.thumbnail,
      featured: course.featured,
      published: course.published,
      modules: modulesWithLessons,
      finalAssessment: finalAssessment ? {
        id: finalAssessment.id,
        title: finalAssessment.title,
        passingPercentage: finalAssessment.passing_percentage,
        timerSeconds: finalAssessment.timer_seconds,
        questions: finalAssessment.questions || []
      } : null
    };
  });

  return handleSuccess(assembled);
};

export const fetchCourseById = async (courseId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const result = await fetchCourses();
  if (!result.success) return result;
  const course = (result.data || []).find(c => c.id === courseId);
  if (!course) return { success: false, error: 'Course not found.' };
  return handleSuccess(course);
};

const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
};

const getOrGenerateUUID = (id) => {
  if (isValidUUID(id)) return id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const createCourse = async (courseData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const courseId = getOrGenerateUUID(courseData.id);

  const { data, error } = await supabase
    .from('courses')
    .insert({
      id: courseId,
      title: courseData.title,
      description: courseData.description || '',
      category: courseData.category || 'General',
      difficulty: courseData.difficulty || 'Beginner',
      price: courseData.price || 0,
      instructor: courseData.instructor || 'Platform Instructor',
      duration: courseData.duration || '0 hours',
      thumbnail: courseData.thumbnail || '',
      featured: courseData.featured || false,
      published: courseData.published || false,
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createCourse');

  // Insert modules, lessons, and module assessments if provided
  if (Array.isArray(courseData.modules)) {
    for (let mIdx = 0; mIdx < courseData.modules.length; mIdx++) {
      const mod = courseData.modules[mIdx];
      const modId = getOrGenerateUUID(mod.id);

      const { error: modErr } = await supabase
        .from('modules')
        .insert({
          id: modId,
          course_id: data.id,
          title: mod.title || `Module ${mIdx + 1}`,
          sort_order: mod.order || mod.sort_order || (mIdx + 1),
        });

      if (modErr) console.warn('[createCourse] module insert warning:', modErr);

      if (Array.isArray(mod.lessons)) {
        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
          const les = mod.lessons[lIdx];
          const lessonId = getOrGenerateUUID(les.id);
          const contentObj = {
            duration: les.duration || '15 mins',
            videoUrl: les.videoUrl || les.embedUrl || '',
            videoId: les.videoId || les.bunnyVideoId || '',
            bunnyVideoId: les.bunnyVideoId || les.videoId || '',
            content: typeof les.content !== 'undefined' ? les.content : '',
            items: Array.isArray(les.items) ? les.items : (Array.isArray(les.contentItems) ? les.contentItems : (les.content && Array.isArray(les.content.items) ? les.content.items : [])),
            ...(typeof les.content === 'object' && !Array.isArray(les.content) ? les.content : {})
          };

          const { error: lesErr } = await supabase
            .from('lessons')
            .insert({
              id: lessonId,
              module_id: modId,
              title: les.title || `Lesson ${lIdx + 1}`,
              type: les.type || 'video',
              sort_order: les.order || les.sort_order || (lIdx + 1),
              content: contentObj,
            });

          if (lesErr) console.warn('[createCourse] lesson insert warning:', lesErr);
        }
      }

      if (mod.assessment && (mod.assessment.title || (mod.assessment.questions && mod.assessment.questions.length > 0))) {
        const quizId = getOrGenerateUUID(mod.assessment.id);
        const { error: quizErr } = await supabase
          .from('assessments')
          .insert({
            id: quizId,
            course_id: data.id,
            module_id: modId,
            title: mod.assessment.title || `${mod.title} Assessment`,
            passing_percentage: mod.assessment.passingPercentage || mod.assessment.passing_percentage || 70,
            timer_seconds: mod.assessment.timerSeconds || mod.assessment.timer_seconds || 600,
            questions: mod.assessment.questions || [],
            is_final: false,
          });

        if (quizErr) console.warn('[createCourse] assessment insert warning:', quizErr);
      }
    }
  }

  // Insert Final Assessment / Exam
  const finalAss = courseData.finalAssessment || courseData.finalExam;
  const finalQuizId = getOrGenerateUUID(finalAss?.id);
  await supabase.from('assessments').insert({
    id: finalQuizId,
    course_id: data.id,
    module_id: null,
    title: finalAss?.title || `${courseData.title} Final Exam`,
    passing_percentage: finalAss?.passingPercentage || finalAss?.passing_percentage || 75,
    timer_seconds: finalAss?.timerSeconds || finalAss?.timer_seconds || 300,
    questions: finalAss?.questions || [],
    is_final: true,
  });

  return handleSuccess(data);
};

export const updateCourse = async (courseId, courseData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const updatePayload = {};
  if (courseData.title !== undefined) updatePayload.title = courseData.title;
  if (courseData.description !== undefined) updatePayload.description = courseData.description;
  if (courseData.category !== undefined) updatePayload.category = courseData.category;
  if (courseData.difficulty !== undefined) updatePayload.difficulty = courseData.difficulty;
  if (courseData.price !== undefined) updatePayload.price = courseData.price;
  if (courseData.instructor !== undefined) updatePayload.instructor = courseData.instructor;
  if (courseData.duration !== undefined) updatePayload.duration = courseData.duration;
  if (courseData.thumbnail !== undefined) updatePayload.thumbnail = courseData.thumbnail;
  if (courseData.featured !== undefined) updatePayload.featured = courseData.featured;
  if (courseData.published !== undefined) updatePayload.published = courseData.published;
  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('courses')
    .update(updatePayload)
    .eq('id', courseId)
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'updateCourse');

  // If modules are provided, sync modules, lessons, and module assessments
  if (Array.isArray(courseData.modules)) {
    // Clean up existing modules for this course (ON DELETE CASCADE handles lessons & assessments)
    await supabase.from('modules').delete().eq('course_id', courseId);
    await supabase.from('assessments').delete().eq('course_id', courseId).eq('is_final', false);

    for (let mIdx = 0; mIdx < courseData.modules.length; mIdx++) {
      const mod = courseData.modules[mIdx];
      const modId = getOrGenerateUUID(mod.id);

      const { error: modErr } = await supabase
        .from('modules')
        .insert({
          id: modId,
          course_id: courseId,
          title: mod.title || `Module ${mIdx + 1}`,
          sort_order: mod.order || mod.sort_order || (mIdx + 1),
        });

      if (modErr) console.warn('[updateCourse] module insert warning:', modErr);

      if (Array.isArray(mod.lessons)) {
        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
          const les = mod.lessons[lIdx];
          const lessonId = getOrGenerateUUID(les.id);
          const contentObj = {
            duration: les.duration || '15 mins',
            videoUrl: les.videoUrl || les.embedUrl || '',
            videoId: les.videoId || les.bunnyVideoId || '',
            bunnyVideoId: les.bunnyVideoId || les.videoId || '',
            content: typeof les.content !== 'undefined' ? les.content : '',
            items: Array.isArray(les.items) ? les.items : (Array.isArray(les.contentItems) ? les.contentItems : (les.content && Array.isArray(les.content.items) ? les.content.items : [])),
            ...(typeof les.content === 'object' && !Array.isArray(les.content) ? les.content : {})
          };

          const { error: lesErr } = await supabase
            .from('lessons')
            .insert({
              id: lessonId,
              module_id: modId,
              title: les.title || `Lesson ${lIdx + 1}`,
              type: les.type || 'video',
              sort_order: les.order || les.sort_order || (lIdx + 1),
              content: contentObj,
            });

          if (lesErr) console.warn('[updateCourse] lesson insert warning:', lesErr);
        }
      }

      if (mod.assessment && (mod.assessment.title || (mod.assessment.questions && mod.assessment.questions.length > 0))) {
        const quizId = getOrGenerateUUID(mod.assessment.id);
        await supabase
          .from('assessments')
          .insert({
            id: quizId,
            course_id: courseId,
            module_id: modId,
            title: mod.assessment.title || `${mod.title} Assessment`,
            passing_percentage: mod.assessment.passingPercentage || mod.assessment.passing_percentage || 70,
            timer_seconds: mod.assessment.timerSeconds || mod.assessment.timer_seconds || 600,
            questions: mod.assessment.questions || [],
            is_final: false,
          });
      }
    }
  }

  // Update Final Assessment if provided
  const finalAss = courseData.finalAssessment || courseData.finalExam;
  if (finalAss) {
    const { data: existingFinal } = await supabase
      .from('assessments')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_final', true)
      .maybeSingle();

    if (existingFinal) {
      await supabase
        .from('assessments')
        .update({
          title: finalAss.title || `${courseData.title || 'Course'} Final Exam`,
          passing_percentage: finalAss.passingPercentage || finalAss.passing_percentage || 75,
          timer_seconds: finalAss.timerSeconds || finalAss.timer_seconds || 300,
          questions: finalAss.questions || [],
        })
        .eq('id', existingFinal.id);
    } else {
      const finalQuizId = getOrGenerateUUID(finalAss.id);
      await supabase.from('assessments').insert({
        id: finalQuizId,
        course_id: courseId,
        module_id: null,
        title: finalAss.title || `${courseData.title || 'Course'} Final Exam`,
        passing_percentage: finalAss.passingPercentage || finalAss.passing_percentage || 75,
        timer_seconds: finalAss.timerSeconds || finalAss.timer_seconds || 300,
        questions: finalAss.questions || [],
        is_final: true,
      });
    }
  }

  return handleSuccess(data);
};

export const deleteCourse = async (courseId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) return handleSupabaseError(error, 'deleteCourse');
  return handleSuccess(null);
};

export const createModule = async (courseId, title) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data: existing } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('modules')
    .insert({ course_id: courseId, title, sort_order: nextOrder })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createModule');

  await supabase.from('assessments').insert({
    course_id: courseId,
    module_id: data.id,
    title: `${title} Assessment`,
    passing_percentage: 60,
    timer_seconds: 120,
    questions: [],
    is_final: false,
  });

  return handleSuccess(data);
};

export const updateModule = async (moduleId, moduleData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { data, error } = await supabase
    .from('modules')
    .update({ title: moduleData.title })
    .eq('id', moduleId)
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'updateModule');
  return handleSuccess(data);
};

export const deleteModule = async (moduleId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId);

  if (error) return handleSupabaseError(error, 'deleteModule');
  return handleSuccess(null);
};

export const createLesson = async (moduleId, lessonData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data: existing } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title: lessonData.title,
      type: lessonData.type || 'rich-text',
      sort_order: nextOrder,
      content: lessonData.content || {},
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createLesson');
  return handleSuccess(data);
};

export const updateLesson = async (lessonId, lessonData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const updatePayload = {};
  if (lessonData.title !== undefined) updatePayload.title = lessonData.title;
  if (lessonData.type !== undefined) updatePayload.type = lessonData.type;
  if (lessonData.content !== undefined) updatePayload.content = lessonData.content;

  const { data, error } = await supabase
    .from('lessons')
    .update(updatePayload)
    .eq('id', lessonId)
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'updateLesson');
  return handleSuccess(data);
};

export const deleteLesson = async (lessonId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId);

  if (error) return handleSupabaseError(error, 'deleteLesson');
  return handleSuccess(null);
};

export const updateAssessment = async (assessmentId, assessmentData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const updatePayload = {};
  if (assessmentData.title !== undefined) updatePayload.title = assessmentData.title;
  if (assessmentData.passingPercentage !== undefined) updatePayload.passing_percentage = assessmentData.passingPercentage;
  if (assessmentData.timerSeconds !== undefined) updatePayload.timer_seconds = assessmentData.timerSeconds;
  if (assessmentData.questions !== undefined) updatePayload.questions = assessmentData.questions;
  if (assessmentData.moduleId !== undefined) updatePayload.module_id = assessmentData.moduleId;
  if (assessmentData.lessonId !== undefined) updatePayload.lesson_id = assessmentData.lessonId;
  if (assessmentData.isFinal !== undefined) updatePayload.is_final = assessmentData.isFinal;

  const { data, error } = await supabase
    .from('assessments')
    .update(updatePayload)
    .eq('id', assessmentId)
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'updateAssessment');
  return handleSuccess(data);
};

export const createAssessment = async (assessmentData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      course_id: assessmentData.courseId,
      module_id: assessmentData.moduleId || null,
      lesson_id: assessmentData.lessonId || null,
      title: assessmentData.title,
      passing_percentage: assessmentData.passingPercentage || 60,
      timer_seconds: assessmentData.timerSeconds || 120,
      questions: assessmentData.questions || [],
      is_final: assessmentData.isFinal || false,
    })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createAssessment');
  return handleSuccess(data);
};

export const deleteAssessment = async (assessmentId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', assessmentId);

  if (error) return handleSupabaseError(error, 'deleteAssessment');
  return handleSuccess(null);
};

export const createFullCourseSyllabi = async (courseData, modulesData) => {
  if (!isSupabaseConfigured) return { success: true, data: null };
  const { data, error } = await supabase
    .rpc('create_full_course', {
      course_data: courseData,
      modules_data: modulesData
    });

  if (error) return handleSupabaseError(error, 'createFullCourseSyllabi');
  return handleSuccess(data);
};

export const purgeAllSeededData = async () => {
  if (!isSupabaseConfigured) return handleSuccess(null);
  try {
    await Promise.all([
      supabase.from('course_reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('lesson_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('live_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('progress').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
    return handleSuccess(true);
  } catch (err) {
    return handleSupabaseError(err, 'purgeAllSeededData');
  }
};
