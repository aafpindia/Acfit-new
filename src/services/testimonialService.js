import { supabase, isSupabaseConfigured, handleSuccess } from './supabaseService';

export const DEFAULT_TESTIMONIALS = [
  {
    id: 't-1',
    quote: "The NASM CPT certification through ACFIT transformed my coaching career. The scientific foundation and practical modules gave me immediate confidence with clients.",
    author: "Vikram Malhotra",
    role: "Senior Fitness Coach, Mumbai",
    cert: "ACFIT CFR PRO ALUMNI",
    rating: 5,
    is_active: true,
    display_order: 1
  },
  {
    id: 't-2',
    quote: "ACFIT's Nutrition Coach program is exceptionally well structured. The LMS video player and study guides made balancing learning with my work seamless.",
    author: "Ananya Deshmukh",
    role: "Sports Nutritionist, Bengaluru",
    cert: "NASM CNC Alumni",
    rating: 5,
    is_active: true,
    display_order: 2
  },
  {
    id: 't-3',
    quote: "The hands-on corrective exercise workshops are unmatched in India. ACFIT sets the gold standard for fitness education.",
    author: "Rahul Sharma",
    role: "Head Strength Coach, Delhi",
    cert: "CFR PRO Alumni",
    rating: 5,
    is_active: true,
    display_order: 3
  }
];

const LOCAL_STORAGE_KEY = 'acfit_testimonials_cms';
let isTableMissing = false;

export const getLocalTestimonials = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_TESTIMONIALS));
  } catch (e) {
    console.error('Failed to read testimonials from localStorage', e);
  }
  return DEFAULT_TESTIMONIALS;
};

export const saveLocalTestimonials = (items) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save testimonials to localStorage', e);
  }
};

/**
 * Fetch all testimonials (for Landing Page or Admin)
 */
export const fetchTestimonials = async () => {
  if (!isSupabaseConfigured || isTableMissing) {
    return handleSuccess(getLocalTestimonials());
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
        isTableMissing = true;
      }
      return handleSuccess(getLocalTestimonials());
    }

    if (!data || data.length === 0) {
      return handleSuccess(getLocalTestimonials());
    }

    saveLocalTestimonials(data);
    return handleSuccess(data);
  } catch (err) {
    isTableMissing = true;
    return handleSuccess(getLocalTestimonials());
  }
};

/**
 * Create a new testimonial
 */
export const createTestimonial = async (testimonialData) => {
  const newItem = {
    id: `t-${Date.now()}`,
    quote: testimonialData.quote || '',
    author: testimonialData.author || '',
    role: testimonialData.role || '',
    cert: testimonialData.cert || 'ACFIT CFR PRO ALUMNI',
    rating: Number(testimonialData.rating) || 5,
    is_active: testimonialData.is_active ?? true,
    display_order: Number(testimonialData.display_order) || 99,
    created_at: new Date().toISOString()
  };

  const currentLocal = getLocalTestimonials();
  const updatedLocal = [newItem, ...currentLocal];
  saveLocalTestimonials(updatedLocal);

  if (!isSupabaseConfigured || isTableMissing) {
    return handleSuccess(newItem);
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        quote: newItem.quote,
        author: newItem.author,
        role: newItem.role,
        cert: newItem.cert,
        rating: newItem.rating,
        is_active: newItem.is_active,
        display_order: newItem.display_order
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
        isTableMissing = true;
      }
      return handleSuccess(newItem);
    }

    if (data) {
      const syncedLocal = updatedLocal.map(t => String(t.id) === String(newItem.id) ? data : t);
      saveLocalTestimonials(syncedLocal);
      return handleSuccess(data);
    }
  } catch (err) {
    isTableMissing = true;
  }

  return handleSuccess(newItem);
};

/**
 * Update an existing testimonial
 */
export const updateTestimonial = async (id, updates) => {
  const currentLocal = getLocalTestimonials();
  const updatedLocal = currentLocal.map(t => 
    String(t.id) === String(id) ? { ...t, ...updates } : t
  );
  saveLocalTestimonials(updatedLocal);

  const updatedItem = updatedLocal.find(t => String(t.id) === String(id)) || { id, ...updates };

  if (!isSupabaseConfigured || isTableMissing || (typeof id === 'string' && id.startsWith('t-'))) {
    return handleSuccess(updatedItem);
  }

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
        isTableMissing = true;
      }
      return handleSuccess(updatedItem);
    }

    if (data) return handleSuccess(data);
  } catch (err) {
    isTableMissing = true;
  }

  return handleSuccess(updatedItem);
};

/**
 * Delete a testimonial
 */
export const deleteTestimonial = async (id) => {
  const currentLocal = getLocalTestimonials();
  const updatedLocal = currentLocal.filter(t => String(t.id) !== String(id));
  saveLocalTestimonials(updatedLocal);

  if (!isSupabaseConfigured || isTableMissing || (typeof id === 'string' && id.startsWith('t-'))) {
    return handleSuccess(null);
  }

  try {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);

    if (error && (error.code === 'PGRST205' || error.status === 404)) {
      isTableMissing = true;
    }
  } catch (err) {
    isTableMissing = true;
  }

  return handleSuccess(null);
};
