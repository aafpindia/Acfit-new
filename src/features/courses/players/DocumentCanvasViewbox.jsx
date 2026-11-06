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
  className = ''
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pptxSlides, setPptxSlides] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.15);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to convert base64 Data URL to Uint8Array
  const dataUrlToUint8Array = (dataUrl) => {
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
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

  // Load Document (PDF or PPTX)
  useEffect(() => {
    if (!fileUrl) {
      setIsLoading(false);
      setLoadError('No document source provided.');
      return;
    }

    let isCancelled = false;
    let loadingTask = null;
    setIsLoading(true);
    setLoadError(null);
    setPdfDoc(null);
    setPptxSlides(null);

    const initDocument = async () => {
      try {
        let uint8Data = null;

        // 1. Base64 Data URL
        if (typeof fileUrl === 'string' && fileUrl.startsWith('data:')) {
          uint8Data = dataUrlToUint8Array(fileUrl);
        }
        // 2. Blob URL: Fetch on main thread or recover from local cache
        else if (typeof fileUrl === 'string' && fileUrl.startsWith('blob:')) {
          let loaded = false;
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              uint8Data = new Uint8Array(buf);
              loaded = true;
            }
          } catch (_) {}

          if (!loaded) {
            // Attempt recovery from local IndexedDB cache
            try {
              const cachedFile = await findCachedDocument(title);
              if (cachedFile) {
                const buf = await cachedFile.arrayBuffer();
                uint8Data = new Uint8Array(buf);
                loaded = true;
              }
            } catch (_) {}
          }

          if (!loaded) {
            throw new Error('This document preview session has expired across browser sessions. Please re-upload or select the document in Course Studio.');
          }
        }
        // 3. Remote URL or relative file path (/uploads/...)
        else if (typeof fileUrl === 'string') {
          try {
            const resp = await fetch(fileUrl);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              uint8Data = new Uint8Array(buf);
            }
          } catch (_) {
            // If fetch failed due to external CORS, we fallback to passing url directly to PDF.js
          }
        } else if (fileUrl instanceof Uint8Array) {
          uint8Data = fileUrl;
        }

        if (isCancelled) return;

        // Check if data is a PPTX file (magic bytes: PK = 0x50, 0x4B)
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

        // Configure PDF.js loading task with raw byte array (transferred to worker without network request)
        const docConfig = uint8Data
          ? { data: uint8Data }
          : { url: fileUrl };

        loadingTask = pdfjsLib.getDocument({
          ...docConfig,
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
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[PDF.js Canvas Viewbox Notice]', err);
          setLoadError(err.message || 'Unable to load document viewbox.');
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
  }, [fileUrl]);

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

  // Completion trigger on final page
  useEffect(() => {
    if (totalPages > 0 && currentPage === totalPages) {
      onComplete?.();
    }
  }, [currentPage, totalPages, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => Math.min(totalPages || 1, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

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

  const isPptxMode = Boolean(pptxSlides && pptxSlides.length > 0);
  const activeSlide = isPptxMode ? pptxSlides[currentPage - 1] : null;

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
            {isPresentation || isPptxMode ? (
              <Presentation className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
          {(isPresentation || isPptxMode) && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Presentation
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page Counter */}
          <span className="font-mono text-xs text-slate-300 px-1 font-semibold">
            {currentPage} <span className="text-slate-500 font-normal">/</span> {totalPages || 1}
          </span>

          {/* Page / Slide Next */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next (Right Arrow)"
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
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-6 min-h-[460px] sm:min-h-[580px] lg:min-h-[680px] bg-[#0A0D13]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            <span className="text-xs font-semibold tracking-wide">Loading content viewbox...</span>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="w-full max-w-3xl space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Document Preview Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">{loadError}</p>
            </div>
            {fallbackContent && (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-4 text-slate-200 text-sm leading-relaxed whitespace-pre-line shadow-xl">
                <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">{title}</h3>
                <div>{fallbackContent}</div>
              </div>
            )}
          </div>
        )}

        {/* 1. PDF Canvas Mode */}
        {!isLoading && !loadError && !isPptxMode && (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 transition-transform duration-150">
            <canvas ref={canvasRef} className="block max-w-full h-auto bg-white" />
          </div>
        )}

        {/* 2. PPTX High-Fidelity Slide Presentation Mode */}
        {!isLoading && !loadError && isPptxMode && activeSlide && (
          <div className="w-full max-w-4xl aspect-[16/10] bg-slate-900/90 rounded-2xl border border-slate-800 p-8 sm:p-12 flex flex-col justify-between shadow-2xl text-left relative overflow-hidden">
            {/* Subtle slide background watermark */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Presentation className="h-48 w-48 text-white" />
            </div>

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
                  {activeSlide.allLines.join('\n\n')}
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 relative z-10">
              <span className="font-semibold text-slate-400">{title}</span>
              <span>ACFIT Academy</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── SLIDE JUMP BAR (MULTI-PAGE NAVIGATION) ─── */}
      {totalPages > 1 && (
        <div className="h-10 bg-[#161C26] border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            First {isPresentation || isPptxMode ? 'Slide' : 'Page'}
          </button>

          {/* Quick jump slide pill indicators */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[60%] scrollbar-none">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx + 1)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentPage === idx + 1
                    ? 'w-6 bg-[#3B82F6]'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Jump to page ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="hover:text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Last {isPresentation || isPptxMode ? 'Slide' : 'Page'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCanvasViewbox;
