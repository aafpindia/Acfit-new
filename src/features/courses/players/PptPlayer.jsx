import React, { useState, useEffect, useCallback } from 'react';
import { DocumentCanvasViewbox } from './DocumentCanvasViewbox';
import { Presentation, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export const PptPlayer = ({ content = {}, onComplete, onProgressChange, allowSkip = false }) => {
  const mediaObj = typeof content === 'string' ? { title: content } : (content || {});
  const fileUrl = mediaObj.pdfUrl || mediaObj.fileUrl || mediaObj.url || mediaObj.pptUrl || '';
  const lessonTitle = mediaObj.title || 'Lesson Presentation';

  // 1. Detect if it's a Google Slides embed link
  const isGoogleSlides = fileUrl && fileUrl.includes('docs.google.com/presentation');
  const googleSlidesEmbed = isGoogleSlides
    ? (fileUrl.includes('/embed') ? fileUrl : fileUrl.replace(/\/(edit|pub|preview).*$/, '/embed?start=false&loop=false&delayms=3000'))
    : null;

  // 2. Detect if it's a PDF (direct PDF or converted from PPTX on upload)
  const isPdfOrConverted = Boolean(
    fileUrl && (
      fileUrl.startsWith('data:application/pdf') ||
      fileUrl.toLowerCase().endsWith('.pdf') ||
      fileUrl.toLowerCase().includes('.pdf?') ||
      mediaObj.isConverted ||
      mediaObj.pdfUrl
    )
  );

  const textBody = mediaObj.body || mediaObj.instructions || mediaObj.textContent || '';

  // 3. Render via HTML5 Canvas Viewbox (Gold Standard: Clean, No Downloads, Native Feel)
  if (isPdfOrConverted) {
    return (
      <DocumentCanvasViewbox
        fileUrl={mediaObj.pdfUrl || fileUrl}
        title={lessonTitle}
        fallbackContent={textBody}
        isPresentation={true}
        onComplete={onComplete}
        onProgressChange={onProgressChange}
        allowSkip={allowSkip}
      />
    );
  }

  // 4. Render Google Slides in clean frame without download controls
  if (googleSlidesEmbed) {
    return (
      <div className="relative aspect-[16/10] min-h-[360px] sm:min-h-[460px] lg:min-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl select-none">
        <iframe
          src={googleSlidesEmbed}
          title={lessonTitle}
          className="w-full h-full border-0"
          allowFullScreen
        />
      </div>
    );
  }

  // 5. If instructor uploaded a set of slide image frames (array of image URLs)
  if (Array.isArray(mediaObj.slides) && mediaObj.slides.length > 0) {
    return (
      <ImageSlideDeckPlayer
        slides={mediaObj.slides}
        title={lessonTitle}
        onComplete={onComplete}
        onProgressChange={onProgressChange}
        allowSkip={allowSkip}
      />
    );
  }

  // 6. Fallback if it's a direct unconverted PPT/PPTX URL:
  if (fileUrl) {
    return (
      <DocumentCanvasViewbox
        fileUrl={fileUrl}
        title={lessonTitle}
        fallbackContent={textBody}
        isPresentation={true}
        onComplete={onComplete}
        onProgressChange={onProgressChange}
        allowSkip={allowSkip}
      />
    );
  }
  if (textBody) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
            <Presentation className="h-4 w-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {lessonTitle}
          </h2>
        </div>
        <CardContent className="p-6 sm:p-10 max-w-4xl mx-auto space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {textBody}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-2">
      <Presentation className="h-8 w-8 text-slate-400 mx-auto" />
      <h3 className="text-sm font-bold text-slate-800">No Presentation Attached</h3>
      <p className="text-xs text-slate-500">
        This presentation lesson does not have a slide deck attached yet.
      </p>
    </div>
  );
};

/**
 * Clean Slide Deck Player for slide image arrays
 */
