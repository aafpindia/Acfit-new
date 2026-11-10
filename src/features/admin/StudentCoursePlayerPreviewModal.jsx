import React, { useState, useMemo, useEffect } from 'react';
import { VideoPlayer } from '../courses/players/VideoPlayer';
import { DocumentCanvasViewbox } from '../courses/players/DocumentCanvasViewbox';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  PlayCircle,
  FileText,
  Video,
  CheckCircle,
  BookOpen,
  Calendar,
  ChevronRight,
  Sparkles,
  X,
  Download,
  Eye,
  Presentation,
  Play,
  Type,
  HelpCircle
} from 'lucide-react';

export const StudentCoursePlayerPreviewModal = ({ isOpen, onClose, courseData }) => {
  if (!isOpen || !courseData) return null;

  const modules = courseData.modules || [];
  const firstLesson = modules[0]?.lessons?.[0];
  const [activeLesson, setActiveLesson] = useState(firstLesson || null);
  const [selectedMediaTab, setSelectedMediaTab] = useState('video');

  // Compute available formats for the active preview lesson
  const previewTabs = useMemo(() => {
    if (!activeLesson) return [];
    const tabs = [];

    const hasVideo = Boolean(
      activeLesson.videoUrl ||
      activeLesson.bunnyVideoId ||
      activeLesson.type === 'video' ||
      activeLesson.items?.some((i) => i.type === 'video')
    );
    if (hasVideo) {
      tabs.push({ id: 'video', label: 'Video', icon: Video, color: 'text-orange-500' });
    }

    const hasPpt = Boolean(
      activeLesson.pptUrl ||
      activeLesson.type === 'ppt' ||
      activeLesson.items?.some((i) => i.type === 'ppt')
    );
    if (hasPpt) {
      tabs.push({ id: 'ppt', label: 'Presentation (PPT)', icon: Presentation, color: 'text-blue-600' });
    }

    const hasPdf = Boolean(
      activeLesson.pdfUrl ||
      activeLesson.type === 'pdf' ||
      activeLesson.items?.some((i) => i.type === 'pdf')
    );
    if (hasPdf) {
      tabs.push({ id: 'pdf', label: 'PDF Manual', icon: FileText, color: 'text-rose-600' });
    }

    const hasText = Boolean(
      (activeLesson.body && activeLesson.body.trim()) ||
      activeLesson.type === 'text' ||
      activeLesson.items?.some((i) => i.type === 'text')
    );
    if (hasText) {
      tabs.push({ id: 'text', label: 'Notes & Text', icon: Type, color: 'text-amber-600' });
    }

    const quizQuestions = activeLesson.questions || activeLesson.assessment?.questions || activeLesson.items?.find((i) => i.type === 'quiz')?.questions || [];
    const hasQuiz = Boolean(
      quizQuestions.length > 0 ||
      activeLesson.assessment ||
      activeLesson.type === 'quiz' ||
      activeLesson.items?.some((i) => i.type === 'quiz')
    );
    if (hasQuiz) {
      tabs.push({ id: 'quiz', label: `Quiz (${quizQuestions.length} Qs)`, icon: HelpCircle, color: 'text-cyan-600' });
    }

    return tabs;
  }, [activeLesson]);

  // Keep selected tab valid
  useEffect(() => {
    if (previewTabs.length > 0) {
      const exists = previewTabs.some((t) => t.id === selectedMediaTab);
      if (!exists) {
        setSelectedMediaTab(previewTabs[0].id);
      }
    }
  }, [activeLesson?.id, previewTabs, selectedMediaTab]);

  return (
    <div className="fixed inset-0 z-[70] bg-[#F7F8FA] text-[#202124] flex flex-col font-sans overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-white border-b border-[#E4E7EB] flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-extrabold bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20">
                Student Player Preview
              </Badge>
              <Badge className="text-[9px] font-bold bg-emerald-100 text-emerald-800">
                {courseData.published ? 'Live Catalog' : 'Draft Preview'}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-[#202124] truncate leading-tight mt-0.5">
              {courseData.title || 'Untitled Course'}
            </h3>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#5F6368] hover:text-[#202124] hover:bg-slate-100 p-2 rounded-xl cursor-pointer"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Player Body Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Main Video / Content Player View Area */}
        <div className="flex-1 bg-[#F7F8FA] p-6 overflow-y-auto flex flex-col space-y-4">
          {activeLesson ? (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              
              {/* Active Lesson Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E4E7EB] shadow-2xs flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md">
                    ● {activeLesson.type?.toUpperCase() || 'LESSON'}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#202124] mt-1">
                    {activeLesson.title}
                  </h3>
                </div>
                {activeLesson.duration && (
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {activeLesson.duration}
                  </span>
                )}
              </div>

              {/* Multimedia Switcher Tabs (When lesson combines 2+ media formats) */}
              {previewTabs.length > 1 && (
                <div className="p-1.5 bg-white rounded-2xl border border-[#E4E7EB] shadow-2xs flex items-center gap-2 overflow-x-auto">
                  {previewTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = selectedMediaTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedMediaTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : tab.color}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Primary Player / Viewer Frame */}
              {(() => {
                const lessonItems = Array.isArray(activeLesson.items) ? activeLesson.items : [];
                const videoItem = lessonItems.find((i) => i.type === 'video');
                const pptItem = lessonItems.find((i) => i.type === 'ppt');
                const pdfItem = lessonItems.find((i) => i.type === 'pdf');
                const textItem = lessonItems.find((i) => i.type === 'text' || i.type === 'rich-text');

                const videoUrl = activeLesson.videoUrl || videoItem?.videoUrl || (activeLesson.type === 'video' ? activeLesson.fileUrl : '') || '';
                const bunnyVideoId = activeLesson.bunnyVideoId || videoItem?.bunnyVideoId || '';
                const pptUrl = activeLesson.pptPdfUrl || activeLesson.pptUrl || pptItem?.pdfUrl || pptItem?.fileUrl || (activeLesson.type === 'ppt' ? activeLesson.fileUrl : '') || '';
                const pptTitle = activeLesson.pptFileName || pptItem?.fileName || activeLesson.fileName || 'Presentation Deck';
                const pdfUrl = activeLesson.pdfUrl || pdfItem?.fileUrl || (activeLesson.type === 'pdf' ? activeLesson.fileUrl : '') || '';
                const pdfTitle = activeLesson.pdfFileName || pdfItem?.fileName || activeLesson.fileName || 'PDF Document';
                const notesText = activeLesson.body || textItem?.body || '';

                return (
                  <div className="space-y-4">
                    {selectedMediaTab === 'video' && (
                      <div className="relative rounded-2xl overflow-hidden bg-black border border-[#E4E7EB] shadow-sm">
                        <VideoPlayer
                          content={{
                            videoUrl,
                            bunnyVideoId,
                            title: activeLesson.title
                          }}
                        />
                      </div>
                    )}

                    {selectedMediaTab === 'ppt' && (
                      <div className="space-y-2">
                        {pptUrl ? (
                          <DocumentCanvasViewbox
                            fileUrl={pptUrl}
                            title={pptTitle}
                            isPresentation={true}
                          />
                        ) : (
                          <div className="p-8 text-center bg-white border border-[#E4E7EB] rounded-2xl text-slate-500 text-xs">
                            No presentation file attached to preview.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMediaTab === 'pdf' && (
                      <div className="space-y-2">
                        {pdfUrl ? (
                          <DocumentCanvasViewbox
                            fileUrl={pdfUrl}
                            title={pdfTitle}
                            isPresentation={false}
                          />
                        ) : (
                          <div className="p-8 text-center bg-white border border-[#E4E7EB] rounded-2xl text-slate-500 text-xs">
                            No PDF file attached to preview.
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMediaTab === 'text' && (
                      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EB] shadow-2xs space-y-2">
                        <p className="text-xs text-[#202124] leading-relaxed font-sans whitespace-pre-wrap">
                          {notesText || 'No explanation text provided.'}
                        </p>
                      </div>
                    )}

                {selectedMediaTab === 'quiz' && (
                  <div className="p-6 bg-white rounded-2xl border border-[#E4E7EB] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E4E7EB] pb-3">
                      <span className="font-bold text-sm text-[#2563EB]">Interactive Lesson Assessment</span>
                      <span className="text-xs text-[#5F6368]">
                        Pass: {activeLesson.passingPercentage || 70}% • Timer: {activeLesson.timerMinutes || 10}m
                      </span>
                    </div>

                    {activeLesson.feedbackText && (
                      <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium">
                        💡 Feedback: {activeLesson.feedbackText}
                      </div>
                    )}

                    <div className="space-y-4">
                      {((activeLesson.questions && activeLesson.questions.length > 0)
                        ? activeLesson.questions
                        : (activeLesson.assessment?.questions || [])
                      ).map((q, qIdx) => (
                        <div key={q.id || qIdx} className="bg-slate-50 p-4 rounded-xl border border-[#E4E7EB] space-y-2.5 text-xs">
                          <span className="font-bold text-[#202124] block">
                            Q{qIdx + 1}. {q.text || q.question || 'Untitled Question'} ({q.format || 'single-choice'})
                          </span>

                          {(q.format === 'single-choice' || q.format === 'multiple-choice' || !q.format) && (
                            <div className="space-y-1.5 pt-1">
                              {(q.options || []).map((opt, optIdx) => {
                                const optText = typeof opt === 'object' && opt !== null ? (opt.text ?? '') : String(opt ?? '');
                                const isChecked = q.format === 'multiple-choice'
                                  ? (Array.isArray(q.correctIndex) ? q.correctIndex.includes(optIdx) : (typeof opt === 'object' && Boolean(opt.isCorrect)))
                                  : (q.correctIndex !== undefined ? q.correctIndex === optIdx : (typeof opt === 'object' ? Boolean(opt.isCorrect) : optIdx === 0));

                                return (
                                  <div key={optIdx} className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200/60">
                                    <input
                                      type={q.format === 'multiple-choice' ? 'checkbox' : 'radio'}
                                      name={`preview-q-${qIdx}`}
                                      readOnly
                                      checked={isChecked}
                                    />
                                    <span className="text-[#202124]">{optText}</span>
                                    {isChecked && (
                                      <span className="ml-auto text-[10px] text-emerald-600 font-bold">✓ Correct</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {q.format === 'fill-in-blank' && (
                            <div className="p-2.5 bg-white rounded-lg border border-[#E4E7EB] text-[11px]">
                              <span className="font-semibold text-[#5F6368]">Expected Answer: </span>
                              <span className="font-mono text-[#2563EB] font-bold">{q.correctAnswerText || 'N/A'}</span>
                            </div>
                          )}

                          {q.format === 'descriptive' && (
                            <div className="p-2.5 bg-white rounded-lg border border-[#E4E7EB] text-[11px]">
                              <span className="font-semibold text-[#5F6368]">Model Solution: </span>
                              <span className="text-[#202124] italic">{q.modelSolution || 'N/A'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                    </div>
                  );
                })()}

                {/* Study Notes Card (Visible below video/slides if notes are provided) */}
                {(() => {
                  const lessonItems = Array.isArray(activeLesson.items) ? activeLesson.items : [];
                  const textItem = lessonItems.find((i) => i.type === 'text' || i.type === 'rich-text');
                  const notesText = activeLesson.body || textItem?.body || '';
                  if (!notesText || !notesText.trim() || selectedMediaTab === 'text') return null;
                  return (
                    <div className="p-5 bg-white rounded-2xl border border-[#E4E7EB] shadow-2xs space-y-2">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Lesson Study Notes & Key Concepts</span>
                      </h5>
                      <p className="text-xs text-[#202124] leading-relaxed font-sans whitespace-pre-wrap">
                        {notesText}
                      </p>
                    </div>
                  );
                })()}

            </div>
          ) : (
            <div className="m-auto text-center space-y-2 p-12 bg-white rounded-3xl border border-[#E4E7EB] max-w-sm">
              <Sparkles className="h-10 w-10 text-[#2563EB] mx-auto" />
              <h4 className="font-extrabold text-base text-[#202124]">No Lesson Selected</h4>
              <p className="text-xs text-[#5F6368]">Select a module lesson from the sidebar playlist on the right to start preview streaming.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar Playlist Navigation */}
        <div className="w-full md:w-80 bg-white border-l border-[#E4E7EB] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#E4E7EB] bg-slate-50/50">
            <h4 className="font-extrabold text-xs text-[#202124] uppercase tracking-wider">
              Course Modules ({modules.length})
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {modules.map((m, mIdx) => (
              <div key={m.id || mIdx} className="space-y-1.5">
                <div className="px-2 py-1 flex items-center justify-between text-xs font-bold text-[#202124]">
                  <span>Module {mIdx + 1}: {m.title}</span>
                </div>

                <div className="space-y-1 pl-2">
                  {(m.lessons || []).map((l, lIdx) => {
                    const isActive = activeLesson?.id === l.id;
                    return (
                      <button
                        key={l.id || lIdx}
                        onClick={() => setActiveLesson(l)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#2563EB] text-white font-extrabold shadow-sm'
                            : 'hover:bg-slate-100 text-[#5F6368] font-medium'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="truncate">{l.title}</span>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {(l.videoUrl || l.bunnyVideoId || l.items?.some((i) => i.type === 'video')) && (
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600 border border-orange-200/60'}`}>
                                Video
                              </span>
                            )}
                            {(l.pptUrl || l.type === 'ppt' || l.items?.some((i) => i.type === 'ppt')) && (
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200/60'}`}>
                                PPT
                              </span>
                            )}
                            {(l.pdfUrl || l.type === 'pdf' || l.items?.some((i) => i.type === 'pdf')) && (
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
                                PDF
                              </span>
                            )}
                            {(l.body || l.items?.some((i) => i.type === 'text')) && (
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200/60'}`}>
                                Notes
                              </span>
                            )}
                            {((l.questions && l.questions.length > 0) || l.assessment || l.items?.some((i) => i.type === 'quiz')) && (
                              <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-cyan-50 text-cyan-600 border border-cyan-200/60'}`}>
                                Quiz
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#5F6368]'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-[#E4E7EB] flex items-center justify-between shrink-0">
        <span className="text-xs text-[#5F6368] font-medium">
          This is an interactive full-screen simulation of how enrolled members will view and stream lessons.
        </span>
        <Button variant="outline" onClick={onClose} className="text-xs font-bold border-[#E4E7EB] text-[#202124] hover:bg-slate-100">
          Close Preview
        </Button>
      </div>
    </div>
  );
};

export default StudentCoursePlayerPreviewModal;
