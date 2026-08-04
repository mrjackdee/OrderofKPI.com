import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { ShieldCheck, Download, ArrowLeft, Trash2, Edit2, CheckCircle2, AlertCircle, Search, Calendar, User } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

interface AdminNominationItem {
  id: string;
  voter_email: string;
  nominee_first_name: string;
  nominee_last_name: string;
  statement: string;
  timestamp: string;
}

export default function DeanAuditLogDashboard() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = normEmail === 'admin@orderofkpi.org';

  const [nominations, setNominations] = useState<AdminNominationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editStatement, setEditStatement] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminNominations();
    }
  }, [isAdmin]);

  const fetchAdminNominations = async () => {
    try {
      const res = await fetch('/api/admin/dean-nominations');
      const data = await res.json();
      if (data.success && Array.isArray(data.nominations)) {
        setNominations(data.nominations);
      }
    } catch (err) {
      console.error('Error fetching admin dean nominations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/member-portal" replace />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this nomination record?')) return;
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/dean-nominations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('Nomination successfully deleted.');
        fetchAdminNominations();
      } else {
        setError(data.message || 'Failed to delete nomination.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    }
  };

  const handleStartEdit = (nom: AdminNominationItem) => {
    setEditingId(nom.id);
    setEditFirstName(nom.nominee_first_name);
    setEditLastName(nom.nominee_last_name);
    setEditStatement(nom.statement);
  };

  const handleSaveEdit = async (id: string) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/dean-nominations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominee_first_name: editFirstName,
          nominee_last_name: editLastName,
          statement: editStatement
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Nomination successfully updated.');
        setEditingId(null);
        fetchAdminNominations();
      } else {
        setError(data.message || 'Failed to update nomination.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    }
  };

  const filteredNominations = nominations.filter(n => 
    n.voter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.nominee_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.nominee_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.statement.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportAuditPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(30, 63, 32);
    doc.rect(0, 0, 297, 35, 'F');

    doc.setTextColor(253, 252, 240);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INTAKE DEAN NOMINATIONS – ADMIN AUDIT LOG', 148.5, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11);
    doc.text('Strictly Confidential — System Administrator Access Only', 148.5, 24, { align: 'center' });

    let y = 45;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 63, 32);

    doc.text('Voter Email', 14, y);
    doc.text('Nominee Name', 90, y);
    doc.text('Statement', 140, y);
    doc.text('Timestamp', 250, y);
    y += 4;

    doc.setDrawColor(184, 134, 11);
    doc.line(14, y, 283, y);
    y += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);

    nominations.forEach((nom) => {
      if (y > 185) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(50, 50, 50);
      doc.text(nom.voter_email, 14, y);
      doc.text(`${nom.nominee_first_name} ${nom.nominee_last_name}`, 90, y);
      
      const stmtLines = doc.splitTextToSize(nom.statement, 105);
      doc.text(stmtLines, 140, y);

      const timeStr = nom.timestamp ? new Date(nom.timestamp).toLocaleString() : 'N/A';
      doc.text(timeStr, 250, y);

      y += Math.max(6, stmtLines.length * 4) + 4;
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Dean Nominations Audit Report — Page ${i} of ${pageCount}`, 148.5, 205, { align: 'center' });
    }

    doc.save('Dean_Nominations_Audit_Log.pdf');
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
            Dean Nominations Audit & Management
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
            Exclusive administrator view mapping which member submitted which nominee, complete with timestamps and record management (edit / delete). Not visible to other roles or users.
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
              placeholder="Search by voter email, nominee, or statement..."
              className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl pl-11 pr-4 py-2.5 text-xs text-[#1E3F20] focus:outline-none focus:border-[#1E3F20]"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total Audit Records: <strong className="text-[#1E3F20]">{nominations.length}</strong>
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(30,63,32,0.06)]">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-xs">Loading audit records...</div>
          ) : filteredNominations.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">No matching nomination audit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1E3F20] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-4">Voter (Submitter)</th>
                    <th className="p-4">Nominee Name</th>
                    <th className="p-4">Nomination Statement</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8860B]/20 text-xs">
                  {filteredNominations.map((nom) => (
                    <tr key={nom.id} className="hover:bg-[#FDFCF0]/50 transition-colors">
                      <td className="p-4 font-medium text-[#1E3F20] align-top">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-[#B8860B]" />
                          <span>{nom.voter_email}</span>
                        </div>
                      </td>

                      <td className="p-4 align-top font-bold text-[#1E3F20]">
                        {editingId === nom.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              placeholder="First Name"
                              className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-lg px-3 py-1.5 text-xs"
                            />
                            <input
                              type="text"
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              placeholder="Last Name"
                              className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-lg px-3 py-1.5 text-xs"
                            />
                          </div>
                        ) : (
                          <span>{nom.nominee_first_name} {nom.nominee_last_name}</span>
                        )}
                      </td>

                      <td className="p-4 align-top text-gray-700 max-w-md">
                        {editingId === nom.id ? (
                          <textarea
                            value={editStatement}
                            onChange={(e) => setEditStatement(e.target.value)}
                            rows={3}
                            className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-lg p-2 text-xs"
                          />
                        ) : (
                          <p className="italic bg-[#FDFCF0] p-3 rounded-xl border border-[#B8860B]/10">"{nom.statement}"</p>
                        )}
                      </td>

                      <td className="p-4 align-top text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>{nom.timestamp ? new Date(nom.timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                      </td>

                      <td className="p-4 align-top text-right whitespace-nowrap">
                        {editingId === nom.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(nom.id)}
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
                              onClick={() => handleStartEdit(nom)}
                              className="p-2 bg-[#B8860B]/10 hover:bg-[#B8860B] hover:text-white text-[#B8860B] rounded-lg transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(nom.id)}
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
