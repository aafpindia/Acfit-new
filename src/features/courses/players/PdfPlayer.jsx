import React from 'react';
import { DocumentCanvasViewbox } from './DocumentCanvasViewbox';
import { Card, CardContent } from '../../../components/ui/card';
import { FileText } from 'lucide-react';

export const PdfPlayer = ({ content = {}, onComplete, onProgressChange, allowSkip = false }) => {
  const fileUrl = content.fileUrl || content.url || content.pdfUrl || '';
  const lessonTitle = content.title || 'Course Document';
  const textBody = content.body || content.instructions || content.textContent || '';

  // 1. Direct PDF or Converted Document: Clean HTML5 Canvas Viewbox
  if (fileUrl) {
    return (
      <DocumentCanvasViewbox
        fileUrl={fileUrl}
        title={lessonTitle}
        fallbackContent={textBody}
        isPresentation={false}
        onComplete={onComplete}
        onProgressChange={onProgressChange}
        allowSkip={allowSkip}
      />
    );
  }

  // 2. Text / Article Lesson: Clean distraction-free content viewbox
  if (textBody) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6 bg-slate-50/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {lessonTitle}
            </h2>
            {content.moduleTitle && (
              <p className="text-xs text-slate-500 font-medium">{content.moduleTitle}</p>
            )}
          </div>
        </div>

        <CardContent className="p-6 sm:p-10 max-w-4xl mx-auto space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
          {textBody}
        </CardContent>
      </Card>
    );
  }

  // 3. Fallback: Clean empty state
  return (
    <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-2">
      <FileText className="h-8 w-8 text-slate-400 mx-auto" />
      <h3 className="text-sm font-bold text-slate-800">No Document Content Attached</h3>
      <p className="text-xs text-slate-500">
        This document lesson does not have a PDF file attached yet.
      </p>
    </div>
  );
};

export default PdfPlayer;