const ImageSlideDeckPlayer = ({ slides = [], title, onComplete, onProgressChange, allowSkip = false }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [maxReachedIdx, setMaxReachedIdx] = useState(0);
  const total = slides.length;

  useEffect(() => {
    setCurrentIdx(0);
    setMaxReachedIdx(0);
  }, [title, total]);

  const goPrevSlide = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  }, []);

  const goNextSlide = useCallback(() => {
    setCurrentIdx((i) => {
      const next = Math.min(total - 1, i + 1);
      setMaxReachedIdx((m) => Math.max(m, next));
      return next;
    });
  }, [total]);

  const goToSlide = useCallback(
    (targetIdx) => {
      if (!allowSkip && targetIdx > maxReachedIdx) return;
      const clamped = Math.max(0, Math.min(total - 1, targetIdx));
      setCurrentIdx(clamped);
      setMaxReachedIdx((m) => Math.max(m, clamped));
    },
    [allowSkip, maxReachedIdx, total]
  );

  useEffect(() => {
    if (typeof onProgressChange === 'function') {
      onProgressChange({
        currentPage: currentIdx + 1,
        totalPages: total,
        maxReachedPage: maxReachedIdx + 1,
        isPresentation: true,
        isLoading: false,
        allViewed: total === 0 || maxReachedIdx >= total - 1,
        prevPage: goPrevSlide,
        nextPage: goNextSlide,
        goToPage: (p) => goToSlide(p - 1),
      });
    }
  }, [currentIdx, maxReachedIdx, total, goPrevSlide, goNextSlide, goToSlide, onProgressChange]);

  useEffect(() => {
    if (typeof onProgressChange !== 'function' && total > 1 && currentIdx === total - 1 && maxReachedIdx >= total - 1) {
      onComplete?.();
    }
  }, [currentIdx, maxReachedIdx, total, onComplete, onProgressChange]);

  const activeSlide = slides[currentIdx];
  const imgSrc = typeof activeSlide === 'string' ? activeSlide : activeSlide?.image || activeSlide?.url;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-[#0F141C] text-slate-100 shadow-2xl select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Bar */}
      <div className="h-12 bg-[#161C26] border-b border-slate-800/80 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-[#3B82F6]" />
          <span className="font-bold text-white truncate max-w-xs">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevSlide}
            disabled={currentIdx <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs font-semibold">
            {currentIdx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={goNextSlide}
            disabled={currentIdx >= total - 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide Canvas Frame */}
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[420px] sm:min-h-[540px] bg-[#0A0D13]">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Slide ${currentIdx + 1}`}
            className="max-h-[600px] w-auto object-contain rounded-lg shadow-xl pointer-events-none"
          />
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">Slide preview unavailable</div>
        )}
      </div>

      {/* Simple Sequential Slide Navigation Footer (no forward skipping) */}
      {total > 1 && (
        <div className="h-12 bg-[#161C26] border-t border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-3 text-xs shrink-0">
          <button
            type="button"
            onClick={goPrevSlide}
            disabled={currentIdx <= 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev Slide</span>
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[55%] scrollbar-none">
            {slides.map((_, idx) => {
              const isCurrent = currentIdx === idx;
              const isReached = allowSkip || idx <= maxReachedIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isReached}
                  onClick={() => goToSlide(idx)}
                  className={`h-2 rounded-full transition-all shrink-0 ${
                    isCurrent
                      ? 'w-6 bg-[#3B82F6] cursor-pointer'
                      : isReached
                      ? 'w-2 bg-emerald-500/80 hover:bg-emerald-400 cursor-pointer'
                      : 'w-2 bg-slate-700/70 opacity-50 cursor-not-allowed'
                  }`}
                  title={isReached ? `Slide ${idx + 1}` : `View slide ${idx} first`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNextSlide}
            disabled={currentIdx >= total - 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              currentIdx >= total - 1
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer shadow-xs'
            }`}
          >
            <span>{currentIdx >= total - 1 ? 'Last Slide ✓' : 'Next Slide'}</span>
            {currentIdx < total - 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default PptPlayer;
