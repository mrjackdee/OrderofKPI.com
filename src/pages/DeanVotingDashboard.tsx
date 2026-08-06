import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Award, Download, ArrowLeft, ShieldCheck, Users, BarChart2, RefreshCw } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { syncApplicationsFromFirestore } from '../lib/memberDb';

interface VoteTally {
  nominee_name: string;
  votes: number;
}

export default function DeanVotingDashboard() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = userEmail.toLowerCase().trim();
  const normalizedRole = (userRole || '').toLowerCase();
  
  const isAdmin = normEmail === 'admin@orderofkpi.org' || userRole === 'admin';
  const isChair = normEmail === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || normalizedRole.includes('chair') || isAdmin;
  const isBrian = normEmail === 'brian.johnson@orderofkpi.org';
  const isAuthorizedCommittee = userRole === 'Membership Committee' || normalizedRole.includes('membership committee') || normalizedRole.includes('committee') || isChair || isBrian || isAdmin;

  const [tallies, setTallies] = useState<VoteTally[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (isAuthorizedCommittee) {
      syncApplicationsFromFirestore().catch(() => {}).finally(() => {
        fetchVotingResults();
      });
    }
  }, [isAuthorizedCommittee]);

  const fetchVotingResults = async () => {
    try {
      const res = await fetch('/api/dean-votes');
      const data = await res.json();
      if (data.success && Array.isArray(data.votes)) {
        const countMap: Record<string, number> = {};
        let total = 0;
        data.votes.forEach((v: any) => {
          const name = v.nominee_name;
          if (!name) return;
          countMap[name] = (countMap[name] || 0) + 1;
          total += 1;
        });

        const list = Object.keys(countMap).map((nominee_name) => ({
          nominee_name,
          votes: countMap[nominee_name]
        })).sort((a, b) => b.votes - a.votes);

        setTallies(list);
        setTotalVotes(total);
      }
    } catch (err) {
      console.error('Error fetching dean voting results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorizedCommittee) {
    return <Navigate to="/member-portal" replace />;
  }

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(30, 63, 32);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(253, 252, 240);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INTAKE DEAN TEAM VOTING RESULTS', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11);
    doc.text('Aggregated Anonymized Results — Authorized Committee Access Only', 105, 24, { align: 'center' });

    let y = 45;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 63, 32);
    doc.text(`Total Ballots Cast: ${totalVotes}`, 14, y);
    y += 10;

    doc.text('Rank', 14, y);
    doc.text('Nominee Name', 35, y);
    doc.text('Total Votes', 160, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(184, 134, 11);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);

    tallies.forEach((tally, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`#${index + 1}`, 14, y);
      doc.text(tally.nominee_name, 35, y);
      doc.text(tally.votes.toString(), 160, y, { align: 'right' });
      y += 8;
    });

    doc.save('Intake_Dean_Voting_Results.pdf');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-24">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <MemberHeader />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E3F20] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Portal
          </Link>

          <button
            onClick={exportPDF}
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
            Intake Dean Voting Results
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
            Aggregated ranking of nominees for the Intake Dean position based on member ballots. Voter identities are completely anonymous to ensure impartial evaluation and compliance with organizational governance standards.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-2xl p-5 space-y-2 mt-4 text-xs text-[#1E3F20]">
            <p className="font-bold uppercase tracking-wider text-[#B8860B]">Timeline & Governance</p>
            <p><strong>Period:</strong> Monday, August 17, 2026 to Wednesday, August 19, 2026.</p>
            <p className="pt-2 border-t border-[#B8860B]/20 text-gray-600">
              For questions regarding the voting process, contact Membership Intake Chair <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a>.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-[#B8860B]/30 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-[#1E3F20]/5 rounded-2xl text-[#1E3F20]">
              <Users size={28} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Ballots Cast</p>
              <h3 className="text-3xl font-serif font-bold text-[#1E3F20] mt-1">{totalVotes}</h3>
            </div>
          </div>

          <div className="bg-white border border-[#B8860B]/30 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-[#B8860B]/10 rounded-2xl text-[#B8860B]">
              <Award size={28} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Qualified Nominees</p>
              <h3 className="text-3xl font-serif font-bold text-[#1E3F20] mt-1">{tallies.length}</h3>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-6">
          <h2 className="text-xl font-serif font-bold text-[#1E3F20] flex items-center gap-2">
            <BarChart2 size={20} className="text-[#B8860B]" />
            <span>Nominee Tallies & Rankings</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">Loading voting results...</div>
          ) : tallies.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">No ballots have been submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {tallies.map((tally, idx) => {
                const percentage = totalVotes > 0 ? Math.round((tally.votes / totalVotes) * 100) : 0;
                return (
                  <div key={tally.nominee_name} className="p-6 rounded-2xl bg-[#FDFCF0] border border-[#B8860B]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-[#1E3F20] text-white' : 'bg-[#B8860B]/20 text-[#1E3F20]'
                        }`}>
                          #{idx + 1}
                        </span>
                        <h4 className="font-serif font-bold text-lg text-[#1E3F20]">{tally.nominee_name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-serif font-bold text-[#1E3F20]">{tally.votes} votes</span>
                        <span className="text-xs text-gray-500 block">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#1E3F20] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
