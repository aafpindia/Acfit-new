import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markLessonComplete, fetchCourseProgress, fetchAllProgress } from '../services/progressService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch progress for a specific course.
 */
export const useCourseProgress = (courseId, userId) => {
  const storeProgress = useLmsStore((s) => s.progress);
  const fallback = (userId && storeProgress[userId]?.[courseId]) || {};

  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      const result = await fetchCourseProgress(courseId);
      if (result.success && result.data) return result.data;
      return fallback;
    },
    initialData: fallback,
    enabled: !!courseId,
  });
};

/**
 * Fetch all progress for the current user.
 */
export const useAllProgress = (userId) => {
  const storeProgress = useLmsStore((s) => s.progress);
  const fallback = (userId && storeProgress[userId]) || {};

  return useQuery({
    queryKey: ['progress', 'all'],
    queryFn: async () => {
      const result = await fetchAllProgress();
      if (result.success && result.data) return result.data;
      return fallback;
    },
    initialData: fallback,
  });
};

/**
 * Mark a lesson as complete.
 */
export const useMarkComplete = () => {
  const queryClient = useQueryClient();
  const storeMarkComplete = useLmsStore((s) => s.markLessonComplete);

  return useMutation({
    mutationFn: async ({ courseId, lessonId, userId }) => {
      if (isSupabaseConfigured) {
        const result = await markLessonComplete(courseId, lessonId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeMarkComplete(courseId, lessonId, userId);
      return null;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'all'] });
    },
  });
};
