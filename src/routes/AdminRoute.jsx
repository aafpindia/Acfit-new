import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, role, authenticated, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
          Authenticating Admin Security Privileges...
        </p>
      </div>
    );
  }

  // Active check if current user was removed or revoked by administrator (Admin accounts immune)
  if (user) {
    const userEmail = (user.email || '').toLowerCase().trim();
    const isAdmin = userEmail === 'admin@gmail.com' || (user.role || '').toLowerCase() === 'admin';

    if (!isAdmin) {
      if (user.status === 'suspended') {
        signOut?.();
        return <Navigate to="/login?suspended=true" replace />;
      }

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
    }
  }

  if (!authenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (role || user?.role || '').toUpperCase();
  if (userRole !== 'ADMIN') {
    // If a normal USER attempts to access /admin/*, redirect to /app/dashboard or /unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AdminRoute;
