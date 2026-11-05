import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLmsStore } from '../../stores/lmsStore';
import { verifyCertificate } from '../../services/certificateService';
import { ArrowLeft, Printer, Award, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const CertificatePage = () => {
  const { certId } = useParams();
  const navigate = useNavigate();
  const { certificates } = useLmsStore();

  const storeCert = certificates.find(
    (c) => c.id === certId || String(c.id).toLowerCase() === String(certId).toLowerCase()
  );

  const [dbCert, setDbCert] = useState(null);
  const [loading, setLoading] = useState(!storeCert);
  const [isVerifiedFromDb, setIsVerifiedFromDb] = useState(false);

  useEffect(() => {
    let active = true;

    if (storeCert) {
      setLoading(false);
      return;
    }

    if (certId) {
      setLoading(true);
      verifyCertificate(certId)
        .then((res) => {
          if (active) {
            if (res?.success && res.data) {
              setDbCert(res.data);
              setIsVerifiedFromDb(true);
            } else {
              setDbCert(null);
            }
          }
        })
        .catch(() => {
          if (active) setDbCert(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [certId, storeCert]);

  const cert = storeCert || dbCert;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center graph-paper-bg text-[#202124] font-sans space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-tactile-sm animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">
          [ Verifying Official Accreditation Credential... ]
        </p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 font-sans graph-paper-bg text-[#202124] p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-2 shadow-sm">
          <ShieldCheck className="h-7 w-7 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-[#202124]">Credential Not Found</h2>
        <p className="font-mono text-xs text-slate-500 max-w-md leading-relaxed">
          The requested certificate identifier <span className="font-bold text-slate-800 font-mono">[{certId}]</span> could not be verified in the ACFIT accreditation ledger. Please check the URL or contact academy administration.
        </p>
        <Link to="/" className="mt-2 text-primary hover:underline text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
          <ArrowLeft className="h-4 w-4" /> [ Return to Academy Catalog ]
        </Link>
      </div>
    );
  }

  const issueDate = cert.issuedAt || cert.date || cert.created_at || new Date().toISOString();
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen graph-paper-bg font-sans py-6 px-3 sm:py-12 sm:px-6 flex flex-col items-center text-[#202124]">
      {/* Embedded print overrides style sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-certificate-container {
            border: 4px solid #0F172A !important;
            box-shadow: none !important;
            margin: 0 !important;
            transform: scale(1) !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Top action header */}
      <div className="max-w-4xl w-full flex items-center justify-between mb-6 sm:mb-8 no-print gap-2">
        <button onClick={() => navigate(-1)} className="font-mono text-xs sm:text-sm text-slate-600 hover:text-[#202124] font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
          <ArrowLeft className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">[ RETURN TO LEARNING PORTAL ]</span>
          <span className="sm:hidden">[ BACK ]</span>
        </button>
        <Button variant="primary" size="sm" onClick={handlePrint} className="font-mono font-bold text-xs h-9 px-3 sm:px-4 rounded-xl shadow-tactile-sm bg-primary text-white shrink-0" leftIcon={<Printer className="h-4 w-4" />}>
          Print / Save PDF
        </Button>
      </div>

      {/* Certificate Frame wrapper */}
      <div className="max-w-4xl w-full border-2 border-[#2563EB] bg-white shadow-tactile p-4 sm:p-12 print-certificate-container relative rounded-2xl corner-crosshair">
        
        {/* Certificate Watermark background */}
        <div className="absolute inset-0 graph-paper-dense opacity-20 pointer-events-none rounded-2xl" />

        <div className="flex flex-col items-center text-center justify-between min-h-[420px] relative z-10 space-y-8">
          
          {/* Certificate header logo */}
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center mx-auto shadow-tactile-sm">
              <Award className="h-7 w-7" />
            </div>
            <span className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-slate-800 uppercase block">
              [ OFFICIAL BLUEPRINT ACCREDITATION // ACFIT ACADEMY ]
            </span>
          </div>

          {/* Certificate main credentials */}
          <div className="space-y-4">
            <span className="font-mono text-xs text-slate-500 uppercase tracking-wider block">This technical artifact certifies that</span>
            <h1 className="text-3xl sm:text-5xl font-black text-[#202124] tracking-tight">
              {cert.fullName}
            </h1>
            <p className="font-mono text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed uppercase tracking-wide">
              has completed all structured modules, passed all exam knowledge checks, and verified competency in:
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-accent tracking-tight">
              {cert.courseTitle}
            </h2>
          </div>

          {/* Certificate footer metadata */}
          <div className="w-full pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600">
            <div className="text-left space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Issue Timestamp</span>
              <span className="font-bold text-[#202124]">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="sticker-tag-red text-[10px]">● 100% ACCREDITED</span>
              {isVerifiedFromDb && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-600" /> PUBLICLY VERIFIED
                </span>
              )}
              {cert.score && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                  EXAM SCORE: {cert.score}%
                </span>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Credential Seal ID</span>
              <span className="font-bold text-[#202124] select-all">{cert.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;
