import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess } from './supabaseService';

const defaultSettings = {
  platformName: 'ACFIT Academy',
  contactEmail: 'support@acfitacademy.com',
  razorpayKey: '',
  currency: 'INR',
  bunnyLibraryId: '',
  bunnyApiKey: '',
};

/**
 * Fetch system settings.
 * Falls back to default values if table is unmigrated or row doesn't exist.
 */
export const fetchSettings = async () => {
  if (!isSupabaseConfigured) return handleSuccess(defaultSettings);

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      console.warn('System settings not found in database. Using default fallback settings.');
      return handleSuccess(defaultSettings);
    }

    return handleSuccess({
      platformName: data.platform_name,
      contactEmail: data.contact_email,
      razorpayKey: data.razorpay_key,
      currency: data.currency,
      bunnyLibraryId: data.bunny_library_id,
      bunnyApiKey: data.bunny_api_key,
    });
  } catch (err) {
    console.warn('Could not read system settings from database:', err);
    return handleSuccess(defaultSettings);
  }
};

/**
 * Update system settings (admin only).
 */
export const updateSettings = async (settings) => {
  if (!isSupabaseConfigured) return handleSuccess(settings);

  const updatePayload = { updated_at: new Date().toISOString() };
  if (settings.platformName !== undefined) updatePayload.platform_name = settings.platformName;
  if (settings.contactEmail !== undefined) updatePayload.contact_email = settings.contactEmail;
  if (settings.razorpayKey !== undefined) updatePayload.razorpay_key = settings.razorpayKey;
  if (settings.currency !== undefined) updatePayload.currency = settings.currency;
  if (settings.bunnyLibraryId !== undefined) updatePayload.bunny_library_id = settings.bunnyLibraryId;
  if (settings.bunnyApiKey !== undefined) updatePayload.bunny_api_key = settings.bunnyApiKey;

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ id: 1, ...updatePayload }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.warn('Failed to persist settings changes to DB. Applying locally only.', error);
      return handleSuccess(settings);
    }

    return handleSuccess({
      platformName: data.platform_name,
      contactEmail: data.contact_email,
      razorpayKey: data.razorpay_key,
      currency: data.currency,
      bunnyLibraryId: data.bunny_library_id,
      bunnyApiKey: data.bunny_api_key,
    });
  } catch (err) {
    console.warn('Failed to update system settings in database:', err);
    return handleSuccess(settings);
  }
};
