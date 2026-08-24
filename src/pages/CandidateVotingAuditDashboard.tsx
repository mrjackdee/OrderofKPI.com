import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Download, ArrowLeft, Trash2, CheckCircle2, AlertCircle, Search, RefreshCw } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { 
  firebaseFetchAllCandidateVotes, 
  firebaseDeleteCandidateVote, 
  syncCandidateVotesFromFirestore 
} from '../lib/firebase';

interface CandidateVoteAuditItem {
  id: string;
  voter_email: string;
  candidate_id: string;
  candidate_name: string;
  decision: string;
  timestamp: string;
}

export default function CandidateVotingAuditDashboard() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = userRole === 'admin' || normEmail === 'admin@orderofkpi.org' || normEmail === 'qa.admin@orderofkpi.org';

  const [votes, setVotes] = useState<CandidateVoteAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchVotes = async () => {
    try {
      let serverVotes: CandidateVoteAuditItem[] = [];
      let firestoreVotes: CandidateVoteAuditItem[] = [];

      const [serverRes, fsRes] = await Promise.allSettled([
        fetch('/api/candidate-votes').then(r => r.json()),
        firebaseFetchAllCandidateVotes()
      ]);

      if (serverRes.status === 'fulfilled' && serverRes.value?.success && Array.isArray(serverRes.value.votes)) {
        serverVotes = serverRes.value.votes;
      }
      if (fsRes.status === 'fulfilled' && fsRes.value?.success && Array.isArray(fsRes.value.votes)) {
        firestoreVotes = fsRes.value.votes;
      }

      const map = new Map<string, CandidateVoteAuditItem>();
      for (const item of [...firestoreVotes, ...serverVotes]) {
        if (!item) continue;
        const key = item.id || `${item.voter_email}_${item.candidate_id}`;
        map.set(key, item);
      }

      setVotes(Array.from(map.values()));
    } catch (err) {
      console.error('Error fetching candidate audit votes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncCandidateVotesFromFirestore().catch(() => {});
    await fetchVotes();
    setIsSyncing(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchVotes();
      syncCandidateVotesFromFirestore().then(() => fetchVotes());
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/member-portal" replace />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vote record?')) return;
    setError('');
    setMessage('');

    setVotes(prev => prev.filter(v => v.id !== id));

    try {
      await Promise.allSettled([
        fetch(`/api/admin/candidate-votes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
        firebaseDeleteCandidateVote(id)
      ]);
      setMessage('Vote record removed.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete vote.');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FY27 Candidate Voting Management & Audit Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Votes Cast: ${votes.length}`, 14, 34);

    let y = 44;
    doc.setFont("helvetica", "bold");
    doc.text("Voter Email", 14, y);
    doc.text("Candidate", 80, y);
    doc.text("Decision", 140, y);
    doc.text("Timestamp", 170, y);

    y += 6;
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    votes.forEach((v) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text((v.voter_email || '').substring(0, 32), 14, y);
      doc.text((v.candidate_name || v.candidate_id || '').substring(0, 25), 80, y);
      doc.text((v.decision || '').toUpperCase(), 140, y);
      doc.text(new Date(v.timestamp || Date.now()).toLocaleDateString(), 170, y);
      y += 8;
    });

    doc.save("FY27_Candidate_Voting_Audit_Report.pdf");
  };

  const filteredVotes = votes.filter(v => 
    (v.voter_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.candidate_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.decision || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <MemberHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Member Portal
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center px-3 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Data
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export Audit PDF
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-stone-900">FY27 Candidate Voting Mgmt & Audit</h1>
                <p className="text-sm text-stone-600">Administrative audit log displaying voter records, candidate selections, and decisions.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-stone-900">{votes.length}</span>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-medium">Total Votes Cast</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by voter email, candidate, or decision..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="border border-stone-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 text-stone-700 text-xs uppercase tracking-wider font-semibold border-b border-stone-200">
                  <th className="py-3 px-4">Voter Email</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-500">Loading audit records...</td>
                  </tr>
                ) : filteredVotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-500">No matching candidate votes found.</td>
                  </tr>
                ) : (
                  filteredVotes.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-stone-900">{v.voter_email}</td>
                      <td className="py-3 px-4 text-stone-700">{v.candidate_name || v.candidate_id}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          (v.decision || '').toLowerCase() === 'yes' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {(v.decision || '').toUpperCase() === 'YES' ? 'Vote For / Accept' : 'Vote Against / Reject'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500 text-xs">
                        {v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete vote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
