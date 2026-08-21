import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Archive, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  BarChart2, 
  FileText, 
  Lock, 
  ArrowLeft, 
  CalendarDays, 
  Download, 
  ExternalLink,
  Clock,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import MemberHeader from '../components/MemberHeader';
import { syncApplicationsFromFirestore, normalizeUserRBAC } from '../lib/memberDb';
import { syncDeanDataFromFirestore, firebaseFetchAllDeanVotes, firebaseFetchAllDeanNominations } from '../lib/firebase';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';

interface VoteTally {
  nominee_name: string;
  votes: number;
}

interface NomineeRecord {
  fullName: string;
  firstName: string;
  lastName: string;
  count: number;
}

export default function GovernanceArchives() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = userEmail.toLowerCase().trim();

  const normUser = normalizeUserRBAC({
    email: userEmail,
    role: userRole
  });

  const isAdmin = normUser.role === 'admin' || normEmail === 'admin@orderofkpi.org' || normEmail === 'info@kpi2012.org';
  const isSuperChair = normUser.title === 'Super Committee Chair';
  const isChair = normEmail === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || isSuperChair || isAdmin;

  const [activeTab, setActiveTab] = useState<'voting' | 'nominations' | 'audits'>('voting');
  const [loading, setLoading] = useState(true);

  // Voting stats
  const [tallies, setTallies] = useState<VoteTally[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [eligibleEmails, setEligibleEmails] = useState<string[]>([
    "anthony.jones@orderofkpi.org",
    "brandon.owens@orderofkpi.org",
    "brian.johnson@orderofkpi.org",
    "brian.goings@orderofkpi.org",
    "darron.jenkins@orderofkpi.org",
    "denzel.talley@orderofkpi.org",
    "deshaun.safford@orderofkpi.org",
    "dominic.goodman@orderofkpi.org",
    "donald.mitchell@orderofkpi.org",
    "edward.cook@orderofkpi.org",
    "ishmeal.allensworth@orderofkpi.org",
    "jack.dee@orderofkpi.org",
    "james.haywood@orderofkpi.org",
    "jason.pilar@orderofkpi.org",
    "kameron.whitfield@orderofkpi.org",
    "keith.woods@orderofkpi.org",
    "tobias.bordley@orderofkpi.org"
  ]);

  // Nomination stats
  const [nomineesList, setNomineesList] = useState<NomineeRecord[]>([]);
  const [totalNominations, setTotalNominations] = useState(0);

  useEffect(() => {
    loadArchiveData();
  }, []);

  const loadArchiveData = async () => {
    setLoading(true);
    // Background sync
    syncDeanDataFromFirestore().catch(() => {});
    syncApplicationsFromFirestore().catch(() => {});

    // 1. Fetch eligible voters from sheet
    try {
      const sheetData = await getLiveGoogleSheetRoster();
      if (sheetData && Array.isArray(sheetData.eligibleVoters) && sheetData.eligibleVoters.length > 0) {
        setEligibleEmails(sheetData.eligibleVoters.filter(e => e.endsWith('@orderofkpi.org')));
      }
    } catch (e) {
      console.warn('Google sheet roster notice:', e);
    }

    // 2. Fetch Votes
    try {
      let voteList: any[] = [];
      try {
        const res = await fetch('/api/dean-votes');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.votes)) {
            voteList = json.votes;
          }
        }
      } catch (e) {}

      if (voteList.length === 0) {
        const fsRes = await firebaseFetchAllDeanVotes();
        if (fsRes.success && Array.isArray(fsRes.votes)) {
          voteList = fsRes.votes;
        }
      }

      // Aggregate vote tallies
      const counts: Record<string, number> = {};
      voteList.forEach(v => {
        const nom = v.nominee_name || 'Unknown';
        counts[nom] = (counts[nom] || 0) + 1;
      });

      const formattedTallies: VoteTally[] = Object.entries(counts)
        .map(([nominee_name, votes]) => ({ nominee_name, votes }))
        .sort((a, b) => b.votes - a.votes);

      setTallies(formattedTallies);
      setTotalVotes(voteList.length);
    } catch (e) {
      console.warn('Archive votes load error:', e);
    }

    // 3. Fetch Nominations
    try {
      let nomList: any[] = [];
      try {
        const res = await fetch('/api/dean-nominations');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.nominations)) {
            nomList = json.nominations;
          }
        }
      } catch (e) {}

      if (nomList.length === 0) {
        const fsRes = await firebaseFetchAllDeanNominations();
        if (fsRes.success && Array.isArray(fsRes.nominations)) {
          nomList = fsRes.nominations;
        }
      }

      const nomMap: Record<string, NomineeRecord> = {};
      nomList.forEach(n => {
        const fn = (n.nominee_first_name || '').trim();
        const ln = (n.nominee_last_name || '').trim();
        const full = `${fn} ${ln}`.trim();
        if (full) {
          const key = full.toLowerCase();
          if (!nomMap[key]) {
            nomMap[key] = { fullName: full, firstName: fn, lastName: ln, count: 1 };
          } else {
            nomMap[key].count += 1;
          }
        }
      });

      const sortedNominees = Object.values(nomMap).sort((a, b) => b.count - a.count);
      setNomineesList(sortedNominees);
      setTotalNominations(nomList.length);
    } catch (e) {
      console.warn('Archive nominations load error:', e);
    }

    setLoading(false);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(18, 44, 20); // Ivy color
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(212, 175, 55); // Gold color
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('THE ORDER OF KAPPA PI, INC.', 105, 14, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('FY27 Intake Dean Selection Archive & Certified Results', 105, 23, { align: 'center' });

      doc.setTextColor(18, 44, 20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL ELECTION RESULTS & SUMMARY', 20, 45);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Status: Completed & Archived`, 20, 53);
      doc.text(`Closure Date: August 20, 2026`, 20, 59);
      doc.text(`Total Ballots Cast: ${totalVotes}`, 20, 65);
      doc.text(`Eligible Voters: ${eligibleEmails.length} active financial members`, 20, 71);

      doc.setDrawColor(212, 175, 55);
      doc.line(20, 77, 190, 77);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(18, 44, 20);
      doc.text('VOTING OUTCOME SUMMARY', 20, 86);

      let yPos = 96;
      tallies.forEach((tally, idx) => {
        const pct = totalVotes > 0 ? ((tally.votes / totalVotes) * 100).toFixed(1) : '0';
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(18, 44, 20);
        doc.text(`${idx + 1}. ${tally.nominee_name}`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${tally.votes} votes (${pct}%)`, 150, yPos);
        yPos += 8;
      });

      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(18, 44, 20);
      doc.text('NOMINATIONS CONSOLIDATION', 20, yPos);
      yPos += 10;

      nomineesList.forEach((nom, idx) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(18, 44, 20);
        doc.text(`${idx + 1}. ${nom.fullName}`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${nom.count} nomination(s)`, 150, yPos);
        yPos += 8;
      });

      yPos += 15;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('Official election record saved in Order of KPI Chapter Archives.', 105, 275, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString()} by ${userEmail}`, 105, 280, { align: 'center' });

      doc.save('KPI_FY27_Intake_Dean_Election_Archive.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="w-full max-w-7xl mx-auto px-6 py-6 md:py-12 space-y-8">
        <MemberHeader />

        {/* Hero Header */}
        <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full">
              <Archive size={14} className="text-gold" />
              <span className="text-[10px] font-bold text-ivy uppercase tracking-[0.2em]">
                Organization Records & Archives
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight text-ivy">
              Past Elections & <span className="text-gold">Records</span>
            </h1>
            <p className="text-ivy/70 text-xs md:text-sm max-w-2xl leading-relaxed font-body">
              Permanent repository for completed organization elections, intake dean selections, and voting cycles. All records are finalized, certified, and timestamped for historical records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-5 py-3 rounded-2xl bg-ivy text-cream hover:bg-ivy/90 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-gold/30 shadow-md cursor-pointer"
            >
              <Download size={15} className="text-gold" /> Export Certified PDF
            </button>
            <Link
              to="/member-portal"
              className="px-5 py-3 rounded-2xl bg-cream/80 hover:bg-gold/10 text-ivy border border-gold/20 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} /> Member Portal
            </Link>
          </div>
        </div>

        {/* Sealed Status Banner */}
        <div className="bg-ivy text-cream p-6 rounded-2xl border border-gold/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gold/20 rounded-xl text-gold shrink-0 border border-gold/30">
              <Lock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-cream uppercase tracking-wider">
                  FY27 Intake Dean Election: Finalized & Archived
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-gold text-ivy font-bold uppercase tracking-widest">
                  Completed
                </span>
              </div>
              <p className="text-cream/70 text-xs mt-1">
                Concluded on August 20, 2026. Official results have been finalized and archived into permanent organization records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-gold/20 pt-3 md:pt-0 md:pl-6 shrink-0 text-xs">
            <div>
              <p className="text-cream/40 text-[10px] uppercase tracking-widest">Total Ballots</p>
              <p className="text-gold font-bold font-mono text-lg">{totalVotes}</p>
            </div>
            <div>
              <p className="text-cream/40 text-[10px] uppercase tracking-widest">Nominees Slate</p>
              <p className="text-gold font-bold font-mono text-lg">{nomineesList.length}</p>
            </div>
            <div>
              <p className="text-cream/40 text-[10px] uppercase tracking-widest">Participation</p>
              <p className="text-gold font-bold font-mono text-lg">
                {eligibleEmails.length > 0 ? `${((totalVotes / eligibleEmails.length) * 100).toFixed(0)}%` : '100%'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gold/20 pb-4">
          <button
            onClick={() => setActiveTab('voting')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'voting'
                ? 'bg-ivy text-cream shadow-md border border-gold/30'
                : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
            }`}
          >
            <Award size={15} className={activeTab === 'voting' ? 'text-gold' : ''} />
            Election Results
          </button>

          <button
            onClick={() => setActiveTab('nominations')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'nominations'
                ? 'bg-ivy text-cream shadow-md border border-gold/30'
                : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
            }`}
          >
            <Users size={15} className={activeTab === 'nominations' ? 'text-gold' : ''} />
            Nominations & Tally
          </button>

          {(isAdmin || isChair) && (
            <button
              onClick={() => setActiveTab('audits')}
              className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'audits'
                  ? 'bg-ivy text-cream shadow-md border border-gold/30'
                  : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
              }`}
            >
              <ShieldCheck size={15} className={activeTab === 'audits' ? 'text-gold' : ''} />
              Ballot & Voting Logs
            </button>
          )}
        </div>

        {/* TAB 1: OFFICIAL VOTING RESULTS */}
        {activeTab === 'voting' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-ivy uppercase tracking-wider flex items-center gap-2">
                    <Award className="text-gold" size={20} />
                    FY27 Intake Dean Voting Results
                  </h3>
                  <p className="text-ivy/60 text-xs mt-1">
                    Final certified ballot tallies submitted during the formal membership election window.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/50 bg-cream px-3 py-1.5 rounded-xl border border-gold/10">
                    {totalVotes} Total Ballots Counted
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-ivy/60 font-mono text-sm">
                  Loading verified election archives...
                </div>
              ) : tallies.length === 0 ? (
                <div className="py-16 text-center text-ivy/50 space-y-2">
                  <Award size={36} className="mx-auto text-gold/40" />
                  <p className="font-bold text-sm text-ivy">No votes recorded for this archived cycle.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tallies.map((tally, idx) => {
                    const percentage = totalVotes > 0 ? (tally.votes / totalVotes) * 100 : 0;
                    const isWinner = idx === 0 && tally.votes > 0;

                    return (
                      <div
                        key={tally.nominee_name}
                        className={`p-5 rounded-2xl border transition-all ${
                          isWinner
                            ? 'bg-gold/5 border-gold/40 shadow-sm'
                            : 'bg-white border-gold/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isWinner ? 'bg-gold text-ivy' : 'bg-cream text-ivy/70'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="font-display font-bold text-base text-ivy flex items-center gap-2">
                                {tally.nominee_name}
                                {isWinner && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-ivy text-gold font-bold uppercase tracking-widest">
                                    Elected Intake Dean
                                  </span>
                                )}
                              </h4>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-base text-ivy">
                              {tally.votes} <span className="text-xs text-ivy/50 font-normal">vote(s)</span>
                            </span>
                            <span className="text-xs text-gold font-bold ml-2 font-mono">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-cream rounded-full h-3 overflow-hidden border border-gold/10">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isWinner ? 'bg-gold' : 'bg-ivy/60'
                            }`}
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
        )}

        {/* TAB 2: NOMINATIONS SLATE */}
        {activeTab === 'nominations' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-ivy uppercase tracking-wider flex items-center gap-2">
                    <Users className="text-gold" size={20} />
                    FY27 Intake Dean Nominations Archive
                  </h3>
                  <p className="text-ivy/60 text-xs mt-1">
                    Consolidated record of all nominated members and submission tallies received during the nomination round.
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/50 bg-cream px-3 py-1.5 rounded-xl border border-gold/10">
                  {totalNominations} Total Nominations Logged
                </span>
              </div>

              {loading ? (
                <div className="py-16 text-center text-ivy/60 font-mono text-sm">
                  Loading nomination records...
                </div>
              ) : nomineesList.length === 0 ? (
                <div className="py-16 text-center text-ivy/50 space-y-2">
                  <Users size={36} className="mx-auto text-gold/40" />
                  <p className="font-bold text-sm text-ivy">No nomination records archived.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nomineesList.map((nom, idx) => (
                    <div
                      key={nom.fullName}
                      className="p-5 bg-cream/30 rounded-2xl border border-gold/20 flex items-center justify-between gap-3 shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ivy text-gold flex items-center justify-center font-bold text-xs">
                          {nom.firstName.charAt(0)}{nom.lastName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-ivy">{nom.fullName}</h4>
                          <p className="text-[10px] text-ivy/50 uppercase tracking-wider">Nominated Leader</p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="px-2.5 py-1 bg-gold/15 text-ivy rounded-lg text-xs font-bold border border-gold/20">
                          {nom.count} Nom{nom.count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BALLOT & VOTING LOGS */}
        {activeTab === 'audits' && (isAdmin || isChair) && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-6">
              <div>
                <h3 className="font-display font-bold text-lg text-ivy uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="text-gold" size={20} />
                  Ballot & Voting Logs
                </h3>
                <p className="text-ivy/60 text-xs mt-1">
                  Officer tools for reviewing election turnout, submitted ballots, and voter participation records.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/dean-voting-dashboard"
                  className="p-6 bg-cream/30 hover:bg-gold/10 border border-gold/20 rounded-2xl flex items-start justify-between gap-4 transition-all group shadow-soft"
                >
                  <div className="space-y-2">
                    <div className="p-2.5 bg-ivy text-gold rounded-xl w-fit">
                      <Award size={20} />
                    </div>
                    <h4 className="font-display font-bold text-base text-ivy group-hover:text-gold transition-colors">
                      Dean Voting Results Dashboard
                    </h4>
                    <p className="text-ivy/60 text-xs leading-relaxed">
                      Detailed voting breakdown, candidate bar metrics, and real-time voter turnout percentage tracker.
                    </p>
                  </div>
                  <ExternalLink size={18} className="text-ivy/40 group-hover:text-ivy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </Link>

                <Link
                  to="/dean-nomination-dashboard"
                  className="p-6 bg-cream/30 hover:bg-gold/10 border border-gold/20 rounded-2xl flex items-start justify-between gap-4 transition-all group shadow-soft"
                >
                  <div className="space-y-2">
                    <div className="p-2.5 bg-ivy text-gold rounded-xl w-fit">
                      <Users size={20} />
                    </div>
                    <h4 className="font-display font-bold text-base text-ivy group-hover:text-gold transition-colors">
                      Dean Nomination Results Dashboard
                    </h4>
                    <p className="text-ivy/60 text-xs leading-relaxed">
                      Comprehensive nominee tallies, submissions count, and nomination participation metrics.
                    </p>
                  </div>
                  <ExternalLink size={18} className="text-ivy/40 group-hover:text-ivy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/dean-voting-audit"
                      className="p-6 bg-cream/30 hover:bg-gold/10 border border-gold/20 rounded-2xl flex items-start justify-between gap-4 transition-all group shadow-soft"
                    >
                      <div className="space-y-2">
                        <div className="p-2.5 bg-gold text-ivy rounded-xl w-fit">
                          <ShieldCheck size={20} />
                        </div>
                        <h4 className="font-display font-bold text-base text-ivy group-hover:text-gold transition-colors">
                          Dean Voting Audit Log
                        </h4>
                        <p className="text-ivy/60 text-xs leading-relaxed">
                          Complete administrative audit trail mapping authenticated voter emails to submitted ballots.
                        </p>
                      </div>
                      <ExternalLink size={18} className="text-ivy/40 group-hover:text-ivy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </Link>

                    <Link
                      to="/dean-audit-dashboard"
                      className="p-6 bg-cream/30 hover:bg-gold/10 border border-gold/20 rounded-2xl flex items-start justify-between gap-4 transition-all group shadow-soft"
                    >
                      <div className="space-y-2">
                        <div className="p-2.5 bg-gold text-ivy rounded-xl w-fit">
                          <ShieldCheck size={20} />
                        </div>
                        <h4 className="font-display font-bold text-base text-ivy group-hover:text-gold transition-colors">
                          Dean Nomination Audit Log
                        </h4>
                        <p className="text-ivy/60 text-xs leading-relaxed">
                          Administrative nominee submission verification logs and individual nomination record auditing.
                        </p>
                      </div>
                      <ExternalLink size={18} className="text-ivy/40 group-hover:text-ivy group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
