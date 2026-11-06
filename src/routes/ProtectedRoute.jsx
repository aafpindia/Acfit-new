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
    const userEmail = (user.email || '').toLowerCase().trim();

    // 1. Check if user is suspended
    if (user.status === 'suspended') {
      signOut?.();
      return <Navigate to="/login?suspended=true" replace />;
    }

    // 2. Check revoked blacklist
    try {
      const revokedRaw = localStorage.getItem('_lms_revoked_users');
      if (revokedRaw) {
        const revokedList = JSON.parse(revokedRaw);
        const isRevoked = revokedList.some(
          (r) => (user.id && r.id === user.id) || (userEmail && r.email?.toLowerCase().trim() === userEmail)
        );
        if (isRevoked) {
          signOut?.();
          return <Navigate to="/login?revoked=true" replace />;
        }
      }
    } catch (_) {}

    // 3. For non-admin accounts, check if account was removed from registered users
    if ((user.role || '').toLowerCase() !== 'admin') {
      try {
        const regRaw = localStorage.getItem('_lms_registered_users');
        if (regRaw) {
          const registered = JSON.parse(regRaw);
          const found = registered.find(
            (u) => (user.id && u.id === user.id) || (userEmail && (u.email || '').toLowerCase().trim() === userEmail)
          );
          if (!found) {
            console.warn('[ProtectedRoute] User removed from user management. Revoking session.');
            signOut?.();
            return <Navigate to="/login?revoked=true" replace />;
          }
          if (found.status === 'suspended') {
            console.warn('[ProtectedRoute] User status is suspended. Revoking session.');
            signOut?.();
            return <Navigate to="/login?suspended=true" replace />;
          }
        }
      } catch (_) {}
    }
  }

  if (!authenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
