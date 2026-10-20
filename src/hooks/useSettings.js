import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, updateSettings } from '../services/settingsService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch system settings.
 */
export const useSettings = () => {
  const storeSettings = useLmsStore((s) => s.systemSettings);

  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await fetchSettings();
      if (result.success && result.data) return result.data;
      return storeSettings;
    },
    initialData: storeSettings,
  });
};

/**
 * Update system settings.
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const storeUpdateSettings = useLmsStore((s) => s.updateSystemSettings);

  return useMutation({
    mutationFn: async (settings) => {
      if (isSupabaseConfigured) {
        const result = await updateSettings(settings);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      storeUpdateSettings(settings);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};
