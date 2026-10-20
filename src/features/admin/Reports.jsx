import React, { useState } from 'react';
import { useLmsStore } from '../../stores/lmsStore';
import { useToast } from '../../hooks/useToast';
import { FileSpreadsheet, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';

export const Reports = () => {
  const { success } = useToast();
  const { courses, enrollments, payments, certificates, syncFromSupabase } = useLmsStore();

  React.useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  const [reportType, setReportType] = useState('users');
  const [reportData, setReportData] = useState([]);

  const handleGenerateReport = () => {
    if (reportType === 'users') {
      const mockUsers = JSON.parse(localStorage.getItem('_lms_mock_users') || '[]');
      const formatted = mockUsers.map((u) => {
        const enrols = enrollments.filter(e => e.userId === u.id).length;
        const certs = certificates.filter(c => c.userId === u.id).length;
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: u.status || 'active',
          enrolled: enrols,
          certificates: certs,
          date: new Date(u.createdAt || Date.now()).toLocaleDateString()
        };
      });
      setReportData(formatted);
    } else if (reportType === 'courses') {
      const formatted = courses.map((c) => {
        const studentCount = c.students || 0;
        const lessons = c.modules?.flatMap(m => m.lessons || []).length || 0;
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          instructor: c.instructor,
          price: c.price === 0 ? 'Free' : `₹${c.price}`,
          lessons,
          students: studentCount,
          rating: c.rating
        };
      });
      setReportData(formatted);
    } else if (reportType === 'revenue') {
      const formatted = payments.map((p) => ({
        id: p.id,
        name: p.studentName,
        email: p.studentEmail,
        course: p.courseTitle,
        amount: `₹${p.amount}`,
        method: p.method,
        status: p.status,
        date: new Date(p.date).toLocaleDateString()
      }));
      setReportData(formatted);
    } else if (reportType === 'certificates') {
      const formatted = certificates.map((c) => ({
        id: c.id,
        name: c.fullName,
        course: c.courseTitle,
        date: new Date(c.date).toLocaleDateString()
      }));
      setReportData(formatted);
    }
    success('Report generated successfully!');
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Get headers
    const headers = Object.keys(reportData[0]);
    csvContent += headers.join(',') + '\n';

    reportData.forEach((row) => {
      const values = headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvContent += values.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Spreadsheet exported successfully!');
  };

  return (
    <div className="space-y-6 font-sans pb-16 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-main">Business Reports</h1>
          <p className="text-xs text-text-secondary">Generate and export audits on platform users, course catalogs, revenues, and degrees</p>
        </div>
      </div>

      {/* Reports Configurator card */}
      <Card className="border-border bg-white">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4 justify-between select-none">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider shrink-0">Report Scope:</span>
            <select
              value={reportType}
              onChange={e => {
                setReportType(e.target.value);
                setReportData([]);
              }}
              className="bg-background border border-border text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-text-main font-semibold w-full sm:w-48"
            >
              <option value="users">User Database Register</option>
              <option value="courses">Syllabus Catalog Metrics</option>
              <option value="revenue">Payments Ledger Audit</option>
              <option value="certificates">Issued Degree Registry</option>
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReport}
              className="gap-1.5 text-xs justify-center flex-1 sm:flex-none"
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              <span>Compile Report</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={reportData.length === 0}
              className="gap-1.5 text-xs justify-center flex-1 sm:flex-none"
              leftIcon={<Download className="h-4 w-4" />}
            >
              <span>Download CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Data Preview Grid */}
      <Card className="border-border overflow-hidden bg-white">
        <CardHeader className="py-4 border-b border-border/80 bg-gray-50/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart2 className="h-4.5 w-4.5 text-primary" /> Compiled Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reportData.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary italic">
              Select report scope and click &quot;Compile Report&quot; to inspect credentials.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(reportData[0]).map((header) => (
                      <TableHead key={header} className="capitalize">{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, rIdx) => (
                    <TableRow key={rIdx}>
                      {Object.values(row).map((val, cIdx) => (
                        <TableCell key={cIdx} className="text-xs font-semibold text-text-main max-w-[200px] truncate">
                          {typeof val === 'boolean' ? val.toString() : val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Reports;
