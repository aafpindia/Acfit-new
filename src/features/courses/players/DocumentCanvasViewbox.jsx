import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  FileText,
  Sparkles,
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

export const DocumentCanvasViewbox = ({
  fileUrl,
  title = 'Document Content',
  isPresentation = false,
  onComplete,
  className = ''
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.15);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Document using PDF.js
  useEffect(() => {
    if (!fileUrl) {
      setIsLoading(false);
      setLoadError('No document source URL provided.');
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      withCredentials: false,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    });

    loadingTask.promise
      .then((loadedPdf) => {
        if (!isCancelled) {
          setPdfDoc(loadedPdf);
          setTotalPages(loadedPdf.numPages);
          setCurrentPage(1);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('[PDF.js Canvas Viewbox Notice]', err);
          setLoadError(err.message || 'Unable to load document viewbox.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch (_) {}
    };
  }, [fileUrl]);

  // Render current page onto HTML5 Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel ongoing render if any
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
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Trigger completion callback on last page
  useEffect(() => {
    if (totalPages > 0 && currentPage === totalPages) {
      onComplete?.();
    }
  }, [currentPage, totalPages, onComplete]);

  // Keyboard navigation (Arrow keys)
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

  // Fullscreen change listener
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
      {/* ─── SLEEK MINIMALIST TOOLBAR (NO DOWNLOAD / PRINT CONTROLS) ─── */}
      <div className="h-12 bg-[#161C26] border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 shrink-0 text-xs">
        {/* Document Title & Mode Label */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
          {isPresentation && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Presentation
            </span>
          )}
        </div>

        {/* Clean Viewport & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            disabled={zoomScale <= 0.75}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Zoom Percent */}
          <button
            type="button"
            onClick={() => setZoomScale(1.15)}
            className="px-2 py-1 rounded-md text-[11px] font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset to 100% Zoom"
          >
            {Math.round((zoomScale / 1.15) * 100)}%
          </button>

          {/* Zoom In */}
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

          {/* Page Previous */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page Counter */}
          <span className="font-mono text-xs text-slate-300 px-1 font-semibold">
            {currentPage} <span className="text-slate-500 font-normal">/</span> {totalPages || 1}
          </span>

          {/* Page Next */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Page (Right Arrow)"
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
          <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Document Preview Notice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 transition-transform duration-150">
            {/* HTML5 Canvas — No raw PDF file or download buttons */}
            <canvas ref={canvasRef} className="block max-w-full h-auto bg-white" />
          </div>
        )}
      </div>

      {/* ─── SLIDE JUMP BAR (FOR MULTI-PAGE PRESENTATIONS/PDFS) ─── */}
      {totalPages > 1 && (
        <div className="h-10 bg-[#161C26] border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            First {isPresentation ? 'Slide' : 'Page'}
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
            Last {isPresentation ? 'Slide' : 'Page'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCanvasViewbox;

