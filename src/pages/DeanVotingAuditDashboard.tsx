import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Download, ArrowLeft, Trash2, Edit2, CheckCircle2, AlertCircle, Search, Calendar, User } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

interface AdminVoteItem {
  id: string;
  voter_email: string;
  nominee_name: string;
  timestamp: string;
}

export default function DeanVotingAuditDashboard() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = normEmail === 'admin@orderofkpi.org';

  const [votes, setVotes] = useState<AdminVoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNomineeName, setEditNomineeName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminVotes();
    }
  }, [isAdmin]);

  const fetchAdminVotes = async () => {
    try {
      const res = await fetch('/api/admin/dean-votes');
      const data = await res.json();
      if (data.success && Array.isArray(data.votes)) {
        setVotes(data.votes);
      }
    } catch (err) {
      console.error('Error fetching admin votes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/member-portal" replace />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vote record?')) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/dean-votes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('Vote successfully deleted.');
        fetchAdminVotes();
      } else {
        setError(data.message || 'Failed to delete vote.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    }
  };

  const handleStartEdit = (vote: AdminVoteItem) => {
    setEditingId(vote.id);
    setEditNomineeName(vote.nominee_name);
  };

  const handleSaveEdit = async (id: string) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/dean-votes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominee_name: editNomineeName
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Vote successfully updated.');
        setEditingId(null);
        fetchAdminVotes();
      } else {
        setError(data.message || 'Failed to update vote.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    }
  };

  const filteredVotes = votes.filter(v => 
    v.voter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.nominee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportAuditPDF = () => {
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
    doc.text('DEAN VOTING — ADMIN AUDIT LOG', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11);
    doc.text('Strictly Confidential — System Administrator Access Only', 105, 24, { align: 'center' });

    let y = 45;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 63, 32);

    doc.text('Voter Email', 14, y);
    doc.text('Nominee Voted For', 90, y);
    doc.text('Timestamp', 160, y);
    y += 4;

    doc.setDrawColor(184, 134, 11);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);

    votes.forEach((v) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(50, 50, 50);
      doc.text(v.voter_email, 14, y);
      doc.text(v.nominee_name, 90, y);

      const timeStr = v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A';
      doc.text(timeStr, 160, y);

      y += 8;
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dean Voting Audit Report — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save('Dean_Voting_Audit_Log.pdf');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-24">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        <MemberHeader />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E3F20] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Portal
          </Link>

          <button
            onClick={exportAuditPDF}
            className="bg-[#1E3F20] hover:bg-[#B8860B] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Download size={14} /> Export Audit PDF
          </button>
        </div>

        {/* Header */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <ShieldCheck size={14} className="text-red-700" />
            <span className="text-[10px] font-bold text-red-900 uppercase tracking-[0.2em]">
              Restricted Admin Audit Dashboard
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1E3F20]">
            Dean Voting Audit & Management
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
            Exclusive administrator view mapping which member voted for which nominee, complete with timestamps and record management (edit / delete). Not visible to other roles or users.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 text-xs">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Search & Controls */}
        <div className="bg-white border border-[#B8860B]/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by voter email or nominee..."
              className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl pl-11 pr-4 py-2.5 text-xs text-[#1E3F20] focus:outline-none focus:border-[#1E3F20]"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total Audit Records: <strong className="text-[#1E3F20]">{votes.length}</strong>
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(30,63,32,0.06)]">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-xs">Loading audit records...</div>
          ) : filteredVotes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">No matching vote audit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E3F20] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Voter (Submitter)</th>
                    <th className="p-4">Nominee Voted For</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8860B]/20 text-xs">
                  {filteredVotes.map((v) => (
                    <tr key={v.id} className="hover:bg-[#FDFCF0]/50 transition-colors">
                      <td className="p-4 font-medium text-[#1E3F20] align-middle">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-[#B8860B]" />
                          <span>{v.voter_email}</span>
                        </div>
                      </td>

                      <td className="p-4 align-middle font-bold text-[#1E3F20]">
                        {editingId === v.id ? (
                          <input
                            type="text"
                            value={editNomineeName}
                            onChange={(e) => setEditNomineeName(e.target.value)}
                            placeholder="Nominee Name"
                            className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-lg px-3 py-1.5 text-xs"
                          />
                        ) : (
                          <span>{v.nominee_name}</span>
                        )}
                      </td>

                      <td className="p-4 align-middle text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>{v.timestamp ? new Date(v.timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                      </td>

                      <td className="p-4 align-middle text-right whitespace-nowrap">
                        {editingId === v.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(v.id)}
                              className="bg-[#1E3F20] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8860B]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(v)}
                              className="p-2 bg-[#B8860B]/10 hover:bg-[#B8860B] hover:text-white text-[#B8860B] rounded-lg transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
