import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  BookMarked,
  Image as ImageIcon,
  DollarSign,
  User,
  Tag,
  CheckCircle2,
  Globe,
  Lock,
  Sparkles,
  Layers,
  Upload,
  Check,
  Zap,
  Dumbbell
} from 'lucide-react';

import { useLmsStore } from '../../stores/lmsStore';

const PRESET_THUMBNAILS = [];

export const EditProgramDialog = ({
  isOpen,
  onClose,
  course,
  onSave
}) => {
  const { categories: storeCategories, courses } = useLmsStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    difficulty: '',
    instructor: '',
    thumbnail: '',
    published: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const categoryOptions = (storeCategories || []).map(c => ({ value: c, label: c }));

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        price: course.price !== undefined ? course.price : '',
        difficulty: course.difficulty || '',
        instructor: course.instructor || '',
        thumbnail: course.thumbnail || '',
        published: Boolean(course.published)
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        difficulty: '',
        instructor: '',
        thumbnail: '',
        published: false
      });
    }
  }, [course, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      await onSave(course.id, {
        ...formData,
        price: Number(formData.price) || 0
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent isOpen={isOpen} hideCloseButton={true} className="max-w-2xl bg-white border-2 border-border shadow-2xl rounded-2xl p-0 font-sans overflow-hidden corner-crosshair">
        {/* Dense Graph Paper Header Banner */}
        <div className="relative overflow-hidden graph-paper-dense p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold shadow-tactile-sm">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold text-slate-500 uppercase">[ SPEC // CONFIG ]</span>
              </div>
              <h3 className="text-lg font-black text-[#202124] tracking-tight flex items-center gap-2">
                Update Blueprint Settings
              </h3>
              <p className="font-mono text-[10px] text-slate-500 font-medium mt-0.5">
                Modify catalog profile, pricing, thumbnail cover art, and publication status.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <span
              className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs ${
                formData.published
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${formData.published ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {formData.published ? 'LIVE & PUBLISHED' : 'DRAFT MODE'}
            </span>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto font-sans">
          
          {/* Section 1: Basic Metadata */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#202124] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Zap className="h-3.5 w-3.5 text-primary" /> Basic Program Profile
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Program Title"
                placeholder="E.g. 1000 Days Muscle Building"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="text-xs font-semibold rounded-2xl border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50/70 focus:bg-white"
              />
              <Input
                label="Coach / Lead Instructor"
                placeholder="E.g. Coach Prem"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="text-xs font-semibold rounded-2xl border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50/70 focus:bg-white"
              />
            </div>

            <Textarea
              label="Program Overview Description"
              placeholder="Describe workout goals, target muscle groups, and recovery structure..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-xs leading-relaxed rounded-2xl border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50/70 focus:bg-white"
            />
          </div>

          {/* Section 2: Catalog Specification & Pricing */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-[#202124] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Catalog Tier & Enrollment Fee
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              />

              <Select
                label="Difficulty Tier"
                options={[
                  { value: 'Beginner', label: 'Beginner' },
                  { value: 'Intermediate', label: 'Intermediate' },
                  { value: 'Advanced', label: 'Advanced' },
                  { value: 'All Levels', label: 'All Levels' }
                ]}
                value={formData.difficulty}
                onValueChange={(val) => setFormData({ ...formData, difficulty: val })}
              />

              <Input
                label="Enrollment Price (₹)"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setFormData({ ...formData, price: '' });
                  } else {
                    const cleaned = parseInt(raw.replace(/^0+(?=\d)/, ''), 10);
                    setFormData({ ...formData, price: isNaN(cleaned) ? 0 : Math.max(0, cleaned) });
                  }
                }}
                onBlur={() => {
                  if (formData.price === '' || isNaN(formData.price)) {
                    setFormData({ ...formData, price: 0 });
                  }
                }}
                className="text-xs font-black rounded-2xl border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50/70 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 3: Thumbnail Cover Art & Presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#202124] uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" /> Cover Art Thumbnail Media
              </span>
              <span className="text-[10px] font-bold text-slate-400">High Resolution 16:9 Widescreen</span>
            </h4>

            {/* Custom File Upload & URL Input Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="sm:col-span-2 space-y-2">
                <Input
                  placeholder="Paste custom cover URL (https://...)"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="text-xs font-mono rounded-2xl"
                />

                {/* System File Dropzone Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setFormData({ ...formData, thumbnail: evt.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>

              {/* Active Cover Live Preview Card */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#2E221E] border border-border shadow-sm shrink-0">
                <img src={formData.thumbnail} alt="Cover Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">Active Cover</span>
                </div>
              </div>
            </div>

            {/* High-Res Presets Gallery Picker */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-extrabold text-slate-700 block">Select 1-Click High-Res Cover Preset:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PRESET_THUMBNAILS.map((preset, idx) => {
                  const isSelected = formData.thumbnail === preset.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, thumbnail: preset.url })}
                      className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 aspect-video group ${
                        isSelected
                          ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-md'
                          : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-400'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2E221E] via-[#2E221E]/30 to-transparent flex items-end p-1.5">
                        <span className="text-[9px] font-black text-white leading-tight truncate">{preset.label}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Live Publication Toggle Panel */}
          <div className="p-4.5 rounded-3xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl ${formData.published ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                {formData.published ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-xs font-black text-[#202124]">
                  {formData.published ? 'Program Published & Enrolling' : 'Draft Mode (Hidden from Catalog)'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {formData.published
                    ? 'Students can browse, enroll, and stream workout lessons in the portal.'
                    : 'Hidden from public directory. Only admins can edit and preview.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, published: !formData.published })}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                formData.published ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                  formData.published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Modal Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-extrabold rounded-2xl px-5 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              className="text-xs font-black rounded-2xl px-6 bg-gradient-to-r from-primary via-primary-hover to-slate-900 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all"
            >
              Save Program Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProgramDialog;
