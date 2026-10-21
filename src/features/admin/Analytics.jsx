import React, { useState, useMemo } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { getUserCourseProgress } from '../../services/progressService';
import {
  TrendingUp,
  Users,
  Award,
  DollarSign,
  BarChart2,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  GaugeChart,
  HorizontalBar,
  DonutChart,
  ColumnChart,
  LineAreaChart,
  TrainingBars,
  CHART_COLORS,
  buildLinePath
} from '../../components/ui/charts';

export const Analytics = () => {
  const { courses = [], enrollments = [], payments = [], certificates = [], attempts = [], progress = {}, syncFromSupabase } = useLmsStore();

  React.useEffect(() => {
    try {
      syncFromSupabase();
    } catch (_) {}
  }, [syncFromSupabase]);

  const [dateFilter, setDateFilter] = useState('30days');

  // Date filter cutoff calculation
  const dateCutoff = useMemo(() => {
    const now = new Date();
    if (dateFilter === '30days') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (dateFilter === '90days') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return null; // 'all' — no cutoff
  }, [dateFilter]);

  const isWithinDateRange = (dateStr) => {
    if (!dateCutoff) return true;
    const d = new Date(dateStr || 0);
    return d >= dateCutoff;
  };

  // Revenue & Monetization Metrics
  const successfulPayments = useMemo(
    () => payments.filter((p) => {
      const st = (p.status || '').toLowerCase();
      const isPaid = st === 'successful' || st === 'paid';
      return isPaid && isWithinDateRange(p.date || p.paidAt || p.createdAt);
    }),
    [payments, dateCutoff]
  );
  const grossRevenue = useMemo(() => successfulPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0), [successfulPayments]);

  const uniqueUsersSet = useMemo(() => {
    const s = new Set();
    enrollments.forEach(e => {
      const uid = e.userId || e.user_id;
      if (uid) s.add(uid);
    });
    return s;
  }, [enrollments]);

  const totalMembers = uniqueUsersSet.size;
  const arpu = totalMembers > 0 ? Math.round(grossRevenue / totalMembers) : 0;
  const aov = successfulPayments.length > 0 ? Math.round(grossRevenue / successfulPayments.length) : 0;
  const conversionRate = totalMembers > 0 ? Math.min(100, Math.round((successfulPayments.length / totalMembers) * 100)) : 0;

  // Active learners count
  const activeLearnersCount = useMemo(() => {
    const s = new Set();
    enrollments.forEach(e => {
      const uid = e.userId || e.user_id;
      const cid = e.courseId || e.course_id;
      const up = getUserCourseProgress(uid, cid, progress);
      if (Object.keys(up || {}).filter(k => up[k]).length > 0) s.add(uid);
    });
    return s.size;
  }, [enrollments, progress]);

  // Overall completion rate
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

  // Completed learners count
  const completedLearnersCount = useMemo(() => {
    const s = new Set();
    enrollments.forEach(e => {
      const uid = e.userId || e.user_id;
      const cid = e.courseId || e.course_id;
      const course = courses.find(c => c.id === cid);
      const totalLessons = course?.modules?.flatMap(m => m.lessons || []).length || 1;
      const up = getUserCourseProgress(uid, cid, progress);
      const done = Object.keys(up || {}).filter(k => up[k]).length;
      if (done >= totalLessons && totalLessons > 0) s.add(uid);
    });
    return s.size;
  }, [enrollments, courses, progress]);

  // Dynamic Month Labels & Values
  const monthLabels = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(d.toLocaleString('default', { month: 'short' }));
    }
    return list;
  }, []);

  const monthlyRevMap = useMemo(() => {
    return successfulPayments.reduce((acc, p) => {
      const mon = new Date(p.date || p.paidAt || p.createdAt || Date.now()).toLocaleString('default', { month: 'short' });
      acc[mon] = (acc[mon] || 0) + (parseFloat(p.amount) || 0);
      return acc;
    }, {});
  }, [successfulPayments]);

  const monthValues = useMemo(() => monthLabels.map((m) => monthlyRevMap[m] || 0), [monthLabels, monthlyRevMap]);

  // Program Enrollment Share
  const enrollmentByProgram = useMemo(() => {
    return courses.map((c, idx) => ({
      label: c.title.length > 16 ? c.title.substring(0, 16) + '…' : c.title,
      fullTitle: c.title,
      value: enrollments.filter((e) => e.courseId === c.id || e.course_id === c.id).length,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [courses, enrollments]);

  // Assessment Score Averages
  const courseScores = useMemo(() => {
    return courses.map((c) => {
      const ca = attempts.filter((a) => a.courseId === c.id || a.course_id === c.id);
      const avg = ca.length > 0 ? Math.round(ca.reduce((s, a) => s + (parseFloat(a.score) || 0), 0) / ca.length) : 0;
      return { label: c.title.length > 12 ? c.title.substring(0, 12) + '…' : c.title, value: avg };
    });
  }, [courses, attempts]);

  // Learning Funnel Data
  const learningFunnelData = useMemo(() => {
    const enrolled = totalMembers;
    const started = activeLearnersCount;
    const attemptUsers = new Set(attempts.map(a => a.userId || a.user_id)).size;
    const completed = completedLearnersCount;
    const certified = certificates.length;

    const getPct = (cnt) => (enrolled > 0 ? `${Math.min(100, Math.round((cnt / enrolled) * 100))}%` : '0%');

    return [
      { stage: 'Enrolled', count: enrolled, pct: enrolled > 0 ? '100%' : '0%' },
      { stage: 'Started Learning', count: started, pct: getPct(started) },
      { stage: 'Assessment Attempt', count: attemptUsers, pct: getPct(attemptUsers) },
      { stage: 'Completed', count: completed, pct: getPct(completed) },
      { stage: 'Certified', count: certified, pct: getPct(certified) }
    ];
  }, [totalMembers, activeLearnersCount, attempts, completedLearnersCount, certificates]);

  const passRate = attempts.length > 0
    ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
    : 0;

  const avgAttemptScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (parseFloat(a.score) || 0), 0) / attempts.length)
    : 0;

  return (
    <div className="space-y-6 font-sans pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202124] tracking-tight">Analytics</h1>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Deep diagnostic performance reports across revenue, learner retention, courses, and exams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 px-3 text-xs font-semibold bg-white border border-[#E4E7EB] rounded-xl text-[#202124] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="30days">Last 30 Days ▼</option>
            <option value="90days">Last 90 Days ▼</option>
            <option value="all">All Time ▼</option>
          </select>
        </div>
      </div>

      {/* Tabs Bar */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white border border-[#E4E7EB] p-1.5 rounded-2xl shadow-2xs flex flex-wrap gap-1 mb-6 text-xs font-semibold">
          <TabsTrigger value="overview" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="learners" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Learners
          </TabsTrigger>
          <TabsTrigger value="courses" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Courses
          </TabsTrigger>
          <TabsTrigger value="assessments" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="revenue" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="retention" className="px-4 py-2 rounded-xl text-[#5F6368] data-[state=active]:bg-[#2563EB] data-[state=active]:text-white">
            Retention
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: OVERVIEW ────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Learners</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{totalMembers}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Revenue</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">₹{grossRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Completion Rate</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{overallCompletionRate}%</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Pass Rate</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{passRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#202124]">Learner Growth</h3>
              <LineAreaChart
                color="#2563EB"
                data={monthLabels.map((m) => {
                  const mCount = enrollments.filter(e => {
                    const d = new Date(e.enrolledAt || e.created_at || Date.now());
                    return d.toLocaleString('default', { month: 'short' }) === m;
                  }).length;
                  return { label: m, value: mCount };
                })}
                height={160}
              />
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#202124]">Revenue Trend</h3>
              <LineAreaChart
                color="#059669"
                data={monthLabels.map((m, idx) => ({ label: m, value: monthValues[idx] }))}
                height={160}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: LEARNERS ────────────────────────────────────────── */}
        <TabsContent value="learners" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Total Learners</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{totalMembers}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Active Learners</span>
              <div className="text-2xl font-bold text-[#2563EB] mt-1">{activeLearnersCount}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Completed</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{completedLearnersCount}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Completion Rate</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{overallCompletionRate}%</div>
            </div>
          </div>

          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#202124]">Learner Share by Program</h3>
            <HorizontalBar
              color="#2563EB"
              data={enrollmentByProgram.map((d) => ({ ...d, max: Math.max(...enrollmentByProgram.map((x) => x.value), 1) }))}
            />
          </div>
        </TabsContent>

        {/* ─── TAB 3: COURSES ─────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-6">
          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#202124]">Syllabus Retention & Course Completion</h3>
            <div className="space-y-3">
              {enrollmentByProgram.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#202124]">{item.fullTitle || item.label}</span>
                    <span className="text-[#5F6368]">{overallCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2563EB] h-full rounded-full transition-all" style={{ width: `${overallCompletionRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 4: ASSESSMENTS ─────────────────────────────────────── */}
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Average Score</span>
              <div className="text-2xl font-bold text-[#2563EB] mt-1">{avgAttemptScore}%</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Pass Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{passRate}%</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Total Attempts</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">{attempts.length}</div>
            </div>
          </div>

          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#202124]">Course Assessment Score Comparison</h3>
            <ColumnChart data={courseScores} height={180} />
          </div>
        </TabsContent>

        {/* ─── TAB 5: REVENUE ANALYTICS ────────────────────────────────── */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Gross Revenue</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">₹{grossRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">ARPU (Avg Rev / User)</span>
              <div className="text-2xl font-bold text-[#2563EB] mt-1">₹{arpu}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">AOV (Avg Order Value)</span>
              <div className="text-2xl font-bold text-[#202124] mt-1">₹{aov}</div>
            </div>
            <div className="bg-white border border-[#E4E7EB] rounded-2xl p-5 shadow-2xs">
              <span className="text-xs font-semibold text-[#5F6368]">Conversion Rate</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{conversionRate}%</div>
            </div>
          </div>


          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#202124]">Revenue Trend Over Time</h3>
            <LineAreaChart
              color="#059669"
              data={monthLabels.map((m, idx) => ({ label: m, value: monthValues[idx] }))}
              height={180}
            />
          </div>
        </TabsContent>

        {/* ─── TAB 6: RETENTION & LEARNING FUNNEL ──────────────────────── */}
        <TabsContent value="retention" className="space-y-6">
          <div className="bg-white border border-[#E4E7EB] rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Learning Retention Funnel</h3>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Track learner progression from initial course enrollment down to final accreditation.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {learningFunnelData.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-[#E4E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#202124]">{item.stage}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#202124]">{item.count.toLocaleString()} Learners</span>
                    <span className="font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full">{item.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Analytics;
