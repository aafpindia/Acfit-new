import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Shield, Star, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import acfitLogo from '../../assets/libraries/ACFIT-LOGO.webp';
import cfrPng from '../../assets/libraries/cfr.png';
import heroTrainerCutout from '../../assets/libraries/hero_trainer_cutout.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { signIn } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    const res = await signIn(values.email, values.password);
    setIsLoading(false);

    if (res.success) {
      success('Signed in successfully!');
      const redirectFromState = location.state?.from?.pathname;
      if (redirectFromState && !redirectFromState.includes('/login')) {
        navigate(redirectFromState, { replace: true });
      } else {
        const userRole = (res.role || '').toUpperCase();
        if (userRole === 'ADMIN') {
          navigate('/admin/courses', { replace: true });
        } else {
          navigate('/app/courses', { replace: true });
        }
      }
    } else {
      error(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans selection:bg-[#2563EB] selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ─────────────────────────────────────────────────── */}
      {/* LEFT: ACFIT Branded Visual Panel                   */}
      {/* ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] relative overflow-hidden flex-col" style={{ background: 'linear-gradient(160deg, #FFF8E1 0%, #FFECB3 35%, #FFE082 70%, #FFD54F 100%)' }}>
        
        {/* Decorative Blurs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/25 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-[#2563EB]/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-amber-300/20 blur-3xl" />

        {/* Top Nav: Logo + Back Button */}
        <div className="relative z-20 flex items-center justify-between px-8 xl:px-12 pt-8">
          <Link to="/" className="group">
            <img src={acfitLogo} alt="ACFIT Academy" className="h-12 xl:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200/60 text-stone-700 text-xs font-bold hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center px-8 xl:px-14">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="relative z-10 max-w-lg w-full space-y-8"
          >
            {/* Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-amber-300/50 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[10px] font-black text-stone-700 uppercase tracking-[0.15em]">ACFIT ACADEMY for Fitness Professionals</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-[900] text-[#1A1A1A] tracking-tight leading-[1.05]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Welcome Back<br />
                <span className="text-[#2563EB]">Champion.</span>
              </h1>
              <p className="text-[15px] text-stone-600 font-medium leading-relaxed max-w-sm">
                Continue your certification journey with India's most trusted fitness education platform.
              </p>
            </div>

            {/* Hero Character + Floating Badges */}
            <div className="relative flex items-end justify-center">
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                src={heroTrainerCutout}
                alt="ACFIT Certified Trainer"
                className="h-[280px] xl:h-[340px] w-auto object-contain drop-shadow-2xl z-10"
              />
              {/* CFR PRO STANDARD Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="absolute top-4 -left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-stone-200/80 p-2.5 flex items-center gap-2.5"
              >
                <img src={cfrPng} alt="CFR PRO" className="h-8 w-8 object-contain rounded-md" />
                <div>
                  <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-wider block">CFR PRO STANDARD</span>
                  <span className="text-[8px] text-stone-500 font-bold block">Corrective Specialist</span>
                </div>
              </motion.div>



              {/* Star Rating Badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.65 }}
                className="absolute bottom-2 left-0 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-stone-200/80 px-3 py-2 flex items-center gap-2"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-stone-700">4.9 / 5</span>
              </motion.div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-stone-200/40">
              {[
                { value: '10+', label: 'Years Excellence' },
                { value: '5,000+', label: 'Certified Trainers' },
                { value: 'NCCA', label: 'Accredited' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <span className="text-lg font-[900] text-[#1A1A1A] block" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</span>
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* RIGHT: Login Form Panel                            */}
      {/* ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#FAF9F5]">
        
        {/* Mobile Header Banner with Hero Trainer Cutout */}
        <div className="lg:hidden relative overflow-hidden px-5 pt-6 pb-5 border-b border-stone-200/80" style={{ background: 'linear-gradient(145deg, #FFF8E1 0%, #FFECB3 50%, #FFE082 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <img src={acfitLogo} alt="ACFIT Academy" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200/80 text-stone-700 text-xs font-bold shadow-xs hover:bg-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1.5 max-w-[220px] sm:max-w-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-amber-300/60 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[9px] font-black text-stone-700 uppercase tracking-wider">ACFIT PORTAL</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-[900] text-[#1A1A1A] tracking-tight leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Welcome Back <span className="text-[#2563EB]">Champion.</span>
              </h2>
              <p className="text-xs text-stone-600 font-medium line-clamp-2">
                Continue your learning portal & certification journey.
              </p>
            </div>

            <div className="relative shrink-0 flex items-end justify-center">
              <img
                src={heroTrainerCutout}
                alt="ACFIT Certified Trainer"
                className="h-28 sm:h-36 w-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="w-full max-w-[420px] space-y-6 sm:space-y-8"
          >
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-3xl font-[900] text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Sign In
              </h1>
              <p className="text-sm text-stone-500 font-medium">
                Enter your credentials to access your learning portal.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Email</label>
                <Input
                  placeholder="name@example.com"
                  type="email"
                  leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
                  error={errors.email?.message}
                  {...register('email')}
                  className="h-12 text-sm border-stone-200 bg-white focus:border-[#2563EB] rounded-xl shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-[#2563EB] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                  className="h-12 text-sm border-stone-200 bg-white focus:border-[#2563EB] rounded-xl shadow-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full h-13 text-sm font-bold rounded-full bg-[#1A1A1A] hover:bg-[#2563EB] text-white shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Sign In to ACFIT Academy
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#FAF9F5] px-4 text-stone-400 font-medium">New to ACFIT?</span>
              </div>
            </div>

            {/* Sign Up CTA */}
            <div className="text-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-stone-200 text-stone-700 font-bold text-sm hover:border-[#2563EB] hover:text-[#2563EB] transition-all duration-300 cursor-pointer hover:shadow-md"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Create Free Account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2">
              {['Trusted by 5,000+ trainers', 'NCCA Accredited', '10+ Years'].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-stone-400 font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-[10px] text-stone-400 font-medium">
                © {new Date().getFullYear()} ACFIT Academy × NASM India. All rights reserved.
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
