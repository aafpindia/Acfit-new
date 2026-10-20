import React, { useState, useMemo } from 'react';
import { usePayments } from '../../hooks/usePayments';
import { useToast } from '../../hooks/useToast';
import {
  CreditCard,
  Eye,
  Printer,
  X,
  Download,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Search,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Sparkles,
  Check
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

export const Payments = () => {
  const { success, error: toastError } = useToast();
  const { data: payments = [] } = usePayments();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (pay.studentName || '').toLowerCase().includes(q) ||
        (pay.studentEmail || '').toLowerCase().includes(q) ||
        (pay.courseTitle || '').toLowerCase().includes(q) ||
        (pay.id || '').toLowerCase().includes(q) ||
        (pay.razorpayPaymentId || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || pay.status === statusFilter;
      const matchesMethod = methodFilter === 'All' || (pay.method || '').toLowerCase().includes(methodFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // KPI calculations
  const totalRevenue = useMemo(() => payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0), [payments]);
  const successfulCount = useMemo(() => payments.filter((p) => p.status === 'successful' || p.status === 'Paid').length, [payments]);
  const avgOrderValue = useMemo(() => (payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0), [payments, totalRevenue]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toastError('No transaction records available to export.');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Payment ID,Student Name,Student Email,Program,Amount (INR),Status,Gateway Method,Date\n';

    filteredPayments.forEach((p) => {
      const payDate = new Date(p.date || p.createdAt || p.created_at || Date.now()).toLocaleDateString();
      const row = `"${p.id || ''}","${p.studentName || ''}","${p.studentEmail || ''}","${p.courseTitle || ''}",${p.amount || 0},"${p.status || 'successful'}","${p.method || 'Razorpay'}","${payDate}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acfit_academy_payments_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Payments audit ledger exported to CSV!');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-16 text-[#202124]">
      
      {/* ─── 1. SUB-HEADER FILTER TOOLBAR ─────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-2xs py-2.5 px-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2088E7] cursor-pointer appearance-none"
            >
              <option value="All">Status: All</option>
              <option value="successful">Status: Successful</option>
              <option value="Paid">Status: Paid</option>
              <option value="pending">Status: Pending</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2088E7] cursor-pointer appearance-none"
            >
              <option value="All">Gateway: All</option>
              <option value="Razorpay">Gateway: Razorpay</option>
              <option value="Stripe">Gateway: Stripe</option>
              <option value="Card">Gateway: Credit Card</option>
            </select>
            <ChevronDown className="h-3 w-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Input Box & Export CSV */}
        <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, email, payment ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-200 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2088E7]"
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

          <Button
            variant="primary"
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-bold bg-[#2088E7] hover:bg-[#1976D2] text-white rounded-md flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ─── 2. FEATURED ROYAL BLUE METRIC BANNER ──────────────────────── */}
      <div className="bg-[#1E65B8] text-white rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>Featured Payment Gateway & Revenue Summary</span>
          </h2>
          <span className="text-xs font-semibold text-blue-100">
            {filteredPayments.length} Total Audit Records
          </span>
        </div>

        {/* 4-Column Grid of Horizontal White Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'GROSS REVENUE', value: `₹${totalRevenue.toLocaleString()}`, sub: 'Lifetime gross sales collected', icon: DollarSign, color: 'bg-emerald-500' },
            { label: 'SUCCESSFUL PAYMENTS', value: successfulCount, sub: 'Verified checkout receipts', icon: CheckCircle2, color: 'bg-[#2088E7]' },
            { label: 'AVG ORDER VALUE', value: `₹${avgOrderValue.toLocaleString()}`, sub: 'Average transaction size', icon: TrendingUp, color: 'bg-blue-600' },
            { label: 'GATEWAY VERIFIED', value: '100%', sub: 'Razorpay webhook signatures', icon: ShieldCheck, color: 'bg-amber-500' }
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 text-slate-900 shadow-xs flex items-center gap-3 border border-slate-100"
              >
                <div className={`w-10 h-10 rounded-lg ${kpi.color} text-white flex items-center justify-center shrink-0 font-black shadow-xs`}>
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

      {/* ─── 3. PAYMENTS AUDIT TABLE WITH CLEAN SAAS HEADER ──────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#2563EB]" />
            <span>Transaction Ledger ({filteredPayments.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Showing page {currentPage} of {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F9FAFB] text-[#5F6368] border-b border-slate-200 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Student Athlete</th>
                <th className="py-3 px-4">Program Manual</th>
                <th className="py-3 px-3">Gross Amount</th>
                <th className="py-3 px-3">Gateway Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Invoice Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-mono text-xs italic">
                    No transactions recorded matching search query.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                      {pay.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2088E7] flex items-center justify-center font-bold text-xs shrink-0">
                          <UserIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{pay.studentName}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{pay.studentEmail}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[200px] truncate">
                      {pay.courseTitle}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 text-xs">
                      {pay.amount === 0 ? 'Free' : `₹${pay.amount}`}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {pay.method || 'Razorpay'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● {pay.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(pay.date).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(pay)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#2088E7] border border-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between font-mono text-xs px-6 py-4 border-t border-border bg-slate-50/60 select-none">
          <span className="text-slate-500 font-semibold">
            Page {currentPage} of {totalPages} ({filteredPayments.length} Transactions)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 gap-1 text-xs font-bold rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 gap-1 text-xs font-bold rounded-lg"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Itemized Receipt Drawer Modal ──────────────────────────────── */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent
            isOpen={!!selectedInvoice}
            hideCloseButton={true}
            className="max-w-md bg-white border-2 border-border shadow-2xl rounded-2xl p-0 font-sans overflow-hidden corner-crosshair printable-invoice-modal"
          >
            {/* Header Banner */}
            <div className="relative overflow-hidden graph-paper-dense p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="sticker-tag-yellow text-[8px] uppercase tracking-wider mb-0.5 inline-block">
                    ● OFFICIAL TAX RECEIPT
                  </span>
                  <DialogTitle className="text-lg font-black text-[#202124]">
                    Receipt #{selectedInvoice.id}
                  </DialogTitle>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer no-print-invoice"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Billed Athlete:</span>
                  <span className="font-bold text-[#202124]">{selectedInvoice.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Email:</span>
                  <span className="font-bold text-[#202124]">{selectedInvoice.studentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Program Blueprint:</span>
                  <span className="font-bold text-[#202124]">{selectedInvoice.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Method:</span>
                  <span className="font-bold text-[#202124]">{selectedInvoice.method || 'Razorpay Demo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Date:</span>
                  <span className="font-bold text-[#202124]">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <span className="font-black text-[#202124] text-sm">Total Paid Amount:</span>
                <span className="text-xl font-black text-primary font-sans">
                  {selectedInvoice.amount === 0 ? 'FREE ACCESS' : `₹${selectedInvoice.amount}`}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border no-print-invoice">
                <Button
                  variant="outline"
                  onClick={handlePrintInvoice}
                  className="font-mono text-xs font-bold rounded-xl h-10 px-4 gap-2"
                  leftIcon={<Printer className="h-4 w-4" />}
                >
                  Print Receipt
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setSelectedInvoice(null)}
                  className="tactile-btn-primary rounded-xl h-10 px-5 text-xs font-mono font-bold bg-primary text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Payments;
