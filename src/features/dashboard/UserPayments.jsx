import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLmsStore } from '../../stores/lmsStore';
import { useUserPayments } from '../../hooks/usePayments';
import {
  DollarSign,
  CreditCard,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Search,
  Receipt,
  Printer,
  X,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

export const UserPayments = () => {
  const { user } = useAuth();
  const syncFromSupabase = useLmsStore((s) => s.syncFromSupabase);
  const { data: userPayments = [], isLoading } = useUserPayments(user);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (syncFromSupabase) {
      syncFromSupabase(user);
    }
  }, [syncFromSupabase, user]);

  // Filter payments by search query
  const filteredPayments = useMemo(() => {
    if (!search.trim()) return userPayments;
    const q = search.toLowerCase();
    return userPayments.filter(
      (p) =>
        (p.courseTitle || p.course_title || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.razorpayPaymentId || '').toLowerCase().includes(q) ||
        (p.method || '').toLowerCase().includes(q)
    );
  }, [userPayments, search]);

  const totalSpent = useMemo(
    () => userPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
    [userPayments]
  );

  const handleExportCSV = () => {
    if (userPayments.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Transaction ID,Course Title,Amount (INR),Payment Method,Status,Date\n';

    userPayments.forEach((p) => {
      const payDate = new Date(p.date || p.createdAt || p.created_at || Date.now()).toLocaleDateString();
      const row = `"${p.id || ''}","${p.courseTitle || p.course_title || ''}",${p.amount || 0},"${p.method || 'Razorpay'}","${p.status || 'successful'}","${payDate}"`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `acfit_academy_receipts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* ─── Printable Styles Override ────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-invoice, .printable-invoice * {
            visibility: visible;
          }
          .printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `
        }}
      />

      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent">[ BILLING & RECEIPTS ]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight flex items-center gap-2 mt-1">
            <CreditCard className="h-7 w-7 text-[#202124]" /> Enrollment Receipts
          </h1>
          <p className="font-mono text-xs text-slate-500 font-medium mt-0.5">
            Verified course purchase invoices, payment transaction logs & tax receipts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userPayments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 font-mono text-xs font-bold border-border bg-white hover:bg-slate-50 rounded-xl h-9 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          <span className="sticker-tag-red text-[10px] px-3 py-1 font-mono font-bold">
            ● {userPayments.length} INVOICES
          </span>
        </div>
      </div>

      {/* ─── KPI Stats Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tactile-card rounded-2xl p-4 bg-white corner-crosshair border border-border">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">[ TOTAL INVESTMENT ]</span>
            <span className="sticker-tag-yellow text-[8px]">PAID</span>
          </div>
          <div className="text-2xl font-black text-[#202124] mt-2 font-mono">₹{totalSpent.toLocaleString()}</div>
          <span className="font-mono text-[10px] text-slate-500 mt-1 block">Lifetime course tuition</span>
        </div>

        <div className="tactile-card rounded-2xl p-4 bg-white corner-crosshair border border-border">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">[ VERIFIED RECEIPTS ]</span>
            <span className="sticker-tag-cyan text-[8px]">AUDITED</span>
          </div>
          <div className="text-2xl font-black text-[#202124] mt-2 font-mono">{userPayments.length}</div>
          <span className="font-mono text-[10px] text-slate-500 mt-1 block">Purchased program blueprints</span>
        </div>

        <div className="tactile-card rounded-2xl p-4 bg-white corner-crosshair border border-border">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">[ GATEWAY STATUS ]</span>
            <span className="sticker-tape-pink text-[8px]">VERIFIED</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-sans flex items-center gap-1.5 text-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Active & Synced
          </div>
          <span className="font-mono text-[10px] text-slate-500 mt-1 block">Razorpay signature verified</span>
        </div>
      </div>

      {/* ─── Search Input ──────────────────────────────────────── */}
      {userPayments.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search invoice by program title, method or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-border text-xs text-[#202124] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] placeholder:text-slate-400 transition-all shadow-sm"
          />
        </div>
      )}

      {/* ─── Receipts Table ────────────────────────────────────── */}
      <div className="tactile-card rounded-2xl bg-white overflow-hidden corner-crosshair border border-border shadow-tactile">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#2563EB] text-white font-mono uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Program Blueprint</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">Gateway / Method</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4 text-right">Receipt Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-semibold text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono animate-pulse">
                    Syncing payment records...
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((p, idx) => {
                  const rawDate = p.date || p.createdAt || p.created_at || p.paidAt;
                  const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString();
                  const txnId = p.razorpayPaymentId || p.id || `PAY-${idx + 1}`;

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-[#202124] font-bold max-w-[160px] truncate">
                        {txnId}
                      </td>
                      <td className="p-4 text-[#202124] font-bold">
                        {p.courseTitle || p.course_title || 'Gym Program Blueprint'}
                      </td>
                      <td className="p-4 font-mono font-black text-[#202124] text-sm">
                        {p.amount === 0 ? 'Free' : `₹${p.amount}`}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600">
                        <span className="sticker-tag-cyan text-[8px] uppercase inline-block">
                          {p.method || 'Razorpay'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {formattedDate}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(p)}
                          className="gap-1.5 font-mono text-xs font-bold text-[#202124] border-border hover:bg-slate-100 rounded-xl h-8 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-mono italic">
                    {search ? 'No receipts match your search query.' : 'No enrollment payment records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Receipt Inspection Modal ──────────────────────────── */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-xl p-0 rounded-2xl overflow-hidden bg-white border border-border shadow-2xl printable-invoice font-sans">
            <DialogHeader className="p-6 bg-[#2563EB] text-white flex flex-row items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-accent" />
                  <DialogTitle className="text-lg font-black tracking-tight text-white">
                    Official Payment Receipt
                  </DialogTitle>
                </div>
                <p className="font-mono text-xs text-slate-400 mt-0.5">
                  ACFIT Academy LMS Financial Verification Statement
                </p>
              </div>

              <button
                onClick={() => setSelectedInvoice(null)}
                className="no-print p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#1D4ED8] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogHeader>

            <div className="p-6 space-y-6 text-slate-800">
              {/* Top Banner Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-xs text-emerald-900">Payment Processed Successfully</span>
                </div>
                <span className="sticker-tag-yellow text-[9px] uppercase font-mono font-bold">
                  {selectedInvoice.status || 'PAID'}
                </span>
              </div>

              {/* Invoice Particulars Grid */}
              <div className="grid grid-cols-2 gap-4 font-mono text-xs border-b border-border pb-6">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction ID</span>
                  <span className="font-bold text-[#202124] block mt-0.5">
                    {selectedInvoice.razorpayPaymentId || selectedInvoice.id || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Date</span>
                  <span className="font-bold text-[#202124] block mt-0.5">
                    {new Date(selectedInvoice.date || selectedInvoice.createdAt || selectedInvoice.created_at || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Email</span>
                  <span className="font-bold text-[#202124] block mt-0.5">
                    {selectedInvoice.studentEmail || user?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Gateway</span>
                  <span className="font-bold text-[#202124] block mt-0.5">
                    {selectedInvoice.method || 'Razorpay Gateway'}
                  </span>
                </div>
              </div>

              {/* Line Item Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 font-mono text-[10px] font-bold text-slate-500 uppercase flex justify-between border-b border-border">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-4 flex justify-between items-center font-sans">
                  <div>
                    <h4 className="font-black text-[#202124] text-sm">{selectedInvoice.courseTitle || selectedInvoice.course_title || 'Gym Program Blueprint'}</h4>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">Full Lifetime Access & Digital Certification</p>
                  </div>
                  <span className="font-mono font-black text-[#202124] text-base">
                    {selectedInvoice.amount === 0 ? 'Free' : `₹${selectedInvoice.amount}`}
                  </span>
                </div>
              </div>

              {/* Total Paid */}
              <div className="flex justify-between items-center p-4 bg-[#2563EB] text-white rounded-xl font-mono">
                <span className="text-xs font-bold uppercase">Total Charged</span>
                <span className="text-xl font-black text-accent">
                  {selectedInvoice.amount === 0 ? '₹0.00 (FREE)' : `₹${selectedInvoice.amount} INR`}
                </span>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 border-t border-border flex flex-row items-center justify-between no-print">
              <span className="font-mono text-[10px] text-slate-500">
                ACFIT Academy Payment ID: {selectedInvoice.id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 font-mono text-xs font-bold border-border bg-white rounded-xl cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  className="font-mono text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserPayments;
