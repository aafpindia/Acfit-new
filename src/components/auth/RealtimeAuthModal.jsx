import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  LogIn,
  UserPlus,
  Shield,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import acfitLogo from '../../assets/libraries/ACFIT-LOGO.webp';

export const RealtimeAuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { signIn, signUp } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      error('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    const res = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (res.success) {
      success(`Welcome back! Logged in as ${loginEmail}`);
      onClose();
      const role = (res.role || '').toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin/courses');
      } else {
        navigate('/app/courses');
      }
    } else {
      error(res.error || 'Invalid credentials.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      error('Please complete all signup fields.');
      return;
    }

    setIsLoading(true);
    const res = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (res.success) {
      success(`Account created for ${signupName}! Entering portal...`);
      onClose();
      navigate('/app/courses');
    } else {
      error(res.error || 'Registration failed.');
    }
  };

  if (!isOpen) return null;

  const isLogin = mode === 'login';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent isOpen={isOpen} hideCloseButton={false} className="max-w-md bg-white border border-stone-200/80 shadow-2xl rounded-2xl p-0 font-sans overflow-hidden">
        
        {/* ─── Header Banner ─── */}
        <div className="relative overflow-hidden p-6 pb-5 border-b border-stone-100" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 60%, #FFE082 100%)' }}>
          
          {/* Decorative blur */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#2563EB]/5 blur-2xl" />

          <div className="flex items-center justify-between relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <img src={acfitLogo} alt="ACFIT Academy" className="h-9 w-auto object-contain" />
            </div>

            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isLogin ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/15' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
              {isLogin ? <Shield className="h-2.5 w-2.5" /> : <Award className="h-2.5 w-2.5" />}
              {isLogin ? 'SIGN IN' : 'REGISTER'}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-stone-200/60 relative z-10 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isLogin
                  ? 'bg-[#1A1A1A] text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isLogin
                  ? 'bg-[#1A1A1A] text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <UserPlus className="h-3.5 w-3.5" /> Sign Up
            </button>
          </div>
        </div>

        {/* ─── Form Content ─── */}
        <div className="p-6 space-y-5 bg-white">
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>Email Address</label>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
                  required
                  className="h-11 text-sm rounded-xl bg-[#FAF9F5] border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-stone-600 cursor-pointer p-1">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                  className="h-11 text-sm rounded-xl bg-[#FAF9F5] border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-11 text-sm font-bold rounded-full bg-[#1A1A1A] text-white shadow-lg hover:bg-[#2563EB] hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>Full Name</label>
                <Input
                  placeholder="Your full name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  leftIcon={<User className="h-4 w-4 text-stone-400" />}
                  required
                  className="h-11 text-sm rounded-xl bg-[#FAF9F5] border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>Email Address</label>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
                  required
                  className="h-11 text-sm rounded-xl bg-[#FAF9F5] border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-stone-400 hover:text-stone-600 cursor-pointer p-1">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                  className="h-11 text-sm rounded-xl bg-[#FAF9F5] border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-[#2563EB] focus:ring-[#2563EB]/10"
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-11 text-sm font-bold rounded-full bg-[#1A1A1A] text-white shadow-lg hover:bg-[#2563EB] hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>

        {/* ─── Footer ─── */}
        <DialogFooter className="px-6 py-4 bg-[#FAF9F5] border-t border-stone-100 flex items-center justify-center">
          <p className="text-xs text-stone-500 font-medium text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Sign Up Free →
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Sign In →
                </button>
              </>
            )}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RealtimeAuthModal;
