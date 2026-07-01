import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  RefreshCcw, 
  AlertCircle,
  FileText,
  Download,
  Trash2,
  Users,
  CalendarDays,
  UserPlus,
  Key
} from 'lucide-react';

// --- Data ---
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'revisions' | 'users'>(() => {
    try {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const t = params.get('tab');
        if (t === 'revisions' || t === 'users') {
          return t as 'revisions' | 'users';
        }
      }
    } catch (e) {
      // Ignored
    }
    return 'users';
  });
  
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin', email: 'admin@orderofkpi.org', role: 'admin' },
    { id: 2, name: 'Deshaun Safford', email: 'd.safford@orderofkpi.org', role: 'member' },
    { id: 3, name: 'Brian Johnson', email: 'b.johnson@orderofkpi.org', role: 'member' }
  ]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionToDelete, setRevisionToDelete] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

    const qRevisions = query(collection(db, 'revisions'));
    const unsubRevisions = onSnapshot(qRevisions, (snap) => {
      setRevisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubRevisions();
    };
  }, []);

  const exportRevisionsToCSV = () => {
    if (revisions.length === 0) {
      alert("No revisions available to export.");
      return;
    }
    
    // CSV headers
    const headers = ["ID", "Document", "Article", "Section", "Original Text", "Proposed Text", "Submitter Name", "Submitted At"];
    
    const rows = revisions.map(r => {
      let dateStr = "";
      if (r.submittedAt) {
        const dateObj = r.submittedAt.toDate ? r.submittedAt.toDate() : new Date(r.submittedAt);
        dateStr = dateObj.toLocaleString();
      }
      let docName = r.documentType || "";
      if (docName.toLowerCase().includes('constitution')) {
        docName = "KP Constitution (2021)";
      } else if (docName.toLowerCase().includes('by-laws') || docName.toLowerCase().includes('bylaws')) {
        docName = "KP By-laws (2022)";
      } else {
        docName = "KP Constitution (2021)";
      }

      return [
        r.id || "",
        docName,
        r.article || "",
        r.section || "",
        r.originalText || "",
        r.proposedText || "",
        r.submitterName || "",
        dateStr
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kpi_constitution_revisions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRevisionsToPDF = () => {
    if (revisions.length === 0) {
      alert("No revisions available to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Page constraints
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    let y = 15;

    // Helper functions
    const addHeader = (pdfDoc: typeof doc) => {
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(16);
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text("THE ORDER OF KP, INC.", margin, y);
      y += 6;
      pdfDoc.setFontSize(11);
      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.setTextColor(100, 100, 100);
      pdfDoc.text("Bylaws & Constitution Revisions - Member Submissions Log", margin, y);
      
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdfDoc.text(`Exported on: ${dateStr}`, margin, y + 5);
      y += 12;

      // Draw horizontal line
      pdfDoc.setDrawColor(200, 200, 200);
      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(margin, y, pageWidth - margin, y);
      y += 10;
    };

    addHeader(doc);

    revisions.forEach((rev, index) => {
      // Check if we need a new page for the upcoming entry
      if (y > 230) {
        doc.addPage();
        y = 15;
        addHeader(doc);
      }

      // Entry Card Layout Calculation
      const cardY = y;
      const docType = rev.documentType || "KP Constitution (2021)";
      const submitter = rev.submitterName || "Anonymous Member";
      
      let dateVal = "Pending";
      if (rev.submittedAt) {
        const dateObj = rev.submittedAt.toDate ? rev.submittedAt.toDate() : new Date(rev.submittedAt);
        dateVal = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }

      // We'll write to PDF but check height dynamically
      // Header for this card
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`#${index + 1} - ${docType}`, margin + 4, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(`Submitted By: ${submitter} | Date: ${dateVal}`, margin + 4, y + 11);
      
      y += 15;

      // Position info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(`Target Segment: ${rev.article} - ${rev.section}`, margin + 4, y);
      y += 5;

      // Original Text section
      if (rev.originalText && rev.originalText.trim() !== "" && rev.originalText !== "(No original text specified)") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Original Verbiage:", margin + 4, y);
        y += 4;

        doc.setFont("helvetica", "oblique");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const origLines = doc.splitTextToSize(`"${rev.originalText}"`, contentWidth - 10);
        origLines.forEach((line: string) => {
          if (y > 275) {
            doc.addPage();
            y = 15;
            addHeader(doc);
          }
          doc.text(line, margin + 6, y);
          y += 4;
        });
        y += 2;
      }

      // Proposed Text section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Proposed Language Change:", margin + 4, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      const proposedLines = doc.splitTextToSize(rev.proposedText || "(Empty)", contentWidth - 10);
      proposedLines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          y = 15;
          addHeader(doc);
        }
        doc.text(line, margin + 6, y);
        y += 4;
      });

      // Draw boundary box border
      const cardHeight = y - cardY + 2;
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.15);
      doc.rect(margin, cardY, contentWidth, cardHeight);

      y += 10; // margin separation
    });

    // Save output PDF
    doc.save(`kpi_constitution_revisions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDeleteRevision = (rev: any) => {
    setRevisionToDelete(rev);
    setDeleteError(null);
  };

  const confirmDeleteAndArchive = async () => {
    if (!revisionToDelete) return;
    setActionLoading(true);
    setDeleteError(null);
    try {
      // 1. Store/Archive submission first
      const archiveData = {
        originalId: revisionToDelete.id,
        documentType: revisionToDelete.documentType || 'KP Constitution (2021)',
        article: revisionToDelete.article || '',
        section: revisionToDelete.section || '',
        originalText: revisionToDelete.originalText || '',
        proposedText: revisionToDelete.proposedText || '',
        submitterName: revisionToDelete.submitterName || 'Anonymous KPI Member',
        submittedAt: revisionToDelete.submittedAt || null,
        archivedAt: serverTimestamp()
      };

      // Create new archived document
      await addDoc(collection(db, 'archived_revisions'), archiveData);

      // 2. Delete from active list
      await deleteDoc(doc(db, 'revisions', revisionToDelete.id));

      // 3. Clear modal state
      setRevisionToDelete(null);
    } catch (err: any) {
      console.error("Error archiving and deleting revision:", err);
      setDeleteError(err.message || "Failed to archive and delete this submission. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pure-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-8 pt-8">
          <Link to="/intake-calendar" className="px-5 py-2 rounded-full border border-primary/20 text-silver/80 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors flex items-center gap-2">
            <CalendarDays size={14} /> Intake Calendar
          </Link>
          <Link to="/financial-roster" className="px-5 py-2 rounded-full border border-primary/20 text-silver/80 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Financial Roster
          </Link>
        </div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck className="text-primary" size={32} />
              Admin Dashboard
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('revisions')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'revisions' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <FileText className="inline-block mr-2" size={14} />
              Bylaw Revisions
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'users' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <Users className="inline-block mr-2" size={14} />
              User Access
            </button>
          </div>
        </header>

        {activeTab === 'revisions' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest">Proposed Bylaw Revisions</h2>
                <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] mt-1">Submitted by members of the organization</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={exportRevisionsToCSV}
                  className="px-5 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Export to CSV
                </button>
                <button 
                  onClick={exportRevisionsToPDF}
                  className="px-5 py-3 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                >
                  <FileText size={14} />
                  Download PDF
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {revisions.map((rev) => {
                const dateVal = rev.submittedAt ? (rev.submittedAt.toDate ? rev.submittedAt.toDate().toLocaleString() : new Date(rev.submittedAt).toLocaleString()) : "Pending";
                return (
                  <motion.div 
                    key={rev.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black border border-white/10 p-6 rounded-2xl space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                          (rev.documentType || '').toLowerCase().includes('by-laws') || (rev.documentType || '').toLowerCase().includes('bylaws')
                            ? 'bg-silver/5 text-silver border-silver/15'
                            : 'bg-primary/5 text-primary border-primary/20'
                        }`}>
                          {rev.documentType || 'KP Constitution (2021)'}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 text-silver border border-white/5 text-[9px] font-bold uppercase tracking-widest rounded">
                          {rev.article}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 text-silver border border-white/5 text-[9px] font-bold uppercase tracking-widest rounded">
                          {rev.section}
                        </span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-silver/40">
                        Submitted: <span className="text-white font-mono">{dateVal}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] uppercase tracking-wider text-silver/40 font-bold">Original Verbiage:</h4>
                        <div className="p-3 bg-white/5 rounded-xl text-xs text-silver/70 italic leading-relaxed">
                          "{rev.originalText || '(No reference text)'}"
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold">Proposed Language Change:</h4>
                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-white font-medium leading-relaxed">
                          {rev.proposedText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-silver/40">
                        Proposed By: <span className="text-primary font-bold">{rev.submitterName || "Anonymous KPI Member"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-mono text-silver/20">{rev.id}</span>
                        <button
                          onClick={() => handleDeleteRevision(rev)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg cursor-pointer transition-all duration-200"
                          title="Delete submission"
                        >
                          <Trash2 size={11} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {revisions.length === 0 && (
                <div className="border border-white/10 rounded-2xl bg-white/5 p-12 text-center text-silver/40 italic">
                  No constitution or bylaw revisions have been submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest">User Management</h2>
                <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] mt-1">Manage portal access for members</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <UserPlus size={16} /> Add New User
              </h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-silver/30"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all placeholder:text-silver/30"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                />
                <button
                  className="px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all text-xs flex items-center justify-center gap-2"
                  onClick={() => {
                    if(newUserName && newUserEmail) {
                      setUsers([...users, { id: Date.now(), name: newUserName, email: newUserEmail, role: 'member' }]);
                      setNewUserName('');
                      setNewUserEmail('');
                    }
                  }}
                >
                  Create User
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {users.map(user => (
                <motion.div 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-primary/70" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{user.name}</h4>
                      <p className="text-silver/60 text-xs">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-silver border-white/10'
                    }`}>
                      {user.role}
                    </span>
                    <button className="p-2 bg-white/5 border border-white/10 text-silver/60 hover:text-white rounded-lg transition-colors title='Change Password'">
                      <Key size={16} />
                    </button>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => setUsers(users.filter(u => u.id !== user.id))}
                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors title='Remove User'"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {revisionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-950 border border-white/10 max-w-xl w-full rounded-3xl p-8 shadow-2xl relative space-y-6"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={28} />
                <h3 className="text-xl font-display font-bold uppercase tracking-widest">Confirm Archiving</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-silver/70 text-sm leading-relaxed">
                  Are you sure you want to remove and archive the revision submitted by <span className="text-white font-bold">{revisionToDelete.submitterName || 'Anonymous KPI Member'}</span>? 
                  Once confirmed, this submission will be removed from the active revisions view and stored securely in the archive log.
                </p>

                <div className="border border-white/5 rounded-2xl p-4 bg-white/5 space-y-3 text-xs leading-relaxed">
                  <div className="flex justify-between text-silver/40">
                    <span className="uppercase tracking-wider">Document Segment</span>
                    <span className="text-white font-mono uppercase">
                      {revisionToDelete.documentType || 'KP Constitution'} {revisionToDelete.article} - {revisionToDelete.section}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-silver/40 uppercase tracking-wider block">Proposed Language Change:</span>
                    <div className="text-white p-2.5 bg-white/5 border border-white/5 rounded-xl font-medium max-h-[120px] overflow-y-auto">
                      {revisionToDelete.proposedText}
                    </div>
                  </div>
                </div>

                {deleteError && (
                  <p className="text-red-500 font-bold text-xs uppercase tracking-wide bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {deleteError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-white/5 pt-6">
                <button
                  type="button"
                  onClick={() => setRevisionToDelete(null)}
                  disabled={actionLoading}
                  className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 text-silver/60 hover:text-white uppercase font-bold text-xs tracking-widest cursor-pointer transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAndArchive}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/10 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCcw size={14} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm & Archive</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
