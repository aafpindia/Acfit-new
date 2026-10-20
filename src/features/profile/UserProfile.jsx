import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { useNavigate } from 'react-router-dom';
import { getStoredAvatar } from '../../lib/apiClient';
import {
  Mail,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  Edit3,
  ShieldCheck,
  Save,
  GraduationCap,
  FileText,
  Upload,
  Camera,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'react-hot-toast';

export const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const { courses, certificates, syncFromSupabase } = useLmsStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const userId = user?.id || '';
  const storedAvatar = getStoredAvatar(userId, user?.email);

  // Tab state: 'certificates' | 'settings'
  const [activeTab, setActiveTab] = useState('certificates');

  // Form state for DB sync
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
    location: user?.location || 'Chennai, Tamil Nadu',
    bio: user?.bio || 'Dedicated fitness enthusiast focusing on compound lifts, athletic conditioning circuits, and healthy nutrition plans.',
    avatarUrl: user?.avatarUrl || storedAvatar || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      syncFromSupabase(user);
      const persistentAvatar = user.avatarUrl || getStoredAvatar(user.id, user.email) || '';
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '+91 98765 43210',
        location: user.location || 'Chennai, Tamil Nadu',
        bio: user.bio || 'Dedicated fitness enthusiast focusing on compound lifts, athletic conditioning circuits, and healthy nutrition plans.',
        avatarUrl: persistentAvatar
      });
    }
  }, [user, syncFromSupabase]);

  // User certificates synced from DB
  const userCertificates = certificates.filter(c => c.userId === userId || c.userId === user?.email);

  // File upload handler for Avatar Image
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
      toast.success('📷 Image uploaded! Click "Save Profile Changes" to update your database profile.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
    toast.success('Profile image removed.');
  };

  // Save profile to backend DB
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await updateProfile({
        fullName: formData.fullName,
        avatarUrl: formData.avatarUrl,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone
      });

      if (res.success) {
        toast.success('✨ Profile saved & synced to database successfully!');
      } else {
        toast.error(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error('An error occurred while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } } };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 font-sans pb-16">
      
      {/* ─── SUBTLE PREMIUM EXECUTIVE BANNER CARD ─────────────────────── */}
      <motion.div variants={fadeUp} className="relative rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs text-slate-900 select-none">
        
        {/* Soft Ambient Subtle Glow Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EFF6FF]/80 via-indigo-50/40 to-slate-50/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 z-10">
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            
            {/* Avatar Container */}
            <div className="relative group shrink-0">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-blue-100 shadow-md bg-slate-50"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#EFF6FF] border-2 border-blue-100 text-[#2563EB] font-black text-4xl flex items-center justify-center shadow-2xs">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {/* Camera Upload Trigger */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-105"
                title="Upload New Profile Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Meta Information */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
                  {formData.fullName || 'Student Learner'}
                </h1>
                <span className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200" title="Verified Account">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="bg-[#EFF6FF] text-[#2563EB] font-mono text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border border-blue-100">
                  {user?.role === 'admin' ? 'INSTRUCTOR LEAD' : 'STUDENT MEMBER'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl line-clamp-2">
                {formData.bio}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500 pt-1">
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-[#2563EB]" /> {formData.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-emerald-600" /> {formData.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-rose-500" /> {formData.location}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-amber-500" /> Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Aug 2026'}</span>
              </div>
            </div>

          </div>

          {/* Edit Settings Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => setActiveTab('settings')}
              className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs h-9 px-4 rounded-xl gap-2 shadow-2xs cursor-pointer"
            >
              <Edit3 className="h-4 w-4 text-[#2563EB]" />
              <span>Edit Settings</span>
            </Button>
          </div>

        </div>

      </motion.div>

      {/* ─── SUBTLE TAB NAVIGATION BAR ────────────────────────────────── */}
      <motion.div variants={fadeUp} className="border-b border-slate-200 flex items-center gap-3 font-sans select-none">
        
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-5 py-3 font-extrabold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'certificates'
              ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="h-4.5 w-4.5 text-[#2563EB]" />
          <span>My Verified Certificates ({userCertificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 font-extrabold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Save className="h-4.5 w-4.5 text-[#2563EB]" />
          <span>Account Settings & Profile Photo</span>
        </button>

      </motion.div>

      {/* ─── TAB CONTENT VIEWS ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: VERIFIED CERTIFICATES */}
        {activeTab === 'certificates' && (
          <motion.div
            key="certificates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                  <span>Verified Completion Credentials ({userCertificates.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userCertificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {userCertificates.map((cert) => {
                      const targetCourse = courses.find(c => c.id === cert.courseId);
                      return (
                        <div key={cert.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 shadow-2xs hover:border-indigo-200 transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#2563EB] font-mono text-[9px] font-extrabold uppercase border border-blue-100">
                                OFFICIAL CREDENTIAL
                              </span>
                              <span className="text-xs font-bold text-slate-500 font-mono">
                                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Aug 2026'}
                              </span>
                            </div>
                            <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                              {targetCourse?.title || cert.courseTitle || 'ACFIT Certified Specialist'}
                            </h3>
                            <p className="text-xs font-mono text-slate-500">
                              Credential Identifier: <span className="font-bold text-slate-700">{cert.id}</span>
                            </p>
                          </div>

                          <Button
                            onClick={() => navigate(`/certificates/${cert.id}`)}
                            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs h-9 rounded-xl gap-2 cursor-pointer shadow-xs"
                          >
                            <FileText className="h-4 w-4" />
                            <span>View & Download Official PDF Certificate</span>
                            <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <GraduationCap className="h-10 w-10 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-extrabold text-slate-800">No Certificates Earned Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Complete all module lessons and pass the final certification assessment in an enrolled course to unlock your official verified certificate.
                    </p>
                    <Button
                      onClick={() => navigate('/app/dashboard')}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs h-9 px-4 rounded-xl gap-2 mt-2"
                    >
                      <span>Explore Enrolled Courses</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TAB 2: ACCOUNT SETTINGS & PROFILE PHOTO UPLOAD */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Card className="border-slate-200 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Save className="h-5 w-5 text-[#2563EB]" />
                  <span>Account Profile & Image Upload Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* DIRECT IMAGE FILE UPLOAD SECTION */}
                  <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-4">
                    <label className="block text-xs font-extrabold text-slate-900">
                      Profile Avatar Image <span className="text-[#2563EB]">(Direct File Upload)</span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      
                      {/* Live Image Preview */}
                      <div className="relative group shrink-0">
                        {formData.avatarUrl ? (
                          <img
                            src={formData.avatarUrl}
                            alt="Avatar Preview"
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-md bg-white"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-[#EFF6FF] border-2 border-blue-100 text-[#2563EB] font-bold text-2xl flex items-center justify-center">
                            {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      {/* Hidden Native File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        accept="image/png, image/jpeg, image/webp, image/jpg, image/gif"
                        className="hidden"
                      />

                      {/* Upload Box / Trigger Controls */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-xs"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Upload Image File</span>
                          </Button>

                          {formData.avatarUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRemoveAvatar}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-9 px-3 rounded-xl gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Remove Image</span>
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Supported formats: JPG, PNG, WEBP (Max 5MB). Image is processed and saved directly to your database profile.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* FORM FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="rounded-xl text-slate-900 font-semibold border-slate-300"
                        placeholder="e.g. Surya V"
                      />
                    </div>

                    {/* Email Address (Read-Only) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Email Address <span className="text-slate-400">(Verified Identity)</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        readOnly
                        disabled
                        className="rounded-xl text-slate-500 bg-slate-100 font-semibold border-slate-200 cursor-not-allowed"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Phone Number
                      </label>
                      <Input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-xl text-slate-900 font-semibold border-slate-300"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Location / City
                      </label>
                      <Input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="rounded-xl text-slate-900 font-semibold border-slate-300"
                        placeholder="e.g. Chennai, Tamil Nadu"
                      />
                    </div>

                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800">
                      About Me & Bio Summary
                    </label>
                    <Textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="rounded-xl text-slate-900 font-semibold border-slate-300"
                      placeholder="Share your athletic goals or personal fitness focus..."
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs h-10 px-6 rounded-xl gap-2 shadow-md cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving to Database...' : 'Save Profile Changes'}</span>
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
};

export default UserProfile;
