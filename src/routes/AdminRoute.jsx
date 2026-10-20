import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, role, authenticated, loading } = useAuth();
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

  if (!authenticated) {
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
