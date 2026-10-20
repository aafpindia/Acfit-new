import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import {
  fetchCourses,
  createCourse as createCourseDb,
  updateCourse as updateCourseDb,
  deleteCourse as deleteCourseDb,
  createModule as createModuleDb,
  deleteModule as deleteModuleDb,
  createLesson as createLessonDb,
  updateLesson as updateLessonDb,
  deleteLesson as deleteLessonDb,
  createAssessment as createAssessmentDb,
  updateAssessment as updateAssessmentDb,
  deleteAssessment as deleteAssessmentDb,
  createFullCourseSyllabi as createFullCourseSyllabiDb,
  purgeAllSeededData
} from '../services/courseService';
import {
  enrollUser as enrollUserDb,
  fetchUserEnrollments,
  fetchAllEnrollments
} from '../services/enrollmentService';
import {
  markLessonComplete as markLessonCompleteDb,
  fetchAllProgress
} from '../services/progressService';
import {
  submitAttempt as submitAttemptDb,
  fetchAllAttempts
} from '../services/assessmentService';
import {
  issueCertificate as issueCertificateDb,
  fetchUserCertificates,
  fetchAllCertificates
} from '../services/certificateService';
import {
  fetchAnnouncements,
  createAnnouncement as createAnnouncementDb,
  deleteAnnouncement as deleteAnnouncementDb
} from '../services/announcementService';
import {
  submitEnquiry as submitEnquiryDb,
  getEnquiries as fetchEnquiriesDb,
  updateEnquiryStatus as updateEnquiryStatusDb,
  deleteEnquiry as deleteEnquiryDb
} from '../services/enquiryService';
import {
  fetchAllPayments,
  fetchUserPayments,
  createPayment as createPaymentDb
} from '../services/paymentService';
import {
  fetchSettings,
  updateSettings as updateSettingsDb
} from '../services/settingsService';
import {
  fetchTestimonials as fetchTestimonialsDb,
  createTestimonial as createTestimonialDb,
  updateTestimonial as updateTestimonialDb,
  deleteTestimonial as deleteTestimonialDb,
  getLocalTestimonials,
  DEFAULT_TESTIMONIALS
} from '../services/testimonialService';

const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_URL_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

