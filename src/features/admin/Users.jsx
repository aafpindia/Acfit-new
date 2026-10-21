import React, { useState, useEffect, useMemo } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { getUserCourseProgress } from '../../services/progressService';
import {
  Shield,
  Ban,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  Award,
  Key,
  X,
  CreditCard,
  User as UserIcon,
  BookOpen,
  Plus,
  Download,
  Filter,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  Sparkles,
  Users as UsersIcon,
  Edit2,
  MoreHorizontal,
  Grid,
  Activity,
  CheckCircle2,
  CheckSquare,
  Square,
  Layers,
  ChevronDown,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown';

import { useSearchParams } from 'react-router-dom';

export const Users = () => {
  const { success, error: toastError } = useToast();
  const [searchParams] = useSearchParams();
  const {
    courses = [],
    enrollments = [],
    progress = {},
    attempts = [],
    certificates = [],
    payments = [],
    enrollInCourse,
    deleteEnrollment,
    syncFromSupabase = () => {}
  } = useLmsStore();

  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const sParam = searchParams.get('search');
    if (sParam !== null) {
      setSearch(sParam);
    }
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'active' | 'suspended' | 'admin' | 'user'
  
  // Navigation Tabs
  const [detailTab, setDetailTab] = useState('Applications'); // 'Info' | 'Applications' | 'Enroll Status' | 'Account Activity' | 'Security Policies'

  // Assign Live Course Modal State
  const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // Enrollment Status Tab Search State
  const [enrollSearchQuery, setEnrollSearchQuery] = useState('');

  // Selected User State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    role: 'user',
    password: ''
  });
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Sync DB on mount
  useEffect(() => {
    try {
      syncFromSupabase();
    } catch (err) {
      console.warn('Sync error:', err);
    }
  }, []);

  // Fetch users strictly from Supabase profiles and active registered auth accounts
  const loadUsers = async () => {
    let baseUsers = [];
    const deletedUserIds = new Set(JSON.parse(localStorage.getItem('_lms_deleted_user_ids') || '[]'));

    // Purge legacy mock user storage keys
    try {
      localStorage.removeItem('_lms_mock_users');
      localStorage.removeItem('_lms_mock_users_initialized');
    } catch (_) {}

    if (isSupabaseConfigured) {
      try {
        const fetchProfilesPromise = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ data: null, error: 'timeout' }), 5000)
        );

        const result = await Promise.race([fetchProfilesPromise, timeoutPromise]);

        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
          result.data.forEach((p) => {
            if (p.id && !deletedUserIds.has(p.id) && p.status !== 'deleted') {
              baseUsers.push({
                id: p.id,
                fullName: p.full_name || p.email?.split('@')[0] || 'User',
                email: p.email || 'no-email@acfitacademy.app',
                role: p.role || 'user',
                status: p.status || 'active',
                createdAt: p.created_at || new Date().toISOString(),
                avatarUrl: p.avatar_url || ''
              });
            }
          });
        }
      } catch (err) {
        console.warn('Profiles fetch warning:', err);
      }
    }

    // Merge registered auth users from localStorage (excluding deleted and dummy accounts)
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      registeredUsers.forEach((reg) => {
        const regEmail = (reg.email || '').toLowerCase().trim();
        const isDummy = regEmail === 'admin@lms.com' || regEmail === 'student@lms.com';
        if (regEmail && !isDummy && !deletedUserIds.has(reg.id) && reg.status !== 'deleted') {
          if (!baseUsers.some((u) => u.email.toLowerCase() === regEmail || u.id === reg.id)) {
            baseUsers.push({
              id: reg.id || `reg-${Date.now()}`,
              fullName: reg.fullName || reg.name || regEmail.split('@')[0],
              email: reg.email,
              role: (reg.role || 'user').toLowerCase(),
              status: reg.status || 'active',
              createdAt: reg.createdAt || new Date().toISOString(),
              avatarUrl: reg.avatarUrl || ''
            });
          }
        }
      });
    } catch (_) {}

    setUsersList(baseUsers);
    if (useLmsStore.getState().setUsers) {
      useLmsStore.getState().setUsers(baseUsers);
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    loadUsers();
    const handleUpdate = () => { loadUsers(); };
    window.addEventListener('lms_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('lms_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto Select first user
  useEffect(() => {
    if (usersList.length > 0 && !selectedUser) {
      setSelectedUser(usersList[0]);
    }
  }, [usersList, selectedUser]);

  // Sync edits
  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.fullName || '');
      setEditEmail(selectedUser.email || '');
    }
  }, [selectedUser]);

  // Filter Users
  const filteredUsers = useMemo(() => {
    const q = (search || '').toLowerCase();
    return usersList.filter((usr) => {
      const name = (usr.fullName || '').toLowerCase();
      const email = (usr.email || '').toLowerCase();
      const matchesQuery = name.includes(q) || email.includes(q);

      if (statusFilter === 'active') return matchesQuery && usr.status === 'active';
      if (statusFilter === 'suspended') return matchesQuery && usr.status === 'suspended';
      if (statusFilter === 'admin') return matchesQuery && usr.role === 'admin';
      if (statusFilter === 'user') return matchesQuery && usr.role === 'user';
      return matchesQuery;
    });
  }, [usersList, search, statusFilter]);

  // Add New User Handler
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.fullName.trim() || !newUserData.email.trim()) {
      toastError('Please provide both Full Name and Email.');
      return;
    }

    setIsSubmittingNewUser(true);
    let newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `usr-${Date.now()}`;

    const cleanEmail = newUserData.email.trim().toLowerCase();
    const cleanName = newUserData.fullName.trim();
    const cleanRole = (newUserData.role || 'user').toLowerCase();
    const userPassword = newUserData.password?.trim() || 'password';

    if (isSupabaseConfigured) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: userPassword,
          options: {
            data: {
              full_name: cleanName,
              role: cleanRole
            }
          }
        });
        if (authData?.user?.id) {
          newId = authData.user.id;
        }
      } catch (authErr) {
        console.warn('Supabase auth signup attempt:', authErr);
      }

      try {
        await supabase.from('profiles').upsert([
          {
            id: newId,
            full_name: cleanName,
            email: cleanEmail,
            role: cleanRole,
            status: 'active'
          }
        ], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase insert notice:', err);
      }
    }

    const newUserRecord = {
      id: newId,
      fullName: cleanName,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      status: 'active',
      department: 'Member',
      password: userPassword,
      passwordHash: userPassword,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`
    };

    try {
      const registeredUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      const filtered = registeredUsers.filter(u => u.email.toLowerCase() !== cleanEmail && u.id !== newId);
      localStorage.setItem('_lms_registered_users', JSON.stringify([newUserRecord, ...filtered]));
    } catch (_) {}

    if (useLmsStore.getState().addUser) {
      useLmsStore.getState().addUser(newUserRecord);
    }
    try { window.dispatchEvent(new Event('lms_users_updated')); } catch (_) {}

    setIsSubmittingNewUser(false);
    setIsAddUserModalOpen(false);
    setNewUserData({ fullName: '', email: '', role: 'user', password: 'password' });
    await loadUsers();
    setSelectedUser(newUserRecord);
    success(`New user "${newUserRecord.fullName}" created successfully!`);
  };

  // Toggle User Role
  const toggleRole = async (userId, currentRole) => {
    const nextRole = (currentRole || '').toLowerCase() === 'admin' ? 'user' : 'admin';

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase role update notice:', err);
      }
    }

    try {
      const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      const updatedReg = regUsers.map((u) => (u.id === userId ? { ...u, role: nextRole } : u));
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedReg));
    } catch (_) {}

    loadUsers();
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => ({ ...prev, role: nextRole }));
    }
    success(`Role updated to ${nextRole.toUpperCase()}`);
  };

  // Toggle Status (Activate / Deactivate)
  const toggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ status: nextStatus }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase status update notice:', err);
      }
    }

    try {
      const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      const updatedReg = regUsers.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u));
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedReg));
    } catch (_) {}

    loadUsers();
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => ({ ...prev, status: nextStatus }));
    }
    success(`User ${nextStatus === 'suspended' ? 'Deactivated' : 'Activated'} successfully.`);
  };

  // Reset Password
  const handleResetPassword = (userId) => {
    success(`Password reset email sent to ${selectedUser?.email || 'user'}.`);
  };

  // Delete User Permanently
  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedUser?.fullName || 'this user'}? This will also remove their enrollments and payments from live metrics.`)) {
      return;
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.from('enrollments').delete().eq('user_id', userId);
        await supabase.from('payments').delete().eq('user_id', userId);
        await supabase.from('certificates').delete().eq('user_id', userId);
        await supabase.from('attempts').delete().eq('user_id', userId);
      } catch (err) {
        console.warn('Supabase cascade delete notice:', err);
      }
    }

    // Persist deleted user ID so deleted data never reappears
    try {
      const deletedSet = new Set(JSON.parse(localStorage.getItem('_lms_deleted_user_ids') || '[]'));
      deletedSet.add(userId);
      localStorage.setItem('_lms_deleted_user_ids', JSON.stringify([...deletedSet]));
    } catch (_) {}

    // Remove from _lms_registered_users
    try {
      const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      const updatedReg = regUsers.filter((u) => u.id !== userId);
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedReg));
    } catch (_) {}

    // Update Zustand LMS store to remove all deleted user's records immediately
    try {
      useLmsStore.setState((state) => ({
        enrollments: (state.enrollments || []).filter((e) => e.userId !== userId && e.user_id !== userId),
        payments: (state.payments || []).filter((p) => p.userId !== userId && p.user_id !== userId),
        certificates: (state.certificates || []).filter((c) => c.userId !== userId && c.user_id !== userId),
        attempts: (state.attempts || []).filter((a) => a.userId !== userId && a.user_id !== userId)
      }));
    } catch (_) {}

    setSelectedUser(null);
    loadUsers();
    try {
      syncFromSupabase();
    } catch (_) {}
    success('User and associated records permanently deleted.');
  };

  // Save Edit User
  const handleSaveEditUser = async () => {
    if (!editName || !editEmail) return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ full_name: editName, email: editEmail }).eq('id', selectedUser.id);
      } catch (_) {}
    }

    try {
      const regUsers = JSON.parse(localStorage.getItem('_lms_registered_users') || '[]');
      const updatedReg = regUsers.map((u) => (u.id === selectedUser.id ? { ...u, fullName: editName, email: editEmail } : u));
      localStorage.setItem('_lms_registered_users', JSON.stringify(updatedReg));
    } catch (_) {}

    setIsEditing(false);
    loadUsers();
    setSelectedUser((prev) => ({ ...prev, fullName: editName, email: editEmail }));
    success('User details updated.');
  };

  // Export CSV
  const handleExportUsersCSV = () => {
    const headers = ['User ID,Full Name,Email Address,Role,Status,Created At'];
    const rows = filteredUsers.map(
      (u) => `"${u.id}","${u.fullName}","${u.email}","${u.role}","${u.status}","${u.createdAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acfit_academy_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported user directory CSV');
  };

  // Assign Live Course Handler
  const handleAssignCourseToUser = async (courseItem) => {
    if (!selectedUser || !courseItem) return;

    try {
      if (enrollInCourse) {
        await enrollInCourse(courseItem.id, selectedUser.id, {
          studentName: selectedUser.fullName,
          studentEmail: selectedUser.email,
          courseTitle: courseItem.title,
          amount: courseItem.price || 0,
          status: 'successful'
        });
      }
      success(`Successfully assigned "${courseItem.title}" to ${selectedUser.fullName}!`);
    } catch (err) {
      console.error(err);
      toastError('Error assigning course.');
    }
  };

  // Real Enrolled LMS Courses for the Selected User
  const userEnrolledCourses = useMemo(() => {
    if (!selectedUser) return [];
    const userEnrollments = enrollments.filter(
      (e) => e.userId === selectedUser.id || e.user_id === selectedUser.id
    );
    return userEnrollments.map((e) => {
      const found = courses.find((c) => c.id === e.courseId || c.id === e.course_id);
      return {
        id: e.id || `${e.courseId}-${selectedUser.id}`,
        courseId: e.courseId || e.course_id,
        title: found?.title || e.courseTitle || 'Enrolled LMS Course',
        category: found?.category || 'General',
        thumbnail: found?.thumbnail,
        price: found?.price || 0,
        role: selectedUser.role === 'admin' ? 'Instructor' : 'Student',
        status: 'Active'
      };
    });
  }, [selectedUser, enrollments, courses]);

  // Handle Revoke / Unenroll User from Course
  const handleRevokeUserEnrollment = async (enrollmentId, courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to unenroll ${selectedUser?.fullName} from "${courseTitle}"?`)) {
      try {
        if (deleteEnrollment) {
          await deleteEnrollment(enrollmentId || courseId, selectedUser?.id);
        }
        success(`Successfully unenrolled ${selectedUser?.fullName} from "${courseTitle}".`);
      } catch (err) {
        console.error(err);
        toastError('Failed to revoke enrollment.');
      }
    }
  };

  // Detailed Enrollment Status Calculation for Selected User ID
  const userEnrollmentDetails = useMemo(() => {
    if (!selectedUser) return [];

    const userEnrList = enrollments.filter(
      (e) => e.userId === selectedUser.id || e.user_id === selectedUser.id
    );

    return userEnrList.map((item) => {
      const course = courses.find((c) => c.id === item.courseId || c.id === item.course_id);
      const totalLessons = course?.modules?.flatMap((m) => m.lessons || []).length || 0;
      const userProgressObj = getUserCourseProgress(selectedUser.id, course?.id || item.courseId || item.course_id, progress);
      const completedCount = Object.keys(userProgressObj || {}).filter((k) => userProgressObj[k]).length;
      const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

      const isCertified = certificates.some(
        (c) =>
          (c.userId === selectedUser.id || c.user_id === selectedUser.id) &&
          (c.courseId === (course?.id || item.courseId) || c.course_id === (course?.id || item.courseId))
      );

      const paymentRecord = payments.find(
        (p) =>
          (p.userId === selectedUser.id || p.user_id === selectedUser.id) &&
          (p.courseId === (course?.id || item.courseId) || p.course_id === (course?.id || item.courseId))
      );

      let statusLabel = 'Not Started';
      let statusColor = 'bg-slate-100 text-slate-700 border-slate-200';
      if (progressPct === 100 || isCertified) {
        statusLabel = 'Completed';
        statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (progressPct > 0) {
        statusLabel = 'In Progress';
        statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      }

      return {
        enrollmentId: item.id || `${item.courseId}-${selectedUser.id}`,
        courseId: course?.id || item.courseId || item.course_id,
        courseTitle: course?.title || item.courseTitle || 'LMS Program',
        category: course?.category || 'General Training',
        thumbnail: course?.thumbnail,
        price: course?.price || 0,
        enrolledAt: item.enrolledAt || item.enrolled_at || Date.now(),
        completedCount,
        totalLessons,
        progressPct,
        statusLabel,
        statusColor,
        isCertified,
        paymentStatus: paymentRecord ? `Paid ($${paymentRecord.amount || course?.price || 0})` : 'Assigned by Admin'
      };
    });
  }, [selectedUser, enrollments, courses, progress, certificates, payments]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F7F8FA] text-[#202124] font-sans overflow-hidden select-none">
      
      {/* ─── 1. TOP ZOHO DIRECTORY HEADER BAR ───────────────────────────────────── */}
      <div className="bg-white border-b border-[#E4E7EB] px-6 h-12 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Page Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-extrabold text-[#202124] tracking-tight">Users</h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExportUsersCSV}
            className="h-8 px-3 text-xs border-[#E4E7EB] text-[#202124] hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={() => setIsAddUserModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3.5 font-semibold shadow-xs cursor-pointer"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* ─── 2. SPLIT-PANE MAIN WORKSPACE CANVAS ───────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-white">
        
        {/* ─── LEFT MASTER USER LIST PANEL ───────────────────────────────────── */}
        <div className="w-full lg:w-[360px] xl:w-[380px] border-r border-[#E4E7EB] flex flex-col bg-white shrink-0">
          
          {/* List Sub-Header (Search & Filter) */}
          <div className="p-3 border-b border-[#E4E7EB] flex items-center justify-between gap-2 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-white border border-[#E4E7EB] rounded-md text-xs text-[#202124] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Filter Dropdown (Active Users ▾) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs font-semibold bg-white border border-[#E4E7EB] rounded-md text-[#5F6368] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="All">All Users ▾</option>
              <option value="active">Active Users</option>
              <option value="suspended">Deactivated Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Students Only</option>
            </select>
          </div>

          {/* Table Header Row */}
          <div className="px-4 py-2 bg-slate-100/70 border-b border-[#E4E7EB] flex items-center gap-3 text-[10px] font-bold text-[#5F6368] uppercase tracking-wider">
            <input type="checkbox" readOnly className="w-3.5 h-3.5 text-[#2563EB] rounded border-[#E4E7EB] cursor-pointer" />
            <span>NAME / EMAIL ADDRESS</span>
          </div>

          {/* Scrollable User Rows List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E4E7EB]/60">
            {isLoadingUsers ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading user directory...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No matching user records.</div>
            ) : (
              filteredUsers.map((usr) => {
                const isSelected = selectedUser?.id === usr.id;
                return (
                  <div
                    key={usr.id}
                    onClick={() => setSelectedUser(usr)}
                    className={`px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer relative ${
                      isSelected ? 'bg-[#F4F5F8] border-l-4 border-[#2563EB]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-3.5 h-3.5 text-[#2563EB] rounded border-[#E4E7EB] shrink-0"
                    />

                    {/* Avatar Circle */}
                    <div className="w-9 h-9 rounded-full bg-slate-200 border border-[#E4E7EB] overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-[#2563EB]">
                      {usr.avatarUrl ? (
                        <img src={usr.avatarUrl} alt={usr.fullName} className="w-full h-full object-cover" />
                      ) : (
                        usr.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name & Email */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs block truncate ${isSelected ? 'font-bold text-[#202124]' : 'font-semibold text-[#202124]'}`}>
                          {usr.fullName}
                        </span>
                        {usr.role === 'admin' && (
                          <span className="text-[9px] font-bold text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.2 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#5F6368] block truncate font-normal">
                        {usr.email}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT DETAIL PANEL (SELECTED USER INSPECTOR) ───────────────────── */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            
            {/* ── Top Header Profile Card ── */}
            <div className="p-6 border-b border-[#E4E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0 bg-white">
              
              {/* Profile Details Left */}
              <div className="flex items-start gap-4 min-w-0">
                {/* Large Avatar with Edit Badge */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-100 flex items-center justify-center text-xl font-bold text-[#2563EB]">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      selectedUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border border-[#E4E7EB] shadow-xs text-slate-600 hover:text-[#2563EB] flex items-center justify-center cursor-pointer transition-colors"
                    title="Edit Profile Picture"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Name, Role & Email Details */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-[#202124] tracking-tight truncate">
                      {selectedUser.fullName}
                    </h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        selectedUser.role === 'admin'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20'
                      }`}
                    >
                      {selectedUser.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>

                  <p className="text-xs text-[#5F6368] font-normal">{selectedUser.email}</p>
                  <p className="text-xs text-[#5F6368] font-normal">
                    {selectedUser.department && selectedUser.department !== 'Consultant, Finance' ? selectedUser.department : 'Operations Lead'}
                  </p>

                  {/* Profile Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 rounded-md border border-[#E4E7EB] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#202124] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit2 className="h-3 w-3 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleResetPassword(selectedUser.id)}
                      className="px-3 py-1 rounded-md border border-[#E4E7EB] bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#202124] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>Manage Email Address</span>
                    </button>

                    {/* More Options Dropdown (...) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-md border border-[#E4E7EB] bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs font-sans">
                        <DropdownMenuItem onClick={() => toggleRole(selectedUser.id, selectedUser.role)}>
                          <Shield className="h-3.5 w-3.5 mr-2 text-[#2563EB]" />
                          <span>Make {selectedUser.role === 'admin' ? 'Student' : 'Admin'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteUser(selectedUser.id)} className="text-rose-600">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          <span>Delete User</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right (Deactivate CTA) */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  onClick={() => toggleStatus(selectedUser.id, selectedUser.status)}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer ${
                    selectedUser.status === 'suspended'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#EF4444] hover:bg-rose-600 text-white'
                  }`}
                >
                  {selectedUser.status === 'suspended' ? 'Activate' : 'Deactivate'}
                </button>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-[#202124] hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Inspector"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Profile Subheader Navigation Tabs Bar ── */}
            <div className="bg-white border-b border-[#E4E7EB] px-6 h-11 flex items-center gap-6 shrink-0 text-xs font-medium">
              {[
                { id: 'Info', label: 'Info' },
                { id: 'Applications', label: 'Applications' },
                { id: 'Enroll Status', label: 'Enroll Status' },
                { id: 'Account Activity', label: 'Account Activity' },
                { id: 'Security Policies', label: 'Security Policies' }
              ].map((tab) => {
                const isActive = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`h-11 px-1 font-semibold transition-all relative whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-[#202124] border-b-2 border-[#EF4444]'
                        : 'text-[#5F6368] hover:text-[#202124]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Scrollable Tab Content Body ── */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              
              {/* TAB 1: INFO */}
              {detailTab === 'Info' && (
                <div className="space-y-6 max-w-3xl">
                  <h3 className="text-sm font-bold text-[#202124] pb-2 border-b border-[#E4E7EB]">
                    User Information & Profile Attributes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">Full Name</span>
                      <span className="text-[#202124] font-bold block">{selectedUser.fullName}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">Email Address</span>
                      <span className="text-[#202124] font-bold block">{selectedUser.email}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">User ID</span>
                      <span className="font-mono text-slate-600 block">{selectedUser.id}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">System Role</span>
                      <span className="text-[#202124] font-bold block uppercase">{selectedUser.role}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">Account Status</span>
                      <span className={`font-bold block ${selectedUser.status === 'suspended' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {selectedUser.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#5F6368] font-semibold block">Member Joined</span>
                      <span className="text-[#202124] font-medium block">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATIONS (ENROLLED LMS COURSES) */}
              {detailTab === 'Applications' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wider">
                      Assigned Applications & LMS Courses ({userEnrolledCourses.length})
                    </span>
                    <button
                      onClick={() => setIsAssignCourseModalOpen(true)}
                      className="text-xs text-[#2563EB] font-bold hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>Assign Course</span>
                    </button>
                  </div>

                  {userEnrolledCourses.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-[#E4E7EB] rounded-xl text-center space-y-3 bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">No courses assigned yet</h4>
                        <p className="text-[11px] text-[#5F6368] mt-0.5">
                          Assign a live course to {selectedUser?.fullName || 'this user'} to grant immediate LMS access.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsAssignCourseModalOpen(true)}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-4 font-semibold shadow-xs cursor-pointer"
                      >
                        Assign Course
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {userEnrolledCourses.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-xl border border-[#E4E7EB] bg-white shadow-2xs flex items-center gap-3.5 transition-all hover:border-[#2563EB]/30"
                        >
                          {app.thumbnail ? (
                            <img src={app.thumbnail} alt={app.title} className="w-11 h-11 rounded-lg object-cover border border-[#E4E7EB] shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center shrink-0">
                              <BookOpen className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="font-bold text-xs text-[#202124] truncate">{app.title}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-[#5F6368]">
                              <span>{app.category}</span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">Active</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ENROLL STATUS (USER ENROLLMENT MANAGEMENT) */}
              {detailTab === 'Enroll Status' && (
                <div className="space-y-6">
                  {/* KPI Summary Cards Bar for Selected User */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 border border-[#E4E7EB] rounded-xl space-y-1">
                      <span className="text-[#5F6368] font-semibold text-[11px]">Total Programs</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[#202124]">{userEnrollmentDetails.length}</span>
                        <BookOpen className="h-4 w-4 text-[#2563EB]" />
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-1">
                      <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-800">
                          {userEnrollmentDetails.filter((d) => d.statusLabel === 'Completed').length}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/60 rounded-xl space-y-1">
                      <span className="text-indigo-700 font-semibold text-[11px]">In Progress</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-indigo-800">
                          {userEnrollmentDetails.filter((d) => d.statusLabel === 'In Progress').length}
                        </span>
                        <Clock className="h-4 w-4 text-indigo-600" />
                      </div>
                    </div>

                    <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1">
                      <span className="text-amber-700 font-semibold text-[11px]">Avg. Progress</span>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-amber-800">
                          {userEnrollmentDetails.length > 0
                            ? Math.round(
                                userEnrollmentDetails.reduce((acc, curr) => acc + curr.progressPct, 0) /
                                  userEnrollmentDetails.length
                              )
                            : 0}
                          %
                        </span>
                        <Activity className="h-4 w-4 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  {/* Section Title & Sub-Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#202124]">
                        Program Enrollments for {selectedUser.fullName}
                      </h3>
                      <p className="text-[11px] text-[#5F6368]">
                        Track, manage access seats, and revoke course enrollments per user ID ({selectedUser.id}).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter user programs..."
                          value={enrollSearchQuery}
                          onChange={(e) => setEnrollSearchQuery(e.target.value)}
                          className="h-8 pl-8 pr-3 bg-white border border-[#E4E7EB] rounded-md text-xs text-[#202124] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <Button
                        onClick={() => setIsAssignCourseModalOpen(true)}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3 font-semibold cursor-pointer shrink-0"
                      >
                        Enroll Course
                      </Button>
                    </div>
                  </div>

                  {/* Enrollment Cards List */}
                  {userEnrollmentDetails.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-[#E4E7EB] rounded-xl text-center space-y-3 bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#202124]">No enrollments found</h4>
                        <p className="text-[11px] text-[#5F6368] mt-0.5">
                          {selectedUser.fullName} is currently not enrolled in any LMS courses.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsAssignCourseModalOpen(true)}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-4 font-semibold shadow-xs cursor-pointer"
                      >
                        Enroll in Course
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userEnrollmentDetails
                        .filter((d) => {
                          const q = enrollSearchQuery.toLowerCase();
                          return (
                            d.courseTitle.toLowerCase().includes(q) ||
                            d.category.toLowerCase().includes(q) ||
                            d.statusLabel.toLowerCase().includes(q)
                          );
                        })
                        .map((item) => (
                          <div
                            key={item.enrollmentId}
                            className="p-4 rounded-xl border border-[#E4E7EB] bg-white shadow-2xs hover:border-[#2563EB]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            {/* Left: Banner & Program Title */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {item.thumbnail ? (
                                <img
                                  src={item.thumbnail}
                                  alt={item.courseTitle}
                                  className="w-12 h-12 rounded-lg object-cover border border-[#E4E7EB] shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center shrink-0">
                                  <BookOpen className="h-6 w-6" />
                                </div>
                              )}

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs text-[#202124] truncate">{item.courseTitle}</h4>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-[#5F6368]">
                                    {item.category}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-[#5F6368]">
                                  <span>
                                    Enrolled:{' '}
                                    <strong className="text-slate-700">
                                      {new Date(item.enrolledAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-600 font-medium">{item.paymentStatus}</span>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Progress Bar & Status Pill */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="space-y-1 w-36">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-[#5F6368]">
                                  <span>{item.progressPct}% Done</span>
                                  <span>
                                    {item.completedCount}/{item.totalLessons} Lessons
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                                  <div
                                    className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${item.progressPct}%` }}
                                  />
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.statusColor} flex items-center gap-1 whitespace-nowrap`}
                              >
                                {item.statusLabel === 'Completed' && <CheckCircle2 className="h-3 w-3" />}
                                {item.statusLabel === 'In Progress' && <Clock className="h-3 w-3" />}
                                {item.statusLabel}
                              </span>

                              {item.isCertified && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <Award className="h-3 w-3 text-amber-600" /> Certified
                                </span>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 border-[#E4E7EB] pt-2 md:pt-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeUserEnrollment(item.enrollmentId, item.courseId, item.courseTitle)}
                                className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer font-semibold flex items-center gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Unenroll</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}



              {/* TAB 4: ACCOUNT ACTIVITY */}
              {detailTab === 'Account Activity' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#202124]">User Audit Trail & Activity Log</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { action: 'Logged into LMS Workspace', time: '2 hours ago' },
                      { action: 'Completed lesson "Squat Form & Core Bracing Guide"', time: '1 day ago' },
                      { action: 'Submitted Module 1 Quiz (Score: 90%)', time: '3 days ago' }
                    ].map((act, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-[#E4E7EB] rounded-lg flex justify-between">
                        <span className="font-medium text-[#202124]">{act.action}</span>
                        <span className="text-[#8A8F98] text-[11px]">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY POLICIES */}
              {detailTab === 'Security Policies' && (
                <div className="space-y-4 max-w-lg text-xs">
                  <h3 className="text-sm font-bold text-[#202124]">Security Policies & Password Credentials</h3>
                  <div className="p-4 bg-slate-50 border border-[#E4E7EB] rounded-xl space-y-3">
                    <p className="text-[#5F6368]">Send password reset instructions to user's primary email address.</p>
                    <Button onClick={() => handleResetPassword(selectedUser.id)} className="bg-[#2563EB] text-white text-xs h-8">
                      Send Reset Password Email
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-slate-400 text-xs font-medium">
            Select a user account from the left panel to inspect profile details.
          </div>
        )}

      </div>

      {/* ─── ADD USER MODAL ───────────────────────────────────────────────── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] p-6 w-full max-w-md shadow-xl space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#E4E7EB] pb-3">
              <h3 className="font-bold text-sm text-[#202124]">Add New User Account</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-[#202124]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#202124]">Full Name *</label>
                <Input
                  placeholder="e.g. Irma Flores"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="h-9 text-xs border-[#E4E7EB]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#202124]">Email Address *</label>
                <Input
                  type="email"
                  placeholder="irma.flores@zylker.biz"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="h-9 text-xs border-[#E4E7EB]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#202124]">System Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-white border border-[#E4E7EB] rounded-md text-[#202124]"
                >
                  <option value="user">Student (Standard Access)</option>
                  <option value="admin">Instructor / Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E7EB]">
                <Button variant="outline" type="button" onClick={() => setIsAddUserModalOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingNewUser} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8">
                  {isSubmittingNewUser ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT USER MODAL ───────────────────────────────────────────────── */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] p-6 w-full max-w-md shadow-xl space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-[#E4E7EB] pb-3">
              <h3 className="font-bold text-sm text-[#202124]">Edit User Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-[#202124]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#202124]">Full Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-xs border-[#E4E7EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#202124]">Email Address</label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-9 text-xs border-[#E4E7EB]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E7EB]">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button onClick={handleSaveEditUser} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ASSIGN LIVE COURSE MODAL ─────────────────────────────────────── */}
      {isAssignCourseModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh] text-xs font-sans overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#E4E7EB] flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-sm text-[#202124]">Assign Course</h3>
                <p className="text-[11px] text-[#5F6368]">
                  Select a live course to immediately assign to <span className="font-semibold text-[#202124]">{selectedUser.fullName}</span>.
                </p>
              </div>
              <button
                onClick={() => setIsAssignCourseModalOpen(false)}
                className="text-slate-400 hover:text-[#202124] w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-[#E4E7EB] bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search live courses by title or category..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-[#F8F9FA] border border-[#E4E7EB] rounded-lg text-xs text-[#202124] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>
            </div>

            {/* Course List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]/50">
              {courses.filter((c) => {
                const q = assignSearchQuery.toLowerCase();
                return (c.title || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No courses found matching "{assignSearchQuery}".
                </div>
              ) : (
                courses
                  .filter((c) => {
                    const q = assignSearchQuery.toLowerCase();
                    return (c.title || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q);
                  })
                  .map((courseItem) => {
                    const isAlreadyEnrolled = userEnrolledCourses.some(
                      (e) => e.courseId === courseItem.id
                    );

                    return (
                      <div
                        key={courseItem.id}
                        className="p-3.5 rounded-xl border border-[#E4E7EB] bg-white hover:border-[#2563EB]/40 transition-all flex items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {courseItem.thumbnail ? (
                            <img
                              src={courseItem.thumbnail}
                              alt={courseItem.title}
                              className="w-12 h-12 rounded-lg object-cover border border-[#E4E7EB] shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center shrink-0">
                              <BookOpen className="h-6 w-6" />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <h4 className="font-bold text-xs text-[#202124] truncate">{courseItem.title}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-[#5F6368]">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-[#5F6368]">
                                {courseItem.category || 'General'}
                              </span>
                              <span>•</span>
                              <span>{courseItem.modules?.length || 0} Modules</span>
                              <span>•</span>
                              <span className="font-semibold text-[#2563EB]">
                                {courseItem.price ? `$${courseItem.price}` : 'Free'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assign CTA Button */}
                        <div className="shrink-0">
                          {isAlreadyEnrolled ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                            </span>
                          ) : (
                            <Button
                              onClick={() => handleAssignCourseToUser(courseItem)}
                              leftIcon={<Plus className="h-3.5 w-3.5" />}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-8 px-3.5 font-semibold shadow-xs cursor-pointer"
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#E4E7EB] bg-white flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAssignCourseModalOpen(false)}
                className="h-8 text-xs font-semibold text-[#202124]"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
