import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import { getStoredAvatar } from '../../lib/apiClient';
import {
  User,
  Image,
  Lock,
  Shield,
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  Bell,
  CheckCircle2,
  Key,
  Mail,
  Sparkles,
  Upload,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().optional()
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

const brandSchema = z.object({
  platformName: z.string().min(2, 'Platform name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  razorpayKey: z.string().min(1, 'Razorpay key is required'),
  bunnyStreamApiKey: z.string().min(1, 'Streaming key is required')
});

export const Settings = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { systemSettings, updateSystemSettings } = useLmsStore();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);

  const storedAvatar = getStoredAvatar(user?.id, user?.email);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      avatarUrl: user?.avatarUrl || storedAvatar || ''
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileValue('avatarUrl', reader.result);
      success('📷 Image uploaded! Click "Save Profile Changes" to save.');
    };
    reader.readAsDataURL(file);
  };

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm
  } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const {
    register: registerBrand,
    handleSubmit: handleBrandSubmit,
    formState: { errors: brandErrors }
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      platformName: systemSettings?.platformName || 'ACFIT Academy LMS',
      contactEmail: systemSettings?.contactEmail || 'support@acfitacademy.com',
      razorpayKey: systemSettings?.razorpayKey || 'rzp_test_5173_demo_key',
      bunnyStreamApiKey: systemSettings?.bunnyStreamApiKey || 'bunny_stream_live_key'
    }
  });

  const onProfileSubmit = async (values) => {
    setProfileLoading(true);
    const res = await updateProfile(values.fullName, values.avatarUrl || undefined);
    setProfileLoading(false);

    if (res.success) {
      success('Profile details updated successfully!');
    } else {
      toastError(res.error || 'Failed to update profile settings.');
    }
  };

  const onPasswordSubmit = async (values) => {
    setPasswordLoading(true);
    const res = await updatePassword(values.password);
    setPasswordLoading(false);

    if (res.success) {
      success('Admin password updated successfully!');
      resetPasswordForm();
    } else {
      toastError(res.error || 'Failed to change password.');
    }
  };

  const onBrandSubmit = (values) => {
    setBrandLoading(true);
    updateSystemSettings(values);
    setBrandLoading(false);
    success('Platform settings updated successfully!');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-6 font-sans pb-16"
    >
      {/* ─── Page Header Bar ────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-6 corner-crosshair shadow-tactile flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="h-7 w-7 text-primary" /> Platform Settings & Credentials
          </h1>
          <p className="font-mono text-xs text-slate-500">
            Configure system parameters, security credentials, gateway keys & platform preferences.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-border flex items-center justify-start gap-1 font-mono text-xs overflow-x-auto">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 font-bold whitespace-nowrap">
            👤 Profile Details
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 font-bold whitespace-nowrap">
            🔐 Security & Password
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="enterprise" className="rounded-xl px-4 py-2 font-bold whitespace-nowrap">
              ⚙️ Enterprise & Gateway
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Details Tab */}
        <TabsContent value="profile">
          <div className="tactile-card bg-white rounded-2xl p-6 corner-crosshair border border-border space-y-6">
            <div className="space-y-1 border-b border-border/70 pb-4">
              <span className="font-mono text-[10px] font-bold text-primary uppercase">● PUBLIC IDENTITY</span>
              <h2 className="text-lg font-black text-[#202124]">Profile Details</h2>
              <p className="font-mono text-xs text-slate-500">Update your account name and avatar photo</p>
            </div>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5 font-sans">
              <Input
                label="Full Name"
                placeholder="Alex Admin"
                leftIcon={<User className="h-4.5 w-4.5" />}
                error={profileErrors.fullName?.message}
                {...registerProfile('fullName')}
              />

              {/* Avatar Section with File Upload + URL Fallback */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-[#202124]">
                  Profile Avatar Image <span className="text-[#2563EB]">(Direct File Upload or URL)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Thumbnail Preview */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center font-black text-slate-700 shadow-2xs">
                    {watchProfile('avatarUrl') ? (
                      <img src={watchProfile('avatarUrl')} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{watchProfile('fullName')?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>

                  {/* Hidden Native File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png, image/jpeg, image/webp, image/jpg"
                    className="hidden"
                  />

                  {/* Actions & Input */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-xs"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Image File</span>
                      </Button>
                      {watchProfile('avatarUrl') && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProfileValue('avatarUrl', '')}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-9 px-3 rounded-xl gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>

                    <Input
                      placeholder="Or paste direct image URL (https://...)"
                      leftIcon={<Image className="h-4 w-4 text-slate-400" />}
                      error={profileErrors.avatarUrl?.message}
                      {...registerProfile('avatarUrl')}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={profileLoading}
                  className="tactile-btn-primary rounded-xl h-10 px-6 font-mono text-xs font-bold bg-primary text-white"
                >
                  Save Profile Changes →
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Security / Password Change Tab */}
        <TabsContent value="security">
          <div className="tactile-card bg-white rounded-2xl p-6 corner-crosshair border border-border space-y-6">
            <div className="space-y-1 border-b border-border/70 pb-4">
              <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase">● CLEARANCE PRIVILEGES</span>
              <h2 className="text-lg font-black text-[#202124]">Credentials & Password Security</h2>
              <p className="font-mono text-xs text-slate-500">Configure a new password to secure account access</p>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 font-sans">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4.5 w-4.5" />}
                error={passwordErrors.password?.message}
                {...registerPassword('password')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4.5 w-4.5" />}
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={passwordLoading}
                  className="tactile-btn-primary rounded-xl h-10 px-6 font-mono text-xs font-bold bg-primary text-white"
                >
                  Update Account Password →
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Enterprise & Gateway Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="enterprise">
            <div className="tactile-card bg-white rounded-2xl p-6 corner-crosshair border border-border space-y-6">
              <div className="space-y-1 border-b border-border/70 pb-4">
                <span className="font-mono text-[10px] font-bold text-blue-600 uppercase">● ENTERPRISE PARAMETERS</span>
                <h2 className="text-lg font-black text-[#202124]">Brand & Payment Gateway Configuration</h2>
                <p className="font-mono text-xs text-slate-500">Manage Razorpay keys, Bunny Stream credentials and platform title</p>
              </div>

              <form onSubmit={handleBrandSubmit(onBrandSubmit)} className="space-y-4 font-sans">
                <Input
                  label="Platform Brand Title"
                  placeholder="ACFIT Academy LMS"
                  leftIcon={<Globe className="h-4.5 w-4.5" />}
                  error={brandErrors.platformName?.message}
                  {...registerBrand('platformName')}
                />

                <Input
                  label="Support & Billing Contact Email"
                  placeholder="support@acfitacademy.com"
                  leftIcon={<Mail className="h-4.5 w-4.5" />}
                  error={brandErrors.contactEmail?.message}
                  {...registerBrand('contactEmail')}
                />

                <Input
                  label="Razorpay API Key ID (Demo/Live)"
                  placeholder="rzp_test_5173_demo_key"
                  leftIcon={<CreditCard className="h-4.5 w-4.5" />}
                  error={brandErrors.razorpayKey?.message}
                  {...registerBrand('razorpayKey')}
                />

                <Input
                  label="Bunny Stream Video API Key"
                  placeholder="bunny_stream_live_key"
                  leftIcon={<Key className="h-4.5 w-4.5" />}
                  error={brandErrors.bunnyStreamApiKey?.message}
                  {...registerBrand('bunnyStreamApiKey')}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    isLoading={brandLoading}
                    className="tactile-btn-primary rounded-xl h-10 px-6 font-mono text-xs font-bold bg-primary text-white"
                  >
                    Save Gateway Credentials →
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default Settings;
