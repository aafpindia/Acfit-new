import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('[useAuth] Component rendered outside AuthProvider context tree. Returning safe fallback state.');
    return {
      user: null,
      session: null,
      role: null,
      authenticated: false,
      loading: true,
      login: async () => ({ data: null, error: 'Auth context uninitialized' }),
      logout: async () => {},
      signup: async () => ({ data: null, error: 'Auth context uninitialized' }),
      updateProfile: async () => ({ success: false, error: 'Auth context uninitialized' }),
      updatePassword: async () => ({ success: false, error: 'Auth context uninitialized' })
    };
  }
  return context;
};

export default useAuth;
