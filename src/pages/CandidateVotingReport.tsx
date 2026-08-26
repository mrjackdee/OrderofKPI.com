import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  BarChart3, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { 
  firebaseFetchAllCandidateVotes, 
  syncCandidateVotesFromFirestore 
} from '../lib/firebase';
import { normalizeUserRBAC, isCommitteeChair } from '../lib/memberDb';
import { 
  calculateApproval, 
  determineVotingStatus, 
  formatSyncTimestamp,
  aggregateCandidateVotes,
  VotingStatusState 
} from '../utils/reconciliation';

interface CandidateResult {
  candidateId: string;
  candidateName: string;
  yesVotes: number;
  noVotes: number;
  totalVotesCast: number;
  approvalPercentage: number;
  passed: boolean;
}

export default function CandidateVotingReport() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = userEmail.toLowerCase().trim();
  
  let userCommittees: string[] = [];
  let userCommitteeRoles: Record<string, string> = {};
  try {
    const rawCommittees = sessionStorage.getItem('userCommittees');
    if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
    const rawRoles = sessionStorage.getItem('userCommitteeRoles');
    if (rawRoles) userCommitteeRoles = JSON.parse(rawRoles);
  } catch (e) {}

  const normUser = normalizeUserRBAC({
    email: normEmail,
    role: userRole,
    committees: userCommittees,
    committeeRoles: userCommitteeRoles
  });

  const isAdmin = normUser.role === 'admin' || normEmail === 'admin@orderofkpi.org' || normEmail === 'qa.admin@orderofkpi.org';
  const isMembershipIntakeChair = 
    userRole === 'Membership Committee Chair' || 
    userRole === 'Membership Intake Chair' || 
    isCommitteeChair('membership_intake', normUser) || 
    normEmail === 'james.haywood@orderofkpi.org';
  const isBrian = normEmail === 'brian.johnson@orderofkpi.org';
  
  const hasAccess = isAdmin || isMembershipIntakeChair || isBrian;

  if (!hasAccess) {
    return <Navigate to="/member-portal" replace />;
  }

  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [votingStatusState, setVotingStatusState] = useState<VotingStatusState>('NO_BALLOTS');
  const [hasFetchError, setHasFetchError] = useState(false);
  const [totalSelectionCandidates, setTotalSelectionCandidates] = useState(0);

  const fetchReportData = async () => {
    try {
      setHasFetchError(false);
      let allRawVotes: any[] = [];
      let candidatesList: any[] = [];
      const [serverRes, fsRes, candRes] = await Promise.allSettled([
        fetch('/api/candidate-votes').then(r => r.json()),
        firebaseFetchAllCandidateVotes(),
        fetch('/api/candidates').then(r => r.json())
      ]);

      if (serverRes.status === 'fulfilled' && serverRes.value?.success && Array.isArray(serverRes.value.votes)) {
        allRawVotes.push(...serverRes.value.votes);
      }
      if (fsRes.status === 'fulfilled' && fsRes.value?.success && Array.isArray(fsRes.value.votes)) {
        allRawVotes.push(...fsRes.value.votes);
      }
      
      if (candRes.status === 'fulfilled' && candRes.value?.success && Array.isArray(candRes.value.candidates)) {
        candidatesList = candRes.value.candidates.filter((c: any) => c.status && c.status.toLowerCase() === 'selection');
      }

      const aggregated = aggregateCandidateVotes(candidatesList, allRawVotes);
      setTotalSelectionCandidates(candidatesList.length || aggregated.length);
      setResults(aggregated);
      setLastSyncedAt(formatSyncTimestamp(new Date()));

      const totalBallotsCount = aggregated.reduce((sum, r) => sum + r.totalVotesCast, 0);
      const statusState = determineVotingStatus(
        false,
        candidatesList.length || aggregated.length,
        totalBallotsCount,
        false,
        true
      );
      setVotingStatusState(statusState);

    } catch (err) {
      console.error('Error fetching candidate voting report:', err);
      setHasFetchError(true);
      setVotingStatusState('DATA_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncCandidateVotesFromFirestore().catch(() => {});
    await fetchReportData();
    setIsSyncing(false);
  };

  useEffect(() => {
    if (hasAccess) {
      fetchReportData();
      syncCandidateVotesFromFirestore().then(() => fetchReportData());
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return <Navigate to="/member-portal" replace />;
  }

  const totalBallotsRecorded = results.reduce((sum, r) => sum + r.totalVotesCast, 0);
  const totalYesVotesRecorded = results.reduce((sum, r) => sum + r.yesVotes, 0);
  const totalNoVotesRecorded = results.reduce((sum, r) => sum + r.noVotes, 0);
  const isExportDisabled = results.length === 0 || totalBallotsRecorded === 0;

  const exportPDF = () => {
    if (isExportDisabled) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FY27 Candidate Voting Roll-Up Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Last Synced: ${lastSyncedAt || new Date().toLocaleString()}`, 14, 34);
    doc.text(`Passing Threshold: 50.1% of Total Votes Cast (For + Against)`, 14, 40);

    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.text("Candidate Name", 14, y);
    doc.text("For", 90, y);
    doc.text("Against", 115, y);
    doc.text("Total Cast", 140, y);
    doc.text("Approval %", 165, y);
    doc.text("Status", 185, y);

    y += 6;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    results.forEach((r) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(r.candidateName.substring(0, 30), 14, y);
      doc.text(r.yesVotes.toString(), 90, y);
      doc.text(r.noVotes.toString(), 115, y);
      doc.text(r.totalVotesCast.toString(), 140, y);
      doc.text(`${r.approvalPercentage.toFixed(1)}%`, 165, y);
      doc.text(r.passed ? "PASS" : "FAIL", 185, y);
      y += 8;
    });

    doc.save("FY27_Candidate_Voting_Report.pdf");
  };

  const getStatusBadgeUI = () => {
    switch (votingStatusState) {
      case 'OPEN':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Voting Is Open',
          icon: CheckCircle
        };
      case 'NO_BALLOTS':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'No Ballots Submitted',
          icon: Clock
        };
      case 'NOT_STARTED':
        return {
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          label: 'Voting Has Not Started',
          icon: Clock
        };
      case 'FINALIZED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          label: 'Voting Finalized',
          icon: CheckCircle2
        };
      case 'DATA_UNAVAILABLE':
      default:
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          label: 'Data Unavailable',
          icon: AlertCircle
        };
    }
  };

  const statusUI = getStatusBadgeUI();
  const StatusIconComp = statusUI.icon;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <MemberHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Member Portal
          </Link>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center px-3.5 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
              title={lastSyncedAt ? `Last Synced: ${lastSyncedAt}` : 'Sync latest votes'}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin text-amber-700' : 'text-stone-500'}`} />
              {isSyncing ? 'Syncing...' : 'Sync Latest Votes'}
            </button>

            <div className="relative group">
              <button
                onClick={exportPDF}
                disabled={isExportDisabled}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs ${
                  isExportDisabled 
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                    : 'bg-amber-700 text-white hover:bg-amber-800 cursor-pointer'
                }`}
              >
                <Download className="w-4 h-4 mr-2" /> Export Report PDF
              </button>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        {lastSyncedAt && (
          <div className="mb-4 text-right text-xs text-stone-500 font-mono">
            Last successful synchronization: <span className="font-semibold text-stone-700">{lastSyncedAt}</span>
          </div>
        )}

        {isExportDisabled && !loading && (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Export Unavailable:</strong> No recorded candidate votes exist for FY27 to generate a PDF report. Submit votes in the Selection Voting portal to populate report data.</span>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-stone-900">FY27 Candidate Voting Report</h1>
                <p className="text-sm text-stone-600">Candidate approval rollup report calculated at the 50.1% majority threshold (For + Against).</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusUI.bg}`}>
                <StatusIconComp className="w-4 h-4" />
                {statusUI.label}
              </span>
            </div>
          </div>

          {/* Metric Cards Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">Selection Candidates</p>
              <p className="text-2xl font-bold text-stone-900 font-mono">{totalSelectionCandidates || results.length}</p>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold mb-1">Total Ballots Cast</p>
              <p className="text-2xl font-bold text-stone-900 font-mono">{totalBallotsRecorded}</p>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <p className="text-xs uppercase tracking-wider text-emerald-800 font-semibold mb-1">Total "For" Votes</p>
              <p className="text-2xl font-bold text-emerald-700 font-mono">{totalYesVotesRecorded}</p>
            </div>
            <div className="p-4 bg-rose-50/50 rounded-lg border border-rose-100">
              <p className="text-xs uppercase tracking-wider text-rose-800 font-semibold mb-1">Total "Against" Votes</p>
              <p className="text-2xl font-bold text-rose-700 font-mono">{totalNoVotesRecorded}</p>
            </div>
          </div>

          <div className="border border-stone-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 text-xs uppercase tracking-wider font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Total For (Yes)</th>
                  <th className="py-3 px-4">Total Against (No)</th>
                  <th className="py-3 px-4">Total Votes Cast</th>
                  <th className="py-3 px-4">Approval %</th>
                  <th className="py-3 px-4 text-right">Pass / Fail (50.1%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-amber-700" />
                        <span>Calculating voting results...</span>
                      </div>
                    </td>
                  </tr>
                ) : hasFetchError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-rose-700">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
                      <p className="font-bold">Unable to load candidate voting records.</p>
                      <button 
                        onClick={fetchReportData} 
                        className="mt-3 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-md border border-stone-300"
                      >
                        Retry Loading
                      </button>
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                      <p className="font-semibold text-stone-700">No candidate votes recorded yet.</p>
                      <p className="text-xs text-stone-500 mt-1">Votes submitted during the Selection voting window will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.candidateId} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">{r.candidateName}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{r.yesVotes}</td>
                      <td className="py-3 px-4 text-rose-700 font-semibold">{r.noVotes}</td>
                      <td className="py-3 px-4 text-stone-700">{r.totalVotesCast}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{r.approvalPercentage.toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          r.passed 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.passed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> PASS (≥ 50.1%)
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> FAIL (&lt; 50.1%)
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
