import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  Layers,
  CheckCircle,
  Eye,
  Bookmark
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const PdfPlayer = ({ content = {}, onComplete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [readingTheme, setReadingTheme] = useState('white'); // 'white' | 'sepia' | 'dark'
  const [viewMode, setViewMode] = useState('embed'); // 'embed' | 'reader'

  const rawFileUrl = content.fileUrl || content.url || content.pdfUrl || '';
  const isDirectPdf = Boolean(
    rawFileUrl && (
      rawFileUrl.startsWith('data:application/pdf') ||
      rawFileUrl.toLowerCase().endsWith('.pdf') ||
      rawFileUrl.toLowerCase().includes('.pdf?') ||
      rawFileUrl.toLowerCase().includes('/pdf')
    )
  );

  // Default to reader mode if there's no direct PDF fileUrl, or embed if there is
  const activeView = isDirectPdf ? viewMode : 'reader';

  const documentPages = useMemo(() => {
    const rawBody = content.body || content.instructions || content.textContent || '';
    const bodySections = rawBody ? rawBody.split(/\n\s*\n/).filter(Boolean) : [];
    const lessonTitle = content.title || 'Official Curriculum Document';
    const lessonNotes = content.notes || '';

    return [
      {
        pageNumber: 1,
        title: `${lessonTitle} — Section 1: Curriculum Blueprint`,
        chapter: 'CHAPTER 01 // OVERVIEW & OBJECTIVES',
        summary: 'Official syllabus guidelines, technical prerequisites, and learning roadmap.',
        paragraphs: [
          'This technical syllabus document defines the mechanical, physiological, and programming standards required for this learning phase. All athletes and coaches are required to read through each section carefully prior to undertaking assessments.',
          'The core objective of this curriculum module is to bridge foundational biomechanical theory with safe, reproducible gym-floor execution.',
          'Key Learning Targets: Understand kinetic chain sequencing, maintain strict postural alignment under load, and apply standardized tempo prescriptions.'
        ],
        checklist: [
          'Verify baseline readiness and joint mobilization prior to session onset.',
          'Maintain neutral spinal alignment throughout all compound movement patterns.',
          'Document training loads and session volume for subsequent periodization cycles.'
        ],
        keyTakeaway: 'Mastering the fundamental movement patterns reduces injury incidence by over 40% in high-volume training blocks.'
      },
      {
        pageNumber: 2,
        title: 'Section 2: Biomechanical Foundations & Kinetic Principles',
        chapter: 'CHAPTER 02 // SCIENTIFIC MECHANICS',
        summary: 'Evidence-based mechanisms governing muscular adaptation and movement mechanics.',
        paragraphs: [
          'Joint mechanics under load rely on balanced co-contraction of agonist and antagonist muscle groups. In compound resistance exercises, the preservation of spinal neutrality is mediated by intra-abdominal pressure generated through diaphragmatic bracing.',
          'The length-tension relationship dictates that optimal cross-bridge formation occurs within intermediate sarcomere ranges. Over-stretching or hyper-shortening diminishes force generation capacity.',
          'Controlled eccentric phases (3-second descent) elevate mechanical tension, fostering greater satellite cell proliferation and structural tendon reinforcement compared to uncontrolled rapid repetitions.'
        ],
        checklist: [
          'Execute deliberate diaphragmatic bracing before initiating axial loads.',
          'Prioritize joint alignment over external barbell or dumbbell poundage.',
          'Adhere strictly to the prescribed 3-1-1 tempo protocol across all primary sets.'
        ],
        keyTakeaway: 'Eccentric tempo control preserves connective tissue health while optimizing force-velocity adaptations.'
      },
      {
        pageNumber: 3,
        title: 'Section 3: Execution Protocols & Phase Breakdown',
        chapter: 'CHAPTER 03 // PROCEDURAL ROADMAP',
        summary: 'Standardized operational procedures for structured session delivery.',
        paragraphs: [
          'Phase 1 (Preparation): Dynamic joint mobility drills targeting the thoracic spine, hips, and ankle complexes. Activate posterior chain stabilizers with isometric holds.',
          'Phase 2 (Primary Compounds): Implement multi-joint exercises adhering strictly to bar path discipline. Ensure full lockout without compensatory hyperextension.',
          'Phase 3 (Accessory Volume): Deploy unilateral movements to mitigate bilateral asymmetries, improve rotary stability, and reinforce scapular control.',
          'Phase 4 (Down-Regulation): Parasympathetic recovery protocols including nasal diaphragmatic breathing and gentle passive tissue decompression.'
        ],
        checklist: [
          'Complete all 4 phases sequentially without skipping the preparation priming.',
          'Rest intervals must strictly mirror the programmed ATP-CP restoration guidelines.',
          'Log RPE (Rate of Perceived Exertion) at the conclusion of each primary exercise.'
        ],
        keyTakeaway: 'Structured phase progression guarantees consistent progressive overload without cumulative joint degradation.'
      },
      {
        pageNumber: 4,
        title: 'Section 4: Diagnostic Form Checks & Corrections',
        chapter: 'CHAPTER 04 // COACHING CUES & SAFETY',
        summary: 'Detecting movement compensations and deploying rapid real-time corrections.',
        paragraphs: [
          'Movement degradation often stems from fatigue, inadequate mobility, or excessive external loading. Coaches and athletes must monitor primary joint angles at terminal transition points.',
          'Lumbar Flexion under Load: Cease repetition immediately. Regression strategy involves elevating the starting pins or employing block pulls.',
          'Knee Valgus on Descent: Deploy resistance loop bands above the patella to cue active hip abduction and external rotator torque.',
          'Loss of Scapular Retraction: Reduce working weight by 15% and cue "packing shoulder blades down into back pockets."'
        ],
        checklist: [
          'Terminate sets if movement form deviates by more than 10% from baseline standards.',
          'Never permit ballistic rebounding through vulnerable articular joint ranges.',
          'Re-test movement mobility screens weekly to monitor progressive adaptation.'
        ],
        keyTakeaway: 'Correcting form deficiencies early prevents chronic overuse tendinopathies and maximizes long-term athletic longevity.'
      },
      {
        pageNumber: 5,
        title: 'Section 5: Summary Checklist & Assessment Readiness',
        chapter: 'CHAPTER 05 // EXAM VALIDATION',
        summary: 'Final checklist and essential study points for the certification exam.',
        paragraphs: [
          'You have completed the core reading material for this lesson. Synthesize the physiological mechanisms, phase sequences, and coaching diagnostic cues detailed across all preceding chapters.',
          'Review the companion notes provided by the instructor below this player for specific cohort announcements and regional standards.',
          'Ensure all syllabus items within this module are marked complete to unlock the final certification exam.'
        ],
        checklist: [
          'Review tempo standards (3-1-1) and diaphragmatic bracing mechanics.',
          'Memorize the 4 distinct execution phases of progressive training sessions.',
          'Confirm that all lessons in this module display a completed green checkmark.'
        ],
        keyTakeaway: 'You are now fully prepared to complete the knowledge checks and take the Certificate Exam.'
      }
    ];
  }, [content]);

  const totalPages = documentPages.length;
  const activeDocPage = documentPages[currentPage - 1] || documentPages[0];

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const themeClasses = {
    white: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#FBF0D9] text-[#433422] border-[#E8D7B8]',
    dark: 'bg-slate-900 text-slate-100 border-slate-800'
  };

  return (
    <Card className="border-slate-200 bg-slate-100/70 p-3 sm:p-5 space-y-4 select-none font-sans rounded-2xl shadow-sm">
      
      {/* ─── CONTROLS TOOLBAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs">
        
        {/* Left: Page Navigator */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-1 h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
          <span className="font-extrabold select-none text-slate-800 text-xs sm:text-sm px-1">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1 h-8 w-8 rounded-lg"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Center: View Mode Toggle if direct PDF is attached */}
        {isDirectPdf && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('embed')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'embed'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5 inline mr-1" />
              <span>Embedded PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reader')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'reader'
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 inline mr-1" />
              <span>Reader Mode</span>
            </button>
          </div>
        )}

        {/* Right: Reading Theme & Zoom Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Reading Theme Selector */}
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2 sm:pr-3">
            <button
              type="button"
              onClick={() => setReadingTheme('white')}
              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                readingTheme === 'white' ? 'ring-2 ring-[#2563EB] border-slate-300 bg-white' : 'border-slate-200 bg-white opacity-60'
              }`}
              title="White Paper Theme"
            />
            <button
              type="button"
              onClick={() => setReadingTheme('sepia')}
              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                readingTheme === 'sepia' ? 'ring-2 ring-[#2563EB] border-[#E8D7B8] bg-[#FBF0D9]' : 'border-[#E8D7B8] bg-[#FBF0D9] opacity-60'
              }`}
              title="Sepia Eye-Care Theme"
            />
            <button
              type="button"
              onClick={() => setReadingTheme('dark')}
              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                readingTheme === 'dark' ? 'ring-2 ring-[#2563EB] border-slate-600 bg-slate-900' : 'border-slate-600 bg-slate-900 opacity-60'
              }`}
              title="Night Reading Theme"
            />
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setZoomPercent(p => Math.max(75, p - 15))} className="p-1 h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="font-bold text-slate-700 text-xs select-none w-10 text-center">{zoomPercent}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoomPercent(p => Math.min(150, p + 15))} className="p-1 h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoomPercent(100)} className="p-1 h-8 w-8 text-slate-500 hidden sm:inline-flex" title="Reset Zoom">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── PDF DOCUMENT VIEWPORT CANVAS ─── */}
      {activeView === 'embed' && isDirectPdf ? (
        <div className="rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 h-[520px] sm:h-[620px] lg:h-[720px] shadow-md">
          <iframe
            src={rawFileUrl}
            className="w-full h-full border-0"
            title={content.title || 'PDF Document Reader'}
          />
        </div>
      ) : (
        /* ─── INTERACTIVE INLINE DOCUMENT & HANDBOOK READER ─── */
        <div className="overflow-auto max-h-[680px] p-2 sm:p-4 bg-slate-200/50 rounded-2xl border border-slate-300 flex justify-center">
          <div
            className={`w-full max-w-3xl rounded-2xl p-6 sm:p-10 lg:p-12 shadow-lg border transition-all duration-200 space-y-6 ${themeClasses[readingTheme]}`}
            style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top center' }}
          >
            {/* Document Header */}
            <div className="border-b pb-5 border-current/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] uppercase tracking-wider">
                  {activeDocPage.chapter}
                </span>
                <span className="opacity-60 text-[11px]">
                  PAGE {currentPage} OF {totalPages}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug">
                {activeDocPage.title}
              </h1>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-medium">
                {activeDocPage.summary}
              </p>
            </div>

            {/* Document Paragraphs */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-serif">
              {activeDocPage.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed opacity-90 indent-3 sm:indent-5">
                  {p}
                </p>
              ))}
            </div>

            {/* Document Checklist Guidelines */}
            {Array.isArray(activeDocPage.checklist) && (
              <div className="p-4 sm:p-5 rounded-xl border border-current/20 bg-current/5 space-y-3 font-sans">
                <span className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-[#2563EB]" />
                  <span>Mandatory Protocol Checklist</span>
                </span>
                <div className="space-y-2">
                  {activeDocPage.checklist.map((item, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaway Callout */}
            {activeDocPage.keyTakeaway && (
              <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-950 font-sans text-xs sm:text-sm font-semibold flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span className="leading-snug">{activeDocPage.keyTakeaway}</span>
              </div>
            )}

            {/* Document Page Footer */}
            <div className="border-t pt-4 border-current/15 flex items-center justify-between text-[11px] font-mono opacity-60 font-medium">
              <span>ACFIT ACADEMY OFFICIAL STUDY HANDBOOK</span>
              <span>SECTION {currentPage} // VERIFIED BLUEPRINT</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM QUICK JUMP PAGINATION BAR ─── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {documentPages.map((page, idx) => {
            const isActive = idx + 1 === currentPage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx + 1)}
                className={`h-8 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Page {idx + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-8 px-3 rounded-xl text-xs font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev Page</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleNextPage}
            className="h-8 px-4 rounded-xl text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <span>{currentPage === totalPages ? 'Finish Reading ✓' : 'Next Page'}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </Card>
  );
};

export default PdfPlayer;
