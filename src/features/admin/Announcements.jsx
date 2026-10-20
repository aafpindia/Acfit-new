import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { useLmsStore } from '../../stores/lmsStore';
import {
  Megaphone,
  Plus,
  Trash2,
  Globe,
  Radio,
  Sparkles,
  AlertTriangle,
  Users,
  Search,
  ChevronDown,
  X,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { BroadcastModal } from '../../components/broadcast/BroadcastModal';
import { deleteAnnouncement } from '../../services/announcementService';

const CARD_BANNERS = [
  { bg: 'bg-[#2563EB]', text: 'text-white', badge: 'ANNOUNCEMENT' },
  { bg: 'bg-rose-600', text: 'text-white', badge: 'URGENT BULLETIN' },
  { bg: 'bg-emerald-600', text: 'text-white', badge: 'SYSTEM UPDATE' },
  { bg: 'bg-[#0284C7]', text: 'text-white', badge: 'NEW FEATURE' }
];

export const Announcements = () => {
  const { success, error: toastError } = useToast();
  const {
    courses,
    announcements,
    enquiries = [],
    syncFromSupabase,
    subscribeToRealtime,
    deleteAnnouncement: deleteStoreAnnouncement,
    updateEnquiryStatus,
    deleteEnquiry
  } = useLmsStore();

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'enquiries'
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState('all');

  useEffect(() => {
    syncFromSupabase();
    const unsubscribe = subscribeToRealtime();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [syncFromSupabase, subscribeToRealtime]);

  // Filter Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (ann.title || '').toLowerCase().includes(q) ||
        (ann.body || '').toLowerCase().includes(q) ||
        (ann.target || '').toLowerCase().includes(q);

      const matchesTarget =
        targetFilter === 'all' || (ann.target || '').toLowerCase().includes(targetFilter.toLowerCase());

      return matchesSearch && matchesTarget;
    });
  }, [announcements, search, targetFilter]);

  // Filter Enquiries
  const filteredEnquiries = useMemo(() => {
    return (enquiries || []).filter((enq) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (enq.name || '').toLowerCase().includes(q) ||
        (enq.email || '').toLowerCase().includes(q) ||
        (enq.message || '').toLowerCase().includes(q);

      const matchesStatus =
        enquiryStatusFilter === 'all' || (enq.status || 'pending').toLowerCase() === enquiryStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, enquiryStatusFilter]);

  // Enquiry Stats
  const pendingCount = (enquiries || []).filter((e) => (e.status || 'pending') === 'pending').length;
  const contactedCount = (enquiries || []).filter((e) => e.status === 'contacted').length;
  const resolvedCount = (enquiries || []).filter((e) => e.status === 'resolved').length;

  const handleDeleteAnnouncement = async (id, title) => {
    if (window.confirm(`Are you sure you want to retract and delete broadcast "${title}"?`)) {
      try {
        await deleteAnnouncement(id);
        deleteStoreAnnouncement(id);
        await syncFromSupabase();
        success(`Broadcast "${title}" was retracted.`);
      } catch (err) {
        toastError(err.message || 'Failed to delete announcement.');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateEnquiryStatus(id, newStatus);
      success(`Enquiry status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toastError(err.message || 'Failed to update enquiry status.');
    }
  };

  const handleDeleteEnquiry = async (id, name) => {
    if (window.confirm(`Delete support enquiry from "${name}"?`)) {
      try {
        await deleteEnquiry(id);
        success(`Enquiry from ${name} deleted.`);
      } catch (err) {
        toastError(err.message || 'Failed to delete enquiry.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-16 text-[#202124]">
      
      {/* ─── 0. TOP MODULE TAB NAVIGATION ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Broadcast Bulletins</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'announcements' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {announcements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'enquiries'
                ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Student Support Enquiries & Leads</span>
            {pendingCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {pendingCount} New
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'enquiries' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {enquiries.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'announcements' ? (
          <Button
            variant="primary"
            onClick={() => setIsBroadcastModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5 text-white" />}
            className="h-9 px-4 text-xs font-extrabold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-md cursor-pointer shrink-0"
          >
            Publish Broadcast
          </Button>
        ) : null}
      </div>

      {/* ─── TAB 1: ANNOUNCEMENTS BROADCAST FEED ─────────────────────── */}
      {activeTab === 'announcements' && (
        <>
          {/* Sub-Header Filter Toolbar */}
          <div className="bg-white border border-slate-200 shadow-2xs py-2.5 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={targetFilter}
                  onChange={(e) => setTargetFilter(e.target.value)}
                  className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer appearance-none"
                >
                  <option value="all">Target: All Learners</option>
                  <option value="user">Target: Specific Student (Direct)</option>
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Featured Purple Banner KPI */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
                <span>Featured Broadcast Campaigns & Priority Bulletins</span>
              </h2>
              <span className="text-xs font-semibold text-blue-100">
                {filteredAnnouncements.length} Published Messages
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'TOTAL BROADCASTS', value: announcements.length, sub: 'Active bulletins on member feed', icon: Megaphone, color: 'bg-[#2563EB]' },
                { label: 'LEARNER REACH', value: '100%', sub: 'Pushed to all active member feeds', icon: Users, color: 'bg-emerald-500' },
                { label: 'PRIORITY ALERTS', value: announcements.filter(a => (a.title || '').includes('URGENT') || (a.title || '').includes('HIGH')).length, sub: 'High urgency system alerts', icon: AlertTriangle, color: 'bg-rose-500' },
                { label: 'DELIVERY STATUS', value: 'ACTIVE', sub: 'Instant notification delivery', icon: Radio, color: 'bg-sky-500' }
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-3.5 text-slate-900 shadow-2xs flex items-center gap-3 border border-slate-100"
                  >
                    <div className={`w-10 h-10 rounded-xl ${kpi.color} text-white flex items-center justify-center shrink-0 font-black shadow-xs`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {kpi.label}
                      </span>
                      <h4 className="font-black text-base text-slate-900 truncate">
                        {kpi.value}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {kpi.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Announcements Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#2563EB]" />
                <span>Active Broadcast Feed ({filteredAnnouncements.length})</span>
              </h3>
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-sans text-xs italic bg-white rounded-2xl border border-dashed border-slate-300">
                No active broadcasts published matching search filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAnnouncements.map((ann, idx) => {
                  const banner = CARD_BANNERS[idx % CARD_BANNERS.length];
                  const annDate = new Date(ann.created_at || ann.createdAt || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={ann.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className={`h-20 ${banner.bg} p-3.5 text-white flex flex-col justify-between relative overflow-hidden`}>
                        <div className="flex items-center justify-between z-10">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-white">
                            {ann.target || 'All Learners'}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/20 text-white">
                            {annDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 z-10">
                          <Megaphone className="h-5 w-5 text-white shrink-0" />
                          <h4 className="font-extrabold text-xs text-white truncate leading-tight">
                            {ann.title}
                          </h4>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
                        <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                          {ann.body || 'Priority broadcast bulletin published to student portal dashboards.'}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ● Published Live
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Retract Broadcast"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Retract</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB 2: STUDENT SUPPORT ENQUIRIES & LEADS ───────────────── */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6 font-sans">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0 font-extrabold">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL ENQUIRIES</span>
                <h4 className="font-black text-lg text-slate-900">{enquiries.length}</h4>
                <p className="text-[10px] text-slate-500">Captured leads & admissions queries</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-extrabold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PENDING FOLLOW-UPS</span>
                <h4 className="font-black text-lg text-amber-600">{pendingCount}</h4>
                <p className="text-[10px] text-slate-500">Requires admissions call/reply</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 font-extrabold">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONTACTED LEADS</span>
                <h4 className="font-black text-lg text-sky-600">{contactedCount}</h4>
                <p className="text-[10px] text-slate-500">Outreach in progress</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-extrabold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RESOLVED INQUIRIES</span>
                <h4 className="font-black text-lg text-emerald-600">{resolvedCount}</h4>
                <p className="text-[10px] text-slate-500">Converted or answered</p>
              </div>
            </div>
          </div>

          {/* Enquiries Filter Toolbar */}
          <div className="bg-white border border-slate-200 shadow-2xs py-2.5 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={enquiryStatusFilter}
                  onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                  className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] cursor-pointer appearance-none"
                >
                  <option value="all">Status: All Enquiries</option>
                  <option value="pending">Status: Pending Only</option>
                  <option value="contacted">Status: Contacted</option>
                  <option value="resolved">Status: Resolved</option>
                </select>
                <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="relative flex-1 sm:w-80 ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead name, email, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Enquiries Table / Card View */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#2563EB]" />
                <span>Captured Student Inquiries ({filteredEnquiries.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">Live database sync enabled</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F9FAFB] text-[#5F6368] border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Visitor / Lead</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-6">Message / Query</th>
                    <th className="py-3 px-3">Submitted</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-mono text-xs italic">
                        No support inquiries submitted matching active search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((item) => {
                      const status = (item.status || 'pending').toLowerCase();
                      const dateStr = new Date(item.created_at || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-extrabold text-xs flex items-center justify-center shrink-0">
                                {(item.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="block text-slate-900 font-bold">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">Source: {item.source || 'Landing Modal'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            <a href={`mailto:${item.email}`} className="text-[#2563EB] hover:underline flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{item.email}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-6 max-w-xs">
                            <p className="text-xs text-slate-700 leading-snug line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 font-normal">
                              "{item.message}"
                            </p>
                          </td>

                          <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {dateStr}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </span>
                            )}
                            {status === 'contacted' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <Send className="h-3 w-3" />
                                <span>Contacted</span>
                              </span>
                            )}
                            {status === 'resolved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Resolved</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {status !== 'contacted' && (
                                <button
                                  onClick={() => handleStatusChange(item.id, 'contacted')}
                                  className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Mark Contacted"
                                >
                                  Contacted
                                </button>
                              )}

                              {status !== 'resolved' && (
                                <button
                                  onClick={() => handleStatusChange(item.id, 'resolved')}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Mark Resolved"
                                >
                                  Resolved
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteEnquiry(item.id, item.name)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                title="Delete Enquiry"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Broadcast Studio Modal ───────────────────────────────────── */}
      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
      />

    </div>
  );
};

export default Announcements;
