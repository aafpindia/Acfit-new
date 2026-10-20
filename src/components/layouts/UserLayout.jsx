import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useLmsStore } from '../../stores/lmsStore';
import {
  LayoutDashboard,
  BookOpen,
  User as UserIcon,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ShieldAlert,
  Dumbbell,
  Menu,
  X,
  CreditCard,
  CheckCircle2,
  Bike,
  Activity
} from 'lucide-react';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import acfitLogo from '../../assets/libraries/ACFIT-LOGO.webp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown';

export const UserLayout = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { courses, announcements = [] } = useLmsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state for user portal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // Notifications state with live DB announcements integration
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const userEmail = (user?.email || '').toLowerCase();
  const userName = (user?.fullName || '').toLowerCase();

  const displayNotifications = useMemo(() => {
    const matched = announcements.filter((ann) => {
      const t = (ann.target || '').toLowerCase();
      if (!t || t === 'all' || t === 'all athletes' || t.includes('all registered athletes')) return true;
      if (userEmail && t.includes(userEmail)) return true;
      if (userName && t.includes(userName)) return true;
      return false;
    });

    if (matched.length > 0) {
      return matched.map((ann) => ({
        id: ann.id,
        text: `${ann.title}: ${ann.body}`,
        time: ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'Recent',
        read: readNotificationIds.includes(ann.id)
      }));
    }

    return [
      { id: 1, text: 'Welcome to ACFIT Academy! Your enrollment is active.', time: 'Just now', read: readNotificationIds.includes(1) },
      { id: 2, text: 'New Workout Blueprint added: 30-Day Lean Muscle & Strength', time: '1h ago', read: readNotificationIds.includes(2) },
      { id: 3, text: 'Keep up your daily training streak!', time: '1d ago', read: true }
    ];
  }, [announcements, userEmail, userName, readNotificationIds]);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/app/dashboard',
      icon: LayoutDashboard,
      description: 'Your learning progress, active program sessions, announcements & achievements'
    },
    {
      label: 'My Programs',
      path: '/app/courses',
      icon: BookOpen,
      description: 'Explore fitness programs, workout modules, video lessons & certifications'
    },
    {
      label: 'Learning Progress',
      path: '/app/progress',
      icon: Activity,
      description: 'Track lesson completions and syllabus progression'
    },
    {
      label: 'Billing & Payments',
      path: '/app/payments',
      icon: CreditCard,
      description: 'View enrollment transaction receipts and payment history'
    },
    {
      label: 'Profile',
      path: '/app/profile',
      icon: UserIcon,
      description: 'View your account details, enrollment records & earned certificates'
    }
  ];

  const userNavSections = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'LEARNING',
      items: [
        { label: 'My Programs', path: '/app/courses', icon: BookOpen },
        { label: 'Learning Progress', path: '/app/progress', icon: Activity }
      ]
    },
    {
      group: 'ACCOUNT',
      items: [
        { label: 'Billing & Payments', path: '/app/payments', icon: CreditCard },
        { label: 'Profile', path: '/app/profile', icon: UserIcon }
      ]
    }
  ];

  // Course search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matched = (courses || []).filter(
      (c) => c.title.toLowerCase().includes(query) || (c.category && c.category.toLowerCase().includes(query))
    );
    setSearchResults(matched.slice(0, 5));
  }, [searchQuery, courses]);

  // Click outside to dismiss search overlay
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const markAllRead = () => {
    const allIds = displayNotifications.map(n => n.id);
    setReadNotificationIds(allIds);
  };

  const unreadCount = displayNotifications.filter((n) => !n.read).length;
  const isLearningRoute = location.pathname.includes('/learning/');

  if (isLearningRoute) {
    return (
      <div className="h-screen w-screen bg-[#F8FAFC] overflow-hidden font-sans text-[#202124] selection:bg-[#2563EB] selection:text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F7F8FA] flex flex-col font-sans text-[#202124] selection:bg-[#2563EB] selection:text-white">
      
      {/* ─── TOP NAVIGATION HEADER BAR (LIGHT SAAS CLEAN THEME) ────────── */}
      <header className="h-14 shrink-0 z-40 bg-white text-[#202124] border-b border-[#E4E7EB] shadow-xs select-none">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-4 overflow-hidden">
          
          {/* LEFT: Brand Logo & Title */}
          <Link to="/app/dashboard" className="flex items-center gap-2.5 group shrink-0 select-none">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={acfitLogo} alt="ACFIT Academy" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-[#202124] block font-sans">
                ACFIT Academy
              </span>
            </div>
          </Link>

          {/* RIGHT: Search, Notifications & Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto text-[#5F6368]">
            
            {/* Quick Program Search Input */}
            <div className="relative hidden xl:block" ref={searchRef}>
              <div className="flex items-center bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E4E7EB] focus-within:border-[#2563EB] focus-within:bg-white rounded-lg transition-all shadow-2xs overflow-hidden text-xs px-3 w-64">
                <Search className="h-3.5 w-3.5 text-[#5F6368] shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search programs & workouts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full h-9 topbar-search-input bg-transparent text-xs text-[#202124] placeholder:text-[#8A8F98] focus:outline-none focus:ring-0 border-none font-sans"
                />
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#5F6368] bg-white border border-[#E4E7EB] rounded select-none shrink-0 ml-1">
                  ctrl k
                </kbd>
              </div>

              {/* SEARCH DROPDOWN OVERLAY */}
              <AnimatePresence>
                {showSearchDropdown && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#E4E7EB] text-[#202124] rounded-xl shadow-xl overflow-hidden z-50 p-2 font-sans"
                  >
                    <div className="px-3 py-1.5 border-b border-[#E4E7EB] text-[10px] font-bold text-[#5F6368] uppercase tracking-wider flex items-center justify-between">
                      <span>SEARCH RESULTS</span>
                      <span className="text-[#2563EB]">{searchResults.length} MATCHES</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                      {searchResults.length > 0 ? (
                        searchResults.map((course) => (
                          <Link
                            key={course.id}
                            to={`/app/courses/${course.id}`}
                            onClick={() => setShowSearchDropdown(false)}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F3F4F6] text-[#202124] transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                              <BookOpen className="h-3.5 w-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-[#202124] block truncate">{course.title}</span>
                              <span className="text-[10px] text-[#5F6368] font-mono block">{course.category || 'Fitness Blueprint'}</span>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[#5F6368] italic">
                          No matching programs found.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg text-[#5F6368] hover:bg-[#F3F4F6] hover:text-[#202124] transition-all focus:outline-none cursor-pointer">
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-0 rounded-xl shadow-xl bg-white border-[#E4E7EB] text-[#202124] font-sans" align="end">
                <div className="p-3 border-b border-[#E4E7EB] flex items-center justify-between bg-[#F9FAFB] rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#202124] uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E4E7EB]">
                  {displayNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs flex items-start gap-2.5 transition-colors ${
                        item.read ? 'bg-white text-[#5F6368]' : 'bg-[#EFF6FF]/50 text-[#202124] font-medium'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.read ? 'bg-[#8A8F98]' : 'bg-[#2563EB]'}`} />
                      <div className="flex-1">
                        <p className="leading-snug">{item.text}</p>
                        <span className="text-[9px] text-[#8A8F98] block mt-1">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex items-center cursor-pointer focus:outline-none p-0.5 rounded-full hover:ring-2 hover:ring-[#2563EB] transition-all">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="User Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-xs ring-2 ring-emerald-500/40 shrink-0">
                      {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl shadow-xl bg-white border-[#E4E7EB] text-[#202124] font-sans p-3" align="end">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E7EB]">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[#2563EB]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-sm ring-2 ring-[#2563EB] shrink-0">
                      {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-[#202124] block truncate">{user?.fullName || 'Student Member'}</span>
                    <span className="text-[10px] text-[#5F6368] block truncate">{user?.email || 'student@acfitacademy.com'}</span>
                  </div>
                </div>
                
                <div className="py-2 space-y-1">
                  <button
                    onClick={() => navigate('/app/profile')}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-left transition-colors cursor-pointer text-[#202124] text-xs font-medium"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#5F6368]" />
                    <span>My Account Profile</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#E4E7EB]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F3F4F6] transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* ─── MOBILE SLIDE-DOWN DRAWER MENU ─────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden bg-white border-b border-[#E4E7EB] text-[#202124] overflow-hidden font-sans shadow-xl"
            >
              <div className="p-4 space-y-3">
                {/* Mobile Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5F6368]" />
                  <input
                    type="text"
                    placeholder="Search programs & workouts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg topbar-search-input bg-[#F3F4F6] border border-[#E4E7EB] text-xs text-[#202124] placeholder:text-[#8A8F98] focus:outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {userNavSections.map((sec) => (
                    <div key={sec.group} className="space-y-1">
                      <span className="px-2 text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                        {sec.group}
                      </span>
                      {sec.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                              isActive
                                ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                                : 'text-[#5F6368] hover:bg-[#F3F4F6] hover:text-[#202124]'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── BODY (EXPANDED HOVER USER SIDEBAR + MAIN CONTENT) ────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* DESKTOP HOVER-EXPANDABLE SUBTLE PREMIUM SLATE SIDEBAR */}
        <aside className="hidden lg:flex flex-col justify-between py-5 px-3 shrink-0 font-sans h-full bg-[#F8FAFC] text-slate-700 border-r border-slate-200/80 transition-all duration-300 ease-in-out z-30 group/sidebar w-[68px] hover:w-[260px] overflow-y-auto overflow-x-hidden shadow-md shadow-slate-200/40 select-none">
          <div className="space-y-6">
            {userNavSections.map((sec) => (
              <div key={sec.group} className="space-y-1.5">
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                  {sec.group}
                </span>
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap overflow-hidden ${
                        isActive
                          ? 'bg-[#2563EB] text-white font-extrabold shadow-sm shadow-[#2563EB]/25'
                          : 'text-slate-600 font-bold hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                      title={item.label}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover/sidebar:text-slate-800'}`} />
                      <span className="truncate opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 font-bold">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>


        </aside>

        {/* MAIN WORKSPACE CONTENT AREA */}
        <main className="flex-1 min-w-0 bg-[#F7F8FA] overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default UserLayout;
