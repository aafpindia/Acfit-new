import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllPayments, fetchUserPayments, createPayment, normalizePaymentRecord } from '../services/paymentService';
import { isSupabaseConfigured } from '../config/supabase';
import { useLmsStore } from '../stores/lmsStore';

/**
 * Fetch all payments (Admin View).
 * Combines & deduplicates live Supabase DB records with Zustand store payments.
 */
export const usePayments = () => {
  const storePayments = useLmsStore((s) => s.payments);

  return useQuery({
    queryKey: ['payments', 'all'],
    queryFn: async () => {
      const map = new Map();

      // 1. Add Zustand local payments
      (storePayments || []).forEach((p) => {
        const norm = normalizePaymentRecord(p);
        if (norm && norm.id) map.set(norm.id, norm);
      });

      // 2. Fetch Supabase DB payments if available
      try {
        const result = await fetchAllPayments();
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((p) => {
            const norm = normalizePaymentRecord(p);
            if (norm && norm.id) map.set(norm.id, norm);
          });
        }
      } catch (err) {
        console.warn('fetchAllPayments error:', err);
      }

      const list = Array.from(map.values());
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    initialData: (storePayments || []).map(normalizePaymentRecord),
    refetchInterval: 15000,
  });
};

/**
 * Fetch current user's payments (User View).
 * Combines & deduplicates DB records with local store records filtered by user.
 */
export const useUserPayments = (user = null) => {
  const storePayments = useLmsStore((s) => s.payments);

  return useQuery({
    queryKey: ['payments', 'user', user?.id || 'guest'],
    queryFn: async () => {
      const map = new Map();

      // 1. Local store payments matching current user
      (storePayments || []).forEach((p) => {
        const norm = normalizePaymentRecord(p);
        if (norm) {
          const isOwner =
            !user ||
            norm.userId === user.id ||
            norm.user_id === user.id ||
            (norm.studentEmail && user.email && norm.studentEmail.toLowerCase() === user.email.toLowerCase());
          if (isOwner) {
            map.set(norm.id, norm);
          }
        }
      });

      // 2. Database payments for current user
      try {
        const result = await fetchUserPayments(user?.email);
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((p) => {
            const norm = normalizePaymentRecord(p);
            if (norm && norm.id) map.set(norm.id, norm);
          });
        }
      } catch (err) {
        console.warn('fetchUserPayments error:', err);
      }

      const list = Array.from(map.values());
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    initialData: (storePayments || [])
      .map(normalizePaymentRecord)
      .filter((p) => !user || p.userId === user.id || (p.studentEmail && user.email && p.studentEmail.toLowerCase() === user.email.toLowerCase())),
    refetchInterval: 15000,
  });
};

/**
 * Create a payment record.
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      if (isSupabaseConfigured) {
        const result = await createPayment(paymentData);
        if (!result.success) throw new Error(result.error);
        return result.data;
      }
      return normalizePaymentRecord(paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
