import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BookOpen, Award, CreditCard, BarChart3, Plus, ArrowRight, UserCheck } from 'lucide-react';
import { useLmsStore } from '../../stores/lmsStore';
import { useAuth } from '../../hooks/useAuth';

// STUDENT COURSES LIST
export const CoursesStudent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, enrollments, payments = [], progress, syncFromSupabase } = useLmsStore();
  const userId = user?.id || '';

  useEffect(() => {
    if (user) {
      syncFromSupabase(user);
    }
  }, [user, syncFromSupabase]);

  // Check enrollment
  const isEnrolled = (courseId) => {
    const matchesCourse = (c) => {
      const str1 = String(c || '').toLowerCase();
      const str2 = String(courseId || '').toLowerCase();
      if (str1 === str2) return true;
      if ((str1 === 'course-cardio-hiit' && str2 === '20202020-2020-2020-2020-202020202020') ||
          (str2 === 'course-cardio-hiit' && str1 === '20202020-2020-2020-2020-202020202020')) {
        return true;
      }
      return false;
    };
    const matchesUser = (item) => {
      if (!item || !userId) return false;
      const uId = String(item.userId || item.user_id || '');
      if (uId && uId === String(userId)) return true;
      if (user?.email && item.studentEmail && item.studentEmail.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
      return false;
    };

    if (enrollments.some((e) => matchesCourse(e.courseId || e.course_id) && matchesUser(e))) return true;
    if (payments.some((p) => matchesCourse(p.courseId || p.course_id) && matchesUser(p) && ['successful', 'paid'].includes((p.status || '').toLowerCase()))) return true;

    try {
      const raw = localStorage.getItem('_lms_enrollments');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.some(e => matchesCourse(e.courseId || e.course_id) && matchesUser(e))) return true;
      }
    } catch (_) {}

    return false;
  };

  const getCourseProgress = (course) => {
    const userProgress = (progress[userId] && progress[userId][course.id]) || {};
    const totalLessons = course.modules?.flatMap((m) => m.lessons || []).length || 0;
    const completedCount = Object.keys(userProgress).filter(k => userProgress[k]).length;
    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  const getLessonsCount = (course) => {
    const totalLessons = course.modules?.flatMap((m) => m.lessons || []).length || 0;
    return totalLessons;
  };

  // Filter only published courses for students, unless they are admin
  const visibleCourses = courses.filter((c) => c.published || user?.role === 'admin');

  return (
    <div className="space-y-6 font-sans">
      <div className="relative overflow-hidden bg-white border border-stone-200/80 rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col items-start gap-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-600/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 leading-[1.15]">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600">CFR PRO</span> Fitness<br className="hidden sm:block" /> Certification courses
          </h1>
          <p className="text-sm text-stone-500 font-medium">
            Continue your current programs or discover new internationally recognized credentials.
          </p>
        </div>
      </div>

      {visibleCourses.length === 0 ? (
        <Card className="border-border text-center py-16">
          <CardContent className="flex flex-col items-center justify-center max-w-sm mx-auto">
            <div className="p-3.5 bg-primary/10 rounded-xl text-primary mb-6">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-text-main">No Programs Published Yet</h2>
            <p className="text-xs text-text-secondary mt-3 leading-relaxed">
              Check back soon! The gym administrators are designing high-performance strength and cardio guides for you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const prog = enrolled ? getCourseProgress(course) : 0;
            const totalLessons = getLessonsCount(course);

            return (
              <Card key={course.id} hoverLift className="border-border overflow-hidden flex flex-col justify-between bg-white shadow-sm">
                <div>
                  <div className="h-40 w-full overflow-hidden relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1E65B8] flex items-center justify-center text-white p-4">
                        <BookOpen className="h-10 w-10 text-blue-200" />
                      </div>
                    )}
                    {enrolled && (
                      <Badge variant="success" className="absolute top-3 right-3 shadow-md">
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="primary" className="w-fit">{course.category}</Badge>
                      <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">{course.difficulty}</span>
                    </div>
                    <CardTitle className="text-base font-bold leading-tight line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed mt-2 pt-1 border-t border-border/50 line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                </div>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                    <span>{totalLessons} Sessions</span>
                    {enrolled && <span className="font-semibold">{prog}% Completed</span>}
                  </div>
                  {enrolled && (
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${prog}%` }} />
                    </div>
                  )}
                  <Button
                    variant={enrolled ? (prog === 100 ? 'outline' : 'primary') : 'outline'}
                    className="w-full text-xs py-1 h-9"
                    onClick={() => navigate(enrolled ? `/app/learning/${course.id}` : `/courses/${course.id}`)}
                  >
                    {enrolled ? (prog === 100 ? 'Review Program' : 'Resume Program') : 'View Program Details'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ADMIN COURSES MANAGER
export const CoursesAdmin = () => {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Manage Courses</h1>
          <p className="text-xs text-text-secondary font-medium">Create, publish, and audit platform curriculums</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Create New Course
        </Button>
      </div>

      <Card className="border-border text-center py-16">
        <CardContent className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary mb-6">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-text-main">Course Manager Ready</h2>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            Create lesson structures, assign instructors, toggle draft/published flags, and audit syllabus files.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ADMIN ASSESSMENTS
export const AssessmentsAdmin = () => {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Assessments & Exams</h1>
        <p className="text-xs text-text-secondary font-medium">Draft test questions and monitor grade metrics</p>
      </div>

      <Card className="border-border text-center py-16">
        <CardContent className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="p-3.5 bg-amber-500/10 rounded-xl text-amber-500 mb-6">
            <Award className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-text-main">Assessment Engine</h2>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            Construct randomized multi-choice exams, set pass benchmarks, track submission times, and award certificates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ADMIN PAYMENTS
export const PaymentsAdmin = () => {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Payments Ledger</h1>
        <p className="text-xs text-text-secondary font-medium">Review sales transactions and student enrollment gross revenue</p>
      </div>

      <Card className="border-border text-center py-16">
        <CardContent className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="p-3.5 bg-success/10 rounded-xl text-success mb-6">
            <CreditCard className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-text-main">Transaction History</h2>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            Monitor payment webhooks, sync invoices, issue refunds, and chart monthly gross margins.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// ADMIN ANALYTICS
export const AnalyticsAdmin = () => {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Platform Analytics</h1>
        <p className="text-xs text-text-secondary font-medium">Examine site traffic, user activity rates, and class engagement</p>
      </div>

      <Card className="border-border text-center py-16">
        <CardContent className="flex flex-col items-center justify-center max-w-sm mx-auto">
          <div className="p-3.5 bg-blue-500/10 rounded-xl text-blue-500 mb-6">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-text-main">Analytics Dashboard</h2>
          <p className="text-xs text-text-secondary mt-3 leading-relaxed">
            Track user retention dropoffs, analyze video watch runtimes, and download CSV reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
