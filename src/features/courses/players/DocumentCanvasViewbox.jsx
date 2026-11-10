import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { findCachedDocument } from '../../../services/fileUploadService';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  FileText,
  Presentation,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Configure Mozilla PDF.js Worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch (_) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  }
}

/**
 * High-Fidelity In-Browser Document & Presentation Canvas Viewbox
 *
 * Renders PDFs directly onto HTML5 canvas with zero browser download buttons,
 * parses and presents PPTX slides with native client-side fidelity, and eliminates
 * worker thread "Unexpected server response (0)" sandbox errors.
 */
export const DocumentCanvasViewbox = ({
  fileUrl,
  title = 'Document Content',
  fallbackContent = '',
  isPresentation = false,
  onComplete,
  onProgressChange,
  allowSkip = false,
  className = ''
}) => {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pptxSlides, setPptxSlides] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxReachedPage, setMaxReachedPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.15);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to convert base64 Data URL to Uint8Array safely
  const dataUrlToUint8Array = (dataUrl) => {
    try {
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const cleanBase64 = (base64 || '').trim().replace(/\s/g, '');
      const binary = atob(cleanBase64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.warn('[DocumentCanvasViewbox] Data URL decode notice:', e?.message || e);
      return null;
    }
  };

  // Helper to extract slides from a PPTX (zip) buffer
  const parsePptxBuffer = async (uint8Array) => {
    const zip = await JSZip.loadAsync(uint8Array);
    const slideFileNames = [];
    zip.forEach((path) => {
      if (/^ppt\/slides\/slide\d+\.xml$/i.test(path)) {
        slideFileNames.push(path);
      }
    });

    slideFileNames.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

    const slides = [];
    for (let i = 0; i < slideFileNames.length; i++) {
      const xmlStr = await zip.file(slideFileNames[i]).async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
      const pElements = xmlDoc.getElementsByTagName('a:p');
      const lines = [];

      for (let p = 0; p < pElements.length; p++) {
        const tElements = pElements[p].getElementsByTagName('a:t');
        let line = '';
        for (let t = 0; t < tElements.length; t++) {
          line += tElements[t].textContent || '';
        }
        const trimmed = line.trim();
        if (trimmed) lines.push(trimmed);
      }

      slides.push({
        slideNumber: i + 1,
        title: lines[0] || `Slide ${i + 1}`,
        points: lines.slice(1),
        allLines: lines
      });
    }

    return slides;
  };

  // Helper to parse text into clean presentation slide cards
  const parseTextIntoSlides = (text, defaultTitle) => {
    if (!text || typeof text !== 'string') return [];
    const clean = text.trim();
    if (!clean) return [];

    const rawSections = clean
      .split(/\n\s*---\s*\n|\n(?=Slide \d+:?)|(?=### )/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const sections = rawSections.length > 0 ? rawSections : [clean];

    return sections.map((sec, idx) => {
      const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
      const titleLine = lines[0]?.replace(/^#+\s*/, '') || `${defaultTitle || 'Slide'} ${idx + 1}`;
      const points = lines.slice(1).map((l) => l.replace(/^[-*•]\s*/, ''));
      return {
        slideNumber: idx + 1,
        title: lines.length > 1 ? titleLine : (defaultTitle || `Slide ${idx + 1}`),
        points: lines.length > 1 && points.length > 0 ? points : [titleLine],
        allLines: lines
      };
    });
  };

  // Load Document (PDF, PPTX, or Clean Presentation Content)
  useEffect(() => {
    let isCancelled = false;
    let loadingTask = null;
    setIsLoading(true);
    setLoadError(null);
    setPdfDoc(null);
    setPptxSlides(null);
    setCurrentPage(1);
    setMaxReachedPage(1);
    setTotalPages(0);

    const initDocument = async () => {
      try {
        let uint8Data = null;

        // 1. Base64 Data URL
        if (typeof fileUrl === 'string' && fileUrl.startsWith('data:')) {
          uint8Data = dataUrlToUint8Array(fileUrl);
        }
        // 2. Blob URL: Fetch arrayBuffer on main thread, or IndexedDB recovery
        else if (typeof fileUrl === 'string' && fileUrl.startsWith('blob:')) {
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              uint8Data = new Uint8Array(buf);
            }
          } catch (_) {}

          if (!uint8Data) {
            try {
              const cachedFile = await findCachedDocument(title);
              if (cachedFile) {
                const buf = await cachedFile.arrayBuffer();
                uint8Data = new Uint8Array(buf);
              }
            } catch (_) {}
          }
        }
        // 3. Remote URL or relative file path (/uploads/...)
        else if (typeof fileUrl === 'string' && fileUrl.length > 0) {
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              uint8Data = new Uint8Array(buf);
            }
          } catch (_) {}
        } else if (fileUrl instanceof Uint8Array) {
          uint8Data = fileUrl;
        }

        if (isCancelled) return;

        // Check if data is a PPTX file (PK = 0x50, 0x4B)
        const isZipOrPptx = uint8Data && uint8Data.length > 4 && uint8Data[0] === 0x50 && uint8Data[1] === 0x4B;

        if (isZipOrPptx) {
          try {
            const slides = await parsePptxBuffer(uint8Data);
            if (slides && slides.length > 0 && !isCancelled) {
              setPptxSlides(slides);
              setTotalPages(slides.length);
              setCurrentPage(1);
              setIsLoading(false);
              return;
            }
          } catch (pptxErr) {
            console.warn('[DocumentCanvasViewbox] PPTX slide extraction notice:', pptxErr.message);
          }
        }

        // If PDF binary data is available
        if (uint8Data) {
          loadingTask = pdfjsLib.getDocument({
            data: uint8Data,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true,
          });

          const loadedPdf = await loadingTask.promise;
          if (!isCancelled) {
            setPdfDoc(loadedPdf);
            setTotalPages(loadedPdf.numPages);
            setCurrentPage(1);
            setIsLoading(false);
            return;
          }
        }

        // If direct non-blob remote URL
        if (typeof fileUrl === 'string' && fileUrl.length > 0 && !fileUrl.startsWith('blob:')) {
          loadingTask = pdfjsLib.getDocument({
            url: fileUrl,
            withCredentials: false,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
            cMapPacked: true,
          });

          const loadedPdf = await loadingTask.promise;
          if (!isCancelled) {
            setPdfDoc(loadedPdf);
            setTotalPages(loadedPdf.numPages);
            setCurrentPage(1);
            setIsLoading(false);
            return;
          }
        }

        // Fallback presentation slide creation or clean reader
        if (fallbackContent) {
          if (isPresentation) {
            const slides = parseTextIntoSlides(fallbackContent, title);
            if (slides && slides.length > 0 && !isCancelled) {
              setPptxSlides(slides);
              setTotalPages(slides.length);
              setCurrentPage(1);
              setIsLoading(false);
              return;
            }
          }
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.warn('[DocumentCanvasViewbox Notice]', err);
          if (fallbackContent && isPresentation) {
            const slides = parseTextIntoSlides(fallbackContent, title);
            if (slides && slides.length > 0) {
              setPptxSlides(slides);
              setTotalPages(slides.length);
              setCurrentPage(1);
            }
          }
          setIsLoading(false);
        }
      }
    };

    initDocument();

    return () => {
      isCancelled = true;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch (_) {}
      }
    };
  }, [fileUrl, fallbackContent, isPresentation, title]);

  // Render current PDF page onto HTML5 Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (_) {}
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d', { alpha: false });

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const viewport = page.getViewport({ scale: zoomScale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('[PDF Page Render Notice]', err);
      }
    }
  }, [pdfDoc, currentPage, zoomScale]);

  useEffect(() => {
    if (pdfDoc) {
      renderCurrentPage();
    }
  }, [pdfDoc, renderCurrentPage]);

  const isPptxMode = Boolean(pptxSlides && pptxSlides.length > 0);
  const effectiveIsPres = Boolean(isPresentation || isPptxMode);
  const activeSlide = isPptxMode ? pptxSlides[currentPage - 1] : null;

  const goPrevPage = useCallback(() => {
    setCurrentPage((p) => {
      const next = Math.max(1, p - 1);
      if (next !== p) {
        viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return next;
    });
  }, []);

  const goNextPage = useCallback(() => {
    setCurrentPage((p) => {
      const limit = totalPages || 1;
      const next = Math.min(limit, p + 1);
      if (next !== p) {
        setMaxReachedPage((m) => Math.max(m, next));
        viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return next;
    });
  }, [totalPages]);

  const goToPage = useCallback(
    (target) => {
      const limit = totalPages || 1;
      const clamped = Math.max(1, Math.min(limit, target));
      if (!allowSkip && clamped > maxReachedPage) return;
      setCurrentPage(clamped);
      if (clamped > maxReachedPage) setMaxReachedPage(clamped);
      viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [totalPages, maxReachedPage, allowSkip]
  );

  // Notify parent of page/slide progress so CoursePlayer navigates one-by-one without skipping
  useEffect(() => {
    if (typeof onProgressChange === 'function') {
      onProgressChange({
        currentPage,
        totalPages,
        maxReachedPage,
        isPresentation: effectiveIsPres,
        isLoading,
        allViewed: !isLoading && (totalPages === 0 || maxReachedPage >= totalPages),
        prevPage: goPrevPage,
        nextPage: goNextPage,
        goToPage,
      });
    }
  }, [currentPage, totalPages, maxReachedPage, effectiveIsPres, isLoading, goPrevPage, goNextPage, goToPage, onProgressChange]);

  // Keep onComplete reference harmless if a legacy caller omits onProgressChange (never auto-skip 1-page docs)
  useEffect(() => {
    if (typeof onProgressChange !== 'function' && totalPages > 1 && currentPage === totalPages && maxReachedPage >= totalPages) {
      onComplete?.();
    }
  }, [currentPage, totalPages, maxReachedPage, onComplete, onProgressChange]);

  // Keyboard navigation (strict sequential stepping)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNextPage, goPrevPage]);

  // Fullscreen tracking
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-[#0F141C] text-slate-100 shadow-2xl select-none relative ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* ─── SLEEK MINIMALIST TOOLBAR (NO DOWNLOAD / PRINT BUTTONS) ─── */}
      <div className="h-12 bg-[#161C26] border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 shrink-0 text-xs">
        {/* Document / Presentation Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center shrink-0">
            {effectiveIsPres ? (
              <Presentation className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <span className="font-bold text-white text-xs truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
          {effectiveIsPres && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Slides
            </span>
          )}
        </div>

        {/* Navigation & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls (only active in canvas PDF mode) */}
          {!isPptxMode && (
            <>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                disabled={zoomScale <= 0.75}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1.15)}
                className="px-2 py-1 rounded-md text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round((zoomScale / 1.15) * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                disabled={zoomScale >= 2.4}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
            </>
          )}

          {/* Page / Slide Previous */}
          <button
            type="button"
            onClick={goPrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={`Previous ${effectiveIsPres ? 'Slide' : 'Page'} (Left Arrow)`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page Counter */}
          <span className="font-mono text-xs text-slate-200 px-1.5 font-bold">
            {currentPage} <span className="text-slate-500 font-normal">/</span> {totalPages || 1}
          </span>

          {/* Page / Slide Next */}
          <button
            type="button"
            onClick={goNextPage}
            disabled={currentPage >= (totalPages || 1)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title={`Next ${effectiveIsPres ? 'Slide' : 'Page'} (Right Arrow)`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ─── MAIN VIEWPORT AREA (PURE CONTENT ONLY) ─── */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-6 min-h-[420px] sm:min-h-[540px] lg:min-h-[620px] bg-[#0A0D13]"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            <span className="text-xs font-semibold tracking-wide">Loading content viewbox...</span>
          </div>
        )}

        {/* 1. PDF Canvas Mode */}
        {!isLoading && !isPptxMode && pdfDoc && (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 transition-transform duration-150">
            <canvas ref={canvasRef} className="block max-w-full h-auto bg-white" />
          </div>
        )}

        {/* 2. PPTX High-Fidelity Slide Presentation Mode */}
        {!isLoading && isPptxMode && activeSlide && (
          <div className="w-full max-w-4xl aspect-[16/10] bg-slate-900/95 rounded-2xl border border-slate-800 p-8 sm:p-12 flex flex-col justify-between shadow-2xl text-left relative overflow-hidden">
            {/* Slide Title */}
            <div className="space-y-2 relative z-10">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#3B82F6]">
                Slide {activeSlide.slideNumber} of {totalPages}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                {activeSlide.title}
              </h2>
            </div>

            {/* Slide Bullets / Body Content */}
            <div className="my-auto py-6 space-y-3 relative z-10">
              {activeSlide.points && activeSlide.points.length > 0 ? (
                <ul className="space-y-3">
                  {activeSlide.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-200 text-sm sm:text-base leading-relaxed">
                      <span className="h-2 w-2 rounded-full bg-[#3B82F6] shrink-0 mt-2" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                  {activeSlide.allLines?.join('\n\n')}
                </div>
              )}
            </div>

            {/* Slide Minimal Header/Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span className="font-semibold text-slate-300">{title}</span>
              <span className="font-mono text-slate-500">ACFIT Professional</span>
            </div>
          </div>
        )}

        {/* 3. Document Reading Viewbox (Clean content layout when canvas PDF not loaded or direct document text) */}
        {!isLoading && !pdfDoc && !isPptxMode && (
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-14 space-y-6 text-left my-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-4">
              {title}
            </h1>
            <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
              {fallbackContent || 'Document content is currently being prepared.'}
            </div>
          </div>
        )}
      </div>

      {/* ─── SIMPLE SEQUENTIAL SLIDE / PAGE BAR (NO FORWARD SKIPPING) ─── */}
      {totalPages > 1 && (
        <div className="h-12 bg-[#161C26] border-t border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-3 text-xs shrink-0">
          <button
            type="button"
            onClick={goPrevPage}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev {effectiveIsPres ? 'Slide' : 'Page'}</span>
          </button>

          {/* Sequential Progress Indicators (already-viewed dots clickable; future dots locked to prevent skipping) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[55%] scrollbar-none">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = currentPage === pageNum;
              const isReached = allowSkip || pageNum <= maxReachedPage;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isReached}
                  onClick={() => goToPage(pageNum)}
                  className={`h-2 rounded-full transition-all shrink-0 ${
                    isCurrent
                      ? 'w-6 bg-[#3B82F6] cursor-pointer'
                      : isReached
                      ? 'w-2 bg-emerald-500/80 hover:bg-emerald-400 cursor-pointer'
                      : 'w-2 bg-slate-700/70 opacity-50 cursor-not-allowed'
                  }`}
                  title={
                    isReached
                      ? `${effectiveIsPres ? 'Slide' : 'Page'} ${pageNum}`
                      : `View ${effectiveIsPres ? 'slide' : 'page'} ${pageNum - 1} first`
                  }
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNextPage}
            disabled={currentPage >= totalPages}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              currentPage >= totalPages
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer shadow-xs'
            }`}
          >
            <span>{currentPage >= totalPages ? (effectiveIsPres ? 'Last Slide ✓' : 'Last Page ✓') : `Next ${effectiveIsPres ? 'Slide' : 'Page'}`}</span>
            {currentPage < totalPages && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCanvasViewbox;
