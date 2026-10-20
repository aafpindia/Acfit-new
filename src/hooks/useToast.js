import { toast } from 'react-hot-toast';

export const useToast = () => {
  const options = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#FFFFFF',
      color: '#111827',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
      fontSize: '0.875rem',
      fontWeight: 500,
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
    }
  };

  return {
    success: (message, opts) => 
      toast.success(message, { ...options, ...opts }),
    error: (message, opts) => 
      toast.error(message, { ...options, ...opts, style: { ...options.style, border: '1px solid #FEE2E2', color: '#DC2626' } }),
    loading: (message, opts) => 
      toast.loading(message, { ...options, ...opts }),
    dismiss: (toastId) => toast.dismiss(toastId),
    toast
  };
};

export default useToast;
