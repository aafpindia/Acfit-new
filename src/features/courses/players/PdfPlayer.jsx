import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export const PdfPlayer = ({ content = {} }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);

  const rawFileUrl = content.fileUrl || content.url || content.pdfUrl || '';
  const totalPages = content.totalPages || 4;

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleZoomIn = () => {
    setZoomPercent((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomPercent((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    if (rawFileUrl) {
      const a = document.createElement('a');
      a.href = rawFileUrl;
      a.download = content.title || 'course-document.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Mock content per page for visual realism
  const getMockPdfContent = (page) => {
    switch (page) {
      case 1:
        return (
          <div className="space-y-4 font-sans">
            <h2 className="text-xl font-bold text-center text-slate-800 border-b border-slate-200 pb-3">
              {content.title || 'Section 1: Architecture Guidelines'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              This official document details structural standards mapped for modern learning modules and high-performance protocols.
            </p>
            <div className="h-32 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-center justify-center font-bold text-xs text-blue-600 gap-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <span>[ Official Document Resource Preview ]</span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 font-sans">
            <h2 className="text-xl font-bold text-center text-slate-800 border-b border-slate-200 pb-3">
              Section 2: Security & Routing Protocols
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              Review syllabus guidelines, reference code snippets, and complete step-by-step checklist protocols.
            </p>
          </div>
        );
      default:
        return (
          <div className="space-y-4 font-sans">
            <h2 className="text-xl font-bold text-center text-slate-800 border-b border-slate-200 pb-3">
              Section {page}: Appendix & Reference Notes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
              Refer to online modules, check checklists inside download assets, and verify certificates once final assessment steps are completed.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="border-border bg-slate-100 p-4 space-y-4 select-none font-sans">
      
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs sm:text-sm shadow-xs">
        {/* Page selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="p-1 h-8 w-8">
            <ChevronLeft className="h-4.5 w-4.5" />
          </Button>
          <span className="font-semibold select-none text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages} className="p-1 h-8 w-8">
            <ChevronRight className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Zoom & Download */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} className="p-1.5 h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
            <span className="font-bold text-slate-600 text-xs select-none w-10 text-center">{zoomPercent}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} className="p-1.5 h-8 w-8"><ZoomIn className="h-4.5 w-4.5" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setZoomPercent(100)} className="p-1.5 h-8 w-8 text-slate-500"><RotateCcw className="h-4 w-4" /></Button>
          </div>

          {rawFileUrl ? (
            <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5 h-8 text-xs font-bold bg-[#2563EB] text-white">
              <Download className="h-4 w-4" />
              <span>Download PDF File</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 h-8 text-xs font-semibold">
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          )}
        </div>
      </div>

      {/* PDF Viewport */}
      {rawFileUrl && (rawFileUrl.startsWith('http') || rawFileUrl.startsWith('data:application/pdf') || rawFileUrl.startsWith('blob:')) ? (
        <div className="rounded-xl overflow-hidden border border-slate-300 bg-white h-[500px]">
          <iframe
            src={rawFileUrl}
            className="w-full h-full border-0"
            title={content.title || 'PDF Document'}
          />
        </div>
      ) : (
        <div className="overflow-auto max-h-[500px] flex items-center justify-center p-4 bg-slate-200/60 rounded-xl border border-slate-300">
          <div
            className="bg-white p-8 rounded-xl shadow-md border border-slate-200 max-w-xl w-full aspect-[1/1.4] flex flex-col justify-between transition-transform duration-200"
            style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top center' }}
          >
            {getMockPdfContent(currentPage)}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-4 font-mono font-semibold">
              OFFICIAL COURSE PDF DOCUMENT — FOR EDUCATION PURPOSES ONLY
            </div>
          </div>
        </div>
      )}

    </Card>
  );
};

export default PdfPlayer;
