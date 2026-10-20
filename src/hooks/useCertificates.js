import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserCertificates, fetchAllCertificates, issueCertificate } from '../services/certificateService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch current user's certificates.
 */
export const useUserCertificates = () => {
  const storeCertificates = useLmsStore((s) => s.certificates);

  return useQuery({
    queryKey: ['certificates', 'user'],
    queryFn: async () => {
      const result = await fetchUserCertificates();
      if (result.success && result.data) return result.data;
      return storeCertificates;
    },
    initialData: storeCertificates,
  });
};

/**
 * Fetch all certificates (admin).
 */
export const useAllCertificates = () => {
  const storeCertificates = useLmsStore((s) => s.certificates);

  return useQuery({
    queryKey: ['certificates', 'all'],
    queryFn: async () => {
      const result = await fetchAllCertificates();
      if (result.success && result.data) return result.data;
      return storeCertificates;
    },
    initialData: storeCertificates,
  });
};

/**
 * Issue a certificate.
 */
export const useIssueCertificate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, fullName, courseTitle }) => {
      if (isSupabaseConfigured) {
        const result = await issueCertificate(courseId, fullName, courseTitle);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
  });
};
