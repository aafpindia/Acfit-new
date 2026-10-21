import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Dumbbell,
  Megaphone,
  MessageSquareQuote,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import acfitLogo from '../../assets/libraries/ACFIT-LOGO.webp';

export const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const { courses, certificates } = useLmsStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ courses: [], users: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Profile Popover State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const navSections = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, description: 'Overview & Analytics' }
      ]
    },
    {
      group: 'Learning',
      items: [
        { label: 'Courses', path: '/admin/courses', icon: BookOpen, description: 'Course catalog & curriculum' },
        { label: 'Users', path: '/admin/users', icon: Users, description: 'Manage accounts & members' }
      ]
    },
    {
      group: 'Business',
      items: [
        { label: 'Payments', path: '/admin/payments', icon: CreditCard, description: 'Revenue & transactions' }
      ]
    },
    {
      group: 'Communication',
      items: [
        { label: 'Announcements', path: '/admin/announcements', icon: Megaphone, description: 'Broadcast updates' },
        { label: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote, description: 'Manage reviews & alumni badges' }
      ]
    },
    {
      group: 'System',
      items: [
        { label: 'Settings', path: '/admin/settings', icon: Settings, description: 'System configuration' }
      ]
    }
  ];

  // Ctrl + K Global Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ courses: [], users: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    const matchedCourses = courses.filter(
      (c) => c.title?.toLowerCase().includes(query) || (c.category && c.category.toLowerCase().includes(query))
    );

    const mockUsers = JSON.parse(localStorage.getItem('_lms_mock_users') || '[]');
    const matchedUsers = mockUsers.filter(
      (u) => (u.fullName && u.fullName.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query))
    );

    setSearchResults({
      courses: matchedCourses.slice(0, 5),
      users: matchedUsers.slice(0, 5)
    });
  }, [searchQuery, courses]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const hasSearchResults =
    searchResults.courses.length > 0 || searchResults.users.length > 0;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F7F8FA] flex flex-col font-sans text-[#202124] selection:bg-[#2563EB] selection:text-white">
      
      {/* ─── TOP NAVIGATION HEADER BAR (LIGHT SAAS CLEAN THEME) ────────── */}
      <header className="h-14 shrink-0 z-40 bg-white text-[#202124] border-b border-[#E4E7EB] shadow-xs select-none">
        <div className="w-full px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <Link to="/admin/courses" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={acfitLogo} alt="ACFIT Academy" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-[#202124] block">
                ACFIT Academy
              </span>
            </div>
          </Link>

          {/* Center Clean Search Capsule - hidden on small mobile, available on sm+ and in mobile drawer */}
          <div className="hidden sm:flex flex-1 max-w-md mx-auto items-center justify-center">
            <div className="relative w-full flex items-center" ref={searchRef}>
              
              {/* Main Search Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;
                  setShowSearchDropdown(false);
                  navigate(`/admin/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                }}
                className="w-full flex items-center bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E4E7EB] focus-within:border-[#2563EB] focus-within:bg-white rounded-lg transition-all shadow-2xs overflow-hidden text-xs px-3"
              >
                <Search className="h-3.5 w-3.5 text-[#5F6368] shrink-0 mr-2" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search courses, users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full h-9 topbar-search-input bg-transparent text-xs text-[#202124] placeholder:text-[#8A8F98] focus:outline-none focus:ring-0 border-none font-sans"
                />
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#5F6368] bg-white border border-[#E4E7EB] rounded select-none shrink-0 ml-2">
                  ctrl k
                </kbd>
              </form>

              {/* SEARCH RESULTS OVERLAY */}
              <AnimatePresence>
                {showSearchDropdown && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 top-full mt-2 w-full bg-white border border-[#E4E7EB] rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto p-4 space-y-4 text-[#202124] font-sans"
                  >
                    {!hasSearchResults ? (
                      <span className="text-xs font-mono text-[#5F6368] italic block text-center py-2">
                        No matching results found for "{searchQuery}"
                      </span>
                    ) : (
                      <>
                        {searchResults.courses.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] block">
                              Courses ({searchResults.courses.length})
                            </span>
                            {searchResults.courses.map((c) => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  navigate(`/admin/courses?search=${encodeURIComponent(c.title)}`);
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-[#F3F4F6] text-xs font-medium text-[#202124] flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span className="truncate">{c.title}</span>
                                <span className="text-[10px] text-[#5F6368] font-mono">{c.category || 'General'}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.users.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                              Users ({searchResults.users.length})
                            </span>
                            {searchResults.users.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  navigate(`/admin/users?search=${encodeURIComponent(u.email || u.fullName)}`);
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-[#F3F4F6] text-xs font-medium text-[#202124] flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span className="truncate">{u.fullName} ({u.email})</span>
                                <span className="text-[10px] text-[#5F6368] font-mono">{u.role}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Header: ONLY Admin Profile Avatar */}
          <div className="flex items-center gap-2 shrink-0 ml-auto text-[#5F6368]">
            
            {/* Admin Profile Avatar with Green Status Dot */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative flex items-center cursor-pointer focus:outline-none p-0.5 rounded-full hover:ring-2 hover:ring-[#2563EB] transition-all"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Admin Profile"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-xs ring-2 ring-emerald-500/40 shrink-0">
                    {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Active Online Green Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E4E7EB] rounded-xl shadow-xl z-50 p-3 font-sans text-xs text-[#202124]"
                  >
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E4E7EB]">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Profile"
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#2563EB]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-sm ring-2 ring-[#2563EB] shrink-0">
                          {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-[#202124] block truncate">{user?.fullName || 'ACFIT Academy Admin'}</span>
                        <span className="text-[10px] text-[#5F6368] block truncate">{user?.email || 'info@acfitacademy.com'}</span>
                      </div>
                    </div>
                    <div className="py-2 space-y-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F3F4F6] text-left transition-colors cursor-pointer text-[#202124]"
                      >
                        <Settings className="h-3.5 w-3.5 text-[#5F6368]" />
                        <span>Account Settings</span>
                      </button>
                    </div>
                    <div className="pt-1 border-t border-[#E4E7EB]">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-left transition-colors cursor-pointer font-semibold"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F3F4F6]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── BODY (EXPANDED GROUPED ZOHO SIDEBAR + MAIN CONTENT) ────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* DESKTOP HOVER-EXPANDABLE SUBTLE PREMIUM SLATE SIDEBAR */}
        <aside className="hidden lg:flex flex-col justify-between py-5 px-3 shrink-0 font-sans h-full bg-[#F8FAFC] text-slate-700 border-r border-slate-200/80 transition-all duration-300 ease-in-out z-30 group/sidebar w-[68px] hover:w-[260px] overflow-y-auto overflow-x-hidden shadow-md shadow-slate-200/40 select-none">
          <div className="space-y-6">
            {navSections.map((sec) => (
              <div key={sec.group} className="space-y-1.5">
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                  {sec.group}
                </span>
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
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

        {/* ─── MOBILE DRAWER OVERLAY ─────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="w-72 bg-white text-[#202124] border-r border-[#E4E7EB] h-full p-6 flex flex-col justify-between shadow-xl font-sans overflow-y-auto"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                        <img src={acfitLogo} alt="ACFIT Academy" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <span className="font-black text-sm text-[#202124] block leading-none">
                          ACFIT Academy Admin
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-[#202124]">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5F6368]" />
                    <input
                      type="text"
                      placeholder="Search courses, users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          setMobileMenuOpen(false);
                          navigate(`/admin/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                        }
                      }}
                      className="w-full h-9 pl-9 pr-3 rounded-lg topbar-search-input bg-[#F3F4F6] border border-[#E4E7EB] text-xs text-[#202124] placeholder:text-[#8A8F98] focus:outline-none font-sans"
                    />
                  </div>

                  <nav className="space-y-4 text-xs font-medium">
                    {navSections.map((sec) => (
                      <div key={sec.group} className="space-y-1">
                        <span className="px-2 text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                          {sec.group}
                        </span>
                        {sec.items.map((item) => {
                          const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border-l-3 border-[#2563EB]'
                                  : 'text-[#5F6368] hover:bg-slate-50 hover:text-[#202124]'
                              }`}
                            >
                              <Icon className="h-4.5 w-4.5 shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </nav>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                    leftIcon={<LogOut className="h-4 w-4" />}
                  >
                    Logout
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN CANVAS */}
        <main className="flex-1 min-w-0 bg-[#F7F8FA] overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;

