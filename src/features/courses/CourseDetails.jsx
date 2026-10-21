import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLmsStore } from '../../stores/lmsStore';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useCourse } from '../../hooks/useCourses';
import { useEnroll } from '../../hooks/useEnrollments';
import { openCheckout } from '../../services/razorpayService';
import {
  ArrowLeft,
  Users,
  Clock,
  Star,
  CheckCircle,
  Play,
  FileText,
  FileCode,
  Shield,
  HelpCircle,
  Lock,
  ChevronRight,
  BookOpen,
  Award,
  Flame,
  Globe,
  Sparkles,
  PlayCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

export const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { enrollments, payments = [], enrollInCourse } = useLmsStore();
  const { data: course } = useCourse(courseId);
  const enrollMutation = useEnroll();
  const [enrollLoading, setEnrollLoading] = useState(false);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 font-sans bg-background">
        <div className="p-4 bg-primary/10 rounded-full text-primary animate-pulse">
          <BookOpen className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-text-main">Program not found</h2>
        <Link to="/" className="text-primary hover:underline text-xs font-bold flex items-center gap-1.5 transition-all">
          <ArrowLeft className="h-4 w-4" /> Back to Gym Syllabus Catalog
        </Link>
      </div>
    );
  }

  // Check enrollment comprehensively across local store, persistent storage, and payments
  const matchesCourse = (c) => {
    const str1 = String(c || '').toLowerCase();
    const str2 = String(course?.id || '').toLowerCase();
    if (str1 === str2) return true;
    if ((str1 === 'course-cardio-hiit' && str2 === '20202020-2020-2020-2020-202020202020') ||
        (str2 === 'course-cardio-hiit' && str1 === '20202020-2020-2020-2020-202020202020')) {
      return true;
    }
    return false;
  };

  const matchesUser = (item) => {
    if (!item || !user) return false;
    const uId = String(item.userId || item.user_id || '');
    if (uId && uId === String(user.id)) return true;
    if (user.email && item.studentEmail && item.studentEmail.toLowerCase() === user.email.toLowerCase()) {
      return true;
    }
    return false;
  };

  let isEnrolledLocally = false;
  try {
    const rawEnrollments = localStorage.getItem('_lms_enrollments');
    if (rawEnrollments) {
      const parsed = JSON.parse(rawEnrollments);
      if (Array.isArray(parsed) && parsed.some(e => matchesCourse(e.courseId || e.course_id) && matchesUser(e))) {
        isEnrolledLocally = true;
      }
    }
    const rawPayments = localStorage.getItem('_lms_payments');
    if (rawPayments) {
      const parsed = JSON.parse(rawPayments);
      if (Array.isArray(parsed) && parsed.some(p => matchesCourse(p.courseId || p.course_id) && matchesUser(p) && ['successful', 'paid'].includes((p.status || '').toLowerCase()))) {
        isEnrolledLocally = true;
      }
    }
  } catch (_) {}

  const isEnrolled = user
    ? (enrollments.some((e) => matchesCourse(e.courseId || e.course_id) && matchesUser(e)) ||
       payments.some((p) => matchesCourse(p.courseId || p.course_id) && matchesUser(p) && ['successful', 'paid'].includes((p.status || '').toLowerCase())) ||
       isEnrolledLocally)
    : false;

  const handleEnroll = async () => {
    if (!user) {
      error('Please sign in or create an account to enroll!');
      navigate(`/login?redirect=/courses/${course.id}`);
      return;
    }

    setEnrollLoading(true);

    try {
      if (course.price > 0) {
        // Razorpay checkout for paid courses
        const payResult = await openCheckout({
          courseName: course.title,
          amount: course.price,
          currency: 'INR',
          userEmail: user.email,
          userName: user.fullName,
          platformName: 'ACFIT Academy LMS',
        });

        if (!payResult.success) {
          error(payResult.error || 'Payment was cancelled.');
          setEnrollLoading(false);
          return;
        }

        const paymentPayload = {
          courseId: course.id,
          studentName: user.fullName || user.name || 'Student',
          studentEmail: user.email,
          courseTitle: course.title,
          amount: course.price,
          status: 'successful',
          method: payResult.method || 'Razorpay',
          razorpayOrderId: payResult.orderId,
          razorpayPaymentId: payResult.paymentId,
        };

        // Register in local store immediately with payment data
        enrollInCourse(course.id, user.id, paymentPayload);

        // Payment succeeded — enroll with payment data in Supabase & invalidate queries
        await enrollMutation.mutateAsync({
          courseId: course.id,
          userId: user.id,
          paymentData: paymentPayload,
        });

        success('Payment successful! You are now enrolled.');
      } else {
        const freePaymentPayload = {
          courseId: course.id,
          studentName: user.fullName || user.name || 'Student',
          studentEmail: user.email,
          courseTitle: course.title,
          amount: 0,
          status: 'successful',
          method: 'Free Enrollment',
        };

        // Register in local store immediately
        enrollInCourse(course.id, user.id, freePaymentPayload);

        // Free enrollment
        await enrollMutation.mutateAsync({
          courseId: course.id,
          userId: user.id,
          paymentData: freePaymentPayload,
        });

        success('Enrolled successfully! Ready to begin.');
      }

      navigate(`/app/learning/${course.id}`);
    } catch (err) {
      error(err.message || 'Enrollment failed. Please try again.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return Play;
      case 'rich-text':
      case 'text': return FileText;
      case 'pdf': return FileText;
      case 'ppt': return BookOpen;
      case 'image': return ImageIcon;
      case 'live-class': return Users;
      case 'download': return FileCode;
      case 'external-link': return Globe;
      case 'quiz': return Award;
      default: return FileText;
    }
  };

  // Static learning objectives
  const learningObjectives = [
    'Execute heavy lifts with precise form guidelines and bracing mechanics.',
    'Build workout splits optimized for hypertrophy, fat burn, and recovery cycles.',
    'Structure your daily calorie intakes and hydration thresholds correctly.',
    'Formulate active rest days and flexibility routines to prevent workout injuries.'
  ];

  const faqs = [
    { q: 'Is there a digital certificate awarded upon completion?', a: 'Absolutely. Finish 100% of all video classes, rich-text logs, and score 75% or above on exams to generate your certificate.' },
    { q: 'Can I stream workout sessions on mobile?', a: 'Yes! The custom player features responsive layouts compatible with iOS and Android devices.' },
    { q: 'What equipment do I need for this guide?', a: 'Detailed equipment lists are attached under each lesson overview, ranging from bodyweight to full gym apparatus.' }
  ];

  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } } };

  return (
    <div className="min-h-screen bg-background font-sans pb-16 selection:bg-primary/20 selection:text-primary">
      
      {/* Top sticky navigation bar */}
      <div className="h-16 px-6 sm:px-12 flex items-center border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-30 justify-between select-none shadow-sm">
        <button onClick={() => navigate('/')} className="text-text-secondary hover:text-text-main text-xs font-bold flex items-center gap-1.5 cursor-pointer group transition-colors">
          <ArrowLeft className="h-4.5 w-4.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Go to Catalog</span>
        </button>

        {isEnrolled && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/app/learning/${course.id}`)}
            rightIcon={<ChevronRight className="h-4 w-4" />}
            className="text-xs h-9 shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all"
          >
            Resume Learning
          </Button>
        )}
      </div>

      {/* Hero Premium Banner Area */}
      <div className="bg-gradient-to-br from-red-50/40 via-white to-slate-50 border-b border-border/60 py-12 sm:py-16 relative overflow-hidden text-text-main mb-8 shadow-xs">
        {/* Abstract glowing backgrounds */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-orange-500/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="border-border bg-background text-text-secondary text-[10px] font-bold tracking-wider uppercase px-2.5 py-1">
                {course.category}
              </Badge>
              <Badge variant="primary" className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 shadow-md shadow-primary/10">
                {course.difficulty}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-text-main leading-tight sm:leading-none">
              {course.title}
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-medium max-w-2xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-xs sm:text-sm text-text-secondary font-semibold border-t border-border/60">
              <span className="flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-primary" /> {course.students} Registered Users</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4.5 w-4.5 text-primary" /> {course.duration}</span>
              <span className="text-text-main flex items-center gap-1.5"><Flame className="h-4.5 w-4.5 text-error" /> Coach: {course.instructor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Curriculum & Details) */}
        <div className="lg:col-span-2 space-y-8">
          
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit shadow-sm">
              <TabsTrigger value="curriculum" className="text-xs sm:text-sm font-bold">Curriculum Syllabus</TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm font-bold">Overview Details</TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs sm:text-sm font-bold">FAQ Guide</TabsTrigger>
            </TabsList>

            {/* Tab 1: Curriculum Syllabus */}
            <TabsContent value="curriculum" className="space-y-6 focus-visible:outline-none">
              <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
              {course.modules?.map((mod, modIdx) => (
                <motion.div key={mod.id} variants={fadeUp} className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <h3 className="font-extrabold text-sm sm:text-base text-text-main flex items-center gap-3">
                      <span className="w-6.5 h-6.5 rounded-xl bg-primary/10 text-primary text-[10px] sm:text-xs font-extrabold flex items-center justify-center shadow-inner">
                        {modIdx + 1}
                      </span>
                      <span>{mod.title}</span>
                    </h3>
                    <span className="text-[10px] text-text-secondary font-extrabold bg-background px-2 py-1 rounded-lg border border-border/50 uppercase tracking-wider">
                      {mod.lessons?.length || 0} sessions
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {mod.lessons?.map((lesson) => {
                      const IconComponent = getLessonIcon(lesson.type);
                      return (
                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-xl border border-border/45 bg-gray-50/50 hover:bg-white hover:border-primary/15 hover:shadow-sm transition-all duration-200 text-xs sm:text-sm group">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-white border border-border/50 text-text-secondary group-hover:text-primary transition-colors">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-text-main">{lesson.title}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold text-text-secondary border-border/60">
                            {lesson.type}
                          </Badge>
                        </div>
                      );
                    })}

                    {/* Module assessment trigger */}
                    {mod.assessment && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 transition-all duration-200 text-xs sm:text-sm font-bold text-primary">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-white border border-primary/10 text-primary">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span>{mod.assessment.title}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold bg-primary/10 px-2 py-0.5 rounded text-primary">Module Exam</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Locked final certification exam row */}
              {(course.finalAssessment || course.finalExam) && (
                <div className="border border-dashed border-border rounded-2xl p-5 bg-zinc-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-border shadow-sm text-text-secondary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm sm:text-base text-text-main flex items-center gap-2">
                        <span>{(course.finalAssessment || course.finalExam).title || 'Final Certification Exam'}</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-amber-600/30 text-amber-600 font-bold bg-amber-50">Exam</Badge>
                      </p>
                      <p className="text-[10px] sm:text-xs text-text-secondary font-medium mt-1 leading-normal">
                        Complete 100% of all course modules and lessons above to unlock the final certification exam and receive your official certificate.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </motion.div>
            </TabsContent>

            {/* Tab 2: Overview Requirements */}
            <TabsContent value="details" className="space-y-6 focus-visible:outline-none">
              <Card className="border-border bg-white rounded-2xl shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-text-secondary flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" /> What You&apos;ll Learn
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {learningObjectives.map((obj, i) => (
                      <div key={i} className="flex gap-3 text-xs sm:text-sm text-text-secondary leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-border/30">
                        <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider text-text-secondary">Requirements</h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-text-secondary pl-1 space-y-2.5 leading-relaxed">
                  <li>No prior heavy weightlifting experience is required; we start from base setups.</li>
                  <li>Access to dumbbells, barbell racks, or basic cable gyms is recommended.</li>
                  <li>A willing mentality to log sets, progress volume metrics, and adjust forms.</li>
                </ul>
              </div>
            </TabsContent>

            {/* Tab 3: FAQs */}
            <TabsContent value="faqs" className="space-y-4 focus-visible:outline-none">
              {faqs.map((faq, i) => (
                <Card key={i} className="border-border bg-white rounded-2xl hover:border-primary/20 transition-colors shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <h4 className="font-black text-xs sm:text-sm text-text-main flex items-center gap-2.5">
                      <HelpCircle className="h-4.5 w-4.5 text-primary shrink-0" />
                      <span>{faq.q}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed pl-7">
                      {faq.a}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

        </div>

        {/* Right Checkout/Enroll Panel card */}
        <div className="lg:col-span-1">
          <Card className="border-border sticky top-24 shadow-premium bg-white rounded-2xl overflow-hidden">
            {/* Promotional Video Banner preview */}
            <div className="aspect-video relative overflow-hidden border-b border-border/80 group">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-[#1E65B8] flex flex-col items-center justify-center p-4 text-white text-center">
                  <BookOpen className="h-10 w-10 text-blue-200 mb-1" />
                  <span className="font-bold text-xs text-white truncate max-w-full">{course.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center backdrop-blur-[1px]">
                <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200">
                  <PlayCircle className="h-8 w-8 fill-current" />
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-text-main tracking-tight">
                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                  </span>
                  {course.price > 0 && (
                    <span className="text-sm text-text-secondary line-through font-semibold">₹1,499</span>
                  )}
                </div>
                <p className="text-xs text-text-secondary font-bold uppercase tracking-wide">
                  {course.price === 0 ? 'Instant Full Access' : 'One-time registration payment'}
                </p>
              </div>

              {isEnrolled ? (
                <Button
                  variant="primary"
                  className="w-full justify-center text-xs h-10 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  onClick={() => navigate(`/app/learning/${course.id}`)}
                >
                  Enter Course Workspace
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="w-full justify-center text-xs h-10 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  onClick={handleEnroll}
                  isLoading={enrollLoading}
                >
                  {course.price === 0 ? 'Enroll in Program' : 'Complete Registration'}
                </Button>
              )}

              <div className="space-y-3 pt-2 text-xs text-text-secondary font-semibold border-t border-border/80">
                <span className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-1">Included in membership:</span>
                <div className="flex items-center gap-2.5"><Clock className="h-4.5 w-4.5 text-primary" /> <span>Full lifetime curriculum access</span></div>
                <div className="flex items-center gap-2.5"><Shield className="h-4.5 w-4.5 text-primary" /> <span>Cross-platform mobile & desktop streaming</span></div>
                <div className="flex items-center gap-2.5"><Award className="h-4.5 w-4.5 text-primary" /> <span>Printable verification certificate</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default CourseDetails;
