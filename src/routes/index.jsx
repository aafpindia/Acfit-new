import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { Loader2 } from 'lucide-react';

// Layouts
import AdminLayout from '../components/layouts/AdminLayout';
import UserLayout from '../components/layouts/UserLayout';

// Public & Auth Pages
const LandingPage = lazy(() => import('../features/landing/LandingPage'));
const Login = lazy(() => import('../features/auth/Login'));
const Signup = lazy(() => import('../features/auth/Signup'));
const AdminLogin = lazy(() => import('../features/auth/AdminLogin'));
const ForgotPassword = lazy(() => import('../features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../features/auth/ResetPassword'));
const Unauthorized = lazy(() => import('../features/auth/Unauthorized'));

// Public Course Details
const CourseDetails = lazy(() => import('../features/courses/CourseDetails'));
const CertificatePage = lazy(() => import('../features/courses/CertificatePage'));


// User (Student) Portal Pages
const UserDashboard = lazy(() => import('../features/dashboard/UserDashboard'));
const UserProfile = lazy(() => import('../features/profile/UserProfile'));
const UserPayments = lazy(() => import('../features/dashboard/UserPayments'));
const UserProgress = lazy(() => import('../features/dashboard/UserProgress'));
const CoursePlayer = lazy(() => import('../features/courses/CoursePlayer'));
const CoursesStudent = lazy(() => import('../features/dashboard/Placeholders').then(m => ({ default: m.CoursesStudent })));

// Admin Portal Pages
const AdminDashboard = lazy(() => import('../features/dashboard/AdminDashboard'));
const Users = lazy(() => import('../features/admin/Users'));
const AdminUserDetails = lazy(() => import('../features/admin/AdminUserDetails'));
const CourseBuilder = lazy(() => import('../features/admin/CourseBuilder'));
const EnrollmentsAdmin = lazy(() => import('../features/admin/EnrollmentsAdmin'));
const Payments = lazy(() => import('../features/admin/Payments'));
const Analytics = lazy(() => import('../features/admin/Analytics'));
const Announcements = lazy(() => import('../features/admin/Announcements'));
const Testimonials = lazy(() => import('../features/admin/Testimonials'));
const Reports = lazy(() => import('../features/admin/Reports'));
const Settings = lazy(() => import('../features/profile/Settings'));

export const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main font-sans space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading Application...</span>
        </div>
      }
    >
      <Routes>
        {/* ============================================================ */}
        {/* 1. PUBLIC ROUTES */}
        {/* ============================================================ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Public Catalog Routes */}
        <Route path="/courses" element={<LandingPage />} />
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/certificates/:certId" element={<CertificatePage />} />


        {/* Redirect legacy /admin/login to standard login */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Legacy / Direct Shortcuts */}
        <Route path="/dashboard" element={<Navigate to="/app/courses" replace />} />

        {/* ============================================================ */}
        {/* 2. USER (STUDENT) ROUTES under /app/* */}
        {/* Protected by ProtectedRoute backend authentication guard */}
        {/* ============================================================ */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/courses" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="courses" element={<CoursesStudent />} />
          <Route path="courses/:courseId" element={<CourseDetails />} />
          <Route path="learning/:courseId" element={<CoursePlayer />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="payments" element={<UserPayments />} />
          <Route path="progress" element={<UserProgress />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Protected Direct Course Player Route */}
        <Route
          path="/app/learning/:courseId"
          element={
            <ProtectedRoute>
              <CoursePlayer />
            </ProtectedRoute>
          }
        />

        {/* ============================================================ */}
        {/* 3. ADMIN ROUTES under /admin/* */}
        {/* Protected by AdminRoute & requireAdmin authorization guard */}
        {/* ============================================================ */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/courses" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:userId" element={<AdminUserDetails />} />
          <Route path="courses" element={<CourseBuilder />} />
          <Route path="courses/create" element={<CourseBuilder defaultView="hub" />} />
          <Route path="courses/:courseId/edit" element={<CourseBuilder defaultView="workspace" />} />
          <Route path="enrollments" element={<EnrollmentsAdmin />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="testimonials" element={<Testimonials />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
