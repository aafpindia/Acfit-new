import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Mail, Lock, Dumbbell, ArrowLeft, Shield } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export const AdminLogin = () => {
  const { signIn, user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn(email, password);
      setIsLoading(false);

      if (res.success) {
        const currentUser = user || res.user;
        const role = (currentUser?.role || res.role || '').toUpperCase();

        if (role !== 'ADMIN') {
          success('Signed in successfully!');
          navigate('/app/courses', { replace: true });
          return;
        }

        success('Welcome back, Admin!');
        navigate('/admin/courses', { replace: true });
      } else {
        error(res.error || 'Invalid credentials.');
      }
    } catch (err) {
      setIsLoading(false);
      error(err.message || 'Authentication error.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col justify-between font-sans selection:bg-[#4F46E5] selection:text-white">
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">ACFIT Academy</span>
          <span className="text-[10px] font-bold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded-md border border-blue-100">
            Admin Portal
          </span>
        </Link>

        <button
          onClick={() => navigate('/login')}
          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs h-8 px-3.5 gap-1.5 flex items-center transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
          <span>User Sign In</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-9 space-y-6">
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider w-fit mx-auto mb-1 border border-blue-100">
              <Shield className="h-3.5 w-3.5 text-[#4F46E5]" /> Admin Portal
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Sign In</h2>
            <p className="text-xs text-slate-500 font-normal">
              Enter administrator credentials to access platform controls.
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <Input
                placeholder="admin@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                required
                className="h-10 text-xs border-slate-200 bg-white focus:border-[#4F46E5]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
                required
                className="h-10 text-xs border-slate-200 bg-white focus:border-[#4F46E5]"
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-10 text-xs font-bold rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs gap-2 cursor-pointer transition-colors mt-2"
            >
              Sign In as Admin
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Looking for user sign in?{' '}
            <Link to="/login" className="text-[#4F46E5] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-center text-[11px] text-slate-500 shrink-0">
        ACFIT Academy &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AdminLogin;