const initialCourses = [
  {
    id: '10101010-1010-1010-1010-101010101010',
    title: '30-Day Lean Muscle & Strength Blueprint',
    description: 'Master progressive overload, lift with correct form, and build a strong foundation using compound exercises.',
    category: 'Strength Training',
    difficulty: 'Beginner',
    price: 0,
    instructor: 'Coach Alex Stone',
    rating: 4.9,
    students: 2450,
    duration: '4 weeks',
    thumbnail: '',
    featured: true,
    modules: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Compound Lift Mechanics',
        order: 1,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111111a',
            title: 'Squat Form & Core Bracing Guide',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Proper Squat Form & Spine Safety</h1><p>The barbell squat is one of the most effective compound lifts for lower body hypertrophy. Achieving depth while keeping the spine neutral is critical.</p><h3>Key Checkpoints:</h3><ul><li><strong>Foot Stance:</strong> Shoulder-width apart, toes flared out about 15-30 degrees.</li><li><strong>Core Bracing:</strong> Take a deep belly breath into the diaphragm to create intra-abdominal pressure.</li><li><strong>Depth:</strong> Lower your hips until the hip crease drops below the top of your kneecap.</li></ul>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111111b',
            title: 'Barbell Deadlift Setup (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-strength-deadlift-01',
              bunnyVideoId: 'bunny-strength-deadlift-01',
              duration: '3:45'
            }
          }
        ],
        assessment: {
          id: '11111111-1111-1111-1111-11111111111c',
          title: 'Module 1 Assessment: Compound Form',
          passingPercentage: 50,
          timerSeconds: 120,
          questions: [
            {
              id: 'q-strength-1',
              question: 'Which of the following is crucial to do before starting a heavy barbell squat?',
              type: 'mcq',
              options: [
                { text: 'Take a deep belly breath and brace the core', isCorrect: true },
                { text: 'Exhale fully to release back tension', isCorrect: false },
                { text: 'Look down directly at your feet', isCorrect: false }
              ],
              explanation: 'Bracing the core creates intra-abdominal pressure that stabilizes the spine.'
            }
          ]
        }
      },
      {
        id: '11111111-1111-1111-1111-111111111112',
        title: 'Squat & Leg Mechanics',
        order: 2,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111112a',
            title: 'Quad Drive & Hip Hinge Balance',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Quad Drive Mechanics</h1><p>Driving out of the bottom position requires balanced quad drive and glute activation. Avoid letting knees cave inward.</p>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111112b',
            title: 'Barbell Squat Depth Breakdown (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-squat-depth-02',
              bunnyVideoId: 'bunny-squat-depth-02',
              duration: '4:12'
            }
          }
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111113',
        title: 'Upper Body Push & Press',
        order: 3,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111113a',
            title: 'Scapular Retraction & Bench Arch',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Bench Press Alignment</h1><p>Retract your scapula flush against the bench pad to protect the rotator cuff under load.</p>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111113b',
            title: 'Overhead Press Trajectory (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-press-form-03',
              bunnyVideoId: 'bunny-press-form-03',
              duration: '5:00'
            }
          }
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111114',
        title: 'Deadlift & Posterior Chain',
        order: 4,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111114a',
            title: 'Lat Engagement & Bar Path',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Lat Tension</h1><p>Squeeze your lats as if squeezing oranges in your armpits before initiating the pull off the floor.</p>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111114b',
            title: 'Sumo vs Conventional Deadlift (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-deadlift-sumo-04',
              bunnyVideoId: 'bunny-deadlift-sumo-04',
              duration: '4:45'
            }
          }
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111115',
        title: 'Progressive Overload Tactics',
        order: 5,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111115a',
            title: 'RPE Scales & Micro-Loading',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Managing RPE</h1><p>Use Rate of Perceived Exertion (RPE 7-9) to auto-regulate daily strength fluctuations.</p>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111115b',
            title: 'Volume Tracking Walkthrough (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-volume-track-05',
              bunnyVideoId: 'bunny-volume-track-05',
              duration: '3:30'
            }
          }
        ]
      },
      {
        id: '11111111-1111-1111-1111-111111111116',
        title: 'Peaking & Max Testing',
        order: 6,
        lessons: [
          {
            id: '11111111-1111-1111-1111-11111111116a',
            title: 'Tapering Protocol & Warmup Sets',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Tapering Tactics</h1><p>Drop volume by 50% while maintaining intensity peak during the final week before testing maxes.</p>`
            }
          },
          {
            id: '11111111-1111-1111-1111-11111111116b',
            title: '1RM Attempt Execution (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-max-attempt-06',
              bunnyVideoId: 'bunny-max-attempt-06',
              duration: '6:15'
            }
          }
        ]
      }
    ],
    finalAssessment: {
      id: 'quiz-strength-final',
      title: 'ACFIT Academy Certified Strength Foundations Exam',
      passingPercentage: 75,
      timerSeconds: 300,
      questions: [
        {
          id: 'q-sf-1',
          question: 'What is progressive overload?',
          type: 'mcq',
          options: [
            { text: 'Gradually increasing weight, reps, or volume over time', isCorrect: true },
            { text: 'Lifting the maximum possible weight in every single workout', isCorrect: false }
          ],
          explanation: 'Progressive overload continuously increases stimulus to prompt growth.'
        }
      ]
    }
  },
  {
    id: 'course-cardio-hiit',
    title: 'HIIT Cardio & Athletic Conditioning Masterclass',
    description: 'High-intensity interval circuits to burn fat, boost aerobic thresholds, and optimize metabolic conditioning.',
    category: 'Cardio & HIIT',
    difficulty: 'Advanced',
    price: 29,
    instructor: 'Coach Sarah Jenkins',
    rating: 4.8,
    students: 1580,
    duration: '6.2 hours',
    thumbnail: '',
    featured: true,
    modules: [
      {
        id: '22222222-2222-2222-2222-222222222221',
        title: 'Aerobic Foundations & Zone 2',
        order: 1,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222221a',
            title: 'Zone 2 Heart Rate Baselines',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Zone 2 Aerobic Base</h1><p>Low-intensity steady state (LISS) builds mitochondrial density and heart stroke volume.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222221b',
            title: 'Cardio Warmup Circuits (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-cardio-warmup-01',
              bunnyVideoId: 'bunny-cardio-warmup-01',
              duration: '4:10'
            }
          }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Tabata & Interval Protocols',
        order: 2,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222222a',
            title: 'The 20s/10s Tabata Ratio',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Tabata Protocol</h1><p>20 seconds maximal output followed by 10 seconds complete rest, for 8 continuous cycles.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222222b',
            title: 'Full Tabata Sprint Workout (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-tabata-workout-02',
              bunnyVideoId: 'bunny-tabata-workout-02',
              duration: '5:30'
            }
          }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222223',
        title: 'VO2 Max Threshold Conditioning',
        order: 3,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222223a',
            title: 'Oxygen Uptake Thresholds',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>VO2 Max Capacity</h1><p>Pushing your maximal oxygen consumption threshold dramatically enhances lactic acid clearance.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222223b',
            title: 'Interval Pacing Strategy (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-vo2-pacing-03',
              bunnyVideoId: 'bunny-vo2-pacing-03',
              duration: '4:50'
            }
          }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222224',
        title: 'Agility & Explosive Speed',
        order: 4,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222224a',
            title: 'Ladder & Cone Footwork Drills',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Agility Ladder Drills</h1><p>Train nervous system speed and foot-eye coordination through high-frequency footwork patterns.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222224b',
            title: 'Plyometric Jump Circuits (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-plyo-jumps-04',
              bunnyVideoId: 'bunny-plyo-jumps-04',
              duration: '3:55'
            }
          }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222225',
        title: 'Fat Oxidation & Heart Rate Zones',
        order: 5,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222225a',
            title: 'Calculating MHR Fat Burn Limits',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>Fat Burning Heart Rates</h1><p>Targeting 60-70% MHR optimizes lipid utilization over glycogen depletion.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222225b',
            title: 'Metabolic Conditioning Circuit (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL,
              videoId: 'bunny-metcon-circuit-05',
              bunnyVideoId: 'bunny-metcon-circuit-05',
              duration: '5:15'
            }
          }
        ]
      },
      {
        id: '22222222-2222-2222-2222-222222222226',
        title: 'Metcon Endurance Test',
        order: 6,
        lessons: [
          {
            id: '22222222-2222-2222-2222-22222222226a',
            title: 'Full Metcon Challenge Setup',
            type: 'rich-text',
            order: 1,
            content: {
              body: `<h1>The 15-Minute Metcon Challenge</h1><p>Test total work capacity across burpees, kettlebell swings, and rowing intervals.</p>`
            }
          },
          {
            id: '22222222-2222-2222-2222-22222222226b',
            title: 'Final Metcon Test Execution (Bunny Stream HD)',
            type: 'video',
            order: 2,
            content: {
              videoUrl: SAMPLE_VIDEO_URL_2,
              videoId: 'bunny-final-metcon-06',
              bunnyVideoId: 'bunny-final-metcon-06',
              duration: '7:00'
            }
          }
        ]
      }
    ]
  }
];

const defaultAnnouncements = [
  { id: 'ann-1', title: 'Summer Shred Program Online', body: 'The Summer HIIT Cardio circuit and nutrition trackers are now fully updated in your catalog.', target: 'all', date: '2026-07-17T12:00:00Z' },
  { id: 'ann-2', title: 'ACFIT Academy Live Workouts Added', body: 'Live streaming schedules have been configured. Register inside your settings page.', target: 'course-strength-101', date: '2026-07-16T15:30:00Z' }
];

const defaultPayments = [
  { id: 'PAY-1001', studentEmail: 'student@lms.com', studentName: 'Jane Student', courseTitle: 'HIIT Cardio & Athletic Conditioning Masterclass', amount: 29, status: 'successful', method: 'Razorpay', date: '2026-07-16T10:30:00Z' }
];

const defaultSystemSettings = {
  platformName: 'ACFIT Academy',
  contactEmail: 'support@acfitacademy.com',
  razorpayKey: 'rzp_test_flex2026',
  currency: 'USD',
  bunnyStreamApiKey: 'bunny_api_key_abc123'
};

export const useLmsStore = create(
  persist(
    (set, get) => ({
      courses: [],
      enrollments: [],
      progress: {},
      attempts: [],
      certificates: [],
      announcements: [],
      payments: [],
      enquiries: [],
      testimonials: getLocalTestimonials(),
      systemSettings: defaultSystemSettings,
      categories: [
        'Strength Training',
        'Cardio & HIIT',
        'Yoga & Mobility',
        'Nutrition & Diet',
        'Muscle Building',
        'Digital Marketing'
      ],

      addCategory: (newCategory) => {
        if (!newCategory || !newCategory.trim()) return;
        const trimmed = newCategory.trim();
        set((state) => {
          const current = state.categories || [
            'Strength Training',
            'Cardio & HIIT',
            'Yoga & Mobility',
            'Nutrition & Diet',
            'Muscle Building',
            'Digital Marketing'
          ];
          if (current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            return state;
          }
          return { categories: [...current, trimmed] };
        });
      },

      // Course Enrollment
      enrollInCourse: async (courseId, userId, paymentData) => {
        // Update local Zustand state immediately
        set((state) => {
          const isEnrolled = state.enrollments.some(
            (e) => e.courseId === courseId && e.userId === userId
          );
          const targetCourse = state.courses.find(c => c.id === courseId);
          const userEmail = paymentData?.studentEmail || (userId === 'admin-id' ? 'admin@lms.com' : 'student@lms.com');
          const userName = paymentData?.studentName || (userId === 'admin-id' ? 'Jane Instructor' : 'Jane Student');
          const payId = paymentData?.razorpayPaymentId || `PAY-${Math.floor(10000 + Math.random() * 90000)}`;

          const now = new Date().toISOString();
          const newPayment = {
            id: payId,
            userId: userId,
            user_id: userId,
            courseId: courseId,
            course_id: courseId,
            studentEmail: userEmail,
            studentName: userName,
            courseTitle: paymentData?.courseTitle || targetCourse?.title || 'Course registration',
            amount: paymentData?.amount ?? (targetCourse?.price || 0),
            currency: paymentData?.currency || 'INR',
            status: paymentData?.status || 'successful',
            method: paymentData?.method || (targetCourse?.price > 0 ? 'Razorpay' : 'Free Enrollment'),
            razorpayOrderId: paymentData?.razorpayOrderId || null,
            razorpayPaymentId: paymentData?.razorpayPaymentId || null,
            date: now,
            paidAt: now,
            createdAt: now,
            created_at: now
          };

          const updatedEnrollments = isEnrolled
            ? state.enrollments
            : [...state.enrollments, { userId, courseId, enrolledAt: now }];

          const existingPayments = state.payments || [];
          const existsIdx = existingPayments.findIndex(
            (p) => p.id === payId || (p.courseId === courseId && (p.userId === userId || p.user_id === userId))
          );

          let updatedPayments;
          if (existsIdx >= 0) {
            updatedPayments = [...existingPayments];
            updatedPayments[existsIdx] = { ...updatedPayments[existsIdx], ...newPayment };
          } else {
            updatedPayments = [...existingPayments, newPayment];
          }

          return {
            enrollments: updatedEnrollments,
            payments: updatedPayments
          };
        });

        // Then try DB operations as best-effort (don't throw on failure)
        if (isSupabaseConfigured) {
          try {
            await enrollUserDb(courseId);
          } catch (e) {
            console.warn('[lmsStore] DB enrollment failed, local state used:', e.message);
          }
          try {
            if (paymentData) {
              await createPaymentDb(paymentData);
            }
          } catch (e) {
            console.warn('[lmsStore] Payment record failed:', e.message);
          }
        }
      },

      markLessonComplete: async (courseId, lessonId, userId) => {
        // Optimistically update local progress immediately
        set((state) => {
          const userProgress = (userId && state.progress[userId]) || {};
          const courseProgress = userProgress[courseId] || state.progress[courseId] || {};
          const updatedCourseProgress = {
            ...courseProgress,
            [lessonId]: true
          };
          return {
            progress: {
              ...state.progress,
              [courseId]: updatedCourseProgress,
              ...(userId ? {
                [userId]: {
                  ...userProgress,
                  [courseId]: updatedCourseProgress
                }
              } : {})
            }
          };
        });

        if (isSupabaseConfigured) {
          try {
            await markLessonCompleteDb(courseId, lessonId);
            await get().syncFromSupabase({ id: userId });
          } catch (e) {
            console.warn('[lmsStore] DB markLessonComplete failed, local state used:', e.message);
          }
        }
      },

      submitAssessmentAttempt: async (courseId, moduleId, score, passed, userId, assessmentId) => {
        // Optimistically update local attempts immediately
        const newAttempt = {
          userId,
          courseId,
          moduleId,
          assessmentId,
          quizId: assessmentId,
          score,
          passed,
          date: new Date().toISOString()
        };
        set((state) => ({
          attempts: [...state.attempts, newAttempt]
        }));

        if (isSupabaseConfigured) {
          try {
            await submitAttemptDb(courseId, moduleId, score, passed, assessmentId);
            await get().syncFromSupabase({ id: userId });
          } catch (e) {
            console.warn('[lmsStore] DB submitAssessmentAttempt failed, local state used:', e.message);
          }
        }
      },

      submitFinalAssessmentAttempt: async (courseId, score, passed, userId, fullName, assessmentId) => {
        // Optimistically update local attempts and certificates immediately
        const newAttempt = {
          userId,
          courseId,
          moduleId: null,
          score,
          passed,
          date: new Date().toISOString()
        };

        set((state) => {
          const updatedAttempts = [...state.attempts, newAttempt];
          let updatedCertificates = [...state.certificates];

          if (passed) {
            const certExists = state.certificates.some(
              (c) => c.courseId === courseId && c.userId === userId
            );

            if (!certExists) {
              const targetCourse = state.courses.find((c) => c.id === courseId);
              const certId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
              updatedCertificates.push({
                id: certId,
                userId,
                courseId,
                fullName,
                courseTitle: targetCourse?.title || 'Course Platform Module',
                date: new Date().toISOString()
              });
            }
          }

          return {
            attempts: updatedAttempts,
            certificates: updatedCertificates
          };
        });

        if (isSupabaseConfigured) {
          try {
            await submitAttemptDb(courseId, null, score, passed, assessmentId);
            if (passed) {
              const targetCourse = get().courses.find(c => c.id === courseId);
              await issueCertificateDb(courseId, fullName, targetCourse?.title || 'Course Platform');
            }
            await get().syncFromSupabase({ id: userId });
          } catch (e) {
            console.warn('[lmsStore] DB submitFinalAssessmentAttempt failed, local state used:', e.message);
          }
        }
      },

      // Admin Announcement Actions
      addAnnouncement: async (title, body, target) => {
        // Optimistically add announcement locally
        const newAnn = {
          id: `ann-${Date.now()}`,
          title,
          body,
          target,
          date: new Date().toISOString()
        };
        set((state) => ({
          announcements: [newAnn, ...state.announcements]
        }));

        if (isSupabaseConfigured) {
          try {
            await createAnnouncementDb(title, body, target);
            await get().syncFromSupabase();
          } catch (e) {
            console.warn('[lmsStore] DB addAnnouncement failed, local state used:', e.message);
          }
        }
      },

      deleteAnnouncement: async (id) => {
        // Optimistically remove announcement locally
        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id)
        }));

        if (isSupabaseConfigured) {
          try {
            await deleteAnnouncementDb(id);
            await get().syncFromSupabase();
          } catch (e) {
            console.warn('[lmsStore] DB deleteAnnouncement failed, local state used:', e.message);
          }
        }
      },

      // Admin & Visitor Enquiry Actions
      submitEnquiry: async (enquiryData) => {
        const created = await submitEnquiryDb(enquiryData);
        set((state) => {
          const current = state.enquiries || [];
          const exists = current.some((e) => e.id === created.id);
          return {
            enquiries: exists ? current : [created, ...current]
          };
        });
        return created;
      },

      fetchEnquiries: async () => {
        const list = await fetchEnquiriesDb();
        set({ enquiries: list || [] });
        return list;
      },

      updateEnquiryStatus: async (id, status) => {
        set((state) => ({
          enquiries: (state.enquiries || []).map((e) => (e.id === id ? { ...e, status } : e))
        }));
        const updated = await updateEnquiryStatusDb(id, status);
        return updated;
      },

      deleteEnquiry: async (id) => {
        set((state) => ({
          enquiries: (state.enquiries || []).filter((e) => e.id !== id)
        }));
        await deleteEnquiryDb(id);
      },

      // Admin System Settings Action
      updateSystemSettings: async (newSettings) => {
        // Optimistically update system settings locally
        set((state) => ({
          systemSettings: { ...state.systemSettings, ...newSettings }
        }));

        if (isSupabaseConfigured) {
          try {
            await updateSettingsDb(newSettings);
            await get().syncFromSupabase();
          } catch (e) {
            console.warn('[lmsStore] DB updateSystemSettings failed, local state used:', e.message);
          }
        }
      },

      // Admin Testimonials Actions (Landing Page CMS)
      fetchTestimonialsStore: async () => {
        const res = await fetchTestimonialsDb();
        if (res.success && Array.isArray(res.data)) {
          set({ testimonials: res.data });
        }
        return res.data;
      },

      addTestimonial: async (testimonialData) => {
        const res = await createTestimonialDb(testimonialData);
        if (res.success && res.data) {
          set((state) => {
            const current = state.testimonials || [];
            const exists = current.some((t) => String(t.id) === String(res.data.id));
            return {
              testimonials: exists
                ? current.map((t) => (String(t.id) === String(res.data.id) ? res.data : t))
                : [res.data, ...current]
            };
          });
        }
        return res;
      },

      updateTestimonial: async (id, updates) => {
        set((state) => ({
          testimonials: (state.testimonials || []).map((t) =>
            String(t.id) === String(id) ? { ...t, ...updates } : t
          )
        }));
        const res = await updateTestimonialDb(id, updates);
        if (res.success && res.data) {
          set((state) => ({
            testimonials: (state.testimonials || []).map((t) =>
              String(t.id) === String(id) ? { ...t, ...res.data } : t
            )
          }));
        }
        return res;
      },

      deleteTestimonial: async (id) => {
        set((state) => ({
          testimonials: (state.testimonials || []).filter((t) => String(t.id) !== String(id))
        }));
        const res = await deleteTestimonialDb(id);
        return res;
      },

      // ADMINISTRATIVE COURSE BUILDER MUTATORS
      createCourse: async (courseData) => {
        if (isSupabaseConfigured) {
          const res = await createCourseDb(courseData);
          await get().syncFromSupabase();
          return res.success ? res.data : null;
        }

        const defaultFinalExam = courseData.finalExam || courseData.finalAssessment || {
          id: `quiz-final-${Date.now()}`,
          title: `${courseData.title || 'Course'} Certification Exam`,
          passingPercentage: 75,
          timerSeconds: 600,
          questions: [
            {
              id: `q-fe-${Date.now()}`,
              question: 'What is the primary objective of this course module?',
              options: [
                { text: 'Structured progressive learning and skill mastery', isCorrect: true },
                { text: 'Random task execution without evaluation', isCorrect: false }
              ],
              explanation: 'Comprehensive course modules validate skill competency upon completion.'
            }
          ]
        };

        const newCourse = {
          id: `course-${Date.now()}`,
          rating: 5.0,
          students: 0,
          featured: false,
          finalExam: defaultFinalExam,
          finalAssessment: defaultFinalExam,
          ...courseData,
          finalExam: courseData.finalExam || defaultFinalExam,
          finalAssessment: courseData.finalAssessment || courseData.finalExam || defaultFinalExam,
          modules: courseData.modules || []
        };
        set((state) => ({
          courses: [...state.courses, newCourse]
        }));
        return newCourse;
      },

      createFullCourseSyllabi: async (courseData, modulesData) => {
        if (isSupabaseConfigured) {
          const res = await createFullCourseSyllabiDb(courseData, modulesData);
          await get().syncFromSupabase();
          return res.success ? res.data : null;
        }

        const newCourseId = `course-${Date.now()}`;
        const newCourse = {
          id: newCourseId,
          rating: 5.0,
          students: 0,
          featured: false,
          finalAssessment: {
            id: `quiz-final-${Date.now()}`,
            title: 'Certification Final Exam',
            passingPercentage: 80,
            timerSeconds: 300,
            questions: []
          },
          ...courseData,
          modules: modulesData.map((m, mIdx) => ({
            id: `module-${newCourseId}-${mIdx}`,
            title: m.title,
            sort_order: m.sort_order || mIdx,
            lessons: (m.lessons || []).map((l, lIdx) => ({
              id: `lesson-${newCourseId}-${mIdx}-${lIdx}`,
              title: l.title,
              type: l.type || 'rich-text',
              sort_order: l.sort_order || lIdx,
              content: l.content || {}
            }))
          }))
        };

        set((state) => ({
          courses: [...state.courses, newCourse]
        }));
        return newCourse;
      },

      updateCourse: async (courseId, courseData) => {
        if (isSupabaseConfigured) {
          await updateCourseDb(courseId, courseData);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id !== courseId) return c;
            const updatedExam = courseData.finalExam || courseData.finalAssessment || c.finalExam || c.finalAssessment;
            return {
              ...c,
              ...courseData,
              finalExam: updatedExam,
              finalAssessment: updatedExam
            };
          })
        }));
      },

      deleteCourse: async (courseId) => {
        if (isSupabaseConfigured) {
          await deleteCourseDb(courseId);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
          enrollments: state.enrollments.filter((e) => e.courseId !== courseId)
        }));
      },

      createAssessment: async (assessmentData) => {
        let newAssessment = {
          id: `quiz-${Date.now()}`,
          title: assessmentData.title,
          passingPercentage: assessmentData.passingPercentage || 60,
          timerSeconds: assessmentData.timerSeconds || 120,
          questions: assessmentData.questions || []
        };

        if (isSupabaseConfigured) {
          try {
            const res = await createAssessmentDb(assessmentData);
            if (res?.success && res?.data) {
              newAssessment = {
                id: res.data.id,
                title: res.data.title,
                passingPercentage: res.data.passing_percentage,
                timerSeconds: res.data.timer_seconds,
                questions: res.data.questions || []
              };
            }
          } catch (e) {
            console.warn('createAssessmentDb warning:', e);
          }
        }

        set((state) => {
          const updatedCourses = state.courses.map((c) => {
            if (c.id !== assessmentData.courseId) return c;

            if (assessmentData.isFinal) {
              return { ...c, finalAssessment: newAssessment };
            } else if (assessmentData.lessonId) {
              return {
                ...c,
                modules: c.modules?.map((m) => ({
                  ...m,
                  lessons: m.lessons?.map((l) =>
                    l.id === assessmentData.lessonId ? { ...l, assessment: newAssessment } : l
                  )
                }))
              };
            } else if (assessmentData.moduleId) {
              return {
                ...c,
                modules: c.modules?.map((m) =>
                  m.id === assessmentData.moduleId ? { ...m, assessment: newAssessment } : m
                )
              };
            }
            return c;
          });
          return { courses: updatedCourses };
        });
      },

      updateAssessment: async (assessmentId, assessmentData) => {
        if (isSupabaseConfigured && assessmentId && !assessmentId.startsWith('quiz-')) {
          try {
            await updateAssessmentDb(assessmentId, assessmentData);
          } catch (e) {
            console.warn('updateAssessmentDb warning:', e);
          }
        }

        set((state) => {
          const updatedCourses = state.courses.map((c) => {
            const isTargetCourse = assessmentData.courseId ? c.id === assessmentData.courseId : true;
            if (!isTargetCourse) return c;

            if (c.finalAssessment?.id === assessmentId || (assessmentData.isFinal && isTargetCourse)) {
              return {
                ...c,
                finalAssessment: { ...(c.finalAssessment || {}), ...assessmentData }
              };
            }

            const updatedModules = c.modules?.map((m) => {
              if (m.assessment?.id === assessmentId || m.id === assessmentData.moduleId) {
                return {
                  ...m,
                  assessment: { ...(m.assessment || {}), ...assessmentData }
                };
              }

              const updatedLessons = m.lessons?.map((l) => {
                if (l.assessment?.id === assessmentId || l.id === assessmentData.lessonId) {
                  return {
                    ...l,
                    assessment: { ...(l.assessment || {}), ...assessmentData }
                  };
                }
                return l;
              });

              return { ...m, lessons: updatedLessons };
            });

            return { ...c, modules: updatedModules };
          });
          return { courses: updatedCourses };
        });
      },

      deleteAssessment: async (assessmentId) => {
        if (isSupabaseConfigured) {
          await deleteAssessmentDb(assessmentId);
          await get().syncFromSupabase();
          return;
        }

        set((state) => {
          const updatedCourses = state.courses.map((c) => {
            if (c.finalAssessment?.id === assessmentId) {
              return { ...c, finalAssessment: null };
            }

            const updatedModules = c.modules?.map((m) => {
              if (m.assessment?.id === assessmentId) {
                return { ...m, assessment: null };
              }

              const updatedLessons = m.lessons?.map((l) => {
                if (l.assessment?.id === assessmentId) {
                  return { ...l, assessment: null };
                }
                return l;
              });

              return { ...m, lessons: updatedLessons };
            });

            return { ...c, modules: updatedModules };
          });
          return { courses: updatedCourses };
        });
      },

      createModule: async (courseId, moduleTitle) => {
        if (isSupabaseConfigured) {
          const res = await createModuleDb(courseId, moduleTitle);
          await get().syncFromSupabase();
          return res.success ? res.data : null;
        }

        let newModule = null;
        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              const modules = c.modules || [];
              newModule = {
                id: `module-${Date.now()}`,
                title: moduleTitle,
                order: modules.length + 1,
                lessons: [],
                assessment: {
                  id: `quiz-${Date.now()}`,
                  title: `${moduleTitle} Assessment`,
                  passingPercentage: 60,
                  timerSeconds: 120,
                  questions: []
                }
              };
              return { ...c, modules: [...modules, newModule] };
            }
            return c;
          })
        }));
        return newModule;
      },

      updateModule: async (courseId, moduleId, moduleData) => {
        if (isSupabaseConfigured) {
          await updateModuleDb(moduleId, moduleData);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              return {
                ...c,
                modules: c.modules.map((m) =>
                  m.id === moduleId ? { ...m, ...moduleData } : m
                )
              };
            }
            return c;
          })
        }));
      },

      deleteModule: async (courseId, moduleId) => {
        if (isSupabaseConfigured) {
          await deleteModuleDb(moduleId);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              return {
                ...c,
                modules: c.modules.filter((m) => m.id !== moduleId)
              };
            }
            return c;
          })
        }));
      },

      createLesson: async (courseId, moduleId, lessonData) => {
        if (isSupabaseConfigured) {
          const res = await createLessonDb(moduleId, lessonData);
          await get().syncFromSupabase();
          return res.success ? res.data : null;
        }

        let newLesson = null;
        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              return {
                ...c,
                modules: c.modules.map((m) => {
                  if (m.id === moduleId) {
                    const lessons = m.lessons || [];
                    newLesson = {
                      id: `lesson-${Date.now()}`,
                      order: lessons.length + 1,
                      ...lessonData
                    };
                    return { ...m, lessons: [...lessons, newLesson] };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        }));
        return newLesson;
      },

      updateLesson: async (courseId, moduleId, lessonId, lessonData) => {
        if (isSupabaseConfigured) {
          await updateLessonDb(lessonId, lessonData);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              return {
                ...c,
                modules: c.modules.map((m) => {
                  if (m.id === moduleId) {
                    return {
                      ...m,
                      lessons: m.lessons.map((l) =>
                        l.id === lessonId ? { ...l, ...lessonData } : l
                      )
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        }));
      },

      deleteLesson: async (courseId, moduleId, lessonId) => {
        if (isSupabaseConfigured) {
          await deleteLessonDb(lessonId);
          await get().syncFromSupabase();
          return;
        }

        set((state) => ({
          courses: state.courses.map((c) => {
            if (c.id === courseId) {
              return {
                ...c,
                modules: c.modules.map((m) => {
                  if (m.id === moduleId) {
                    return {
                      ...m,
                      lessons: m.lessons.filter((l) => l.id !== lessonId)
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        }));
      },

      subscribeToRealtime: (user) => {
        if (!isSupabaseConfigured) return;
        try {
          // Remove any existing channel to prevent duplicates
          const existingChannels = supabase.getChannels();
          if (Array.isArray(existingChannels)) {
            existingChannels.forEach((ch) => {
              if (ch.name === 'realtime-lms-changes' || ch.topic === 'realtime:realtime-lms-changes') {
                supabase.removeChannel(ch);
              }
            });
          }

          // Debounced sync to avoid hammering DB on rapid consecutive events
          let syncTimer = null;
          const debouncedSync = () => {
            if (syncTimer) clearTimeout(syncTimer);
            syncTimer = setTimeout(() => {
              get().syncFromSupabase(user);
            }, 300);
          };

          const channel = supabase
            .channel('realtime-lms-changes')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'enquiries' },
              (payload) => {
                console.log('[Supabase Realtime] Enquiry event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'announcements' },
              (payload) => {
                console.log('[Supabase Realtime] Announcement event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'enrollments' },
              (payload) => {
                console.log('[Supabase Realtime] Enrollment event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'payments' },
              (payload) => {
                console.log('[Supabase Realtime] Payment event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'progress' },
              (payload) => {
                console.log('[Supabase Realtime] Progress event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'certificates' },
              (payload) => {
                console.log('[Supabase Realtime] Certificate event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'courses' },
              (payload) => {
                console.log('[Supabase Realtime] Course event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'attempts' },
              (payload) => {
                console.log('[Supabase Realtime] Attempt event:', payload.eventType);
                debouncedSync();
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'profiles' },
              (payload) => {
                console.log('[Supabase Realtime] Profile event:', payload.eventType);
                debouncedSync();
              }
            )
            .subscribe((status) => {
              console.log('[Supabase Realtime] Channel status:', status);
            });

          return () => {
            if (syncTimer) clearTimeout(syncTimer);
            try {
              supabase.removeChannel(channel);
            } catch (_) {}
          };
        } catch (e) {
          console.warn('[Supabase Realtime] Error subscribing:', e);
        }
      },

      deleteEnrollment: async (enrollmentIdOrCourseId, userId) => {
        // Optimistically update local state
        set((state) => {
          const existing = state.enrollments || [];
          return {
            enrollments: existing.filter((e) => {
              if (e.id === enrollmentIdOrCourseId) return false;
              if (userId) {
                const matchUser = e.userId === userId || e.user_id === userId;
                const matchCourse = e.courseId === enrollmentIdOrCourseId || e.course_id === enrollmentIdOrCourseId;
                if (matchUser && matchCourse) return false;
              }
              return true;
            })
          };
        });

        // Sync deletion to Supabase DB
        if (isSupabaseConfigured) {
          try {
            // Try deleting by enrollment ID first
            const { error: idErr } = await supabase
              .from('enrollments')
              .delete()
              .eq('id', enrollmentIdOrCourseId);

            // If that didn't match (not a valid enrollment ID), try by composite key
            if (idErr && userId) {
              await supabase
                .from('enrollments')
                .delete()
                .eq('user_id', userId)
                .eq('course_id', enrollmentIdOrCourseId);
            }
          } catch (e) {
            console.warn('[lmsStore] DB deleteEnrollment failed, local state updated:', e.message);
          }
        }
      },

      syncFromSupabase: async (user) => {
        if (!isSupabaseConfigured) return;

        try {
          const coursesRes = await fetchCourses();
          if (coursesRes.success && Array.isArray(coursesRes.data)) {
            set({ courses: coursesRes.data });
          }

          const annRes = await fetchAnnouncements();
          if (annRes.success && annRes.data) {
            set({ announcements: annRes.data });
          }

          const enqList = await fetchEnquiriesDb();
          if (Array.isArray(enqList)) {
            set({ enquiries: enqList });
          }

          const settingsRes = await fetchSettings();
          if (settingsRes.success && settingsRes.data) {
            set({ systemSettings: settingsRes.data });
          }

          const testRes = await fetchTestimonialsDb();
          if (testRes.success && Array.isArray(testRes.data)) {
            set({ testimonials: testRes.data });
          }

          const isAdmin = !user || (user.role && user.role.toString().toLowerCase() === 'admin');

          const enrollRes = isAdmin ? await fetchAllEnrollments() : await fetchUserEnrollments();
          if (enrollRes.success && enrollRes.data) {
            set((state) => {
              const existing = state.enrollments || [];
              const mergedMap = new Map();
              existing.forEach((e) => mergedMap.set(`${e.userId}-${e.courseId}`, e));
              (enrollRes.data || []).forEach((e) => mergedMap.set(`${e.userId}-${e.courseId}`, e));
              return { enrollments: Array.from(mergedMap.values()) };
            });
          }

          const progressRes = await fetchAllProgress();
          if (progressRes.success && progressRes.data) {
            set((state) => ({
              progress: { ...state.progress, ...progressRes.data }
            }));
          }

          const attemptsRes = await fetchAllAttempts();
          if (attemptsRes.success && attemptsRes.data) {
            set((state) => {
              const existing = state.attempts || [];
              const mergedMap = new Map();
              existing.forEach((a) => mergedMap.set(a.id, a));
              (attemptsRes.data || []).forEach((a) => mergedMap.set(a.id, a));
              return { attempts: Array.from(mergedMap.values()) };
            });
          }

          const certsRes = isAdmin ? await fetchAllCertificates() : await fetchUserCertificates();
          if (certsRes.success && certsRes.data) {
            set((state) => {
              const existing = state.certificates || [];
              const mergedMap = new Map();
              existing.forEach((c) => mergedMap.set(c.id, c));
              (certsRes.data || []).forEach((c) => mergedMap.set(c.id, c));
              return { certificates: Array.from(mergedMap.values()) };
            });
          }

          const paymentsRes = isAdmin ? await fetchAllPayments() : await fetchUserPayments();
          if (paymentsRes.success && paymentsRes.data) {
            set((state) => {
              const existing = state.payments || [];
              const mergedMap = new Map();
              existing.forEach((p) => mergedMap.set(p.id, p));
              (paymentsRes.data || []).forEach((p) => mergedMap.set(p.id, p));
              return { payments: Array.from(mergedMap.values()) };
            });
          }
        } catch (err) {
          console.error('Error syncing Supabase data to Zustand:', err);
        }
      },

      purgeAllData: async () => {
        set({
          courses: [],
          enrollments: [],
          progress: {},
          attempts: [],
          certificates: [],
          announcements: [],
          payments: []
        });
        await purgeAllSeededData();
      }
    }),
    {
      name: 'lms-store-storage'
    }
  )
);
