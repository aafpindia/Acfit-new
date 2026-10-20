import React, { useState, useEffect, useMemo } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import {
  Megaphone,
  Radio,
  Send,
  Sparkles,
  AlertTriangle,
  Users,
  User,
  BookOpen,
  Check,
  X,
  Search,
  CheckCircle2,
  ShieldAlert,
  Bell,
  ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { createAnnouncement } from '../../services/announcementService';
import { fetchUsers } from '../../services/userService';

export const BroadcastModal = ({ isOpen, onClose, initialTarget = '' }) => {
  const { success, error: toastError } = useToast();
  const { addAnnouncement, syncFromSupabase } = useLmsStore();

  const [title, setTitle] = useState('');
  const [targetType, setTargetType] = useState('all'); // 'all' | 'user'
  const [selectedUser, setSelectedUser] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userList, setUserList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Reset all form inputs to empty states with placeholders when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setBody('');
      setUserSearchQuery('');
      if (!initialTarget) {
        setTargetType('all');
        setSelectedUser('');
      }
    }
  }, [isOpen, initialTarget]);

  // Async load available DB & local registered users
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadDbUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const fetchedUsers = await fetchUsers();
        if (isMounted) {
          setUserList(fetchedUsers);
        }
      } catch (err) {
        console.warn('Error fetching users for broadcast:', err);
      } finally {
        if (isMounted) setIsLoadingUsers(false);
      }
    };

    loadDbUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Support prefilled initialTarget (e.g., from enquiries tab "Broadcast Reply")
  useEffect(() => {
    if (initialTarget && isOpen) {
      if (initialTarget.startsWith('User:')) {
        setTargetType('user');
        setSelectedUser(initialTarget.replace('User:', '').trim());
      } else {
        setTargetType('all');
        setSelectedUser('');
      }
    }
  }, [initialTarget, isOpen]);

  // Filtered users for search input
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return userList;
    const q = userSearchQuery.toLowerCase();
    return userList.filter(
      (u) =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [userList, userSearchQuery]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toastError('Please fill in both broadcast title and announcement content.');
      return;
    }

    if (targetType === 'user' && !selectedUser) {
      toastError('Please select a specific student recipient.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine final target string: 'All Athletes' or 'User: <selectedUser>'
      const finalTarget = targetType === 'user' ? `User: ${selectedUser}` : 'All Athletes';
      const fullTitle = priority !== 'NORMAL' ? `[${priority}] ${title}` : title;

      // Store action handles DB + Zustand + Realtime WebSocket sync!
      await addAnnouncement(fullTitle, body, finalTarget);

      success(`Message published live for target: ${finalTarget}!`);
      setTitle('');
      setBody('');
      setPriority('NORMAL');
      setTargetType('all');
      onClose();
      syncFromSupabase();
    } catch (err) {
      toastError(err.message || 'Error publishing broadcast message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        isOpen={isOpen}
        hideCloseButton={true}
        className="w-[98vw] max-w-6xl h-[92vh] max-h-[900px] bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 font-sans flex flex-col overflow-hidden my-auto"
      >
        {/* HEADER BAR */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#4A2EC4] px-8 py-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-200">
                  ● ACFIT ANNOUNCEMENT STUDIO
                </span>
              </div>
              <DialogTitle className="text-xl font-black text-white mt-0.5 tracking-tight">
                Publish Live System Announcement
              </DialogTitle>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MAIN BODY FORM */}
        <form onSubmit={handleSendBroadcast} className="flex-1 flex flex-col justify-between overflow-hidden bg-[#F8FAFC]">
          
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: TARGETING & AUDIENCE SCOPE (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* TARGET AUDIENCE SCOPE SELECTION */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <label className="text-xs font-black uppercase tracking-wider text-[#202124] block">
                  1. Target Audience Scope
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      targetType === 'all'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-2 ring-[#2563EB]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      targetType === 'all' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-[#202124]">All Athletes / Everyone</span>
                        {targetType === 'all' && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Broadcasts to every active learner portal dashboard & notification bell.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('user')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      targetType === 'user'
                        ? 'border-[#2563EB] bg-[#EFF6FF]/60 ring-2 ring-[#2563EB]/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      targetType === 'user' ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-[#202124]">Specific Student / User (Direct)</span>
                        {targetType === 'user' && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Delivered privately & strictly to one selected student's feed.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* SEARCHABLE STUDENT RECIPIENT SELECTOR (WHEN TARGET IS 'USER') */}
              {targetType === 'user' && (
                <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
                      <User className="h-4 w-4 text-[#2563EB]" />
                      <span>Select Student Recipient</span>
                    </label>
                    <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                      {isLoadingUsers ? 'Loading DB Users...' : `${userList.length} Active Students`}
                    </span>
                  </div>

                  {/* ACTIVE SELECTED RECIPIENT BANNER */}
                  {selectedUser && (
                    <div className="p-3 bg-[#EFF6FF] border border-blue-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {selectedUser.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider">Active Recipient</span>
                          <span className="text-xs font-bold text-[#202124] block truncate">{selectedUser}</span>
                        </div>
                      </div>
                      <Check className="h-4 w-4 text-[#2563EB] shrink-0" />
                    </div>
                  )}

                  {/* SEARCH FILTER INPUT */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    />
                  </div>

                  {/* CUSTOM SCROLLABLE STUDENT LIST */}
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 font-medium">
                        No matching student found.
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const userLabel = `${u.fullName || 'Student'} (${u.email})`;
                        const isSelected = selectedUser === userLabel;
                        return (
                          <button
                            type="button"
                            key={u.id || u.email}
                            onClick={() => setSelectedUser(userLabel)}
                            className={`w-full p-3 text-left flex items-center justify-between hover:bg-[#EFF6FF]/50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-[#EFF6FF] font-bold text-[#2563EB]' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {(u.fullName || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-bold text-[#202124] block truncate">{u.fullName || 'Student'}</span>
                                <span className="text-[11px] text-slate-500 block truncate">{u.email}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-[#2563EB] shrink-0 ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* PRIORITY ALERT SELECTION */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-[#202124] block">
                  2. Priority Alert Banner
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NORMAL', label: 'Normal' },
                    { id: 'HIGH PRIORITY', label: 'High Priority' },
                    { id: 'URGENT ALERT', label: 'Urgent' }
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        priority === p.id
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: MESSAGE COMPOSER & LIVE PREVIEW (7 COLS) */}
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              
              {/* ANNOUNCEMENT CONTENT FORM */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <label className="text-xs font-black uppercase tracking-wider text-[#202124] block">
                  3. Announcement Content
                </label>

                <Input
                  label="Subject Header Title"
                  placeholder="e.g. ⚡ Important Notice: Exam Schedule Updated"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-11 text-xs border-slate-200 focus:border-[#2563EB]"
                />

                <Textarea
                  label="Broadcast Message Details"
                  placeholder="Type the announcement details to be delivered directly to the learner portal..."
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  className="text-xs border-slate-200 focus:border-[#2563EB]"
                />
              </div>

              {/* LIVE STUDENT FEED PREVIEW CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                    <span>Live Student Portal Feed Preview</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {targetType === 'user' ? `Delivered to: ${selectedUser || 'Student'}` : 'Delivered to: All Athletes'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#202124] text-sm">
                      {priority !== 'NORMAL' ? `[${priority}] ` : ''}
                      {title || 'Announcement Title Preview...'}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-blue-200">
                      Just now
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {body || 'Broadcast body message preview will appear here in real-time as you type...'}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* FOOTER ACTIONS BAR */}
          <div className="shrink-0 bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ready to publish</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs font-bold rounded-xl h-11 px-5 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="rounded-xl h-11 px-7 text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-2 cursor-pointer shadow-lg shadow-[#2563EB]/25"
                leftIcon={<Send className="h-4 w-4 text-white" />}
              >
                Publish Broadcast Now →
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastModal;
