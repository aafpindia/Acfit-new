import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement } from '../services/announcementService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch all announcements.
 */
export const useAnnouncements = () => {
  const storeAnnouncements = useLmsStore((s) => s.announcements);

  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const result = await fetchAnnouncements();
      if (result.success && result.data) return result.data;
      return storeAnnouncements;
    },
    initialData: storeAnnouncements,
  });
};

/**
 * Create a new announcement.
 */
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const storeAddAnnouncement = useLmsStore((s) => s.addAnnouncement);

  return useMutation({
    mutationFn: async ({ title, body, target }) => {
      if (isSupabaseConfigured) {
        const result = await createAnnouncement(title, body, target);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeAddAnnouncement(title, body, target);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

/**
 * Delete an announcement.
 */
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  const storeDeleteAnnouncement = useLmsStore((s) => s.deleteAnnouncement);

  return useMutation({
    mutationFn: async (announcementId) => {
      if (isSupabaseConfigured) {
        const result = await deleteAnnouncement(announcementId);
        if (!result.success) throw new Error(result.error);
        return null;
      }
      storeDeleteAnnouncement(announcementId);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};
