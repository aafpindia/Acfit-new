import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image, Presentation, Download, ExternalLink, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const PptPlayer = ({ content = {} }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasImageError, setHasImageError] = useState(false);
  const mediaObj = typeof content === 'string' ? { slides: [content] } : (content || {});

  const fileUrl = mediaObj.fileUrl || mediaObj.url || mediaObj.pptUrl || '';

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

  const slides = (Array.isArray(mediaObj.slides) && mediaObj.slides.length > 0)
    ? mediaObj.slides
    : (fileUrl ? [fileUrl] : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80']);

  const handleNext = () => {
    setDirection(1);
    setHasImageError(false);
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = () => {
    setDirection(-1);
    setHasImageError(false);
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const activeSlideSrc = slides[currentSlide];
  const isDirectImage = activeSlideSrc && (
    activeSlideSrc.startsWith('data:image') ||
    activeSlideSrc.match(/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i)
  );

  return (
    <Card className="border-border overflow-hidden bg-white select-none rounded-2xl shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4 font-sans">
        
        {/* If an iframe embed (Google Slides, Web PPT or PDF) is available */}
        {isIframeable ? (
          <div className="relative aspect-[16/10] min-h-[260px] sm:min-h-[380px] lg:min-h-[480px] bg-slate-900 rounded-xl border border-border overflow-hidden shadow-md">
            <iframe
              src={iframeSrc}
              title={mediaObj.title || 'Presentation Viewer'}
              className="w-full h-full min-h-[260px] sm:min-h-[380px] lg:min-h-[480px] border-0"
              allowFullScreen
            />
          </div>
        ) : (
          /* Slide Viewport */
          <div className="slide-image-container relative aspect-[16/10] min-h-[260px] sm:min-h-[380px] lg:min-h-[440px] bg-gradient-to-br from-[#1E3A8A] via-[#1E65B8] to-[#0B2535] rounded-xl border border-border overflow-hidden flex items-center justify-center text-white shadow-inner">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {!hasImageError && isDirectImage ? (
                <motion.img
                  key={currentSlide}
                  src={activeSlideSrc}
                  alt={`Slide ${currentSlide + 1}`}
                  onError={() => setHasImageError(true)}
                  className="w-full h-full object-contain absolute inset-0 bg-slate-950"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
                />
              ) : (
                <motion.div
                  key={`canvas-${currentSlide}`}
                  className="w-full h-full p-4 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 bg-gradient-to-br from-[#0F2042] via-[#1E3A8A] to-[#0F172A] absolute inset-0 overflow-y-auto"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg shrink-0">
                    <Presentation className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/15">
                      📊 SLIDE PRESENTATION DECK READY
                    </span>
                    <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                      {mediaObj.title || `Presentation Slide ${currentSlide + 1}`}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-blue-100/80 leading-relaxed line-clamp-3 sm:line-clamp-none">
                      {mediaObj.instructions || mediaObj.notes || 'Official course slide presentation deck and curriculum study manual.'}
                    </p>
                  </div>

                  {fileUrl && (
                    <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center gap-2 max-w-full">
                      <a
                        href={fileUrl}
                        download={mediaObj.fileName || `${mediaObj.title || 'course-presentation'}.pptx`}
                        className="py-2 px-3.5 sm:h-10 sm:px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer max-w-full text-center"
                      >
                        <Download className="h-4 w-4 shrink-0" />
                        <span className="truncate">Download PowerPoint (.pptx)</span>
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20 shadow-md"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentSlide === slides.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20 shadow-md"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide z-10">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>
        )}

        {/* Toolbar & Slide Indicators */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {slides.length > 1 ? (
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentSlide ? 1 : -1);
                    setCurrentSlide(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-6 bg-[#2563EB]'
                      : 'w-1.5 bg-slate-200 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          ) : <div />}

          {/* Action buttons (Download or open presentation) */}
          {fileUrl && (
            <div className="flex items-center gap-2">
              <a
                href={fileUrl}
                download={mediaObj.title || 'presentation'}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Open / Download Presentation</span>
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PptPlayer;
