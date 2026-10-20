import React, { useState } from 'react';
import { getEmbedUrl } from '../../services/bunnyService';
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
  X
} from 'lucide-react';

export const StudentCoursePlayerPreviewModal = ({ isOpen, onClose, courseData }) => {
  if (!isOpen || !courseData) return null;

  const modules = courseData.modules || [];
  const firstLesson = modules[0]?.lessons?.[0];
  const [activeLesson, setActiveLesson] = useState(firstLesson || null);

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
              {Array.isArray(activeLesson.items) && activeLesson.items.length > 0 ? (
                <div className="space-y-6">
                  {activeLesson.items.map((item, idx) => (
                    <div key={item.id || idx} className="p-5 rounded-2xl bg-white border border-[#E4E7EB] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E4E7EB] pb-3">
                        <h4 className="font-extrabold text-sm text-[#202124] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          {item.title || 'Content Item'}
                        </h4>
                        <Badge className="text-[10px] uppercase font-mono tracking-wider bg-[#2563EB] text-white">
                          {item.type}
                        </Badge>
                      </div>

                      {item.type === 'video' && (() => {
                        const embedUrl = item.bunnyVideoId ? getEmbedUrl(item.bunnyVideoId) : null;
                        const isEmbed = Boolean(embedUrl || (item.videoUrl && (item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') || item.videoUrl.includes('iframe.mediadelivery.net'))));
                        const displayUrl = embedUrl || item.videoUrl;

                        return (
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#E4E7EB] flex items-center justify-center">
                            {isEmbed ? (
                              <iframe
                                src={displayUrl}
                                className="w-full h-full border-0"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                              />
                            ) : displayUrl ? (
                              <video
                                src={displayUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center text-slate-400 p-6">
                                <Video className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                                <p className="text-xs">No video URL available for preview.</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {item.type === 'ppt' && (
                        <div className="p-6 bg-slate-50 border border-[#E4E7EB] rounded-xl space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                              <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-[#202124]">Presentation Deck Attached</h5>
                              <p className="text-[11px] text-[#5F6368]">{item.fileUrl || 'presentation.pptx'}</p>
                            </div>
                          </div>

                          {item.fileUrl && item.fileUrl.startsWith('http') && (
                            <div className="h-72 bg-white rounded-lg overflow-hidden border border-[#E4E7EB]">
                              <iframe src={item.fileUrl} className="w-full h-full border-0" />
                            </div>
                          )}
                        </div>
                      )}

                      {item.type === 'text' && (
                        <div className="p-5 bg-white rounded-xl border border-[#E4E7EB] space-y-2">
                          <p className="text-xs text-[#202124] leading-relaxed font-sans whitespace-pre-wrap">
                            {item.body || 'No explanation text provided.'}
                          </p>
                        </div>
                      )}

                      {item.type === 'quiz' && (
                        <div className="p-5 bg-slate-50 border border-[#E4E7EB] rounded-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-[#E4E7EB] pb-2">
                            <span className="font-bold text-xs text-[#2563EB]">Interactive Quiz</span>
                            <span className="text-[11px] text-[#5F6368]">
                              Pass Score: {item.passingPercentage || 70}% • Timer: {item.timerMinutes || 10}m
                            </span>
                          </div>

                          {item.feedbackText && (
                            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                              💡 Feedback: {item.feedbackText}
                            </div>
                          )}

                          <div className="space-y-4">
                            {(item.questions || []).map((q, qIdx) => (
                              <div key={q.id || qIdx} className="bg-white p-3.5 rounded-lg border border-[#E4E7EB] space-y-2 text-xs">
                                <span className="font-bold text-[#202124]">
                                  Q{qIdx + 1}. {q.text || 'Untitled Question'} ({q.format || 'single-choice'})
                                </span>

                                {(q.format === 'single-choice' || q.format === 'multiple-choice' || !q.format) && (
                                  <div className="space-y-1.5 pt-1">
                                    {(q.options || []).map((opt, optIdx) => (
                                      <div key={optIdx} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50">
                                        <input
                                          type={q.format === 'multiple-choice' ? 'checkbox' : 'radio'}
                                          name={`preview-q-${qIdx}`}
                                          readOnly
                                          checked={
                                            q.format === 'multiple-choice'
                                              ? Array.isArray(q.correctIndex) && q.correctIndex.includes(optIdx)
                                              : q.correctIndex === optIdx
                                          }
                                        />
                                        <span className="text-[#202124]">{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.format === 'fill-in-blank' && (
                                  <div className="p-2 bg-slate-50 rounded border border-[#E4E7EB] text-[11px]">
                                    <span className="font-semibold text-[#5F6368]">Correct Answer: </span>
                                    <span className="font-mono text-[#2563EB] font-bold">{q.correctAnswerText || 'N/A'}</span>
                                  </div>
                                )}

                                {q.format === 'descriptive' && (
                                  <div className="p-2 bg-slate-50 rounded border border-[#E4E7EB] text-[11px]">
                                    <span className="font-semibold text-[#5F6368]">Model Solution Key: </span>
                                    <span className="text-[#202124] italic">{q.modelSolution || 'N/A'}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-[#E4E7EB] text-center space-y-2">
                  <BookOpen className="h-10 w-10 text-[#2563EB]/40 mx-auto" />
                  <h4 className="font-bold text-sm text-[#202124]">{activeLesson.title}</h4>
                  <p className="text-xs text-[#5F6368]">This lesson has no content items configured yet.</p>
                </div>
              )}
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
                        <div className="flex items-center gap-2 truncate">
                          <span>{l.title}</span>
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
