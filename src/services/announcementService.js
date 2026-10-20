import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';

/**
 * Fetch all announcements.
 */
export const fetchAnnouncements = async () => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return handleSupabaseError(error, 'fetchAnnouncements');

  return handleSuccess(data.map(a => ({
    id: a.id,
    title: a.title,
    body: a.body,
    target: a.target,
    date: a.created_at,
  })));
};

/**
 * Create a new announcement (admin only).
 */
export const createAnnouncement = async (title, body, target) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body, target })
    .select()
    .single();

  if (error) return handleSupabaseError(error, 'createAnnouncement');

  return handleSuccess({
    id: data.id,
    title: data.title,
    body: data.body,
    target: data.target,
    date: data.created_at,
  });
};

/**
 * Delete an announcement (admin only).
 */
export const deleteAnnouncement = async (announcementId) => {
  if (!isSupabaseConfigured) return { success: true, data: null };

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId);

  if (error) return handleSupabaseError(error, 'deleteAnnouncement');
  return handleSuccess(null);
};
