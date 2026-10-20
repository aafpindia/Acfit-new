import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { getUserCourseProgress } from '../../services/progressService';
import {
  Users,
  BookOpen,
  Calendar,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Award,
  TrendingUp,
  Download,
  Filter,
  UserCheck,
  Clock,
  Sparkles,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Select } from '../../components/ui/select';
import apiClient from '../../lib/apiClient';

export const EnrollmentsAdmin = () => {
  const { user: currentAdmin } = useAuth();
  const { courses, enrollments, certificates, payments, progress, syncFromSupabase, deleteEnrollment } = useLmsStore();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [usersList, setUsersList] = useState([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync Supabase data on mount
  useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  // Fetch full student profiles
  useEffect(() => {
    let isMounted = true;

    const fetchRoster = async () => {
      let mergedUsers = [];

      // 1. Fetch from Supabase profiles if configured
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('profiles').select('*');
          if (data) {
            data.forEach((u) => {
              mergedUsers.push({
                id: u.id,
                fullName: u.full_name || u.fullName || u.email?.split('@')[0],
                email: u.email
              });
            });
          }
        } catch (e) {
          console.warn('Profiles fetch error:', e);
        }
      }

      // 2. Fetch from admin API client
      try {
        const res = await apiClient.admin.getUsers(currentAdmin);
        if (res.data) {
          res.data.forEach((u) => {
            const uid = u.id || u.userId;
            if (!mergedUsers.some((x) => x.id === uid)) {
              mergedUsers.push({
                id: uid,
                fullName: u.full_name || u.fullName || u.email?.split('@')[0],
                email: u.email
              });
            }
          });
        }
      } catch (e) {
        console.warn('API users fetch error:', e);
      }

      // 3. Fallback from payments
      payments.forEach((p) => {
        const pId = p.userId || p.id;
        if (pId && !mergedUsers.some((x) => x.id === pId)) {
          mergedUsers.push({
            id: pId,
            fullName: p.studentName || 'Athlete Student',
            email: p.studentEmail || 'student@acfitacademy.com'
          });
        }
      });

      if (isMounted) {
        setUsersList(mergedUsers);
      }
    };

    fetchRoster();
    return () => {
      isMounted = false;
    };
  }, [currentAdmin, payments]);

  // Handle Manual Enrollment creation
  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedCourse) {
      toastError('Please select both a student and a course blueprint.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiClient.enrollments.create({ userId: selectedUser, courseId: selectedCourse });
    setIsSubmitting(false);

    if (!res.error) {
      success('Student seat allocated successfully!');
      setIsEnrollModalOpen(false);
      setSelectedUser('');
      setSelectedCourse('');
      syncFromSupabase();
    } else {
      toastError(res.error || 'Failed to create enrollment.');
    }
  };

  // Handle Revoke / Delete Enrollment
  const handleRevokeEnrollment = async (enrollmentId, courseTitle, studentName) => {
    if (window.confirm(`Are you sure you want to revoke enrollment for ${studentName} in "${courseTitle}"?`)) {
      try {
        await deleteEnrollment(enrollmentId);
        await syncFromSupabase();
        success(`Enrollment seat revoked for ${studentName}.`);
      } catch (err) {
        toastError(err.message || 'Failed to revoke enrollment.');
      }
    }
  };

  // Compute Enrolled Roster Data with full student & course progress details
  const rosterData = useMemo(() => {
    return enrollments.map((item, idx) => {
      const course = courses.find((c) => c.id === item.courseId);

      // Find user profile
      let student = usersList.find((u) => u.id === item.userId);
      if (!student) {
        const paymentRecord = payments.find((p) => p.userId === item.userId || p.courseId === item.courseId);
        student = {
          fullName: paymentRecord?.studentName || `Athlete #${(item.userId || '101').substring(0, 6)}`,
          email: paymentRecord?.studentEmail || 'athlete@acfitacademy.com'
        };
      }

      // Calculate real-time progress %
      const totalLessons = course?.modules?.flatMap((m) => m.lessons || []).length || 0;
      const userProgressObj = getUserCourseProgress(item.userId, item.courseId, progress);
      const completedCount = Object.keys(userProgressObj).filter(k => userProgressObj[k]).length;
      const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

      // Check if certified
      const isCertified = certificates.some((c) => (c.userId === item.userId || c.user_id === item.userId) && (c.courseId === item.courseId || c.course_id === item.courseId));

      return {
        id: item.id || `en-${idx + 1}`,
        userId: item.userId,
        courseId: item.courseId,
        studentName: student.fullName,
        studentEmail: student.email,
        courseTitle: course?.title || item.courseId,
        courseCategory: course?.category || 'General Training',
        enrolledAt: item.enrolledAt || item.enrolled_at || Date.now(),
        completedCount,
        totalLessons,
        progressPct,
        isCertified
      };
    });
  }, [enrollments, courses, usersList, payments, progress, certificates]);

  // Filter Roster Data by Search & Category
  const filteredRoster = useMemo(() => {
    return rosterData.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(search.toLowerCase()) ||
        item.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
        item.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategoryFilter === 'all' || item.courseCategory.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [rosterData, search, selectedCategoryFilter]);

  // Unique categories for filter dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set(courses.map((c) => c.category || 'General Training'));
    return [{ value: 'all', label: 'All Program Categories' }, ...Array.from(set).map((cat) => ({ value: cat, label: cat }))];
  }, [courses]);

  // KPI Summary Numbers
  const uniqueStudentsCount = useMemo(() => new Set(enrollments.map((e) => e.userId)).size, [enrollments]);
  const completedCount = useMemo(() => rosterData.filter((r) => r.progressPct === 100 || r.isCertified).length, [rosterData]);

  // Export Roster to CSV
  const handleExportCSV = () => {
    if (filteredRoster.length === 0) {
      toastError('No enrollment records available to export.');
      return;
    }

    const headers = ['Enrollment ID,Student Name,Student Email,Program Title,Category,Progress %,Enrolled Date,Certified'];
    const rows = filteredRoster.map(
      (r) =>
        `"${r.id}","${r.studentName}","${r.studentEmail}","${r.courseTitle}","${r.courseCategory}",${r.progressPct}%,"${new Date(
          r.enrolledAt
        ).toLocaleDateString()}",${r.isCertified ? 'YES' : 'NO'}`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acfit_academy_enrollment_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Enrollment roster exported as CSV!');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans max-w-7xl mx-auto pb-16">
      
      {/* ─── Page Header Bar ────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl p-6 corner-crosshair shadow-tactile flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              [ ENROLLMENT MANAGEMENT ROSTER ]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-primary" /> Enrollment Management Roster
          </h1>
          <p className="font-mono text-xs text-slate-500">
            Audit student seat allocations, course completion progress, manual overrides & certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl h-10 px-4 text-xs font-mono font-bold bg-white text-[#202124] border border-border shadow-xs hover:bg-slate-50 gap-2 cursor-pointer"
            leftIcon={<Download className="h-4 w-4 text-slate-600" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsEnrollModalOpen(true)}
            className="tactile-btn-primary rounded-xl h-10 px-5 text-xs font-mono font-bold bg-primary text-white shadow-tactile-sm hover:scale-105 transition-all gap-2 cursor-pointer"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Enroll Student Manually
          </Button>
        </div>
      </div>

      {/* ─── Top KPI Metric Banner ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '[ TOTAL SEATS ]', value: enrollments.length, sub: 'Active course seats allocated', icon: BookOpen, badge: 'sticker-tag-yellow', badgeText: 'LIVE' },
          { label: '[ UNIQUE ATHLETES ]', value: uniqueStudentsCount, sub: 'Enrolled member accounts', icon: Users, badge: 'sticker-tag-cyan', badgeText: 'ROSTER' },
          { label: '[ COMPLETED ]', value: completedCount, sub: 'Fully finished syllabi', icon: CheckCircle2, badge: 'sticker-tag-red', badgeText: '100% DONE' },
          { label: '[ CERTS SEALED ]', value: certificates.length, badge: 'sticker-tape-pink', badgeText: 'CREDENTIALS', sub: 'Accredited certs issued', icon: Award }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="tactile-card rounded-2xl p-4 sm:p-5 bg-white corner-crosshair flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <span className={`${kpi.badge} text-[8px]`}>{kpi.badgeText}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#202124] font-sans tracking-tight">{kpi.value}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-mono">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <span className="font-mono text-[9px] text-slate-500 block border-t border-border/60 pt-2">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* ─── Search & Category Filter Bar ─────────────────────────────── */}
      <div className="tactile-card rounded-2xl bg-white p-4 corner-crosshair flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by student name, email, course or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-border text-xs text-[#202124] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            options={categoryOptions}
            value={selectedCategoryFilter}
            onValueChange={setSelectedCategoryFilter}
            className="w-full sm:w-60 font-mono text-xs"
          />
          <Badge variant="outline" className="font-mono text-xs font-bold px-3.5 py-2 rounded-xl border-border bg-slate-50 shrink-0">
            {filteredRoster.length} Seats
          </Badge>
        </div>
      </div>

      {/* ─── Comprehensive Roster Table ──────────────────────────────── */}
      <div className="tactile-card rounded-2xl bg-white corner-crosshair overflow-hidden border border-border shadow-tactile">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead className="bg-[#2563EB] text-white font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold">Enrollment ID</th>
                <th className="p-4 font-bold">Student Athlete</th>
                <th className="p-4 font-bold">Program Blueprint</th>
                <th className="p-4 font-bold">Course Completion</th>
                <th className="p-4 font-bold">Enrolled Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 font-medium text-slate-700">
              {filteredRoster.length > 0 ? (
                filteredRoster.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Enrollment ID */}
                    <td className="p-4 font-mono text-[11px] font-bold text-[#202124]">
                      {item.id}
                    </td>

                    {/* Student Athlete Details */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[#202124] block truncate">{item.studentName}</span>
                          <span className="font-mono text-[10px] text-slate-500 block truncate">{item.studentEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Program Blueprint */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#202124] block truncate max-w-[200px]">{item.courseTitle}</span>
                        <span className="sticker-tag-cyan text-[8px] uppercase inline-block">{item.courseCategory}</span>
                      </div>
                    </td>

                    {/* Progress Bar & % */}
                    <td className="p-4 min-w-[160px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                          <span className="text-[#202124]">{item.progressPct}%</span>
                          <span className="text-slate-500">
                            {item.completedCount}/{item.totalLessons || '—'} lessons
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-border/50">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.progressPct === 100
                                ? 'bg-emerald-500'
                                : item.progressPct > 0
                                ? 'bg-primary'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${item.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Enrolled Date */}
                    <td className="p-4 font-mono text-[11px] text-slate-600">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {item.isCertified ? (
                        <span className="sticker-tag-yellow text-[8px] font-black uppercase flex items-center gap-1 w-fit">
                          <Award className="h-3 w-3 text-amber-500" /> CERTIFIED
                        </span>
                      ) : item.progressPct === 100 ? (
                        <span className="sticker-tag-red text-[8px] font-black uppercase w-fit block">
                          SYLLABUS DONE
                        </span>
                      ) : (
                        <span className="sticker-tag-cyan text-[8px] font-black uppercase w-fit block">
                          ACTIVE LEARNER
                        </span>
                      )}
                    </td>

                    {/* Revoke Action */}
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeEnrollment(item.id, item.courseTitle, item.studentName)}
                        className="h-8 px-2.5 text-[11px] font-mono font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer gap-1"
                        leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-600" />}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-mono text-xs italic">
                    No active student enrollments found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Manual Student Enrollment Modal ────────────────────────────── */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent
          isOpen={isEnrollModalOpen}
          hideCloseButton={true}
          className="max-w-md bg-white border-2 border-border shadow-2xl rounded-2xl p-0 font-sans overflow-hidden corner-crosshair"
        >
          {/* Header Banner */}
          <div className="relative overflow-hidden graph-paper-dense p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="sticker-tag-yellow text-[8px] uppercase tracking-wider mb-0.5 inline-block">
                  ● MANUAL OVERRIDE ACCESS
                </span>
                <DialogTitle className="text-lg font-black text-[#202124]">
                  Manual Seat Allocation
                </DialogTitle>
              </div>
            </div>
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleManualEnroll} className="p-6 space-y-4">
            <Select
              label="Select Student Athlete Account"
              options={usersList.map((u) => ({
                value: u.id,
                label: `${u.fullName || u.email} (${u.email})`
              }))}
              value={selectedUser}
              onValueChange={setSelectedUser}
              required
            />

            <Select
              label="Select Training Blueprint Course"
              options={courses.map((c) => ({ value: c.id, label: c.title }))}
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEnrollModalOpen(false)}
                className="font-mono text-xs font-bold rounded-xl h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="tactile-btn-primary rounded-xl h-10 px-5 text-xs font-mono font-bold bg-primary text-white"
              >
                Grant Seat Access →
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EnrollmentsAdmin;
