import { supabase, isSupabaseConfigured } from './supabaseService';

const MOCK_STORAGE_KEY = '_lms_mock_enquiries';
let isTableMissing = false;

const DEFAULT_MOCK_ENQUIRIES = [
  {
    id: 'enq-101',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    message: 'I would like to inquire about the NASM CPT weekend workshop batch start dates and fee structure.',
    status: 'pending',
    source: 'landing_modal',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'enq-102',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    message: 'Interested in Certified Nutrition Coach (CNC) course details. Are practical study kits provided?',
    status: 'contacted',
    source: 'landing_modal',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'enq-103',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    message: 'Looking for corporate fitness trainer certification packages for our gym chain instructors.',
    status: 'resolved',
    source: 'landing_modal',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  }
];

const getLocalEnquiries = () => {
  try {
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_ENQUIRIES));
      return DEFAULT_MOCK_ENQUIRIES;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_MOCK_ENQUIRIES;
  }
};

const saveLocalEnquiries = (enquiries) => {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(enquiries));
  } catch (e) {
    console.error('Failed to save enquiries to localStorage:', e);
  }
};

/**
 * Submit a new enquiry from landing modal or contact form.
 */
export const submitEnquiry = async ({ name, email, message, source = 'landing_modal' }) => {
  const newEnquiry = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    status: 'pending',
    source,
    created_at: new Date().toISOString()
  };

  if (!isSupabaseConfigured || isTableMissing) {
    const localList = getLocalEnquiries();
    const createdLocal = { ...newEnquiry, id: 'enq-' + Date.now() };
    saveLocalEnquiries([createdLocal, ...localList]);
    return createdLocal;
  }

  try {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([newEnquiry])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
        isTableMissing = true;
      }
      throw error;
    }
    return data;
  } catch (err) {
    const localList = getLocalEnquiries();
    const createdLocal = { ...newEnquiry, id: 'enq-' + Date.now() };
    saveLocalEnquiries([createdLocal, ...localList]);
    return createdLocal;
  }
};

/**
 * Fetch all enquiries.
 */
export const getEnquiries = async () => {
  if (!isSupabaseConfigured || isTableMissing) {
    return getLocalEnquiries();
  }

  try {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
        isTableMissing = true;
      }
      return getLocalEnquiries();
    }
    if (data && data.length > 0) {
      saveLocalEnquiries(data);
      return data;
    }
    return getLocalEnquiries();
  } catch (err) {
    isTableMissing = true;
    return getLocalEnquiries();
  }
};

/**
 * Update enquiry status ('pending' | 'contacted' | 'resolved' | 'archived')
 */
export const updateEnquiryStatus = async (id, status) => {
  const localList = getLocalEnquiries();
  const updated = localList.map((item) => (String(item.id) === String(id) ? { ...item, status } : item));
  saveLocalEnquiries(updated);

  if (!isSupabaseConfigured || isTableMissing) {
    return updated.find((item) => String(item.id) === String(id));
  }

  try {
    const { data, error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.status === 404) {
        isTableMissing = true;
      }
    } else if (data) {
      return data;
    }
  } catch (err) {
    isTableMissing = true;
  }

  return updated.find((item) => String(item.id) === String(id));
};

/**
 * Delete an enquiry by ID.
 */
export const deleteEnquiry = async (id) => {
  const localList = getLocalEnquiries();
  const filtered = localList.filter((item) => String(item.id) !== String(id));
  saveLocalEnquiries(filtered);

  if (!isSupabaseConfigured || isTableMissing) {
    return;
  }

  try {
    const { error } = await supabase
      .from('enquiries')
      .delete()
      .eq('id', id);

    if (error && (error.code === 'PGRST205' || error.status === 404)) {
      isTableMissing = true;
    }
  } catch (err) {
    isTableMissing = true;
  }
};
