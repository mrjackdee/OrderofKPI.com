import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Lock, 
  Unlock, 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

interface RevisionSubmission {
  id: string;
  documentType?: string;
  article: string;
  section: string;
  originalText?: string;
  proposedText: string;
  submitterName: string;
  submittedAt: any;
}

// Enum for operations (following error guidelines)
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { CONSTITUTION_DATA, BYLAWS_DATA } from '../data/governingCode';

export default function Constitution() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('kpi_member_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Governing Document style selection state
  const [docType, setDocType] = useState<'constitution' | 'bylaws'>('constitution');

  // form States
  const [selectedArticle, setSelectedArticle] = useState('Article I');
  const [selectedSection, setSelectedSection] = useState('Section 1');
  
  // Custom states if 'Other' is chosen
  const [customArticle, setCustomArticle] = useState('');
  const [customSection, setCustomSection] = useState('');
  const [customOriginalText, setCustomOriginalText] = useState('');

  const [proposedText, setProposedText] = useState('');
  const [submitterName, setSubmitterName] = useState('');

  // submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // Deadline calculation: June 19, 2026 at 12:00 PM ET
  const targetDate = new Date(Date.UTC(2026, 5, 19, 16, 0, 0));
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        setIsDeadlinePassed(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      setIsDeadlinePassed(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Submissions archive states
  const [viewingSubmissions, setViewingSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState<RevisionSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'constitution' | 'bylaws'>('all');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '2012') {
      try {
        localStorage.setItem('kpi_member_logged_in', 'true');
      } catch (err) {
        console.warn('Failed to save log in state:', err);
      }
      setIsLoggedIn(true);
      setPasscode('');
      setLoginError('');
    } else {
      setLoginError('Invalid passcode. Please enter the valid KPI member passcode.');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('kpi_member_logged_in');
    } catch (err) {
      console.warn('Failed to remove log in state:', err);
    }
    setIsLoggedIn(false);
  };

  // Get current text based on selections
  const getCurrentOriginalText = () => {
    if (selectedArticle === 'Other') {
      return customOriginalText;
    }
    const data = docType === 'constitution' ? CONSTITUTION_DATA : BYLAWS_DATA;
    const articleObj = data.find(a => a.id === selectedArticle);
    if (!articleObj) return '';
    
    if (selectedSection === 'Other') {
      return customOriginalText;
    }
    const sectionObj = articleObj.sections.find(s => s.id === selectedSection);
    return sectionObj ? sectionObj.text : '';
  };

  // Reset selected article/section when document type changes
  useEffect(() => {
    const data = docType === 'constitution' ? CONSTITUTION_DATA : BYLAWS_DATA;
    if (data.length > 0) {
      setSelectedArticle(data[0].id);
      if (data[0].sections.length > 0) {
        setSelectedSection(data[0].sections[0].id);
      } else {
        setSelectedSection('Other');
      }
    } else {
      setSelectedArticle('Other');
      setSelectedSection('Other');
    }
  }, [docType]);

  // Update dynamic defaults when article changes
  useEffect(() => {
    if (selectedArticle !== 'Other') {
      const data = docType === 'constitution' ? CONSTITUTION_DATA : BYLAWS_DATA;
      const articleObj = data.find(a => a.id === selectedArticle);
      if (articleObj && articleObj.sections.length > 0) {
        // Only override selectedSection if the current one doesn't exist in the new article
        const sectionExists = articleObj.sections.some(s => s.id === selectedSection);
        if (!sectionExists) {
          setSelectedSection(articleObj.sections[0].id);
        }
      } else {
        setSelectedSection('Other');
      }
    } else {
      setSelectedSection('Other');
    }
  }, [selectedArticle, docType]);

  // Load submissions in real-time
  useEffect(() => {
    if (!isLoggedIn) return;

    setLoadingSubmissions(true);
    const q = query(collection(db, 'revisions'), orderBy('submittedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RevisionSubmission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          documentType: data.documentType,
          article: data.article,
          section: data.section,
          originalText: data.originalText,
          proposedText: data.proposedText,
          submitterName: data.submitterName,
          submittedAt: data.submittedAt
        });
      });
      setSubmissions(list);
      setLoadingSubmissions(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoadingSubmissions(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'revisions');
      } catch (e) {
        // Logged
      }
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (typeof timestamp.toDate === 'function') {
      try {
        const d = timestamp.toDate();
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return 'Recent';
      }
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return 'Recent';
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesDoc = docFilter === 'all' || 
      (docFilter === 'constitution' && (sub.documentType || '').toLowerCase().includes('constitution')) ||
      (docFilter === 'bylaws' && (sub.documentType || '').toLowerCase().includes('by-laws'));

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (sub.submitterName || '').toLowerCase().includes(searchLower) ||
      (sub.article || '').toLowerCase().includes(searchLower) ||
      (sub.section || '').toLowerCase().includes(searchLower) ||
      (sub.proposedText || '').toLowerCase().includes(searchLower) ||
      (sub.originalText || '').toLowerCase().includes(searchLower);

    return matchesDoc && matchesSearch;
  });

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlinePassed) {
      setSubmissionError('The deadline for submitting proposed changes has passed. No additional proposed changes are accepted after June 19, 2026, 12:00 p.m. ET.');
      return;
    }
    if (!submitterName.trim()) {
      setSubmissionError("Please enter your name under 'Submitted By' before submitting.");
      return;
    }
    if (!proposedText.trim()) {
      setSubmissionError('Please enter the proposed revised language.');
      return;
    }

    const articleVal = selectedArticle === 'Other' ? customArticle.trim() : selectedArticle;
    const sectionVal = selectedSection === 'Other' ? customSection.trim() : selectedSection;
    const originalTextVal = getCurrentOriginalText().trim();

    if (!articleVal) {
      setSubmissionError('Please specify the Article name/number.');
      return;
    }
    if (!sectionVal) {
      setSubmissionError('Please specify the Section name/number.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');
    setSubmissionSuccess(false);

    try {
      const docPayload = {
        documentType: docType === 'constitution' ? 'KP Constitution (2021)' : 'KP By-laws (2022)',
        article: articleVal,
        section: sectionVal,
        originalText: originalTextVal || '(No original text specified)',
        proposedText: proposedText.trim(),
        submitterName: submitterName.trim(),
        submittedAt: serverTimestamp()
      };

      const path = 'revisions';
      try {
        await addDoc(collection(db, path), docPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }

      setSubmissionSuccess(true);
      setProposedText('');
      setCustomArticle('');
      setCustomSection('');
      setCustomOriginalText('');
      setSubmitterName('');
    } catch (err: any) {
      console.error(err);
      setSubmissionError('Failed to submit revision. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not logged in, show the Enter Passcode screen
  if (!isLoggedIn) {
    return (
      <main className="w-full bg-pure-black min-h-screen py-8 px-6 flex items-center justify-center relative overflow-hidden">
        {/* Abstract glowing background lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-silver/20 to-transparent" />
        
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-6">
            <Link to="/agenda" className="inline-flex items-center gap-1.5 text-silver/40 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors mb-4">
              <ArrowLeft size={12} /> Back to Conference
            </Link>
            
            <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
              <Lock size={28} className="animate-pulse text-primary" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-2">
              KPI Revisions Portal
            </h1>
          </div>

          <div className="bg-silver/5 border border-silver/10 p-7 rounded-3xl backdrop-blur-md shadow-2xl">
            <h3 className="text-base font-bold text-silver uppercase tracking-widest mb-6 text-center">
              Enter Passcode to Submit Revisions
            </h3>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-4 py-3.5 text-center text-base tracking-widest focus:outline-none transition-all uppercase placeholder-white/20 font-bold"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-400 p-3 bg-red-400/5 border border-red-400/10 rounded-xl text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-silver hover:bg-white text-black font-bold uppercase tracking-widest rounded-xl transition-all text-xs cursor-pointer shadow-xl shadow-silver/5 hover:translate-y-[-1px]"
              >
                Verify Credentials
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Loaded Revisions content
  return (
    <main className="w-full bg-pure-black min-h-screen py-8 px-4 md:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Navigation & Logout Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/agenda" 
            className="inline-flex items-center gap-2 text-silver/50 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors py-1.5 px-3 bg-silver/5 border border-silver/10 rounded-full"
          >
            <ArrowLeft size={12} /> Conference Details
          </Link>

          <button
            onClick={handleLogout}
            className="text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-white transition-colors cursor-pointer py-1.5 px-4 border border-primary/20 rounded-full hover:bg-primary/5"
          >
            Log Out Portal
          </button>
        </div>

        {/* Header Block */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Unlock size={12} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Access Granted • KPI Member</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-[0.1em] mb-4">
            Constitution & Bylaws Revisions
          </h1>
        </header>

        {/* Disclaimer & Countdown Banner */}
        <div className="w-full bg-primary/5 border border-primary/30 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                Revision Deadline Disclaimer
              </div>
              <p className="text-white text-xs md:text-[13px] leading-relaxed uppercase tracking-wider font-semibold">
                All proposed changes to either document must be submitted by <span className="text-primary font-extrabold">12:00 p.m. ET on Friday, June 19, 2026</span>. No additional proposed changes will be accepted after that deadline.
              </p>
            </div>

            <div className="bg-pure-black/85 border border-silver/10 rounded-2xl py-3 px-5 flex items-center gap-4 shrink-0 shadow-inner">
              {timeLeft.isExpired ? (
                <div className="text-center px-4 py-2">
                  <span className="text-red-400 font-bold uppercase tracking-widest text-[11px] block animate-pulse">
                    Submission Deadline Passed
                  </span>
                  <span className="text-[9px] text-silver/50 uppercase font-medium tracking-wide mt-1 block">
                    June 19, 2026 — 12:00 PM ET
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-center min-w-[35px]">
                    <span className="font-mono text-xl md:text-2xl font-black text-primary block leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-silver/40 font-bold block mt-1">Days</span>
                  </div>
                  <div className="text-silver/25 font-mono text-lg font-bold select-none">:</div>
                  <div className="text-center min-w-[35px]">
                    <span className="font-mono text-xl md:text-2xl font-black text-primary block leading-none">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-silver/40 font-bold block mt-1">Hrs</span>
                  </div>
                  <div className="text-silver/25 font-mono text-lg font-bold select-none">:</div>
                  <div className="text-center min-w-[35px]">
                    <span className="font-mono text-xl md:text-2xl font-black text-primary block leading-none">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-silver/40 font-bold block mt-1">Mins</span>
                  </div>
                  <div className="text-silver/25 font-mono text-lg font-bold select-none">:</div>
                  <div className="text-center min-w-[35px]">
                    <span className="font-mono text-xl md:text-2xl font-black text-primary block leading-none">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-silver/40 font-bold block mt-1">Secs</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Download & Selection Reference */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Download Document Box */}
            <div className="bg-silver/5 border border-silver/10 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
              <FileText className="text-primary mb-4" size={28} />
              
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Documents
              </h3>
              
              <div className="space-y-3">
                {/* PDF Clickable Link 1 */}
                <a 
                  href="https://assets.orderofkpi.org/files/KP_Constitution_2021.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between p-3.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all text-[10px] uppercase font-bold tracking-widest text-primary hover:text-white"
                >
                  <span>Download KP Constitution (2021)</span>
                  <ExternalLink size={12} />
                </a>

                {/* PDF Clickable Link 2 */}
                <a 
                  href="https://assets.orderofkpi.org/files/KP_Bylaws_2022.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-between p-3.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all text-[10px] uppercase font-bold tracking-widest text-primary hover:text-white"
                >
                  <span>Download KP By-laws (2022)</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Quick Reference Box */}
            <div className="bg-pure-black border border-silver/5 p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Steps</h4>
              <ul className="space-y-4 text-[11px] leading-relaxed text-silver/50 uppercase tracking-wide">
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>Select any Article & Section from the selectors list.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>Review the displayed text</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>Enter clear, concise revised language is the text box.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>Enter your name</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>Click Submit.</span>
                </li>
              </ul>
            </div>

          </section>

          {/* Right Column: Submission Form or Submissions List */}
          <section className="lg:col-span-8">
            
            {/* LINK ABOVE PROPOSED AMENDMENT FORM */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setViewingSubmissions(!viewingSubmissions)}
                className="group inline-flex items-center gap-1.5 text-primary hover:text-white text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer py-1.5 px-3.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-full"
              >
                {viewingSubmissions ? (
                  <>
                    <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                    <span>Back to Proposed Amendment Form</span>
                  </>
                ) : (
                  <>
                    <span>View Submitted Revisions</span>
                    <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </div>

            <div className="bg-silver/5 border border-silver/10 p-6 md:p-8 rounded-3xl relative backdrop-blur-md">
              
              {viewingSubmissions ? (
                <div className="space-y-6">
                  {/* Submissions Title */}
                  <div className="flex items-center gap-3 border-b border-silver/10 pb-4">
                    <FileText size={20} className="text-primary" />
                    <h3 className="text-base font-bold text-white uppercase tracking-widest">
                      Submitted Revisions
                    </h3>
                  </div>

                  <p className="text-silver/50 text-[11px] uppercase tracking-wider leading-relaxed">
                    Read-only archive of all proposed amendments received from the membership portal.
                  </p>

                  {/* Filters & Search Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by submitter, article, or text..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-silver/40">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Doc Filter Toggles */}
                    <div className="grid grid-cols-3 gap-1 bg-pure-black p-1 rounded-xl border border-silver/10">
                      {(['all', 'constitution', 'bylaws'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDocFilter(t)}
                          className={`py-1.5 rounded-lg text-[9px] uppercase font-extrabold tracking-wider transition-all text-center cursor-pointer ${
                            docFilter === t
                              ? 'bg-primary/20 text-primary border border-primary/25'
                              : 'text-silver/50 hover:text-white border border-transparent'
                          }`}
                        >
                          {t === 'all' ? 'All' : t === 'constitution' ? 'Constitution' : 'By-Laws'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loader / Empty / Content */}
                  {loadingSubmissions ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-silver/40">Loading Archive...</span>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-silver/10 rounded-2xl bg-pure-black/20">
                      <p className="text-silver/40 text-xs uppercase tracking-widest font-semibold mb-1">No submissions found</p>
                      <p className="text-silver/20 text-[10px] uppercase tracking-wider">
                        {searchTerm || docFilter !== 'all' ? 'Try clearing your filters' : 'Be the first to submit a proposal'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                      {filteredSubmissions.map((sub) => (
                        <div 
                          key={sub.id}
                          className="bg-pure-black border border-silver/15 rounded-2xl p-5 hover:border-silver/20 transition-all space-y-4"
                        >
                          {/* Card Meta Header */}
                          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold">
                            <span className={`px-2 py-0.5 rounded border ${
                              (sub.documentType || '').includes('Constitution')
                                ? 'bg-primary/5 text-primary border-primary/20'
                                : 'bg-silver/5 text-silver border-silver/10'
                            }`}>
                              {sub.documentType || 'Governing Document'}
                            </span>
                            <span className="text-silver/40 font-semibold">
                              {formatDate(sub.submittedAt)}
                            </span>
                          </div>

                          {/* Target Article Reference */}
                          <div className="bg-silver/5 px-4 py-2.5 rounded-xl flex items-center justify-between border border-silver/5">
                            <div className="text-[10px] uppercase tracking-widest text-silver/60">
                              Target Segment:
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-white">
                              {sub.article} &bull; {sub.section}
                            </div>
                          </div>

                          {/* Reference Text (Original Text) */}
                          {sub.originalText && sub.originalText !== '(No original text specified)' && (
                            <div className="space-y-1">
                              <span className="block text-[9px] uppercase tracking-widest text-silver/40 font-bold">Original Reference Text:</span>
                              <p className="text-xs text-silver/60 italic leading-relaxed pl-3 border-l border-silver/10 py-0.5">
                                "{sub.originalText}"
                              </p>
                            </div>
                          )}

                          {/* Proposed Revision Text (Submitted Change) */}
                          <div className="space-y-1">
                            <span className="block text-[9px] uppercase tracking-widest text-primary font-black">Proposed Submitted Change:</span>
                            <div className="bg-pure-black/95 border border-primary/10 rounded-xl p-3.5 mt-1">
                              <p className="text-white text-xs font-light leading-relaxed whitespace-pre-wrap">
                                {sub.proposedText}
                              </p>
                            </div>
                          </div>

                          {/* Submitter info */}
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-silver/50 pt-2 border-t border-silver/5">
                            <span>Submitted By:</span>
                            <span className="text-white font-extrabold">{sub.submitterName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Submission Heading */}
                  <div className="flex items-center gap-3 border-b border-silver/10 pb-4 mb-6">
                    <BookOpen size={20} className="text-primary" />
                    <h3 className="text-base font-bold text-white uppercase tracking-widest">
                      Proposed Amendment Form
                    </h3>
                  </div>

                  {/* Submission Deadline Pass Notification */}
                  {isDeadlinePassed && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">
                          Revisions Are Closed
                        </h5>
                        <p className="text-[11px] text-silver/60 uppercase leading-relaxed font-semibold">
                          The official deadline to submit proposed changes was June 19, 2026, at 12:00 PM ET. No additional proposed revisions are accepted after this date.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success Notification */}
                  {submissionSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-3"
                    >
                      <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">
                          Submission Successful
                        </h5>
                        <p className="text-[11px] text-silver/60 uppercase leading-relaxed font-semibold">
                          Your proposed revised language has been was recorded. Thank you for your submission!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Error Notification */}
                  {submissionError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                          Amendment Error
                        </h5>
                        <p className="text-[11px] text-red-300 uppercase leading-relaxed">
                          {submissionError}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitRevision} className="space-y-6">
                    
                    {/* Governing Document Selector Card/Toggles */}
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase tracking-wider text-silver/60 font-bold">
                        Select Governing Document *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDocType('constitution')}
                          className={`py-3.5 px-4 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all border text-center cursor-pointer ${
                            docType === 'constitution'
                              ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/5'
                              : 'bg-pure-black border-silver/10 text-silver/60 hover:border-silver/25 hover:text-white'
                          }`}
                        >
                          KP Constitution (2021)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocType('bylaws')}
                          className={`py-3.5 px-4 rounded-xl text-xs uppercase font-extrabold tracking-widest transition-all border text-center cursor-pointer ${
                            docType === 'bylaws'
                              ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/5'
                              : 'bg-pure-black border-silver/10 text-silver/60 hover:border-silver/25 hover:text-white'
                          }`}
                        >
                          KP By-Laws (2022)
                        </button>
                      </div>
                    </div>

                    {/* Selector Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Article select */}
                      <div className="space-y-1.5 font-sans">
                        <label className="block text-[10px] uppercase tracking-wider text-silver/60 font-semibold">
                          Target Article
                        </label>
                        <select
                          value={selectedArticle}
                          onChange={(e) => setSelectedArticle(e.target.value)}
                          className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-3 py-3 text-xs uppercase tracking-wider focus:outline-none transition-colors"
                        >
                          {(docType === 'constitution' ? CONSTITUTION_DATA : BYLAWS_DATA).map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                          ))}
                          <option value="Other">Other (Custom Article)</option>
                        </select>
                      </div>

                      {/* Section select */}
                      <div className="space-y-1.5 font-sans">
                        <label className="block text-[10px] uppercase tracking-wider text-silver/60 font-semibold">
                          Target Section
                        </label>
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          disabled={selectedArticle === 'Other'}
                          className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-3 py-3 text-xs uppercase tracking-wider focus:outline-none transition-colors disabled:opacity-50"
                        >
                          {selectedArticle !== 'Other' && (docType === 'constitution' ? CONSTITUTION_DATA : BYLAWS_DATA).find(a => a.id === selectedArticle)?.sections.map(s => (
                            <option key={s.id} value={s.id}>{s.id}</option>
                          ))}
                          <option value="Other">Other / Custom</option>
                        </select>
                      </div>

                    </div>

                    {/* Custom input fields if 'Other' is selected */}
                    {selectedArticle === 'Other' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold">
                            Custom Article Title / Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Article VII"
                            value={customArticle}
                            onChange={(e) => setCustomArticle(e.target.value)}
                            className="w-full bg-pure-black border border-primary/20 focus:border-primary text-white rounded-xl px-3 py-3 text-xs focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold">
                            Custom Section Title / Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Section 1"
                            value={customSection}
                            onChange={(e) => setCustomSection(e.target.value)}
                            className="w-full bg-pure-black border border-primary/20 focus:border-primary text-white rounded-xl px-3 py-3 text-xs focus:outline-none transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Section Input text if other section was selected */}
                    {selectedSection === 'Other' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5"
                      >
                        {selectedArticle !== 'Other' && (
                          <div className="space-y-1.5 mb-3">
                            <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold">
                              Custom Section Title / Number *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Section 5"
                              value={customSection}
                              onChange={(e) => setCustomSection(e.target.value)}
                              className="w-full bg-pure-black border border-primary/20 focus:border-primary text-white rounded-xl px-3 py-3 text-xs focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                        <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold">
                          Current Verbiage / Reference Text (Optional)
                        </label>
                        <textarea
                          placeholder="Type the constitution passage that you wish to propose revisions for..."
                          rows={3}
                          value={customOriginalText}
                          onChange={(e) => setCustomOriginalText(e.target.value)}
                          className="w-full bg-pure-black border border-primary/20 focus:border-primary text-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors font-light leading-relaxed resize-y"
                        />
                      </motion.div>
                    )}

                    {/* Display Current Selected Text (Display Only) */}
                    {selectedSection !== 'Other' && selectedArticle !== 'Other' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-silver/40 font-semibold">
                          Active Governing Verbiage:
                        </label>
                        <div className="p-4 bg-pure-black/60 border border-silver/10 rounded-2xl">
                          <p className="text-silver/80 text-xs font-light leading-relaxed italic">
                            "{getCurrentOriginalText()}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* User Proposed Language Textbox */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-bold">
                        Proposed Revised Language *
                      </label>
                      <textarea
                        required
                        placeholder="Enter the proposed revised text or new language to be presented to the Directorate..."
                        rows={6}
                        value={proposedText}
                        onChange={(e) => setProposedText(e.target.value)}
                        className="w-full bg-pure-black border border-silver/20 focus:border-primary text-white rounded-xl px-4 py-3.5 text-xs focus:outline-none transition-colors leading-relaxed resize-y font-light shadow-inner"
                      />
                    </div>

                    {/* User Info Row */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-bold">
                        Submitted By *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jason Purify"
                        value={submitterName}
                        onChange={(e) => setSubmitterName(e.target.value)}
                        className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-3 py-3 text-xs focus:outline-none transition-colors font-semibold"
                      />
                    </div>

                    {/* Submit button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={
                          isSubmitting || 
                          isDeadlinePassed ||
                          !submitterName.trim() || 
                          !proposedText.trim() || 
                          (selectedArticle === 'Other' && !customArticle.trim()) || 
                          (selectedSection === 'Other' && !customSection.trim())
                        }
                        className="w-full py-4 bg-primary hover:bg-white text-black font-bold uppercase tracking-widest rounded-xl transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                        title={
                          isDeadlinePassed
                            ? "Submission deadline has passed."
                            : !submitterName.trim() || !proposedText.trim() 
                              ? "Please fill in 'Submitted By' and proposed text to submit." 
                              : "Submit proposal"
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Transmitting Revision...</span>
                          </>
                        ) : isDeadlinePassed ? (
                          <>
                            <Lock size={14} />
                            <span>Deadline Passed</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle size={14} />
                            <span>Submit Proposal</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </>
              )}
            </div>
          </section>

        </div>

        {/* Admin Login Pill */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/admin-dashboard?tab=revisions"
            className="group inline-flex items-center gap-2 bg-silver/5 hover:bg-silver/10 text-silver/40 hover:text-white border border-silver/10 hover:border-silver/20 px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer hover:translate-y-[-1px]"
          >
            <Lock size={12} className="text-silver/40 group-hover:text-white transition-colors" />
            <span>Admin Login</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
