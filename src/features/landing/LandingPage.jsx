import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useLmsStore } from '../../stores/lmsStore';
import { fetchCourses } from '../../services/courseService';

import { SplitText } from '../../components/ui/SplitText';
import { CountUp } from '../../components/ui/CountUp';
import logoWebp from '../../assets/libraries/logo.webp';
import acfitLogo from '../../assets/libraries/ACFIT-LOGO.webp';
import nasmJpg from '../../assets/libraries/nasm.jpg';
import cfrPng from '../../assets/libraries/cfr.png';
import heroCharacterCutout from '../../assets/libraries/hero_character_cutout.png';

// High quality professional cover photos
import coverCpt from '../../assets/libraries/covers/cpt_cover_pro.png';
import coverCnc from '../../assets/libraries/covers/cnc_cover_pro.png';
import coverSpecialist from '../../assets/libraries/covers/specialist_cover_pro.png';
import coverWorkshop from '../../assets/libraries/covers/workshop_cover_pro.png';

// Dynamically import all partner images from app/src/assets/libraries/partners
const partnerLogos = Object.entries(
  import.meta.glob('../../assets/libraries/partners/*.{png,jpg,jpeg,webp,svg}', { eager: true, import: 'default' })
).map(([path, src]) => ({
  src,
  isWhatsApp: path.toLowerCase().includes('whatsapp-image')
}));
import chatgptImg1 from '../../assets/libraries/ChatGPT Image Sep 18, 2026, 11_06_18 AM.png';
import chatgptImg2 from '../../assets/libraries/ChatGPT Image Sep 18, 2026, 11_08_08 AM.png';
import chatgptImg3 from '../../assets/libraries/ChatGPT Image Sep 18, 2026, 11_09_34 AM.png';
import chatgptImg4 from '../../assets/libraries/ChatGPT Image Sep 18, 2026, 11_16_43 AM.png';

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Star,
  X,
  Send,
  Phone,
  Mail,
  UserCheck,
  Check,
  ShieldCheck,
  Sparkles,
  Globe,
  Award,
  BookOpen,
  Menu
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();
  const { info, success, error: toastError } = useToast();
  const navigate = useNavigate();
  const { submitEnquiry, courses: storeCourses, testimonials: storeTestimonials, syncFromSupabase } = useLmsStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ─── Live courses from admin/Supabase ───
  const [liveCourses, setLiveCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (syncFromSupabase) {
          await syncFromSupabase();
        }
        const res = await fetchCourses();
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setLiveCourses(res.data);
        }
      } catch (err) {
        console.warn('[LandingPage] Failed to load live courses:', err);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [syncFromSupabase]);

  // Combined real-time course list (prefer live API response, fallback to store if API returned empty)
  const activeCourses = useMemo(() => {
    if (liveCourses && liveCourses.length > 0) return liveCourses;
    if (storeCourses && storeCourses.length > 0) return storeCourses;
    return [];
  }, [liveCourses, storeCourses]);

  // Modal States
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  // Enquiry Form State
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', message: '' });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.email.trim() || !enquiryForm.message.trim()) {
      toastError("Please fill in your name, email, and query message.");
      return;
    }
    setIsSubmittingEnquiry(true);
    try {
      await submitEnquiry({
        name: enquiryForm.name,
        email: enquiryForm.email,
        message: enquiryForm.message,
        source: 'landing_modal'
      });
      setEnquirySuccess(true);
      success("Inquiry submitted! Our ACFIT admissions team will contact you shortly.");
      setEnquiryForm({ name: '', email: '', message: '' });
      setTimeout(() => {
        setEnquirySuccess(false);
        setIsContactModalOpen(false);
      }, 2200);
    } catch (err) {
      toastError(err.message || "Failed to submit inquiry.");
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // Horizontal Scroll Ref for Courses
  const coursesScrollRef = useRef(null);

  const scrollCourses = (direction) => {
    if (coursesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      coursesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselImages = [
    { src: chatgptImg1, title: 'Science-Backed Education', subtitle: 'Global Standards & Evidence-Based Practical Learning' },
    { src: chatgptImg2, title: 'State-of-the-Art Training', subtitle: 'Hands-on Kinesiology & Biomechanics Modules' },
    { src: chatgptImg3, title: 'Internationally Accredited', subtitle: 'NASM Official Premier Partner in India' },
    { src: chatgptImg4, title: 'Career Acceleration', subtitle: 'Transforming Passion into Elite Fitness Careers' }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  // Course Explore Handler
  const handleCourseAction = (courseName) => {
    if (user) {
      const isAdmin = String(user.role || '').toLowerCase() === 'admin';
      navigate(isAdmin ? '/admin/courses' : '/app/courses');
    } else {
      navigate('/app/courses');
    }
  };

  // Nav scroll helper
  const scrollToSection = (id) => {
    let el = document.getElementById(id);
    if (!el && (id === 'certifications' || id === 'workshops' || id === 'courses')) {
      el = document.getElementById('courses-section') || document.getElementById('certifications');
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Mock Directory Data for Certified Professionals in India
  const certifiedDirectory = [
    { name: 'Rohan Deshmukh', city: 'Mumbai', cert: 'NASM CPT', exp: '6 Years', rating: 4.9, active: true },
    { name: 'Priya Sharma', city: 'Delhi NCR', cert: 'NASM CNC & CPT', exp: '4 Years', rating: 5.0, active: true },
    { name: 'Karan Patel', city: 'Bengaluru', cert: 'CFR PRO Specialist', exp: '8 Years', rating: 4.8, active: true },
    { name: 'Sneha Reddy', city: 'Hyderabad', cert: 'NASM CNC', exp: '5 Years', rating: 4.9, active: true },
    { name: 'Amitabh Sen', city: 'Kolkata', cert: 'NASM CPT', exp: '3 Years', rating: 4.7, active: true },
    { name: 'Vikram Joshi', city: 'Pune', cert: 'NASM CPT & CFR PRO', exp: '7 Years', rating: 5.0, active: true },
  ];

  const filteredDirectory = certifiedDirectory.filter(
    (p) =>
      p.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      p.city.toLowerCase().includes(directorySearch.toLowerCase()) ||
      p.cert.toLowerCase().includes(directorySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#202124] font-sans relative overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
      
      {/* ─── FIRST FOLD (HERO & NAVIGATION) ─── */}
      <div className="relative z-10 overflow-hidden border-b border-stone-200/80">
        
        {/* Warm Yellow Hero Background — Clean & Smooth */}
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 40%, #FFE082 100%)' }} />

        {/* ─── TOP NAVIGATION HEADER ─── */}
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-lg border-b border-amber-200/50 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            
            {/* Logo Image Only — Increased Size, No Text */}
            <Link to="/" className="flex items-center group py-1">
              <img
                src={acfitLogo || logoWebp}
                alt="ACFIT Academy"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Navigation Links — Clean & Essential */}
            <nav className="hidden lg:flex items-center gap-8 font-bold text-xs tracking-wider uppercase text-stone-700" style={{ fontFamily: "'Inter', sans-serif" }}>
              <button onClick={() => scrollToSection('courses-section')} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                Courses
              </button>
              <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                About
              </button>
              <button onClick={() => setIsContactModalOpen(true)} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                Contact
              </button>
            </nav>

            {/* Action & User Auth Buttons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {!user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="hidden sm:block text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-[#2563EB] px-4 py-2 transition-colors cursor-pointer"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-[#1A1A1A] hover:bg-[#2563EB] text-white px-4 sm:px-6 py-2.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const isAdmin = String(user.role || '').toLowerCase() === 'admin';
                    navigate(isAdmin ? '/admin/courses' : '/app/courses');
                  }}
                  className="bg-[#1A1A1A] hover:bg-[#2563EB] text-white px-4 sm:px-6 py-2.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Portal Catalog →
                </button>
              )}

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

          </div>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:hidden overflow-hidden border-t border-amber-200/50 bg-white/95 backdrop-blur-lg"
              >
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
                  <button
                    onClick={() => { scrollToSection('courses-section'); setMobileNavOpen(false); }}
                    className="text-left text-sm font-bold text-stone-700 hover:text-[#2563EB] hover:bg-stone-50 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Courses
                  </button>
                  <button
                    onClick={() => { setIsAboutModalOpen(true); setMobileNavOpen(false); }}
                    className="text-left text-sm font-bold text-stone-700 hover:text-[#2563EB] hover:bg-stone-50 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    About
                  </button>
                  <button
                    onClick={() => { setIsContactModalOpen(true); setMobileNavOpen(false); }}
                    className="text-left text-sm font-bold text-stone-700 hover:text-[#2563EB] hover:bg-stone-50 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Contact
                  </button>
                  {!user && (
                    <button
                      onClick={() => { navigate('/login'); setMobileNavOpen(false); }}
                      className="sm:hidden text-left text-sm font-bold text-[#2563EB] hover:bg-blue-50 px-4 py-3 rounded-xl transition-colors cursor-pointer"
                    >
                      Login
                    </button>
                  )}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ─── HERO MAIN CONTENT ─── */}
        <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0 lg:pt-16 lg:pb-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-end min-h-[480px] lg:min-h-[540px]">
            
            {/* ──── LEFT: CONTENT ──── */}
            <div className="flex flex-col justify-center space-y-7 z-20 order-2 lg:order-1 pb-12 lg:pb-20">
              
              {/* NASM x CFR PRO Official Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm tracking-[0.18em] font-sans select-none"
              >
                <span className="font-black text-[#2563EB] uppercase">
                  ACFIT ACADEMY
                </span>
                <span className="font-bold text-[#1A1A1A] uppercase">
                  for Fitness Professionals
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="leading-[1.02] tracking-[-0.03em]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <span className="block text-[clamp(2rem,5.5vw,4.8rem)] font-[900] text-[#1A1A1A]">
                  INTERNATIONALLY
                </span>
                <span className="block text-[clamp(2rem,5.5vw,4.8rem)] font-[900] text-[#1A1A1A]">
                  CERTIFIED FITNESS
                </span>
                <span className="block text-[clamp(2rem,5.5vw,4.8rem)] font-[900] text-[#1A1A1A]">
                  PROFESSIONALS
                </span>
              </motion.h1>

              {/* Sub-description */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="space-y-3 max-w-md"
              >
                <p className="text-[15px] text-stone-800 font-semibold leading-[1.7]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <strong className="font-black text-[#1A1A1A]">ACFIT Academy</strong> delivers gold-standard <strong className="font-black text-[#2563EB]"></strong> certifications and <strong className="font-black text-emerald-800">CFR PRO</strong> corrective exercise standards with hands-on kinesiology coaching across India.
                </p>
                <p className="text-[13px] text-stone-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Elevate your career with professional fitness certifications.
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
              >
                <button
                  onClick={() => {
                    if (user) {
                      const isAdmin = String(user.role || '').toLowerCase() === 'admin';
                      navigate(isAdmin ? '/admin/courses' : '/app/courses');
                    } else {
                      navigate('/app/courses');
                    }
                  }}
                  className="bg-[#1A1A1A] hover:bg-[#2563EB] text-white px-8 py-4 rounded-full font-bold text-[13px] uppercase tracking-wider transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Explore CFR PRO Courses
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

            </div>

            {/* ──── RIGHT: CHARACTER CUTOUT (no background, flush to bottom) ──── */}
            <div className="relative flex items-end justify-center lg:justify-end order-1 lg:order-2 z-10">
              
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="relative z-10 w-full max-w-[380px] lg:max-w-[440px]"
              >
                <img
                  src={heroCharacterCutout}
                  alt="ACFIT NASM & CFR PRO Certified Professional"
                  className="w-full h-auto object-contain"
                  style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.15))' }}
                  loading="eager"
                />

                {/* Floating CFR PRO Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="absolute top-2 left-0 sm:top-4 sm:-left-12 lg:-left-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/90 p-2.5 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 z-20 hover:scale-105 transition-transform duration-300"
                >
                  <img src={cfrPng} alt="CFR PRO" className="h-8 sm:h-10 w-8 sm:w-10 rounded-lg object-contain border border-stone-100 shrink-0" />
                  <div className="border-l border-stone-200 pl-2 sm:pl-2.5 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-wider block" style={{ fontFamily: "'Inter', sans-serif" }}>CFR PRO STANDARD</span>
                    <span className="text-[8px] sm:text-[9px] text-stone-600 font-bold block">Corrective Specialist</span>
                  </div>
                </motion.div>

                {/* Floating Star Rating Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="absolute -bottom-2 left-0 sm:bottom-2 sm:-left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-stone-200/90 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-2.5 z-20 hover:scale-105 transition-transform duration-300"
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-stone-700" style={{ fontFamily: "'Inter', sans-serif" }}>4.9 / 5</span>
                  <span className="text-[9px] text-stone-400 font-medium">(2.4K)</span>
                </motion.div>
              </motion.div>

            </div>


          </div>
        </main>
      </div>

      {/* ─── STATS BAR (Below Hero — Namogoo-style large stats) ─── */}
      <section className="py-14 bg-white border-b border-stone-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12"
          >
            {[
              { from: 0, to: 10, direction: 'up', suffix: '+', label: 'Years of training excellence' },
              { from: 60, to: 20, direction: 'down', suffix: 'K+', label: 'Professionals certified' },
              { from: 0, to: 98, direction: 'up', suffix: '%', label: 'Exam pass rate with mentorship' },
              { from: 100, to: 50, direction: 'down', suffix: '+', label: 'Cities with active graduates' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <span
                  className="block text-[clamp(2.2rem,4vw,3.6rem)] font-[900] text-[#1A1A1A] tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <CountUp
                    from={stat.from}
                    to={stat.to}
                    direction={stat.direction}
                    duration={2}
                  />
                  {stat.suffix}
                </span>
                <span className="text-xs sm:text-[13px] text-stone-500 font-medium mt-2.5 block leading-snug" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TRUSTED BY THE INDUSTRY ─── */}
      <section className="py-14 sm:py-16 bg-white border-y border-stone-200/80 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-9">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-stone-400">
              TRUSTED BY LEADING FITNESS INSTITUTIONS & BRANDS
            </span>
          </div>

          {/* Running Carousel of Partner Logos */}
          <div className="relative w-full overflow-hidden">
            {/* Fading Gradient Overlays on Left & Right */}
            <div className="absolute left-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />

            <motion.div
              className="flex items-center gap-8 sm:gap-10 w-max py-3"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                ease: 'linear',
                duration: 28,
                repeat: Infinity,
              }}
            >
              {[...partnerLogos, ...partnerLogos].map((logo, idx) => (
                <div
                  key={idx}
                  className={`bg-[#FAF9F5] border border-stone-200 hover:border-[#2563EB] rounded-2xl ${
                    logo.isWhatsApp
                      ? 'px-8 py-5 h-28 sm:h-34 min-w-[210px] sm:min-w-[260px]'
                      : 'px-7 py-4 h-24 sm:h-28 min-w-[180px] sm:min-w-[220px]'
                  } flex items-center justify-center shrink-0 transition-all duration-300 shadow-2xs hover:shadow-md group cursor-pointer`}
                >
                  <img
                    src={logo.src}
                    alt={`Partner Logo ${(idx % partnerLogos.length) + 1}`}
                    className={`${
                      logo.isWhatsApp
                        ? 'max-h-20 sm:max-h-24 max-w-[190px] sm:max-w-[230px] scale-125 group-hover:scale-135'
                        : 'max-h-16 sm:max-h-20 max-w-[150px] sm:max-w-[180px] group-hover:scale-110'
                    } object-contain opacity-90 group-hover:opacity-100 transition-all duration-300`}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 10+ YEARS OF EXPERIENCE (LEARN. CERTIFY. GROW.) ─── */}
      <section className="py-20 sm:py-28 relative z-10 bg-[#FAF9F5] overflow-hidden border-b border-stone-200/60">
        

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center space-y-7">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/90 border border-stone-200/90 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#2563EB] animate-ping" />
            <span className="text-xs font-mono font-bold tracking-widest text-stone-800 uppercase">
              ACFIT ACADEMY · 10+ YEARS OF EXCELLENCE
            </span>
          </div>

          {/* Headline with GSAP SplitText */}
          <h2 className="text-4xl sm:text-6xl font-black text-[#202124] tracking-tight leading-[1.08]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <SplitText
              text="Learn. Certify. Grow."
              tag="span"
              splitType="words"
              className="inline-block text-[#202124]"
              delay={40}
              duration={0.8}
              textAlign="center"
            />
          </h2>

          {/* Brand Mission Subtitle */}
          <p className="text-sm sm:text-base text-stone-600 font-medium max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            <strong className="text-[#1A1A1A] font-bold">ACFIT Academy</strong> is an official NASM India Premier Partner, combining science-backed education, practical kinesiology training, and internationally recognised credentials.
          </p>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAboutModalOpen(true)}
            className="bg-[#1A1A1A] hover:bg-[#2563EB] text-white px-9 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl cursor-pointer inline-flex items-center gap-2.5"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span>Explore ACFIT Academy</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          {/* Premium Large Cinematic Image Carousel */}
          <div className="w-full max-w-7xl mt-8 pt-4">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200/80 bg-stone-900 shadow-2xl group">
              <div className="h-[360px] sm:h-[500px] md:h-[580px] lg:h-[640px] w-full relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSlide}
                    src={carouselImages[currentSlide].src}
                    alt={carouselImages[currentSlide].title}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                {/* Modern Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none" />

                {/* Slide Caption Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-left z-10">
                  <div className="space-y-2 max-w-2xl">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#93C5FD] bg-[#2563EB]/20 border border-[#2563EB]/30 px-3 py-1 rounded-md inline-block">
                      MODULE HIGHLIGHT 0{currentSlide + 1} / 0{carouselImages.length}
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                      {carouselImages[currentSlide].title}
                    </h3>
                    <p className="text-sm sm:text-base text-stone-200 font-normal leading-relaxed">
                      {carouselImages[currentSlide].subtitle}
                    </p>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 pb-1">
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                      className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % carouselImages.length)}
                      className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md"
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === idx ? 'w-10 bg-[#2563EB]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── EXPLORE COURSES (HERO COLOR SYSTEM & HORIZONTAL SCROLL TRACK) ─── */}
      <section id="certifications" className="py-16 sm:py-24 relative z-10 border-b border-amber-200/80 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 40%, #FFE082 100%)' }}>
        <div id="courses-section" className="scroll-mt-24" />
        <div id="workshops" className="scroll-mt-24" />
        {/* Subtle dot pattern overlay for hero consistency */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:28px_28px] z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header with Horizontal Scroll Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-900/90 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                ACFIT ACADEMY PATHWAYS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                Explore Courses & Certifications
              </h2>
              <p className="text-xs sm:text-sm text-stone-700 font-medium">
                Scroll through ACFIT Academy's certifications and practical masterclasses.
              </p>
            </div>

            {/* Carousel Arrow Controls */}
            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              <span className="text-[11px] font-mono font-bold text-amber-900/60 uppercase tracking-widest hidden md:inline-block mr-2">
                SCROLL →
              </span>
              <button
                onClick={() => scrollCourses('left')}
                className="h-11 w-11 rounded-full border border-amber-300/80 bg-white/90 hover:bg-stone-900 hover:text-white text-stone-800 transition-all shadow-xs hover:shadow-md flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollCourses('right')}
                className="h-11 w-11 rounded-full border border-amber-300/80 bg-white/90 hover:bg-stone-900 hover:text-white text-stone-800 transition-all shadow-xs hover:shadow-md flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Track */}
          <div
            ref={coursesScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-4 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {(() => {
              // Tag style palette based on category or index
              const TAG_STYLES = [
                'bg-amber-100/90 text-amber-900 border-amber-300/80',
                'bg-emerald-100/90 text-emerald-900 border-emerald-300/80',
                'bg-orange-100/90 text-orange-900 border-orange-300/80',
                'bg-sky-100/90 text-sky-900 border-sky-300/80',
                'bg-violet-100/90 text-violet-900 border-violet-300/80',
                'bg-blue-100/90 text-blue-900 border-blue-300/80',
                'bg-rose-100/90 text-rose-900 border-rose-300/80',
                'bg-teal-100/90 text-teal-900 border-teal-300/80',
              ];

              // Fallback cover images based on index when custom thumbnail isn't provided
              const FALLBACK_COVERS = [coverCpt, coverCnc, coverSpecialist, coverWorkshop];

              // Real-time courses list from DB / store
              const rawCourses = activeCourses || [];

              if (coursesLoading) {
                return (
                  <div className="w-full py-12 text-center text-stone-600 font-medium text-sm flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                    <span>Syncing live programs from catalog...</span>
                  </div>
                );
              }

              if (rawCourses.length === 0) {
                return (
                  <div className="w-full py-12 px-6 rounded-2xl bg-white/80 border border-amber-200/80 text-center space-y-4 max-w-xl mx-auto shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 mx-auto flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#1A1A1A]">No Programs Currently Live</h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                      Our admissions team is preparing new certification cohorts and practical masterclasses in the admin panel. Check back soon or contact us for upcoming admissions!
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#2563EB] text-white text-xs font-bold rounded-full uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Inquire About Next Cohort
                      </button>
                    </div>
                  </div>
                );
              }

              return rawCourses.map((c, idx) => {
                const tagStyle = TAG_STYLES[idx % TAG_STYLES.length];
                const coverImg = c.thumbnail || FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
                const categoryBadge = (c.category || 'COURSE').toUpperCase();
                const categoryTag = `${String(idx + 1).padStart(2, '0')} — ${categoryBadge}`;
                const subtitle = [c.category, c.difficulty || 'Certification'].filter(Boolean).join(' · ');

                return (
                  <div
                    key={c.id || idx}
                    onClick={() => handleCourseAction(c.title)}
                    className="w-[310px] sm:w-[370px] shrink-0 snap-start bg-white/95 backdrop-blur-md border border-amber-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-2xl hover:border-[#1A1A1A] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Top Cover Image Box */}
                      <div className="relative rounded-xl border border-stone-200/80 overflow-hidden aspect-16/10 shadow-2xs group-hover:border-[#1A1A1A]/40 transition-colors">
                        <img
                          src={coverImg}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {categoryBadge}
                        </div>
                      </div>

                      {/* Category Pill Tag */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-md uppercase tracking-wider border ${tagStyle}`}>
                          {categoryTag}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-extrabold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {c.title}
                        </h3>
                        <div className="text-xs font-semibold text-stone-600">
                          {subtitle}
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed pt-1 line-clamp-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {c.description || 'Comprehensive training curriculum, lessons, assessments & certifications.'}
                        </p>
                      </div>
                    </div>

                    {/* Course Metadata Strip */}
                    <div className="pt-4 mt-5 border-t border-amber-100">
                      <div className="flex items-center justify-between text-[11px] font-medium text-stone-600">
                        <span>Duration: <strong className="text-stone-900 font-bold">{c.duration || 'Flexible'}</strong></span>
                        <span>Format: <strong className="text-stone-900 font-bold">{c.difficulty || 'Online'}</strong></span>
                      </div>
                    </div>

                  </div>
                );
              });
            })()}
          </div>

          {/* Bottom CTA Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                if (user) {
                  const isAdmin = String(user.role || '').toLowerCase() === 'admin';
                  navigate(isAdmin ? '/admin/courses' : '/app/courses');
                } else {
                  navigate('/app/courses');
                }
              }}
              className="bg-[#1A1A1A] hover:bg-[#2563EB] text-white px-9 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl cursor-pointer inline-flex items-center gap-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span>Explore All Courses</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </section>


      {/* ─── WHAT OUR STUDENTS SAY (TESTIMONIALS) ─── */}
      <section className="py-20 sm:py-28 bg-[#FAF9F5] border-t border-stone-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#2563EB]">
              ACFIT ACADEMY ALUMNI SUCCESS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#202124] tracking-tight">
              WHAT OUR STUDENTS SAY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(storeTestimonials && storeTestimonials.length > 0
              ? storeTestimonials.filter(t => t.is_active !== false)
              : [
                  {
                    quote: "The NASM CPT certification through ACFIT transformed my coaching career. The scientific foundation and practical modules gave me immediate confidence with clients.",
                    author: "Vikram Malhotra",
                    role: "Senior Fitness Coach, Mumbai",
                    cert: "ACFIT CFR PRO ALUMNI",
                    rating: 5
                  },
                  {
                    quote: "ACFIT's Nutrition Coach program is exceptionally well structured. The LMS video player and study guides made balancing learning with my work seamless.",
                    author: "Ananya Deshmukh",
                    role: "Sports Nutritionist, Bengaluru",
                    cert: "NASM CNC Alumni",
                    rating: 5
                  },
                  {
                    quote: "The hands-on corrective exercise workshops are unmatched in India. ACFIT sets the gold standard for fitness education.",
                    author: "Rahul Sharma",
                    role: "Head Strength Coach, Delhi",
                    cert: "CFR PRO Alumni",
                    rating: 5
                  }
                ]
            ).map((t, i) => (
              <div
                key={t.id || i}
                className="bg-white border border-stone-200 rounded-3xl p-8 flex flex-col justify-between shadow-xs hover:border-[#2563EB] transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900">— {t.author}</h4>
                    <p className="text-[11px] text-stone-500 font-medium">{t.role}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-[#2563EB]">
                    {t.cert}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─── FOOTER ─── */}
      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col items-center justify-between gap-6 pb-8 border-b border-stone-800">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <img src={acfitLogo || logoWebp} alt="ACFIT Academy" className="h-10 w-auto object-contain bg-white rounded-lg p-1" />
              <div className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-lg">
                <img src={nasmJpg} alt="NASM Logo" className="h-4 w-auto object-contain rounded-xs" />
                <img src={cfrPng} alt="CFR Logo" className="h-4 w-auto object-contain rounded-xs" />
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  OFFICIAL NASM & CFR INDIA PARTNER
                </span>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-6 font-mono font-medium tracking-wider text-stone-300">
              <button onClick={() => scrollToSection('certifications')} className="hover:text-white transition-colors cursor-pointer">
                Courses
              </button>
              <button onClick={() => scrollToSection('workshops')} className="hover:text-white transition-colors cursor-pointer">
                Workshops
              </button>
              <button onClick={() => setIsAboutModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
                About
              </button>
              <button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
                Support
              </button>
              <button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
                Privacy
              </button>
              <button onClick={() => setIsContactModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
                Terms
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-stone-500">
            <span>&copy; {new Date().getFullYear()} ACFIT Academy × NASM India. All rights reserved.</span>
            <span>Empowering Fitness Professionals Across India.</span>
          </div>

        </div>
      </footer>



      {/* ─── DIRECTORY MODAL ─── */}
      <AnimatePresence>
        {isDirectoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-200 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsDirectoryModalOpen(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-stone-400 hover:text-stone-800 transition-colors p-2.5 rounded-full hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#2563EB]" />
                  <h3 className="text-xl font-black text-stone-900">Certified Professional Directory</h3>
                </div>

                <p className="text-xs text-stone-600">
                  Search active NASM and ACFIT certified personal trainers and nutrition coaches across India.
                </p>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search by city (e.g. Mumbai, Delhi, Bengaluru) or trainer name..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Results List */}
                <div className="space-y-3 pt-2">
                  {filteredDirectory.map((prof, i) => (
                    <div key={i} className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-stone-900 truncate">{prof.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                            Verified
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-stone-400" /> {prof.city}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-semibold text-[#2563EB]">{prof.cert}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{prof.exp} Exp</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          info(`Requesting connection with ${prof.name}...`);
                          setIsDirectoryModalOpen(false);
                          setIsContactModalOpen(true);
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer w-full sm:w-auto text-center shrink-0"
                      >
                        Contact
                      </button>
                    </div>
                  ))}
                  {filteredDirectory.length === 0 && (
                    <div className="py-8 text-center text-xs text-stone-500 font-mono">
                      No certified professionals found matching "{directorySearch}".
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── CONTACT US & SUPPORT MODAL ─── */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200/80 shadow-2xl relative space-y-4 font-sans text-[#202124]"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#2E9B68] rounded-t-3xl" />

              <button
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">ACFIT Support & Inquiries</h3>
                    <p className="text-[11px] text-slate-500 font-medium">We respond within 24 business hours</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Have questions about NASM certifications, upcoming practical workshops, or corporate partnerships? Get in touch with our admissions team.
                </p>

                {enquirySuccess ? (
                  <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                      <Check className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Inquiry Received!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Thank you for reaching out to ACFIT Academy. Our admissions representative will be in touch shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Your Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={enquiryForm.name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-slate-50/50 transition-all text-[#202124]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-slate-50/50 transition-all text-[#202124]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Message / Query</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Ask us anything about courses, fees, or workshop dates..."
                        value={enquiryForm.message}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-slate-50/50 transition-all text-[#202124]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingEnquiry}
                      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmittingEnquiry ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                    </button>
                  </form>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-[#2563EB]" /> +91 (800) 555-ACFIT</span>
                  <span>support@acfitacademy.in</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── ABOUT ACFIT MODAL ─── */}
      <AnimatePresence>
        {isAboutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200/80 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 font-sans text-[#202124]"
            >
              {/* Subtle Ambient Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#2E9B68] rounded-t-3xl" />

              {/* Close Button */}
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer focus:outline-none"
                aria-label="Close modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Header Section */}
              <div className="space-y-3.5 pt-1">
                {/* Official Partner Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold tracking-wide border border-[#2563EB]/20">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                  <span>NASM INDIA & CFR OFFICIAL PARTNER</span>
                </div>

                {/* Main Heading */}
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  About ACFIT Academy
                </h3>

                {/* Partner Credentials Logo Bar */}
                <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <div className="h-9 px-3 bg-white rounded-xl shadow-2xs border border-slate-200/60 flex items-center justify-center shrink-0">
                    <img src={logoWebp} alt="ACFIT Logo" className="h-5 w-auto object-contain" />
                  </div>
                  <span className="text-slate-300 font-bold text-xs select-none">×</span>
                  <div className="h-9 px-3 bg-white rounded-xl shadow-2xs border border-slate-200/60 flex items-center justify-center shrink-0">
                    <img src={nasmJpg} alt="NASM Logo" className="h-4.5 w-auto object-contain" />
                  </div>
                  <div className="h-9 px-3 bg-white rounded-xl shadow-2xs border border-slate-200/60 flex items-center justify-center shrink-0">
                    <img src={cfrPng} alt="CFR Logo" className="h-4.5 w-auto object-contain" />
                  </div>
                </div>
              </div>

              {/* Description Intro */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                For over <strong className="text-slate-900 font-semibold">10+ years</strong>, ACFIT Academy has been at the forefront of fitness education in India. By partnering directly with the <strong className="text-slate-900 font-semibold">National Academy of Sports Medicine (NASM)</strong>, we empower aspiring and experienced trainers with internationally recognized certifications, scientific movement knowledge, and practical skills.
              </p>

              {/* Why Choose ACFIT Grid */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#2563EB]" />
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Why Choose ACFIT Academy?
                  </h4>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 font-bold">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-0.5">Global Credibility</h5>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                        NASM CPT & CNC credentials are respected globally across top health facilities & gyms.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 font-bold">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-0.5">Hands-On Mastery</h5>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                        Practical weekend workshops taught by industry master trainers and exercise veterans.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 font-bold">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 mb-0.5">Modern LMS Member Portal</h5>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                        24/7 access to HD video lesson modules, practice quizzes, and interactive slide decks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setIsAboutModalOpen(false);
                  setTimeout(() => {
                    navigate('/app/courses');
                  }, 150);
                }}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explore Certifications</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
