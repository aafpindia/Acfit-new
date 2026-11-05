import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { user, authenticated, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
          Verifying Security Session...
        </p>
      </div>
    );
  }

  // Active check if current user was removed or revoked by administrator
  if (user) {
    try {
      const revokedRaw = localStorage.getItem('_lms_revoked_users');
      if (revokedRaw) {
        const revokedList = JSON.parse(revokedRaw);
        const isRevoked = revokedList.some(
          (r) => (user.id && r.id === user.id) || (user.email && r.email?.toLowerCase() === user.email.toLowerCase())
        );
        if (isRevoked) {
          signOut?.();
          return <Navigate to="/login?revoked=true" replace />;
        }
      }
    } catch (_) {}
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
