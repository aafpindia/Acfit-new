import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCourses, fetchCourseById, createCourse, updateCourse, deleteCourse, createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson, updateAssessment } from '../services/courseService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch all courses. Falls back to Zustand store when Supabase is not configured.
 */
export const useCourses = () => {
  const storeCourses = useLmsStore((s) => s.courses);

  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const result = await fetchCourses();
      if (result.success && result.data) return result.data;
      return storeCourses; // fallback
    },
    initialData: storeCourses,
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Fetch a single course by ID.
 */
export const useCourse = (courseId) => {
  const storeCourses = useLmsStore((s) => s.courses);
  const fallback = storeCourses.find(c => c.id === courseId) || null;

  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const result = await fetchCourseById(courseId);
      if (result.success && result.data) return result.data;
      return fallback;
    },
    initialData: fallback,
    enabled: !!courseId,
  });
};

/**
 * Create a new course (admin mutation).
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const storeCreateCourse = useLmsStore((s) => s.createCourse);

  return useMutation({
    mutationFn: async (courseData) => {
      if (isSupabaseConfigured) {
        const result = await createCourse(courseData);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeCreateCourse(courseData);
      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Update a course (admin mutation).
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const storeUpdateCourse = useLmsStore((s) => s.updateCourse);

  return useMutation({
    mutationFn: async ({ courseId, courseData }) => {
      if (isSupabaseConfigured) {
        const result = await updateCourse(courseId, courseData);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeUpdateCourse(courseId, courseData);
      return courseData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
    },
  });
};

/**
 * Delete a course (admin mutation).
 */
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const storeDeleteCourse = useLmsStore((s) => s.deleteCourse);

  return useMutation({
    mutationFn: async (courseId) => {
      if (isSupabaseConfigured) {
        const result = await deleteCourse(courseId);
        if (!result.success) throw new Error(result.error);
        return null;
      }
      storeDeleteCourse(courseId);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Create a module (admin mutation).
 */
export const useCreateModule = () => {
  const queryClient = useQueryClient();
  const storeCreateModule = useLmsStore((s) => s.createModule);

  return useMutation({
    mutationFn: async ({ courseId, title }) => {
      if (isSupabaseConfigured) {
        const result = await createModule(courseId, title);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeCreateModule(courseId, title);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Delete a module (admin mutation).
 */
export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  const storeDeleteModule = useLmsStore((s) => s.deleteModule);

  return useMutation({
    mutationFn: async ({ courseId, moduleId }) => {
      if (isSupabaseConfigured) {
        const result = await deleteModule(moduleId);
        if (!result.success) throw new Error(result.error);
        return null;
      }
      storeDeleteModule(courseId, moduleId);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Create a lesson (admin mutation).
 */
export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  const storeCreateLesson = useLmsStore((s) => s.createLesson);

  return useMutation({
    mutationFn: async ({ courseId, moduleId, lessonData }) => {
      if (isSupabaseConfigured) {
        const result = await createLesson(moduleId, lessonData);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeCreateLesson(courseId, moduleId, lessonData);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

/**
 * Delete a lesson (admin mutation).
 */
export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  const storeDeleteLesson = useLmsStore((s) => s.deleteLesson);

  return useMutation({
    mutationFn: async ({ courseId, moduleId, lessonId }) => {
      if (isSupabaseConfigured) {
        const result = await deleteLesson(lessonId);
        if (!result.success) throw new Error(result.error);
        return null;
      }
      storeDeleteLesson(courseId, moduleId, lessonId);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
