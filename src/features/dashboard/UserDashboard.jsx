import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  ArrowRight,
  Calendar,
  ChevronRight,
  Megaphone,
  CheckCircle,
  Target,
  Star,
  Zap,
  Shield,
  Trophy,
  Lock,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { GaugeChart, TrainingBars, CHART_COLORS } from '../../components/ui/charts';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, enrollments, progress, certificates, announcements, attempts, syncFromSupabase, subscribeToRealtime } = useLmsStore();

  useEffect(() => {
    syncFromSupabase(user);
    const unsubscribe = subscribeToRealtime(user);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.id, user?.email]);

  // ─── REAL DATA COMPUTATIONS ────────────────────────────────

  const isUserMatch = (id) => {
    if (!id || !user) return false;
    const strId = String(id).toLowerCase().trim();
    const uId = String(user.id || '').toLowerCase().trim();
    const uEmail = String(user.email || '').toLowerCase().trim();
    return strId === uId || strId === uEmail;
  };

  // Enrolled courses directly from user's database enrollments
  const userEnrolled = enrollments.filter((e) => isUserMatch(e.userId));
  const enrolledCourses = courses.filter((c) =>
    userEnrolled.some((e) => e.courseId === c.id)
  );

  // Unified helper to get progress for a specific course from DB state
  const getUserCourseProgress = (courseId) => {
    if (!courseId) return {};
    if (user && progress[user?.id] && progress[user.id][courseId]) {
      return progress[user.id][courseId];
    }
    if (user && progress[user?.email] && progress[user.email][courseId]) {
      return progress[user.email][courseId];
    }
    if (progress[courseId] && typeof progress[courseId] === 'object') {
      return progress[courseId];
    }
    return {};
  };

  // Per-course progress calculator from database lesson_progress
  const getCourseProgress = (course) => {
    if (!course || !course.modules || course.modules.length === 0) return 0;
    const userProgress = getUserCourseProgress(course.id);
    const totalLessons = course.modules.flatMap((m) => m.lessons || []).length;
    if (totalLessons === 0) return 0;
    const completedCount = Object.keys(userProgress).filter(k => userProgress[k]).length;
    return Math.min(100, Math.round((completedCount / totalLessons) * 100));
  };

  const getLessonsCount = (course) => {
    if (!course || !course.modules || course.modules.length === 0) return '0 / 0 sessions completed';
    const userProgress = getUserCourseProgress(course.id);
    const totalLessons = course.modules.flatMap((m) => m.lessons || []).length;
    const completedCount = Object.keys(userProgress).filter(k => userProgress[k]).length;
    return `${completedCount} / ${totalLessons} sessions completed`;
  };

  // Total lessons completed across ALL enrolled programs from database
  const completedLessons = enrolledCourses.reduce((acc, course) => {
    const userProgress = getUserCourseProgress(course.id);
    return acc + Object.keys(userProgress).filter(k => userProgress[k]).length;
  }, 0);

  // Total lessons available across enrolled courses
  const totalLessonsAvailable = enrolledCourses.reduce((acc, c) => {
    return acc + (c.modules?.flatMap(m => m.lessons || []).length || 0);
  }, 0);

  // Overall progress percentage
  const overallProgress = totalLessonsAvailable > 0
    ? Math.min(100, Math.round((completedLessons / totalLessonsAvailable) * 100))
    : 0;

  // Completed courses
  const completedCourses = enrolledCourses.filter(c => getCourseProgress(c) === 100);

  // User's assessment attempts from database
  const userAttempts = attempts.filter(a => isUserMatch(a.userId));
  const passedAttempts = userAttempts.filter(a => a.passed);

  // User's certificates from database
  const userCerts = certificates.filter((c) => isUserMatch(c.userId));

  // Get next uncompleted lesson from database progress
  const getNextUncompletedLesson = (course) => {
    if (!course || !course.modules) return null;
    const userProgress = getUserCourseProgress(course.id);

    for (const mod of course.modules) {
      if (mod.lessons) {
        for (const les of mod.lessons) {
          if (!userProgress[les.id]) {
            return { lesson: les, module: mod };
          }
        }
      }
    }
    const allLessons = course.modules.flatMap(m => m.lessons || []);
    return allLessons.length > 0 ? { lesson: allLessons[allLessons.length - 1], module: course.modules[course.modules.length - 1] } : null;
  };

  // Resume learning target
  const resumeLearningTarget = enrolledCourses.find(c => getCourseProgress(c) < 100) || enrolledCourses[0];

  // User-specific + Course + System Announcements
  const userEmail = (user?.email || '').toLowerCase();
  const userName = (user?.fullName || '').toLowerCase();

  const activeAnnouncements = announcements.filter((ann) => {
    const t = (ann.target || '').toLowerCase();
    if (!t || t === 'all' || t === 'all athletes' || t.includes('all registered athletes')) return true;
    
    // Course targeting
    if (enrolledCourses.some((c) => c.id === ann.target || t.includes(c.title.toLowerCase()))) return true;

    // Direct User Specific Communication!
    if (userEmail && t.includes(userEmail)) return true;
    if (userName && t.includes(userName)) return true;

    return false;
  });

  // Per-course completion data for TrainingBars chart
  const courseCompletionBars = enrolledCourses.map((c, idx) => ({
    label: c.title.length > 18 ? c.title.substring(0, 18) + '…' : c.title,
    pct: getCourseProgress(c),
    color: CHART_COLORS[idx % CHART_COLORS.length]
  }));

  // Achievements
  const achievements = [
    { title: 'First Enrollment', desc: 'Enroll in a program', icon: BookOpen, earned: userEnrolled.length >= 1, color: 'var(--color-chart-blue)' },
    { title: '3 Programs', desc: 'Enroll in 3 programs', icon: Target, earned: userEnrolled.length >= 3, color: 'var(--color-chart-purple)' },
    { title: 'First Lesson', desc: 'Complete a lesson', icon: CheckCircle, earned: completedLessons >= 1, color: 'var(--color-chart-teal)' },
    { title: '10 Lessons', desc: 'Complete 10 lessons', icon: Zap, earned: completedLessons >= 10, color: 'var(--color-chart-amber)' },
    { title: 'Assessment Ace', desc: 'Pass an assessment', icon: Star, earned: passedAttempts.length >= 1, color: 'var(--color-chart-coral)' },
    { title: 'Certified', desc: 'Earn a certificate', icon: Trophy, earned: userCerts.length >= 1, color: 'var(--color-success)' }
  ];

  // Activity timeline
  const activityTimeline = [
    ...userEnrolled.map(e => {
      const course = courses.find(c => c.id === e.courseId);
      return {
        text: `Enrolled in ${course?.title || 'a program'}`,
        date: e.enrolledAt,
        icon: BookOpen,
        color: 'var(--color-chart-blue)'
      };
    }),
    ...passedAttempts.map(a => {
      const course = courses.find(c => c.id === a.courseId);
      return {
        text: `Passed assessment for ${course?.title || 'a program'} (${a.score}%)`,
        date: a.date,
        icon: CheckCircle,
        color: 'var(--color-chart-teal)'
      };
    }),
    ...userCerts.map(c => ({
      text: `Earned certificate: ${c.courseTitle}`,
      date: c.date,
      icon: Award,
      color: 'var(--color-success)'
    }))
  ]
    .filter(e => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const handleResume = (courseToResume) => {
    const targetCourse = courseToResume && courseToResume.id ? courseToResume : resumeLearningTarget;
    if (targetCourse) {
      const nextItem = getNextUncompletedLesson(targetCourse);
      if (nextItem && nextItem.lesson) {
        navigate(`/app/learning/${targetCourse.id}?lessonId=${nextItem.lesson.id}`);
      } else {
        navigate(`/app/learning/${targetCourse.id}`);
      }
    } else {
      navigate('/app/courses');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  const getSubtitle = () => {
    if (enrolledCourses.length === 0) {
      return 'Explore our fitness program blueprints to start your training path today.';
    }
    if (completedCourses.length > 0 && completedCourses.length === enrolledCourses.length) {
      return `You have completed all ${completedCourses.length} enrolled programs. Explore more!`;
    }
    if (completedLessons > 0) {
      return `You have completed ${completedLessons} lesson${completedLessons !== 1 ? 's' : ''} across ${enrolledCourses.length} program${enrolledCourses.length !== 1 ? 's' : ''}. Keep going!`;
    }
    return `You're enrolled in ${enrolledCourses.length} program${enrolledCourses.length !== 1 ? 's' : ''}. Start your first workout lesson!`;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 font-sans pb-16 max-w-6xl mx-auto"
    >
      {/* ─── Royal Blue Hero Welcome Banner ────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="bg-[#1E65B8] text-white rounded-xl p-6 sm:p-7 shadow-sm space-y-3 relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded text-white inline-block">
              Member Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Athlete'} 👋
            </h1>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed font-medium">
              {getSubtitle()}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleResume()}
              className="bg-white hover:bg-slate-100 text-[#1E65B8] font-bold rounded-lg h-10 px-5 text-xs shadow-md cursor-pointer transition-all border-none"
              rightIcon={<ArrowRight className="h-4 w-4 text-[#1E65B8]" />}
            >
              {resumeLearningTarget ? 'Resume Active Course' : 'Browse Catalog'}
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
      </motion.div>

      {/* ─── Metric KPI Cards ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled Courses', val: userEnrolled.length, sub: `${completedCourses.length} completed`, icon: BookOpen, iconBg: 'bg-blue-50 text-[#2088E7] border border-blue-200' },
          { label: 'Sessions Completed', val: completedLessons, sub: `${totalLessonsAvailable} total sessions`, icon: CheckCircle, iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
          { label: 'Assessments Passed', val: passedAttempts.length, sub: `${userAttempts.length} attempts`, icon: TrendingUp, iconBg: 'bg-amber-50 text-amber-600 border border-amber-200' },
          { label: 'Earned Certificates', val: userCerts.length, sub: userCerts.length > 0 ? 'Verified' : 'Pending completion', icon: Award, iconBg: 'bg-blue-50 text-blue-600 border border-blue-200' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">{item.val}</span>
              </div>
              <span className="text-[11px] text-slate-500 block border-t border-slate-100 pt-2 font-medium">{item.sub}</span>
            </div>
          );
        })}
      </motion.div>

      {/* ─── Continue + Progress Gauge ─────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Continue learning card */}
        <div className="lg:col-span-2">
          {resumeLearningTarget ? (
            <div className="tactile-card rounded-2xl bg-white p-6 corner-crosshair flex flex-col justify-between h-full gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#202124]">Current Program</span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">[ TIER: {resumeLearningTarget.difficulty || 'ALL LEVELS'} ]</span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-black text-[#202124]">{resumeLearningTarget.title}</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="sticker-tag-yellow text-[9px] uppercase">{resumeLearningTarget.category}</span>
                  <span className="font-mono text-xs text-slate-500 font-medium">{getLessonsCount(resumeLearningTarget)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-2.5 rounded-full flex-1 bg-slate-100 overflow-hidden border border-border">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${getCourseProgress(resumeLearningTarget)}%` }} />
                  </div>
                  <span className="font-mono text-xs font-black text-[#202124]">{getCourseProgress(resumeLearningTarget)}%</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleResume(resumeLearningTarget)}
                  className="tactile-btn-primary rounded-xl h-10 px-5 text-xs font-mono font-bold bg-primary text-white shrink-0"
                >
                  Resume Plan →
                </Button>
              </div>
            </div>
          ) : (
            <div className="tactile-card rounded-2xl bg-white p-8 corner-crosshair flex flex-col items-center justify-center text-center h-full space-y-4">
              <span className="sticker-tag-yellow text-[9px]">[ NO ACTIVE BLUEPRINTS ]</span>
              <p className="font-mono text-xs text-slate-500 max-w-sm">
                You haven't enrolled in any structured fitness programs yet. Explore the blueprint catalog!
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/courses')}
                className="tactile-btn-primary rounded-xl h-10 px-5 text-xs font-mono font-bold bg-primary text-white"
              >
                Explore Blueprint Catalog →
              </Button>
            </div>
          )}
        </div>

        {/* Overall progress gauge */}
        <div className="tactile-card rounded-2xl bg-white p-6 corner-crosshair flex flex-col items-center justify-center text-center">
          <div className="space-y-1 mb-2">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block">[ SYLLABUS VELOCITY ]</span>
            <h3 className="text-sm font-black text-[#202124]">Total Course Mastery</h3>
            <span className="font-mono text-[10px] text-slate-500">{completedLessons} / {totalLessonsAvailable} sessions logged</span>
          </div>

          <div className="py-2">
            <GaugeChart
              value={overallProgress}
              color="#0F172A"
              label=""
              size={140}
            />
          </div>

          <span className="sticker-tag-cyan text-[9px] mt-1">
            {overallProgress === 100 ? '● 100% COMPLETE' : `${overallProgress}% OVERALL`}
          </span>
        </div>
      </motion.div>

      {/* ─── Main Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Programs + Completion Bars */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">

          {/* Enrolled Programs List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="font-mono text-xs font-bold text-[#202124] uppercase tracking-wider">[ ENROLLED TRAINING BLUEPRINTS ]</h2>
              <span className="font-mono text-[10px] text-slate-500 font-bold">{enrolledCourses.length} ACTIVE</span>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.slice(0, 2).map((course) => (
                  <div key={course.id} className="tactile-card rounded-2xl bg-white p-4 space-y-3 corner-crosshair">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-xl border border-border" />
                    <div className="space-y-1">
                      <span className="sticker-tag-yellow text-[9px] uppercase">{course.category}</span>
                      <h3 className="font-bold text-xs text-[#202124] truncate">{course.title}</h3>
                      <span className="font-mono text-[10px] text-slate-500 block">₹{course.price > 0 ? course.price : 'Free'}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="tactile-btn-primary w-full text-xs font-mono font-bold h-8 rounded-lg bg-primary text-white"
                    >
                      View Blueprint →
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {enrolledCourses.map((course) => {
                  const prog = getCourseProgress(course);
                  return (
                    <div key={course.id} className="tactile-card rounded-2xl bg-white overflow-hidden corner-crosshair">
                      <div className="flex flex-col sm:flex-row h-full">
                        <div className="w-full sm:w-44 h-32 sm:h-auto shrink-0 overflow-hidden relative border-b sm:border-b-0 sm:border-r border-border bg-[#2563EB]">
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-90" />
                          <div className="absolute top-2 left-2">
                            <span className="sticker-tag-yellow text-[8px] uppercase">{course.category}</span>
                          </div>
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                              <span>[ TIER: {course.difficulty || 'ALL LEVELS'} ]</span>
                            </div>
                            <h3 className="font-black text-base text-[#202124] truncate">{course.title}</h3>
                            <p className="font-mono text-xs text-slate-500 font-medium">{getLessonsCount(course)}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-4">
                            <div className="flex-1 flex items-center gap-3">
                              <div className="h-2 rounded-full flex-1 bg-slate-100 overflow-hidden border border-border">
                                <div className={`h-full rounded-full ${prog === 100 ? 'bg-emerald-600' : 'bg-primary'}`} style={{ width: `${prog}%` }} />
                              </div>
                              <span className="font-mono text-xs font-bold text-[#202124]">{prog}%</span>
                            </div>
                            <Button
                              variant={prog === 100 ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleResume(course)}
                              className="tactile-btn-primary py-1 px-3 h-8 text-xs font-mono font-bold rounded-lg bg-primary text-white shrink-0"
                            >
                              {prog === 100 ? 'Review Plan' : 'Resume Plan →'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Per-Course Completion Bars */}
          {courseCompletionBars.length > 0 && (
            <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair space-y-4">
              <div className="border-b border-border pb-3">
                <span className="font-mono text-[9px] font-bold text-slate-500 uppercase block">[ SYLLABUS COMPLETION SPECS ]</span>
                <h3 className="text-sm font-black text-[#202124]">Program Progress Breakdown</h3>
              </div>
              <div>
                <TrainingBars data={courseCompletionBars} />
              </div>
            </div>
          )}

          {/* Announcements */}
          {activeAnnouncements.length > 0 && (
            <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Megaphone className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-black text-[#202124]">[ STUDIO ANNOUNCEMENTS ]</h3>
              </div>
              <div className="space-y-3">
                {activeAnnouncements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="p-3 rounded-xl border border-border bg-slate-50/70 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-[#202124]">{ann.title}</span>
                      <span className="font-mono text-[9px] text-slate-500 shrink-0 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ann.date)}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-600 leading-relaxed">{ann.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column: Achievements & Activity Log */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Achievements Badge Grid */}
          <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-black text-[#202124]">[ MILESTONES & BADGES ]</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all text-center space-y-1.5 ${
                      ach.earned
                        ? 'border-[#2563EB] bg-slate-50 shadow-xs'
                        : 'border-dashed border-border opacity-50 bg-white'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mx-auto shadow-tactile-sm font-mono"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-black text-[#202124] truncate">{ach.title}</p>
                    <span className="font-mono text-[9px] text-slate-500 block leading-tight">{ach.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Clock className="h-4 w-4 text-[#202124]" />
              <h3 className="text-sm font-black text-[#202124]">[ RECENT ACTIVITY LOG ]</h3>
            </div>

            <div className="space-y-3">
              {activityTimeline.length > 0 ? (
                activityTimeline.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="p-1.5 rounded-lg bg-slate-100 border border-border shrink-0 mt-0.5 text-slate-800">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#202124] leading-snug">{item.text}</p>
                        <span className="font-mono text-[9px] text-slate-500">{formatDate(item.date)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="font-mono text-xs text-slate-500 italic text-center py-4">
                  No recent activity logged. Complete lessons to record milestones!
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
