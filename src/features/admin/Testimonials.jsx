import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';
import { useLmsStore } from '../../stores/lmsStore';
import {
  MessageSquareQuote,
  Plus,
  Trash2,
  Edit3,
  Star,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  X,
  User,
  Building,
  Hash,
  ArrowLeft,
  Layout,
  Check,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export const Testimonials = () => {
  const { success, error: toastError } = useToast();
  const {
    testimonials = [],
    fetchTestimonialsStore,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial
  } = useLmsStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden'

  // Studio View State (Full Page Mode)
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'studio'
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    author: '',
    role: '',
    cert: 'ACFIT CFR PRO ALUMNI',
    rating: 5,
    quote: '',
    display_order: 1,
    is_active: true
  });

  useEffect(() => {
    fetchTestimonialsStore();
  }, [fetchTestimonialsStore]);

  const filteredTestimonials = useMemo(() => {
    return (testimonials || []).filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (t.author || '').toLowerCase().includes(q) ||
        (t.role || '').toLowerCase().includes(q) ||
        (t.cert || '').toLowerCase().includes(q) ||
        (t.quote || '').toLowerCase().includes(q);

      const isActive = t.is_active !== false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'hidden' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [testimonials, search, statusFilter]);

  const stats = useMemo(() => {
    const total = testimonials.length;
    const active = testimonials.filter((t) => t.is_active !== false).length;
    const hidden = total - active;
    const avgRating = total
      ? (testimonials.reduce((acc, t) => acc + Number(t.rating || 5), 0) / total).toFixed(1)
      : '5.0';
    return { total, active, hidden, avgRating };
  }, [testimonials]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      author: '',
      role: '',
      cert: 'ACFIT CFR PRO ALUMNI',
      rating: 5,
      quote: '',
      display_order: testimonials.length + 1,
      is_active: true
    });
    setViewMode('studio');
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      author: item.author || '',
      role: item.role || '',
      cert: item.cert || 'ACFIT CFR PRO ALUMNI',
      rating: Number(item.rating) || 5,
      quote: item.quote || '',
      display_order: Number(item.display_order) || 1,
      is_active: item.is_active !== false
    });
    setViewMode('studio');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.author.trim()) {
      toastError('Please enter the student / alumni name.');
      return;
    }
    if (!formData.quote.trim()) {
      toastError('Please enter the testimonial quote text.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateTestimonial(editingItem.id, formData);
        success('Testimonial updated successfully!');
      } else {
        await addTestimonial(formData);
        success('New testimonial added to landing page!');
      }
      setViewMode('list');
    } catch (err) {
      toastError('Failed to save testimonial: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = !item.is_active;
    try {
      await updateTestimonial(item.id, { is_active: newStatus });
      success(`Testimonial by "${item.author}" is now ${newStatus ? 'visible on landing page' : 'hidden'}.`);
    } catch (err) {
      toastError('Failed to toggle status: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete testimonial by "${item.author}"?`)) {
      try {
        await deleteTestimonial(item.id);
        success('Testimonial deleted successfully.');
      } catch (err) {
        toastError('Failed to delete testimonial: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          /* ── LIST VIEW MODE ── */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* ── HEADER & TITLE ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-[#2563EB] shadow-inner">
                    <MessageSquareQuote className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                      Landing Page Testimonials
                    </h1>
                    <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                      Manage student reviews, alumni certification badges, and landing page showcase.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleOpenAdd}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-2xl px-6 py-3.5 flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all text-sm shrink-0"
              >
                <Plus className="h-5 w-5" />
                <span>Create New Testimonial</span>
              </Button>
            </div>

            {/* ── STATS BAR ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Reviews</p>
                <p className="text-3xl font-black text-stone-900">{stats.total}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active on Site</p>
                <p className="text-3xl font-black text-emerald-700">{stats.active}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider font-mono">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-amber-700">{stats.avgRating}</p>
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Hidden</p>
                <p className="text-3xl font-black text-stone-600">{stats.hidden}</p>
              </div>
            </div>

            {/* ── FILTER & SEARCH BAR ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50/80 p-4 rounded-3xl border border-stone-200/80">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search student name, badge or text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {['all', 'active', 'hidden'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold capitalize transition-all ${
                      statusFilter === status
                        ? 'bg-stone-900 text-white shadow-md'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* ── TESTIMONIAL CARDS GRID ── */}
            {filteredTestimonials.length === 0 ? (
              <div className="bg-white p-16 text-center rounded-3xl border border-stone-200 space-y-4">
                <MessageSquareQuote className="h-12 w-12 text-stone-300 mx-auto" />
                <h3 className="text-lg font-extrabold text-stone-800">No Testimonials Found</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Try searching with a different keyword or create a new testimonial using the button above.
                </p>
                <Button
                  onClick={handleOpenAdd}
                  className="bg-[#2563EB] text-white font-bold rounded-xl px-5 py-2.5 text-xs"
                >
                  + Add First Testimonial
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTestimonials.map((item) => {
                  const isActive = item.is_active !== false;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-3xl p-8 border flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all ${
                        isActive ? 'border-stone-200 hover:border-[#2563EB]' : 'border-dashed border-stone-300 opacity-60'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(Number(item.rating || 5))].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-400" />
                            ))}
                          </div>

                          <span
                            className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                              isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {isActive ? 'Live' : 'Hidden'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                          "{item.quote}"
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-stone-100">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-stone-900">— {item.author}</h4>
                            <p className="text-[11px] text-stone-500 font-medium">{item.role}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] shrink-0 border border-blue-100/60">
                            {item.cert || 'ACFIT CFR PRO ALUMNI'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title={isActive ? 'Hide from landing page' : 'Make visible on landing page'}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                              isActive
                                ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit testimonial"
                            className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            title="Delete testimonial"
                            className="p-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ── FULL PAGE STUDIO EDITOR MODE ── */
          <motion.div
            key="studio-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Studio Top Navigation Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
                  title="Back to list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    {editingItem ? `Editing: ${editingItem.author}` : 'Create New Testimonial'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewMode('list')}
                  className="rounded-2xl px-5 py-2.5 text-stone-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-2xl px-7 py-2.5 flex items-center gap-2 shadow-md transition-all text-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Testimonial'}</span>
                </Button>
              </div>
            </div>

            {/* Split Screen 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Input Form Controls (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-stone-100">
                  <Sparkles className="h-5 w-5 text-[#2563EB]" />
                  <h3 className="text-lg font-extrabold text-stone-900">Student & Review Details</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Author Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                      Student / Alumni Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Malhotra"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Role / Profession & City */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                      Role & Location
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="e.g. Senior Fitness Coach, Mumbai"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Alumni Certification Badge */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                      Alumni Certification Badge *
                    </label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. ACFIT CFR PRO ALUMNI"
                        value={formData.cert}
                        onChange={(e) => setFormData({ ...formData, cert: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Rating Selector & Display Rank */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {/* Rating Interactive Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                        Rating (Stars)
                      </label>
                      <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= formData.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-stone-200 text-stone-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-stone-700 ml-2">
                          ({formData.rating} Star{formData.rating > 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                        Display Rank Order
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                          type="number"
                          min="1"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                          className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quote Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-stone-600 tracking-wider">
                        Testimonial Quote *
                      </label>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {formData.quote.length} characters
                      </span>
                    </div>
                    <textarea
                      required
                      rows={5}
                      placeholder="Enter the student's complete quote here..."
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all leading-relaxed"
                    />
                  </div>

                  {/* Visibility Switch */}
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-stone-900">Publish on Landing Page</p>
                      <p className="text-[11px] text-stone-500">
                        When enabled, this review appears live in the "What Our Students Say" section.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-5 w-5 text-[#2563EB] rounded-md focus:ring-[#2563EB] cursor-pointer"
                    />
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Live Real-Time Card Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4 sticky top-6">
                <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-4">
                    <Globe className="h-4 w-4 text-[#2563EB]" />
                    <span className="text-xs font-mono font-bold tracking-widest text-stone-300 uppercase">
                      Card Preview
                    </span>
                  </div>

                  <p className="text-xs text-stone-400">
                    How this testimonial will appear on the landing page:
                  </p>

                  {/* Render Mock Landing Card */}
                  <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-stone-200 text-stone-900 shadow-md space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(formData.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed min-h-[60px]">
                        "{formData.quote || 'Your testimonial quote text will appear here as you type...'}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200/80 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-stone-900">
                          — {formData.author || 'Student Name'}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {formData.role || 'Role & Location'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-[#2563EB] shrink-0 border border-blue-100">
                        {formData.cert || 'ACFIT CFR PRO ALUMNI'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Testimonials;
