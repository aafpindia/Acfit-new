import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { Activity, BookOpen, Award, CheckCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

export const UserProgress = () => {
  const { user } = useAuth();
  const { courses, enrollments, progress, certificates } = useLmsStore();
  const navigate = useNavigate();

  const userEnrollments = user ? enrollments.filter(e => e.userId === user.id || e.userId === user.email) : [];
  const userCertificates = user ? certificates.filter(c => c.userId === user.id || c.userId === user.email) : [];

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

  const totalCompletedSessions = userEnrollments.reduce((acc, en) => {
    const cp = getUserCourseProgress(en.courseId);
    return acc + Object.values(cp).filter(Boolean).length;
  }, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="sticker-tag-cyan text-[9px] uppercase">[ COURSE AUDIT ]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Activity className="h-6 w-6 text-slate-900" /> Syllabus & Course Progress
          </h1>
          <p className="font-mono text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
            [ Module verification and accreditation milestones ]
          </p>
        </div>

        <span className="sticker-tag-yellow text-[9px] shrink-0">
          ● {userEnrollments.length} ACTIVE COURSES
        </span>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">[ ENROLLED BLUEPRINTS ]</span>
            <span className="sticker-tag-yellow text-[8px]">CATALOG</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900 font-sans tracking-tight">{userEnrollments.length}</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-mono">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-500 block border-t border-border/60 pt-2">Active training programs</span>
        </div>

        <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">[ SESSIONS COMPLETED ]</span>
            <span className="sticker-tag-cyan text-[8px]">LOGGED</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900 font-sans tracking-tight">
              {totalCompletedSessions}
            </p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-mono">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-500 block border-t border-border/60 pt-2">Individual lessons finished</span>
        </div>

        <div className="tactile-card rounded-2xl bg-white p-5 corner-crosshair flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">[ ACCREDITED CERTS ]</span>
            <span className="sticker-tag-red text-[8px]">SEALED</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900 font-sans tracking-tight">{userCertificates.length}</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-mono">
              <Award className="h-4 w-4 text-accent" />
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-500 block border-t border-border/60 pt-2">Officially certified credentials</span>
        </div>
      </div>

      {/* Course List Progress Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider">[ ACTIVE BLUEPRINT BREAKDOWNS ]</h2>
          <span className="font-mono text-[10px] text-slate-500 font-bold">{userEnrollments.length} TOTAL</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {userEnrollments.length > 0 ? (
            userEnrollments.map((en, idx) => {
              const course = courses.find(c => c.id === en.courseId);
              if (!course) return null;

              const totalLessons = (course.modules || []).flatMap(m => m.lessons || []).length;
              const courseProgress = getUserCourseProgress(course.id);
              const completedCount = Object.values(courseProgress).filter(Boolean).length;
              const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

              return (
                <div key={idx} className="tactile-card rounded-2xl bg-white p-6 corner-crosshair flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="sticker-tag-yellow text-[9px] uppercase">{course.category}</span>
                      <span className="font-mono text-[9px] font-bold text-slate-500">[ TIER: {course.difficulty || 'ALL LEVELS'} ]</span>
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-black text-slate-900">{course.title}</h3>
                    
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-border">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-600' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                    
                    <div className="flex items-center justify-between font-mono text-xs text-slate-500">
                      <span>{completedCount} of {totalLessons} lessons finished</span>
                      <span className="font-bold text-slate-900">{pct}% COMPLETE</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/app/learning/${course.id}`)}
                    className="tactile-btn-primary rounded-xl text-xs font-mono font-bold h-11 px-5 bg-primary text-white shadow-tactile-sm shrink-0 w-full md:w-auto"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {pct === 100 ? 'Review Blueprint →' : 'Resume Learning →'}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="tactile-card rounded-2xl bg-white p-8 text-center corner-crosshair space-y-3">
              <span className="sticker-tag-yellow text-[9px]">[ NO ENROLLED BLUEPRINTS ]</span>
              <p className="font-mono text-xs text-slate-500">You are not enrolled in any courses yet. Browse catalog to start learning!</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/courses')}
                className="tactile-btn-primary rounded-xl text-xs font-mono font-bold h-10 px-5 bg-primary text-white"
              >
                Browse Blueprint Catalog →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProgress;
