import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserEnrollments, fetchAllEnrollments } from '../services/enrollmentService';
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
 * Dispatches a single atomic enrollment & payment transaction through lmsStore.enrollInCourse,
 * preventing duplicate payment insertions and duplicate enrollments.
 */
export const useEnroll = () => {
  const queryClient = useQueryClient();
  const storeEnroll = useLmsStore((s) => s.enrollInCourse);

  return useMutation({
    mutationFn: async ({ courseId, userId, paymentData }) => {
      // Delegate atomically to lmsStore which handles both optimistic local updates
      // and database persistence (enrollUserDb + createPaymentDb + syncFromSupabase)
      await storeEnroll(courseId, userId, paymentData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
