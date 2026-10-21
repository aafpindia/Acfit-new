import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLmsStore } from '../../stores/lmsStore';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { getUserCourseProgress } from '../../services/progressService';
import { fetchUsers } from '../../services/userService';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle,
  BarChart2,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/useToast';
import { Analytics } from '../admin/Analytics';
import {
  LineAreaChart,
  ColumnChart,
  HorizontalBar,
  DonutChart,
  GaugeChart,
  buildLinePath,
  CHART_COLORS
} from '../../components/ui/charts';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const {
    courses = [],
    enrollments = [],
    certificates = [],
    payments = [],
    progress = {},
    attempts = [],
    syncFromSupabase = () => {},
    subscribeToRealtime = () => {}
  } = useLmsStore();

  const [activeDashboardTab, setActiveDashboardTab] = useState('overview'); // 'overview' | 'analytics'
  const [dateFilter, setDateFilter] = useState('30days'); // '7days' | '30days' | '90days' | 'all'
  const [revenueView, setRevenueView] = useState('revenue'); // 'revenue' | 'transactions'
  const [totalMembers, setTotalMembers] = useState(0);
  const [dashboardUsers, setDashboardUsers] = useState([]);

  // Sync Supabase & WebSocket events
  useEffect(() => {
    try {
      syncFromSupabase();
      const unsubscribe = subscribeToRealtime();
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (_) {}
  }, [syncFromSupabase, subscribeToRealtime]);

  // Compute Total Unique Members (Live Non-Deleted Users)
  useEffect(() => {
    let active = true;
    const computeTotalMembers = async () => {
      const deletedUserIds = new Set(JSON.parse(localStorage.getItem('_lms_deleted_user_ids') || '[]'));
      const uniqueLiveIds = new Set();
      const uniqueLiveEmails = new Set();
      let liveUsersList = [];

      try {
        const fetched = await fetchUsers();
        if (Array.isArray(fetched) && fetched.length > 0) {
          liveUsersList = fetched;
          fetched.forEach((u) => {
            if (u.id && !deletedUserIds.has(u.id) && u.status !== 'deleted') {
              uniqueLiveIds.add(u.id);
              if (u.email) uniqueLiveEmails.add(u.email.toLowerCase().trim());
            }
          });
        }
      } catch (_) {}

      // Count genuine enrollments matching non-deleted user IDs
      (enrollments || []).forEach((e) => {
        const uid = e.userId || e.user_id;
        if (uid && !deletedUserIds.has(uid)) {
          uniqueLiveIds.add(uid);
        }
      });

      // Count genuine payments matching non-deleted user IDs
      (payments || []).forEach((p) => {
        const uid = p.userId || p.user_id;
        if (uid && !deletedUserIds.has(uid)) {
          uniqueLiveIds.add(uid);
        }
      });

      if (active) {
        setDashboardUsers(liveUsersList);
        setTotalMembers(uniqueLiveIds.size);
      }
    };

    computeTotalMembers();

    const handleUpdate = () => { computeTotalMembers(); };
    window.addEventListener('lms_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      active = false;
      window.removeEventListener('lms_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [enrollments, payments, courses]);

  // ─── 1. CORE 4 KPI CALCULATIONS ─────────────────────────────────────────
  const successfulPayments = useMemo(() => {
    const deletedUserIds = new Set(JSON.parse(localStorage.getItem('_lms_deleted_user_ids') || '[]'));
    return payments.filter((p) => {
      if (!p || !p.id) return false;
      if (p.id === 'PAY-1001' || p.studentEmail === 'student@lms.com' || p.studentEmail === 'admin@lms.com') return false;
      if (deletedUserIds.has(p.userId || p.user_id)) return false;
      const st = (p.status || '').toLowerCase();
      return st === 'successful' || st === 'paid';
    });
  }, [payments]);

  const totalRevenue = useMemo(
    () => successfulPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    [successfulPayments]
  );

  const overallCompletionRate = useMemo(() => {
    if (courses.length === 0 || enrollments.length === 0) return 0;
    let totalPossible = 0;
    let totalDone = 0;

    courses.forEach((c) => {
      const lessonsCount = c.modules?.flatMap((m) => m.lessons || []).length || 0;
      if (lessonsCount === 0) return;
      const enrolled = enrollments.filter((e) => e.courseId === c.id || e.course_id === c.id);
      if (enrolled.length > 0) {
        totalPossible += lessonsCount * enrolled.length;
        enrolled.forEach((e) => {
          const up = getUserCourseProgress(e.userId || e.user_id, c.id, progress);
          totalDone += Object.keys(up || {}).filter((k) => up[k]).length;
        });
      }
    });

    return totalPossible > 0 ? Math.min(100, Math.round((totalDone / totalPossible) * 100)) : 0;
  }, [courses, enrollments, progress]);

  // ─── 2. REVENUE & TRANSACTIONS OVERVIEW CHART DATA ─────────────────────
  const overviewChartData = useMemo(() => {
    // Generate the last 6 calendar months dynamically
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const monthlyRevMap = {};
    const monthlyTxMap = {};

    successfulPayments.forEach((p) => {
      const payDate = new Date(p.date || p.paidAt || p.createdAt || p.created_at || Date.now());
      const mon = payDate.toLocaleString('default', { month: 'short' });
      monthlyRevMap[mon] = (monthlyRevMap[mon] || 0) + (parseFloat(p.amount) || 0);
      monthlyTxMap[mon] = (monthlyTxMap[mon] || 0) + 1;
    });

    const revenueValues = months.map((m) => monthlyRevMap[m] || 0);
    const transactionValues = months.map((m) => monthlyTxMap[m] || 0);

    return {
      months,
      revenueValues,
      transactionValues
    };
  }, [successfulPayments]);

  // ─── 3. LEARNER OVERVIEW BREAKDOWN ─────────────────────────────────────
  const activeLearnersCount = useMemo(() => {
    const activeUserSet = new Set();
    enrollments.forEach((e) => {
      const uid = e.userId || e.user_id;
      const cid = e.courseId || e.course_id;
      const up = getUserCourseProgress(uid, cid, progress);
      if (Object.keys(up || {}).filter((k) => up[k]).length > 0) {
        activeUserSet.add(uid);
      }
    });
    return activeUserSet.size;
  }, [enrollments, progress]);

  const completedLearnersCount = useMemo(() => {
    const completedSet = new Set();
    enrollments.forEach((e) => {
      const uid = e.userId || e.user_id;
      const cid = e.courseId || e.course_id;
      const course = courses.find((c) => c.id === cid);
      const totalLessons = course?.modules?.flatMap((m) => m.lessons || []).length || 1;
      const userProg = getUserCourseProgress(uid, cid, progress);
      const done = Object.keys(userProg || {}).filter((k) => userProg[k]).length;
      if (done >= totalLessons && totalLessons > 0) {
        completedSet.add(uid);
      }
    });
    return completedSet.size;
  }, [enrollments, courses, progress]);

  const certifiedCount = useMemo(() => {
    const certUsers = new Set();
    certificates.forEach((c) => {
      if (c.userId || c.user_id) certUsers.add(c.userId || c.user_id);
    });
    return certUsers.size || certificates.length;
  }, [certificates]);

  const activePct = totalMembers > 0 ? Math.min(100, Math.round((activeLearnersCount / totalMembers) * 100)) : 0;
  const completedPct = totalMembers > 0 ? Math.min(100, Math.round((completedLearnersCount / totalMembers) * 100)) : 0;
  const certifiedPct = totalMembers > 0 ? Math.min(100, Math.round((certifiedCount / totalMembers) * 100)) : 0;

  // ─── 4. COURSE PERFORMANCE TABLE ────────────────────────────────────────
  const coursePerformanceList = useMemo(() => {
    return courses.map((c) => {
      const courseEnrollments = enrollments.filter((e) => e.courseId === c.id || e.course_id === c.id);
      const totalLessons = c.modules?.flatMap((m) => m.lessons || []).length || 0;
      let totalCompleted = 0;
      courseEnrollments.forEach((e) => {
        const up = getUserCourseProgress(e.userId || e.user_id, c.id, progress);
        totalCompleted += Object.keys(up || {}).filter((k) => up[k]).length;
      });

      const completionPct =
        courseEnrollments.length > 0 && totalLessons > 0
          ? Math.min(100, Math.round((totalCompleted / (totalLessons * courseEnrollments.length)) * 100))
          : 0;

      const courseAttempts = attempts.filter((a) => a.courseId === c.id || a.course_id === c.id);
      const avgScore =
        courseAttempts.length > 0
          ? Math.round(courseAttempts.reduce((acc, a) => acc + (parseFloat(a.score) || 0), 0) / courseAttempts.length)
          : 0;

      return {
        id: c.id,
        title: c.title,
        category: c.category || 'General',
        learnersCount: courseEnrollments.length,
        completionPct,
        avgScore
      };
    });
  }, [courses, enrollments, progress, attempts]);

  // ─── 5. LEARNERS NEEDING ATTENTION (AT-RISK) ───────────────────────────
  const atRiskBreakdown = useMemo(() => {
    let highRisk = 0;
    let notStarted = 0;
    let lowProgress = 0;

    enrollments.forEach((e) => {
      const uid = e.userId || e.user_id;
      const cid = e.courseId || e.course_id;
      const course = courses.find((c) => c.id === cid);
      const totalLessons = course?.modules?.flatMap((m) => m.lessons || []).length || 1;
      const userProg = getUserCourseProgress(uid, cid, progress);
      const done = Object.keys(userProg || {}).filter((k) => userProg[k]).length;
      const pct = Math.round((done / totalLessons) * 100);

      const userAttempts = attempts.filter((a) => (a.userId === uid || a.user_id === uid) && (a.courseId === cid || a.course_id === cid));
      const failed = userAttempts.filter((a) => !a.passed).length;

      if (failed >= 2) highRisk++;
      else if (pct === 0) notStarted++;
      else if (pct < 30) lowProgress++;
    });

    return {
      highRisk,
      notStarted,
      lowProgress
    };
  }, [enrollments, courses, progress, attempts]);

  // ─── 6. RECENT ACTIVITY FEED ───────────────────────────────────────────
  const recentActivities = useMemo(() => {
    const liveLogs = [];

    // Recent payments & course enrollments
    successfulPayments.forEach((p) => {
      const dateStr = p.date || p.paidAt || p.createdAt || p.created_at;
      const timeAgo = dateStr ? new Date(dateStr).toLocaleDateString() : 'Recent';
      liveLogs.push({
        id: `p-${p.id}`,
        text: `${p.studentName || 'Learner'} enrolled in ${p.courseTitle || 'Course'}`,
        sub: `₹${p.amount} · ${timeAgo}`,
        type: 'payment',
        timestamp: dateStr ? new Date(dateStr).getTime() : 0
      });
    });

    // Recent member registrations
    (dashboardUsers || []).forEach((u) => {
      const dateStr = u.createdAt || u.created_at;
      const timeAgo = dateStr ? new Date(dateStr).toLocaleDateString() : 'Recent';
      liveLogs.push({
        id: `u-${u.id}`,
        text: `New member registered: ${u.fullName || u.email}`,
        sub: `${(u.role || 'user').toUpperCase()} Account · ${timeAgo}`,
        type: 'user',
        timestamp: dateStr ? new Date(dateStr).getTime() : 0
      });
    });

    // Recent certificates
    certificates.forEach((c) => {
      const dateStr = c.issueDate || c.issuedAt || c.created_at;
      const timeAgo = dateStr ? new Date(dateStr).toLocaleDateString() : 'Recent';
      liveLogs.push({
        id: `c-${c.id}`,
        text: `Certificate issued to ${c.studentName || 'Learner'}`,
        sub: `${c.courseTitle || 'Program'} · ${timeAgo}`,
        type: 'cert',
        timestamp: dateStr ? new Date(dateStr).getTime() : 0
      });
    });

    liveLogs.sort((a, b) => b.timestamp - a.timestamp);
    return liveLogs.slice(0, 7);
  }, [successfulPayments, certificates, dashboardUsers]);


  // Export Dashboard CSV
  const handleExportDashboardCSV = () => {
    const headers = ['Metric,Value'];
    const rows = [
      `"Total Members",${totalMembers}`,
      `"Active Courses",${courses.length}`,
      `"Total Revenue (INR)",${totalRevenue}`,
      `"Overall Completion Rate",${overallCompletionRate}%`
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acfit_academy_dashboard_summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Dashboard summary exported as CSV!');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-6 font-sans max-w-7xl mx-auto pb-16"
    >
      {/* ─── HEADER & TAB SWITCHER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500">
            Good afternoon, <span className="font-semibold text-slate-800">Admin</span>. Here is the operational summary of your platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab switcher: Overview vs Analytics */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setActiveDashboardTab('overview')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeDashboardTab === 'overview'
                  ? 'bg-[#2088E7] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveDashboardTab('analytics')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeDashboardTab === 'analytics'
                  ? 'bg-[#2088E7] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics Studio
            </button>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-[#2088E7] cursor-pointer"
          >
            <option value="7days">Last 7 days ▼</option>
            <option value="30days">Last 30 days ▼</option>
            <option value="90days">Last 90 days ▼</option>
            <option value="all">All Time ▼</option>
          </select>

          <Button
            variant="outline"
            onClick={handleExportDashboardCSV}
            className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 font-medium rounded-md"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ─── TAB CONTENT SWITCHING ───────────────────────────────────────── */}
      {activeDashboardTab === 'analytics' ? (
        <Analytics />
      ) : (
        <>
          {/* ─── ROW 1 — FEATURED ROYAL BLUE KPI BANNER CONTAINER ─────────────── */}
          <div className="bg-[#1E65B8] text-white rounded-xl p-4 shadow-sm">
            {/* 4-Column Grid of Horizontal White Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* KPI 1: Members */}
              <div className="bg-white rounded-lg p-3 text-slate-900 shadow-xs flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-[#2088E7] text-white flex items-center justify-center shrink-0 font-black shadow-xs">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MEMBERS</span>
                  <h4 className="font-black text-base text-slate-900 truncate">{totalMembers.toLocaleString()}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Live Active Accounts</p>
                </div>
              </div>

              {/* KPI 2: Courses */}
              <div className="bg-white rounded-lg p-3 text-slate-900 shadow-xs flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-black shadow-xs">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COURSES</span>
                  <h4 className="font-black text-base text-slate-900 truncate">{courses.length}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Published Programs</p>
                </div>
              </div>

              {/* KPI 3: Revenue */}
              <div className="bg-white rounded-lg p-3 text-slate-900 shadow-xs flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 font-black shadow-xs">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GROSS REVENUE</span>
                  <h4 className="font-black text-base text-slate-900 truncate">₹{totalRevenue.toLocaleString()}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Verified Receipts</p>
                </div>
              </div>

              {/* KPI 4: Completion */}
              <div className="bg-white rounded-lg p-3 text-slate-900 shadow-xs flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-black shadow-xs">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COMPLETION RATE</span>
                  <h4 className="font-black text-base text-slate-900 truncate">{overallCompletionRate}%</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Course Progress Sync</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ROW 2 — BUSINESS + LEARNING (2-COLUMN GRID) ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            
            {/* LEFT: Revenue / Transactions Overview */}
            <div className="lg:col-span-7 min-w-0 bg-white border border-[#E4E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider block">
                    {revenueView === 'revenue' ? 'Revenue Overview' : 'Transactions Overview'}
                  </span>
                  <h3 className="text-2xl font-black text-[#202124]">
                    {revenueView === 'revenue'
                      ? `₹${totalRevenue.toLocaleString()}`
                      : `${successfulPayments.length.toLocaleString()} Transactions`}
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200/60">
                  <button
                    onClick={() => setRevenueView('revenue')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      revenueView === 'revenue' ? 'bg-white text-[#202124] shadow-2xs font-bold' : 'text-[#5F6368]'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setRevenueView('transactions')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      revenueView === 'transactions' ? 'bg-white text-[#202124] shadow-2xs font-bold' : 'text-[#5F6368]'
                    }`}
                  >
                    Transactions
                  </button>
                </div>
              </div>

              <div className="py-2 w-full overflow-hidden">
                <LineAreaChart
                  color={revenueView === 'revenue' ? '#2563EB' : '#10B981'}
                  data={overviewChartData.months.map((m, idx) => ({
                    label: m,
                    value: revenueView === 'revenue'
                      ? overviewChartData.revenueValues[idx]
                      : overviewChartData.transactionValues[idx]
                  }))}
                  height={150}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#5F6368] pt-3 border-t border-slate-100">
                <span className="font-medium text-slate-500">
                  {revenueView === 'revenue' ? 'Live Inflow Trend' : 'Live Transaction Volume'}
                </span>
                <span className={`font-extrabold flex items-center gap-1 ${revenueView === 'revenue' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  {revenueView === 'revenue' ? `₹${totalRevenue.toLocaleString()} Live Total` : `${successfulPayments.length} Total Processed`}
                </span>
              </div>
            </div>

            {/* RIGHT: Learner Overview */}
            <div className="lg:col-span-5 min-w-0 bg-white border border-[#E4E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5 flex flex-col justify-between overflow-hidden">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#202124]">Learner Overview</h3>
                <span className="text-xs font-black text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#2563EB]/20">
                  Total {totalMembers}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Active */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#202124]">Active Learners</span>
                    <span className="text-[#5F6368]">{activeLearnersCount} ({activePct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div className="bg-[#2563EB] h-full rounded-full transition-all" style={{ width: `${activePct}%` }} />
                  </div>
                </div>

                {/* Completed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#202124]">Completed</span>
                    <span className="text-[#5F6368]">{completedLearnersCount} ({completedPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${completedPct}%` }} />
                  </div>
                </div>

                {/* Certified */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#202124]">Certified</span>
                    <span className="text-[#5F6368]">{certifiedCount} ({certifiedPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${certifiedPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-[#5F6368] flex items-center justify-between mt-2">
                <span className="font-semibold text-slate-600">Overall Active Engagement</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  Healthy Rate
                </span>
              </div>
            </div>

          </div>

          {/* ─── ROW 3 — COURSE PERFORMANCE TABLE ───────────────────────────── */}
          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#202124]">Course Performance</h3>
              <button
                onClick={() => navigate('/admin/courses')}
                className="text-xs text-[#2563EB] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-sans min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#E4E7EB] text-[#5F6368] font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Course Title</th>
                    <th className="pb-3">Learners</th>
                    <th className="pb-3">Completion Rate</th>
                    <th className="pb-3">Avg. Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coursePerformanceList.slice(0, 5).map((course) => (
                    <tr
                      key={course.id}
                      onClick={() => navigate('/admin/courses')}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 font-bold text-[#202124]">{course.title}</td>
                      <td className="py-3 font-semibold text-[#5F6368]">{course.learnersCount}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#2563EB] h-full rounded-full"
                              style={{ width: `${course.completionPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-[#202124]">{course.completionPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-[#2563EB]">{course.avgScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── ROW 4 — ACTION REQUIRED + RECENT ACTIVITY (2-COLUMN GRID) ──── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            
            {/* LEFT: Learners Needing Attention (At-Risk) */}
            <div className="lg:col-span-6 min-w-0 bg-white border border-[#E4E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#202124]">Learners Needing Attention</h3>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="text-xs text-[#2563EB] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* High Risk */}
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/70 flex items-start gap-3">
                  <span className="text-base shrink-0">🔴</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900">{atRiskBreakdown.highRisk} High Risk</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">Urgent</span>
                    </div>
                    <p className="text-[11px] text-rose-700">Multiple assessment failures (≥ 2 attempts failed)</p>
                  </div>
                </div>

                {/* Not Started */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-start gap-3">
                  <span className="text-base shrink-0">🟡</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">{atRiskBreakdown.notStarted} Not Started</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">Pending</span>
                    </div>
                    <p className="text-[11px] text-amber-700">Enrolled but no lesson activity recorded</p>
                  </div>
                </div>

                {/* Low Progress */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <span className="text-base shrink-0">🟡</span>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#202124]">{atRiskBreakdown.lowProgress} Low Progress</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-[#5F6368]">Review</span>
                    </div>
                    <p className="text-[11px] text-[#5F6368]">Below 30% completion</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  onClick={() => navigate('/admin/users')}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 font-bold shadow-xs cursor-pointer"
                >
                  View Learners
                </Button>
              </div>
            </div>

            {/* RIGHT: Recent Activity */}
            <div className="lg:col-span-6 min-w-0 bg-white border border-[#E4E7EB] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#202124]">Recent Activity</h3>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="text-xs text-[#2563EB] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {recentActivities.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-6 text-center">No recent activity recorded yet.</p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${act.type === 'payment' ? 'bg-emerald-500' : act.type === 'cert' ? 'bg-amber-500' : 'bg-[#2563EB]'}`} />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="font-bold text-[#202124] block truncate">{act.text}</span>
                        <span className="text-[11px] text-[#5F6368] block">{act.sub}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </motion.div>
  );
};

// Helper icon component
const LayoutDashboardIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export default AdminDashboard;
