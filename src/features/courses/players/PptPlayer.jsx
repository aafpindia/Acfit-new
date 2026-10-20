import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../../components/ui/card';

export const PptPlayer = ({ content = {} }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasImageError, setHasImageError] = useState(false);
  const mediaObj = typeof content === 'string' ? { slides: [content] } : (content || {});
  const slides = (Array.isArray(mediaObj.slides) && mediaObj.slides.length > 0)
    ? mediaObj.slides
    : [
        mediaObj.fileUrl || mediaObj.url || mediaObj.pptUrl ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'
      ];

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
    <Card className="border-border overflow-hidden bg-white select-none">
      <CardContent className="p-5 space-y-4 font-sans">
        {/* Slide Viewport */}
        <div className="slide-image-container relative aspect-[16/10] bg-gradient-to-br from-[#1E3A8A] via-[#1E65B8] to-[#0B2535] rounded-xl border border-border overflow-hidden flex items-center justify-center text-white">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {!hasImageError && isDirectImage ? (
              <motion.img
                key={currentSlide}
                src={activeSlideSrc}
                alt={`Slide ${currentSlide + 1}`}
                onError={() => setHasImageError(true)}
                className="w-full h-full object-cover absolute inset-0"
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
                className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-br from-[#1E3A8A] to-[#0B2535] absolute inset-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                  <Image className="h-7 w-7 text-blue-200" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Slide Presentation {currentSlide + 1} of {slides.length}
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {mediaObj.title || `Presentation Slide ${currentSlide + 1}`}
                  </h3>
                  <p className="text-xs text-blue-100/80 max-w-sm mx-auto">
                    {mediaObj.instructions || 'Interactive presentation slide & document content.'}
                  </p>
                </div>
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

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
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
        )}
      </CardContent>
    </Card>
  );
};

export default PptPlayer;
