import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Award, ShieldCheck, Download, Users, ArrowLeft, BarChart3, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { syncApplicationsFromFirestore } from '../lib/memberDb';

interface NominationItem {
  id: string;
  nominee_first_name: string;
  nominee_last_name: string;
  statement: string;
  timestamp: string;
}

interface NomineeSummary {
  fullName: string;
  count: number;
  statements: string[];
}

export default function DeanNominationDashboard() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';

  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = userRole === 'admin' || normEmail === 'admin@orderofkpi.org';
  const isChair = normEmail === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || userRole.toLowerCase().includes('chair');
  const isBrian = normEmail === 'brian.johnson@orderofkpi.org';

  const canAccess = isAdmin || isChair || isBrian || userRole === 'Membership Committee';

  const [nominations, setNominations] = useState<NominationItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (canAccess) {
      syncApplicationsFromFirestore().catch(() => {}).finally(() => {
        fetchNominations();
      });
    }
  }, [canAccess]);

  const fetchNominations = async () => {
    try {
      const res = await fetch('/api/dean-nominations');
      const data = await res.json();
      if (data.success && Array.isArray(data.nominations)) {
        setNominations(data.nominations);
      }
    } catch (err) {
      console.error('Error fetching dean nominations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return <Navigate to="/member-portal" replace />;
  }

  // Aggregate nominations by nominee full name
  const summaryMap: Record<string, { count: number; statements: string[] }> = {};
  nominations.forEach((nom) => {
    const fullName = `${nom.nominee_first_name || ''} ${nom.nominee_last_name || ''}`.trim();
    if (!fullName) return;
    if (!summaryMap[fullName]) {
      summaryMap[fullName] = { count: 0, statements: [] };
    }
    summaryMap[fullName].count += 1;
    if (nom.statement) {
      summaryMap[fullName].statements.push(nom.statement);
    }
  });

  const rankedNominees: NomineeSummary[] = Object.keys(summaryMap)
    .map((fullName) => ({
      fullName,
      count: summaryMap[fullName].count,
      statements: summaryMap[fullName].statements
    }))
    .sort((a, b) => b.count - a.count);

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header background
    doc.setFillColor(30, 63, 32); // #1E3F20 Ivy
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(253, 252, 240);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INTAKE DEAN NOMINATION RESULTS', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11); // Gold
    doc.text('The Order of KPI — Confidential Committee Report', 105, 25, { align: 'center' });

    let y = 48;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Nominations Submitted: ${nominations.length}`, 14, y);
    doc.text(`Unique Nominees: ${rankedNominees.length}`, 120, y);
    y += 10;

    rankedNominees.forEach((nom, index) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Nominee banner
      doc.setFillColor(245, 243, 230);
      doc.rect(14, y - 5, 182, 10, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 63, 32);
      doc.text(`${index + 1}. ${nom.fullName}`, 16, y + 2);
      doc.text(`Total Votes: ${nom.count}`, 165, y + 2, { align: 'right' });
      y += 12;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Anonymized Nomination Statements:', 16, y);
      y += 6;

      nom.statements.forEach((stmt, sIdx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        const splitText = doc.splitTextToSize(`• "${stmt}"`, 175);
        doc.text(splitText, 18, y);
        y += (splitText.length * 4) + 4;
      });
      y += 6;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dean Nomination Report — Confidential — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save('Intake_Dean_Nomination_Report.pdf');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-24">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <MemberHeader />

        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E3F20] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Portal
          </Link>

          <button
            onClick={exportToPDF}
            className="bg-[#1E3F20] hover:bg-[#B8860B] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Download size={14} /> Export Results PDF
          </button>
        </div>

        {/* Header */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-full">
            <ShieldCheck size={14} className="text-[#B8860B]" />
            <span className="text-[10px] font-bold text-[#1E3F20] uppercase tracking-[0.2em]">
              Authorized Committee Dashboard
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1E3F20]">
            Dean Nomination Results
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
            Nominees for the Intake Dean position. Submitter identities are completely anonymous to ensure impartial evaluation and compliance with organizational governance standards.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-2xl p-5 space-y-2 mt-4 text-xs text-[#1E3F20]">
            <p className="font-bold uppercase tracking-wider text-[#B8860B]">Nomination Period & Timeline</p>
            <p><strong>Period:</strong> Monday, August 10, 2026 at 12:01 AM ET to Wednesday, August 12, 2026 at 9:08 PM ET.</p>
            <p><strong>Deadline:</strong> Dean nominations close strictly at <strong>9:08 PM ET on August 12, 2026</strong>.</p>
            <p className="pt-2 border-t border-[#B8860B]/20 text-gray-600">
              For questions regarding the dean nomination process, contact Membership Intake Chair <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a>.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#B8860B]/30 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#1E3F20] text-white flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Ballots Cast</p>
              <h3 className="text-3xl font-bold font-serif text-[#1E3F20] mt-1">{nominations.length}</h3>
            </div>
          </div>

          <div className="bg-white border border-[#B8860B]/30 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#B8860B] text-white flex items-center justify-center">
              <Award size={28} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Unique Nominees</p>
              <h3 className="text-3xl font-bold font-serif text-[#1E3F20] mt-1">{rankedNominees.length}</h3>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-bold text-[#1E3F20]">Ranked Nominees</h2>

          {loading ? (
            <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-12 text-center text-gray-500">
              Loading nomination results...
            </div>
          ) : rankedNominees.length === 0 ? (
            <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-12 text-center text-gray-500">
              No nominations have been submitted yet.
            </div>
          ) : (
            rankedNominees.map((nom, index) => (
              <div 
                key={nom.fullName}
                className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 shadow-[0_6px_24px_rgba(30,63,32,0.05)] space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B8860B]/20 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3F20] text-white flex items-center justify-center font-bold text-sm shadow">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif text-[#1E3F20]">{nom.fullName}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Intake Dean Nominee</p>
                    </div>
                  </div>

                  <div className="bg-[#B8860B]/10 border border-[#B8860B]/30 px-5 py-2.5 rounded-xl text-center">
                    <span className="text-xs font-bold text-[#B8860B] uppercase tracking-wider block">Nomination Count</span>
                    <span className="text-2xl font-bold font-serif text-[#1E3F20]">{nom.count}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#1E3F20]">
                    Anonymized Statements ({nom.statements.length})
                  </h4>
                  <div className="space-y-3">
                    {nom.statements.map((stmt, sIdx) => (
                      <div key={sIdx} className="bg-[#FDFCF0] border border-[#B8860B]/20 rounded-xl p-4 text-xs text-gray-700 italic leading-relaxed">
                        "{stmt}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
