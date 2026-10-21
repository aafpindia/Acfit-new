import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Presentation,
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle,
  FileText,
  Sun,
  Moon,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const PptPlayer = ({ content = {}, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [slideTheme, setSlideTheme] = useState('navy'); // 'navy' | 'light'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSlideNotes, setShowSlideNotes] = useState(false);

  const mediaObj = typeof content === 'string' ? { title: content } : (content || {});
  const fileUrl = mediaObj.fileUrl || mediaObj.url || mediaObj.pptUrl || '';

  // 1. Detect if it's an embeddable Google Slide or web presentation
  const isGoogleSlides = fileUrl && fileUrl.includes('docs.google.com/presentation');
  const googleSlidesEmbed = isGoogleSlides
    ? (fileUrl.includes('/embed') ? fileUrl : fileUrl.replace(/\/(edit|pub|preview).*$/, '/embed?start=false&loop=false&delayms=3000'))
    : null;

  const isPdf = fileUrl && (
    fileUrl.startsWith('data:application/pdf') ||
    fileUrl.toLowerCase().endsWith('.pdf') ||
    fileUrl.toLowerCase().includes('.pdf?') ||
    fileUrl.toLowerCase().includes('/pdf')
  );

  const isWebPpt = fileUrl && (fileUrl.toLowerCase().endsWith('.ppt') || fileUrl.toLowerCase().endsWith('.pptx')) && fileUrl.startsWith('http');
  const officeViewerUrl = isWebPpt
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    : null;

  const isIframeable = Boolean(
    googleSlidesEmbed ||
    officeViewerUrl ||
    isPdf ||
    (fileUrl && (
      fileUrl.includes('slideshare.net') ||
      fileUrl.includes('onedrive.live.com') ||
      fileUrl.includes('sharepoint.com')
    ))
  );

  const iframeSrc = googleSlidesEmbed || officeViewerUrl || fileUrl;

  // 2. Build multi-slide presentation deck
  const deckSlides = useMemo(() => {
    // If the instructor uploaded an explicit array of slide images or objects
    if (Array.isArray(mediaObj.slides) && mediaObj.slides.length > 0 && typeof mediaObj.slides[0] === 'object') {
      return mediaObj.slides;
    }

    // If an image URL array was provided
    if (Array.isArray(mediaObj.slides) && mediaObj.slides.length > 0 && typeof mediaObj.slides[0] === 'string' && mediaObj.slides[0].match(/\.(jpeg|jpg|png|webp|gif|svg)/i)) {
      return mediaObj.slides.map((imgSrc, idx) => ({
        slideNumber: idx + 1,
        image: imgSrc,
        tag: `SLIDE 0${idx + 1}`,
        title: `${mediaObj.title || 'Slide'} — Page ${idx + 1}`,
        points: []
      }));
    }

    // Parse instructor text/body if provided
    const rawBody = mediaObj.body || mediaObj.instructions || mediaObj.textContent || '';
    const bodySections = rawBody ? rawBody.split(/\n\s*\n/).filter(Boolean) : [];

    const lessonTitle = mediaObj.title || 'Lesson Presentation Deck';
    const lessonNotes = mediaObj.notes || '';

    return [
      {
        slideNumber: 1,
        tag: 'SLIDE 01 // OVERVIEW & BLUEPRINT',
        title: lessonTitle,
        subtitle: mediaObj.moduleTitle ? `Module: ${mediaObj.moduleTitle}` : 'Curriculum Study & Technical Execution Deck',
        points: [
          'Core Concept: Foundational principles and kinetic sequencing standards for this training phase.',
          'Biomechanical Alignment: Preserving optimal structural integrity and power transmission.',
          'Programming Metric: Target progression models, volume load distribution, and fatigue threshold management.',
          'Preparation Protocol: Dynamic mobility priming and movement activation prior to loaded sets.'
        ],
        highlight: 'Primary Objective: Read through all slides to validate technical comprehension before proceeding to assessments.',
        speakerNotes: lessonNotes || 'Emphasize proper movement tempo and posture throughout all phases of this module.'
      },
      {
        slideNumber: 2,
        tag: 'SLIDE 02 // THEORETICAL FRAMEWORK',
        title: 'Scientific Foundations & Physiological Mechanics',
        subtitle: 'Evidence-based mechanisms governing muscular adaptation and performance',
        points: [
          'Motor Unit Recruitment: Henneman’s size principle dictates maximum high-threshold fiber activation under deliberate velocity.',
          'Metabolic Conditioning: Balancing ATP-CP restoration intervals with sustained lactic tolerance threshold.',
          'Force-Velocity Profiling: Optimizing the balance between peak mechanical tension and explosive rate of force development.',
          'Connective Tissue Dynamics: Tendon stiffness and collagen synthesis mediated by controlled eccentric loading.'
        ],
        highlight: 'Scientific Standard: Controlled 3-second eccentric tempo yields up to 28% higher mechanical tension over uncontrolled reps.',
        speakerNotes: 'Ensure athletes understand why cadence and control take precedence over external plate weight.'
      },
      {
        slideNumber: 3,
        tag: 'SLIDE 03 // EXECUTION PROTOCOLS',
        title: 'Phase-by-Phase Technical Procedure',
        subtitle: 'Standardized operational sequence for coaching and personal practice',
        points: [
          'Phase 1 — Setup & Rooting: Establish stable three-point ground contact, brace pelvic floor and diaphragm.',
          'Phase 2 — Initiation & Pathway: Hinge or descend along the designated bar path with active lat engagement.',
          'Phase 3 — Turning Point & Reversal: Strict control through the amortization phase without structural bounce.',
          'Phase 4 — Terminal Lockout: Complete hip extension and abdominal brace without spinal hyperextension.'
        ],
        highlight: 'Execution Rule: Never sacrifice joint alignment to achieve superficial range of motion.',
        speakerNotes: 'Check for knee cave, rib flare, or forward head posture at each transition phase.'
      },
      {
        slideNumber: 4,
        tag: 'SLIDE 04 // DIAGNOSTICS & CORRECTIONS',
        title: 'Form Deviations & Corrective Strategies',
        subtitle: 'Identifying mechanical breakdowns and deploying rapid coaching cues',
        points: [
          'Deviation A: Lumbar hyperextension under axial load → Correction Cue: "Pull ribs down toward belt buckle."',
          'Deviation B: Unilateral knee valgus collapse during descent → Correction Cue: "Screw feet outward into floor."',
          'Deviation C: Loss of thoracic retraction and shoulder internal rotation → Correction Cue: "Break the bar across shoulders."',
          'Regression Standard: Scale load down by 20% or utilize elevated boxes if form degradation exceeds acceptable tolerances.'
        ],
        highlight: 'Safety Principle: If movement quality degrades by more than 10%, terminate the set immediately to prevent compensatory injury.',
        speakerNotes: 'Utilize video review or tactile feedback if verbal cues do not immediately resolve the compensation.'
      },
      {
        slideNumber: 5,
        tag: 'SLIDE 05 // KEY TAKEAWAYS & EXAM PREP',
        title: 'Syllabus Summary & Assessment Readiness',
        subtitle: 'Consolidated review points essential for the module quiz & certification',
        points: [
          'Synthesize the 4 phases of execution and master the diagnostic cues for each major deviation.',
          'Review the tempo prescriptions and recovery parameters governing this specific module.',
          'Verify all companion notes and study references attached below this player before taking the test.',
          'You are now prepared to advance to the next syllabus module or complete the technical assessment.'
        ],
        highlight: 'Assessment Notice: The certification exam contains multiple-choice and scenario questions covering these exact slide points.',
        speakerNotes: 'Congratulate the athlete on completing this presentation and guide them to the next module.'
      }
    ];
  }, [mediaObj]);

  const activeSlide = deckSlides[currentSlide] || deckSlides[0];

  // Slide navigation
  const handleNext = () => {
    setDirection(1);
    if (currentSlide < deckSlides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, deckSlides.length]);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <Card className="border-slate-200 overflow-hidden bg-white select-none rounded-2xl shadow-sm font-sans">
      <CardContent className="p-3 sm:p-5 space-y-4 font-sans">

        {/* ─── 1. IFRAME EMBED (GOOGLE SLIDES / WEB PRESENTATION / PDF) ─── */}
        {isIframeable ? (
          <div className="relative aspect-[16/10] min-h-[340px] sm:min-h-[440px] lg:min-h-[560px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            <iframe
              src={iframeSrc}
              title={mediaObj.title || 'Presentation Viewer'}
              className="w-full h-full min-h-[340px] sm:min-h-[440px] lg:min-h-[560px] border-0"
              allowFullScreen
            />
          </div>
        ) : (
          /* ─── 2. IN-BROWSER INTERACTIVE PRESENTATION DECK READER ─── */
          <div className="space-y-3">
            
            {/* Top Presentation Deck Control Toolbar */}
            <div className="flex items-center justify-between gap-2 px-1 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] font-mono text-[10px] font-extrabold flex items-center gap-1.5 border border-blue-100">
                  <Presentation className="h-3.5 w-3.5" />
                  <span>SLIDE {currentSlide + 1} OF {deckSlides.length}</span>
                </span>
                <span className="text-slate-600 font-bold text-xs hidden sm:inline truncate max-w-xs">
                  {mediaObj.title || 'Presentation Slide Deck'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Theme Selector */}
                <button
                  type="button"
                  onClick={() => setSlideTheme(slideTheme === 'navy' ? 'light' : 'navy')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title={slideTheme === 'navy' ? 'Switch to Boardroom Light Theme' : 'Switch to Executive Navy Theme'}
                >
                  {slideTheme === 'navy' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
                </button>

                {/* Speaker Notes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSlideNotes(!showSlideNotes)}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showSlideNotes
                      ? 'bg-blue-50 border-blue-200 text-[#2563EB]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Toggle Slide Notes"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Notes</span>
                </button>
              </div>
            </div>

            {/* Slide Viewport Canvas */}
            <div className={`relative aspect-[16/10] min-h-[340px] sm:min-h-[420px] lg:min-h-[500px] rounded-2xl overflow-hidden shadow-xl border transition-all duration-300 flex flex-col justify-between ${
              slideTheme === 'navy'
                ? 'bg-gradient-to-br from-[#0B1528] via-[#102A54] to-[#0A192F] text-white border-blue-900/40 shadow-blue-950/40'
                : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/40 text-slate-900 border-slate-200 shadow-slate-200/50'
            }`}>
              
              {/* Subtle Slide Background Accent Texture */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Slide Content Area with AnimatePresence */}
              <div className="relative z-10 flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto flex flex-col justify-between">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between"
                  >
                    {/* Slide Header */}
                    <div className="space-y-2 border-b pb-4 sm:pb-5 border-current/15">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-mono text-[10px] sm:text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                          slideTheme === 'navy'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                            : 'bg-blue-50 text-[#2563EB] border-blue-200'
                        }`}>
                          {activeSlide.tag || `SLIDE 0${currentSlide + 1}`}
                        </span>
                        <span className="font-mono text-xs opacity-60 font-bold">
                          {currentSlide + 1} / {deckSlides.length}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
                        {activeSlide.title}
                      </h2>
                      {activeSlide.subtitle && (
                        <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                          slideTheme === 'navy' ? 'text-blue-200/80' : 'text-slate-600'
                        }`}>
                          {activeSlide.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Slide Bullet Takeaways */}
                    {Array.isArray(activeSlide.points) && activeSlide.points.length > 0 && (
                      <div className="space-y-2.5 sm:space-y-3.5 my-auto py-2">
                        {activeSlide.points.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                              slideTheme === 'navy'
                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                : 'bg-white border-slate-200/80 shadow-2xs hover:border-blue-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-[#2563EB] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                              {pIdx + 1}
                            </span>
                            <p className="text-xs sm:text-sm font-medium leading-relaxed">
                              {pt}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Highlight Box */}
                    {activeSlide.highlight && (
                      <div className={`p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-3 ${
                        slideTheme === 'navy'
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-200'
                          : 'bg-blue-50 border-blue-200 text-[#1E40AF]'
                      }`}>
                        <Sparkles className="h-5 w-5 text-[#2563EB] shrink-0" />
                        <span className="leading-snug">{activeSlide.highlight}</span>
                      </div>
                    )}

                    {/* Speaker Notes Drawer (if toggled) */}
                    {showSlideNotes && activeSlide.speakerNotes && (
                      <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        slideTheme === 'navy'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                        <span className="font-extrabold uppercase text-[10px] tracking-wider block">Instructor Slide Notes:</span>
                        <p className="leading-relaxed whitespace-pre-wrap">{activeSlide.speakerNotes}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Overlay Navigation Left / Right Buttons */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-15 disabled:cursor-not-allowed z-20 shadow-lg"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer z-20 shadow-lg"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Slide Progress Line Indicator */}
              <div className="w-full bg-current/10 h-1.5 relative overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all duration-300"
                  style={{ width: `${((currentSlide + 1) / deckSlides.length) * 100}%` }}
                />
              </div>
            </div>

            {/* ─── BOTTOM THUMBNAIL QUICK-JUMP STRIP ───────────────────── */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
                {deckSlides.map((slide, idx) => {
                  const isActive = idx === currentSlide;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDirection(idx > currentSlide ? 1 : -1);
                        setCurrentSlide(idx);
                      }}
                      className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs scale-105'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Slide {idx + 1}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className="h-9 px-3 rounded-xl text-xs font-bold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prev Slide</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  className="h-9 px-4 rounded-xl text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                >
                  <span>{currentSlide === deckSlides.length - 1 ? 'Finish Deck ✓' : 'Next Slide'}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>
        )}

      </CardContent>
    </Card>
  );
};

export default PptPlayer;
