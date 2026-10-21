import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollUser, fetchUserEnrollments, fetchAllEnrollments } from '../services/enrollmentService';
import { createPayment } from '../services/paymentService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch current user's enrollments.
 */
export const useUserEnrollments = () => {
  const storeEnrollments = useLmsStore((s) => s.enrollments);

  return useQuery({
    queryKey: ['enrollments', 'user'],
    queryFn: async () => {
      const result = await fetchUserEnrollments();
      if (result.success && result.data) return result.data;
      return storeEnrollments;
    },
    initialData: storeEnrollments,
    staleTime: 1000 * 30,
  });
};

/**
 * Fetch ALL enrollments (admin).
 */
export const useAllEnrollments = () => {
  const storeEnrollments = useLmsStore((s) => s.enrollments);

  return useQuery({
    queryKey: ['enrollments', 'all'],
    queryFn: async () => {
      const result = await fetchAllEnrollments();
      if (result.success && result.data) return result.data;
      return storeEnrollments;
    },
    initialData: storeEnrollments,
  });
};

/**
 * Enroll the current user in a course.
 * Also creates a payment record.
 * Falls back to local Zustand store if DB operations fail.
 */
export const useEnroll = () => {
  const queryClient = useQueryClient();
  const storeEnroll = useLmsStore((s) => s.enrollInCourse);

  return useMutation({
    mutationFn: async ({ courseId, userId, paymentData }) => {
      // Always update the local Zustand store first so the UI reflects immediately
      storeEnroll(courseId, userId, paymentData);

      if (isSupabaseConfigured) {
        // Try DB enrollment with explicit userId — don't throw on failure, just log
        const enrollResult = await enrollUser(courseId, userId);
        if (!enrollResult.success) {
          console.warn('[useEnroll] DB enrollment notice, local store active:', enrollResult.error);
        }

        // Try recording payment — don't throw on failure
        if (paymentData) {
          try {
            await createPayment(paymentData);
          } catch (payErr) {
            console.warn('[useEnroll] Payment record failed:', payErr.message);
          }
        }

        return enrollResult?.data;
      }

      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
