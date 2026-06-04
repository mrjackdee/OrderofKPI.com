import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, 
  Ticket, 
  BarChart3, 
  ShieldCheck, 
  Save, 
  RefreshCcw, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Trash2
} from 'lucide-react';

// --- Data ---
const FINANCIAL_MEMBERS = [
  "Anthony Jones", "Brandon Owens", "Brian Goings", "Brian Johnson",
  "Dameone Ferguson", "Darron Jenkins", "Deshaun Stafford", "Dominic Goodman",
  "Donald Mitchell", "Edward Cook", "Ishmeal Allensworth", "Jack Dee",
  "James Haywood Jr", "Jason Pilar", "Kameron Whitfield", "Keith Woods", "Tobias Bordley",
  "Test User A", "Test User B"
];

const NOMINEES = [
  { id: "1ab-aj", name: "Anthony Jones", position: "1st Anti-Basileus" },
  { id: "2ab-jh", name: "James “JR” Hayward", position: "2nd Anti-Basileus" },
  { id: "gram-bj", name: "Brian Johnson", position: "Grammateus" },
  { id: "epis-ec", name: "Edward Cook", position: "Epistoleus" },
  { id: "hist-bo", name: "Brandon Owens", position: "Historian" },
  { id: "hod-dj", name: "Darron Jenkins", position: "Hodegos" },
  { id: "tam-ia", name: "Ishmael Allensworth", position: "Tamiouchos" }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'revisions'>(() => {
    try {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const t = params.get('tab');
        if (t === 'results' || t === 'revisions') {
          return t;
        }
      }
    } catch (e) {
      // Ignored
    }
    return 'results';
  });
  const [ballots, setBallots] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toUpperCase() === 'ATLANTA') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const qBallots = query(collection(db, 'ballots'));
    const unsubBallots = onSnapshot(qBallots, (snap) => {
      setBallots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Auto-seed if empty
      if (snap.empty && !actionLoading) {
        console.log("Seeding ballots...");
        generateBallots(true); // silent seed
      }
    });

    const qVotes = query(collection(db, 'votes'));
    const unsubVotes = onSnapshot(qVotes, (snap) => {
      setVotes(snap.docs.map(d => d.data()));
      setLoading(false);
    });

    const qRevisions = query(collection(db, 'revisions'));
    const unsubRevisions = onSnapshot(qRevisions, (snap) => {
      setRevisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubBallots();
      unsubVotes();
      unsubRevisions();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-3xl text-center"
        >
          <ShieldCheck className="text-primary mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-2">Committee Access</h2>
          <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] mb-8">Authorization Required</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Enter Administrative Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-white focus:border-primary outline-none transition-all placeholder:text-[10px] placeholder:uppercase placeholder:tracking-widest"
              autoFocus
            />
            {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Invalid credentials</p>
            )}
            <button 
              type="submit"
              className="w-full py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl shadow-primary/10"
            >
              Verify Identity
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const generateBallots = async (silent = false) => {
    if (!silent && !confirm("Are you sure? This will overwrite or create ballots for all KPI members.")) return;
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      FINANCIAL_MEMBERS.forEach((name, index) => {
        const id = `KPI-2026-${(index + 1).toString().padStart(4, '0')}`;
        const ref = doc(db, 'ballots', id);
        batch.set(ref, {
          name,
          hasVoted: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      if (!silent) alert("Successfully generated ballots for all KPI members.");
    } catch (err) {
      console.error(err);
      if (!silent) alert("Error generating ballots.");
    } finally {
      setActionLoading(false);
    }
  };

  const getResults = () => {
    const results: Record<string, Record<string, number>> = {};
    
    // Group nominees by position
    NOMINEES.forEach(n => {
      if (!results[n.position]) results[n.position] = {};
      results[n.position][n.name] = 0;
    });

    // Count votes
    votes.forEach(v => {
      Object.entries(v.selections).forEach(([posId, nomineeId]: [any, any]) => {
        const nominee = NOMINEES.find(n => n.id === nomineeId);
        if (nominee) {
          results[nominee.position][nominee.name]++;
        }
      });
    });

    return results;
  };

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

  const handleDeleteRevision = async (id: string, submitter: string) => {
    if (!confirm(`Are you sure you want to permanently delete the submission from ${submitter || 'Anonymous KPI Member'}?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, 'revisions', id));
    } catch (err) {
      console.error("Error deleting revision:", err);
      alert("Error deleting submission. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pure-black text-white p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-widest mb-2 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-silver/40 text-xs uppercase tracking-[0.3em]">Election Management & Live Tabulation</p>
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'results' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <BarChart3 className="inline-block mr-2" size={14} />
              Live Results
            </button>
            <button 
              onClick={() => setActiveTab('revisions')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'revisions' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <FileText className="inline-block mr-2" size={14} />
              Bylaw Revisions
            </button>
          </div>
        </header>

        {activeTab === 'results' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Total Ballots</p>
                <p className="text-3xl font-bold text-white">{ballots.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Votes Cast</p>
                <p className="text-3xl font-bold text-primary">{votes.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Turnout</p>
                <p className="text-3xl font-bold text-white">
                  {ballots.length ? `${Math.round((votes.length / ballots.length) * 100)}%` : '0%'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(getResults()).map(([position, candidates]) => (
                <motion.div 
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black border border-white/10 p-8 rounded-3xl"
                >
                  <h3 className="text-lg font-bold uppercase tracking-widest mb-6 text-primary flex items-center justify-between">
                    {position}
                    <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-silver/40">Official Slate</span>
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(candidates).map(([name, count]) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between text-sm uppercase tracking-wider">
                          <span className="text-white">{name}</span>
                          <span className="text-primary font-bold">{count} Votes</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: votes.length > 0 ? `${(count / votes.length) * 100}%` : '0%' }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

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
                          onClick={() => handleDeleteRevision(rev.id, rev.submitterName)}
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
      </div>
    </div>
  );
}
