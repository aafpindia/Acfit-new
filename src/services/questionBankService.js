import { supabase, isSupabaseConfigured, handleSupabaseError, handleSuccess, getCurrentUserId, isValidUuid } from './supabaseService';

const CACHE_KEY = '_lms_questions_bank';

const DEFAULT_QUESTIONS = [
  {
    id: 'q-bank-1',
    question: 'What is the primary role of protein in workout recovery?',
    category: 'Nutrition',
    difficulty: 'Easy',
    type: 'mcq',
    options: [
      { text: 'Muscle repair and synthesis', isCorrect: true },
      { text: 'Glycogen replenishment only', isCorrect: false },
      { text: 'Hydration enhancement', isCorrect: false }
    ],
    explanation: 'Protein provides the essential amino acids required to repair and rebuild muscle tissues damaged during workouts.'
  },
  {
    id: 'q-bank-2',
    question: 'True or False: Isometric muscle contractions involve zero joint movement.',
    category: 'Fitness',
    difficulty: 'Medium',
    type: 'boolean',
    options: [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false }
    ],
    explanation: 'True. In isometric contractions, the muscle tension increases but the muscle length does not change and joint angle remains static.'
  }
];

const getLocalQuestions = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[questionBankService] Failed to read cached questions:', e);
  }
  return DEFAULT_QUESTIONS;
};

const setLocalQuestions = (questions) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(questions));
  } catch (e) {
    console.warn('[questionBankService] Failed to save questions to cache:', e);
  }
};

/**
 * Fetch questions from Supabase PostgreSQL question_bank table with localStorage fallback.
 */
export const fetchQuestionBank = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted = data.map(q => ({
          id: q.id,
          question: q.question,
          category: q.category || 'General',
          difficulty: q.difficulty || 'Medium',
          type: q.type || 'mcq',
          options: q.options || [],
          explanation: q.explanation || '',
          createdAt: q.created_at,
          source: 'database',
        }));
        setLocalQuestions(formatted);
        return handleSuccess(formatted);
      }
    } catch (err) {
      console.warn('[questionBankService] Database fetch error, using local cache:', err);
    }
  }

  return handleSuccess(getLocalQuestions());
};

/**
 * Add a new question to the central question bank.
 */
export const createQuestionInBank = async (questionData) => {
  const newId = crypto.randomUUID();
  const currentUserId = await getCurrentUserId();

  const formatted = {
    id: newId,
    question: questionData.question,
    category: questionData.category || 'General',
    difficulty: questionData.difficulty || 'Medium',
    type: questionData.type || 'mcq',
    options: questionData.options || [],
    explanation: questionData.explanation || 'No explanation provided.',
    createdAt: new Date().toISOString(),
    source: 'local',
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('question_bank')
        .insert({
          id: newId,
          question: formatted.question,
          category: formatted.category,
          difficulty: formatted.difficulty,
          type: formatted.type,
          options: formatted.options,
          explanation: formatted.explanation,
          created_by: isValidUuid(currentUserId) ? currentUserId : null,
        })
        .select()
        .single();

      if (!error && data) {
        formatted.id = data.id;
        formatted.source = 'database';
      }
    } catch (dbErr) {
      console.warn('[questionBankService] Database insert failed, saving locally:', dbErr);
    }
  }

  // Update local cache
  const localList = getLocalQuestions();
  const updated = [formatted, ...localList.filter(q => q.id !== formatted.id)];
  setLocalQuestions(updated);

  return handleSuccess(formatted);
};

/**
 * Delete a question from the central question bank.
 */
export const deleteQuestionFromBank = async (questionId) => {
  if (isSupabaseConfigured && isValidUuid(questionId)) {
    try {
      const { error } = await supabase
        .from('question_bank')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.warn('[questionBankService] Database delete notice:', error.message);
      }
    } catch (dbErr) {
      console.warn('[questionBankService] Database delete exception:', dbErr);
    }
  }

  // Remove from local cache
  const localList = getLocalQuestions();
  const filtered = localList.filter(q => q.id !== questionId);
  setLocalQuestions(filtered);

  return handleSuccess({ id: questionId });
};

