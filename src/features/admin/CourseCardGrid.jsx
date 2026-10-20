import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookMarked,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  CheckCircle2,
  Grid,
  List,
  Sparkles,
  Layers,
  ChevronDown,
  X,
  Dumbbell,
  Shield,
  Zap,
  Award,
  Globe,
  Tag,
  Check
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useLmsStore } from '../../stores/lmsStore';

// Distinctive Card Banner Color Schemes for Zoho Marketplace aesthetic
const CARD_BANNERS = [
  { bg: 'bg-[#D32F2F]', text: 'text-white', badge: 'Paid', label: 'SMS & WhatsApp' },
  { bg: 'bg-[#1976D2]', text: 'text-white', badge: 'Free', label: 'ACFIT Core' },
  { bg: 'bg-[#C2185B]', text: 'text-white', badge: 'Free', label: 'Analytics Pro' },
  { bg: 'bg-[#388E3C]', text: 'text-white', badge: 'Paid', label: 'Live Webinar' },
  { bg: 'bg-[#7B1FA2]', text: 'text-white', badge: 'Free', label: 'Certification' },
  { bg: 'bg-[#E65100]', text: 'text-white', badge: 'Paid', label: 'Retention' }
];

export const CourseCardGrid = ({
  courses = [],
  onSelectCourse,
  onCreateNew,
  onEditCourse,
  onDeleteCourse
}) => {
  const { categories: storeCategories } = useLmsStore();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam !== null) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Dynamic Categories list
  const categoriesList = useMemo(() => {
    const defaultList = storeCategories || [
      'Strength & Conditioning',
      'Cardio & HIIT',
      'Yoga & Wellness',
      'Nutrition & Diet',
      'General'
    ];
    const courseCats = (courses || []).map((c) => c.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultList, ...courseCats]));
    return ['All', ...combined];
  }, [storeCategories, courses]);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor && c.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;

    const matchesPrice =
      selectedPrice === 'All'
        ? true
        : selectedPrice === 'Free'
        ? c.price === 0
        : c.price > 0;

    const matchesStatus =
      selectedStatus === 'All'
        ? true
        : selectedStatus === 'published'
        ? Boolean(c.published)
        : !c.published;

    return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
  });

  const totalLessons = useMemo(() => {
    return courses.reduce((acc, c) => {
      const courseLessons = c.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.length || 0), 0) || 0;
      return acc + courseLessons;
    }, 0);
  }, [courses]);

  const publishedCount = courses.filter((c) => c.published).length;
  const draftCount = courses.length - publishedCount;

  return (
    <div className="space-y-6 font-sans relative pb-20 text-[#202124]">
      
      {/* ─── 1. TOP SUB-HEADER FILTER TOOLBAR (PILL SELECTORS BAR) ─────── */}
      <div className="bg-white border-b border-slate-200 shadow-2xs py-2.5 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Pill Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Dropdown */}
          <div className="relative group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2088E7] cursor-pointer appearance-none"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Price Filter */}
          <div className="relative">
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2088E7] cursor-pointer appearance-none"
            >
              <option value="All">Price: All</option>
              <option value="Free">Price: Free</option>
              <option value="Paid">Price: Paid</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2088E7] cursor-pointer appearance-none"
            >
              <option value="All">Status: All</option>
              <option value="published">Status: Live</option>
              <option value="draft">Status: Drafts</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Search Input Box & View Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2088E7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grid / List view mode switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500'
              }`}
              title="List Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="primary"
            onClick={onCreateNew}
            leftIcon={<Plus className="h-3.5 w-3.5 text-white" />}
            className="h-8 px-3 text-xs font-bold bg-[#2088E7] hover:bg-[#1976D2] text-white rounded-md shadow-xs cursor-pointer shrink-0"
          >
            New Program
          </Button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE ADMIN COURSE STUDIO BANNER & KPI METRICS STRIP ───── */}
      <div className="bg-[#1E65B8] text-white rounded-xl p-5 shadow-md">

        {/* 4-Column Executive Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div
            onClick={() => setSelectedStatus('All')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'All'
                ? 'bg-white/20 border-white/40 ring-1 ring-white/30'
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-blue-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Catalog</span>
              <BookOpen className="h-4 w-4 text-blue-200" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{courses.length}</span>
              <span className="text-[10px] text-blue-200">Programs</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('published')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'published'
                ? 'bg-white/20 border-white/40 ring-1 ring-white/30'
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">Live Published</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{publishedCount}</span>
              <span className="text-[10px] text-emerald-200 font-semibold">Learner Ready</span>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('draft')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedStatus === 'draft'
                ? 'bg-white/20 border-white/40 ring-1 ring-white/30'
                : 'bg-white/10 hover:bg-white/15 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-amber-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">Studio Drafts</span>
              <BookMarked className="h-4 w-4 text-amber-300" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{draftCount}</span>
              <span className="text-[10px] text-amber-200 font-semibold">In Progress</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 border border-white/10">
            <div className="flex items-center justify-between text-blue-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Curriculum Lessons</span>
              <Award className="h-4 w-4 text-blue-300" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{totalLessons}</span>
              <span className="text-[10px] text-blue-200">Lesson Modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. ALL MANUALS / PROGRAMS MARKETPLACE GRID WITH COLOR BANNERS ─ */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            All Programs ({filteredCourses.length})
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">• {publishedCount} Live</span>
            <span className="text-amber-600 font-bold">• {draftCount} Drafts</span>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookMarked className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-800">No Programs Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No matching program items found for "{searchQuery}".
            </p>
            <Button variant="primary" onClick={onCreateNew} className="mt-4 font-semibold px-4 text-xs bg-[#2088E7] text-white rounded-md">
              + Create New Program
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          
          /* MARKETPLACE CARDS WITH COLOR BANNERS & STAR RATINGS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c, idx) => {
              const banner = CARD_BANNERS[idx % CARD_BANNERS.length];
              const lessonCount = c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  {/* TOP DISTINCTIVE COLOR HEADER BANNER */}
                  <div className={`h-24 ${banner.bg} p-4 text-white flex flex-col justify-between relative overflow-hidden`}>
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-white">
                        {c.category || 'General'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${c.published ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
                        {c.published ? 'LIVE' : 'DRAFT'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                      <BookOpen className="h-6 w-6 text-white shrink-0" />
                      <h3 className="font-extrabold text-sm text-white truncate leading-tight">
                        {c.title}
                      </h3>
                    </div>

                    {/* Subtle Background Pattern Circle */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                  </div>

                  {/* CARD BODY CONTENT */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {c.description || 'Comprehensive training curriculum, lessons, assessments & certifications.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
                      <span>{lessonCount} Lessons</span>
                      <span>•</span>
                      <span>{c.instructor || 'ACFIT Academy Admin'}</span>
                    </div>

                    {/* CARD FOOTER: RATING STARS, PRICE TAG & ACTION BUTTONS */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                      
                      {/* Price Tag */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${c.price === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                          {c.price === 0 ? 'Free' : `₹${c.price}`}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => (onEditCourse ? onEditCourse(c) : onSelectCourse && onSelectCourse(c.id))}
                          className="px-2.5 py-1 rounded bg-[#2088E7] hover:bg-[#1976D2] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {onDeleteCourse && (
                          <button
                            type="button"
                            onClick={() => onDeleteCourse(c.id)}
                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE LIST VIEW */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Program Manual</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Lessons Count</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourses.map((c, idx) => {
                    const lessonCount = c.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2088E7] font-bold text-xs flex items-center justify-center shrink-0">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <h4
                                onClick={() => (onEditCourse ? onEditCourse(c) : onSelectCourse && onSelectCourse(c.id))}
                                className="font-bold text-xs text-slate-900 hover:text-[#2088E7] cursor-pointer"
                              >
                                {c.title}
                              </h4>
                              <span className="text-[10px] text-slate-500 truncate block max-w-xs">{c.description || 'No description'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {c.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {lessonCount} Lessons
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {c.price === 0 ? 'Free' : `₹${c.price}`}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {c.published ? 'Live' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => (onEditCourse ? onEditCourse(c) : onSelectCourse && onSelectCourse(c.id))}
                              className="px-2.5 py-1 rounded bg-[#2088E7] hover:bg-[#1976D2] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            {onDeleteCourse && (
                              <button
                                type="button"
                                onClick={() => onDeleteCourse(c.id)}
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING (+) QUICK CREATE BUTTON */}
      <button
        type="button"
        onClick={onCreateNew}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#2088E7] hover:bg-[#1976D2] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-105 cursor-pointer z-50 focus:outline-none"
        title="Create New Program"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>
    </div>
  );
};

export default CourseCardGrid;

