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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

const STATIC_CONSTITUTION_DATA = [
  {
    id: "Article I",
    title: "Article I: Name and Object",
    sections: [
      { id: "Section 1", text: "The name of this organization shall be The Order of KP, Inc." },
      { id: "Section 2", text: "The objective and purposes of this organization is to foster fraternal bonds, support community leadership, and promote excellence among members and community partners." }
    ]
  },
  {
    id: "Article II",
    title: "Article II: Membership",
    sections: [
      { id: "Section 1", text: "Membership shall be open to individuals who meet the recruitment and financial criteria established by the Directorate." },
      { id: "Section 2", text: "Active membership requires timely payment of annual dues and active participation in organizational events." }
    ]
  },
  {
    id: "Article VI",
    title: "Article VI: Officers",
    sections: [
      { id: "Section 1", text: "The members of the Directorate shall be the Basileus, the 1st Anti-Basileus, the 2nd Anti-Basileus, the Grammateus, the Pecunious Grammateus, the Tamiouchos, the Epistoleus, the Hodegos, and the Historian." },
      { id: "Section 2", text: "The term of office for each officer shall be for two years. Term is from July 1 – June 30." },
      { id: "Section 3", text: "Officers shall be elected in May and installed at the last meeting in June. Members shall be nominated by the organization and names will be submitted to the Nominating Committee after verification of financial obligations." },
      { id: "Section 4", text: "It shall be the duty of each officer to deliver to his successor all files, supplies, materials, and records in his possession within 14 calendar days after the installation. If not complied with, it shall be the duty of the Basileus to ensure that transfers are facilitated." }
    ]
  }
];

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

  // form States
  const [selectedArticle, setSelectedArticle] = useState('Article VI');
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
    const articleObj = STATIC_CONSTITUTION_DATA.find(a => a.id === selectedArticle);
    if (!articleObj) return '';
    
    if (selectedSection === 'Other') {
      return customOriginalText;
    }
    const sectionObj = articleObj.sections.find(s => s.id === selectedSection);
    return sectionObj ? sectionObj.text : '';
  };

  // Update dynamic defaults when article changes
  useEffect(() => {
    if (selectedArticle !== 'Other') {
      const articleObj = STATIC_CONSTITUTION_DATA.find(a => a.id === selectedArticle);
      if (articleObj && articleObj.sections.length > 0) {
        setSelectedSection(articleObj.sections[0].id);
      } else {
        setSelectedSection('Other');
      }
    } else {
      setSelectedSection('Other');
    }
  }, [selectedArticle]);

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <main className="w-full bg-pure-black min-h-screen py-20 px-6 flex items-center justify-center relative overflow-hidden">
        {/* Abstract glowing background lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-silver/20 to-transparent" />
        
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <Link to="/agenda" className="inline-flex items-center gap-1.5 text-silver/40 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors mb-6">
              <ArrowLeft size={12} /> Back to Conference
            </Link>
            
            <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
              <Lock size={28} className="animate-pulse text-primary" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-2">
              KPI Revisions Portal
            </h1>
            <p className="text-silver/40 text-xs uppercase tracking-[0.2em] max-w-[320px] mx-auto leading-relaxed">
              Administrative & Financial Member access only
            </p>
          </div>

          <div className="bg-silver/5 border border-silver/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
            <h3 className="text-base font-bold text-silver uppercase tracking-widest mb-6 text-center">
              Enter Passcode to Submit Revisions
            </h3>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-silver/60">
                  Financial Member Passcode
                </label>
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
    <main className="w-full bg-pure-black min-h-screen py-20 px-4 md:px-8 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Navigation & Logout Header */}
        <div className="flex items-center justify-between mb-12">
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
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Unlock size={12} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Access Granted • KPI Member</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-[0.1em] mb-4">
            Constitution & Bylaws Revisions
          </h1>
          <p className="text-silver/40 text-xs uppercase tracking-[0.25em] max-w-[500px] mx-auto leading-relaxed">
            Submit proposed changes to governing organizational documents directly to the Directorate
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Download & Selection Reference */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Download Document Box */}
            <div className="bg-silver/5 border border-silver/10 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
              <FileText className="text-primary mb-4" size={28} />
              
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Governing Code
              </h3>
              <p className="text-silver/50 text-[11px] leading-relaxed mb-4 uppercase tracking-wider">
                Review the latest active constitution and by-laws draft for reference.
              </p>
              
              {/* PDF Clickable Link */}
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Official PDF Link is TBD. This placeholder is primed to route to your hosted bylaws PDF once available.");
                }}
                className="w-full inline-flex items-center justify-between p-3.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all text-[10px] uppercase font-bold tracking-widest text-primary hover:text-white"
              >
                <span>Download Governing Code</span>
                <ExternalLink size={12} />
              </a>
              <p className="text-[9px] text-silver/30 text-center mt-2 font-mono uppercase tracking-widest">
                [Link TBD]
              </p>
            </div>

            {/* Quick Reference Box */}
            <div className="bg-pure-black border border-silver/5 p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-silver uppercase tracking-wider mb-3">Revision Rulebook</h4>
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

          {/* Right Column: Submission Form */}
          <section className="lg:col-span-8">
            <div className="bg-silver/5 border border-silver/10 p-6 md:p-8 rounded-3xl relative backdrop-blur-md">
              
              {/* Submission Heading */}
              <div className="flex items-center gap-3 border-b border-silver/10 pb-4 mb-6">
                <BookOpen size={20} className="text-primary" />
                <h3 className="text-base font-bold text-white uppercase tracking-widest">
                  Proposed Amendment Form
                </h3>
              </div>

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
                
                {/* Selector Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Article select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-silver/60 font-semibold">
                      Target Article
                    </label>
                    <select
                      value={selectedArticle}
                      onChange={(e) => setSelectedArticle(e.target.value)}
                      className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-3 py-3 text-xs uppercase tracking-wider focus:outline-none transition-colors"
                    >
                      {STATIC_CONSTITUTION_DATA.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                      <option value="Other">Other (Custom Article)</option>
                    </select>
                  </div>

                  {/* Section select */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-wider text-silver/60 font-semibold">
                      Target Section
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      disabled={selectedArticle === 'Other'}
                      className="w-full bg-pure-black border border-silver/20 focus:border-primary/50 text-white rounded-xl px-3 py-3 text-xs uppercase tracking-wider focus:outline-none transition-colors disabled:opacity-50"
                    >
                      {selectedArticle !== 'Other' && STATIC_CONSTITUTION_DATA.find(a => a.id === selectedArticle)?.sections.map(s => (
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
                    placeholder="e.g. Anthony Jones"
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
                      !submitterName.trim() || 
                      !proposedText.trim() || 
                      (selectedArticle === 'Other' && !customArticle.trim()) || 
                      (selectedSection === 'Other' && !customSection.trim())
                    }
                    className="w-full py-4 bg-primary hover:bg-white text-black font-bold uppercase tracking-widest rounded-xl transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                    title={
                      !submitterName.trim() || !proposedText.trim() 
                        ? "Please fill in 'Submitted By' and proposed text to submit." 
                        : "Submit proposal"
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Transmitting Revision...</span>
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
            </div>
          </section>

        </div>

        <footer className="mt-20 pt-12 border-t border-silver/10 text-center">
          <p className="text-silver/20 text-[10px] uppercase tracking-[0.4em]">
            Official Constitution of The Order of KP, Inc.
          </p>
        </footer>

      </div>
    </main>
  );
}
