import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  CalendarDays, 
  ShieldCheck, 
  LogOut, 
  ArrowRight, 
  Info, 
  User, 
  HelpCircle,
  Sparkles,
  ChevronRight,
  ClipboardList,
  Lock,
  KeyRound,
  Loader2,
  Save,
  Settings,
  Mail,
  X,
  RefreshCw
} from 'lucide-react';
import { fetchApplication, performHybridPasswordChange, changeApplicantEmail, syncApplicationsFromFirestore } from '../lib/memberDb';
import Application from './Application';

export default function ApplicantPortal() {
  const [activeTab, setActiveTab] = useState<'application' | 'timeline' | 'instructions' | 'account'>('application');
  const [linkedGoogleFormId, setLinkedGoogleFormId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkedForm = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const docSnap = await getDoc(doc(db, 'settings', 'google_form'));
        if (docSnap.exists()) {
          const fid = docSnap.data().formId;
          if (fid) setLinkedGoogleFormId(fid);
        }
      } catch (err) {
        console.warn('Error fetching linked google form:', err);
      }
    };
    fetchLinkedForm();
  }, []);
  const [appStatus, setAppStatus] = useState<'not_started' | 'draft' | 'submitted'>('not_started');
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const saveRef = React.useRef<(() => Promise<any>) | null>(null);
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState(() => sessionStorage.getItem('userEmail') || '');
  const userName = sessionStorage.getItem('userName') || 'Applicant';
  const userFirstName = sessionStorage.getItem('userFirstName') || userName.split(' ')[0];

  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Account settings states
  const [newEmail, setNewEmail] = useState('');
  const [emailAuthPassword, setEmailAuthPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsPwdError, setSettingsPwdError] = useState('');
  const [settingsPwdSuccess, setSettingsPwdSuccess] = useState('');
  const [settingsPwdLoading, setSettingsPwdLoading] = useState(false);

  useEffect(() => {
    // Background sync application data on load
    if (userEmail) {
      syncApplicationsFromFirestore().catch(() => {}).then(async () => {
        const res = await fetchApplication(userEmail);
        if (res) {
          if (res.candidateStatus) setCandidateStatus(res.candidateStatus);
          if (res.application?.status === 'submitted' || res.candidateStatus === 'Applied') {
            setAppStatus('submitted');
          } else if (res.application) {
            setAppStatus(res.application.status || 'draft');
          }
        }
      }).catch(() => {});
    }

    // Check if user is logging in for the first time
    const isFirst = sessionStorage.getItem('userIsFirstLogin') === 'true';
    const pwdChangedLocally = localStorage.getItem(`kpi_password_changed_${userEmail}`) === 'true';
    if (userEmail && (isFirst || !pwdChangedLocally)) {
      setShowFirstLoginModal(true);
    }
  }, [userEmail]);

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match. Please re-enter.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await performHybridPasswordChange(userEmail, currentPassword, newPassword);
      if (res.success) {
        setPwdSuccess('Your password has been updated successfully.');
        sessionStorage.setItem('userIsFirstLogin', 'false');
        localStorage.setItem(`kpi_password_changed_${userEmail}`, 'true');
        setTimeout(() => {
          setShowFirstLoginModal(false);
        }, 1200);
      } else {
        setPwdError(res.message || 'Unable to update password. Please try again.');
      }
    } catch (err: any) {
      setPwdError(err.message || 'An error occurred while updating password. Please try again.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSettingsPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsPwdError('');
    setSettingsPwdSuccess('');

    if (!settingsNewPassword || settingsNewPassword.length < 8) {
      setSettingsPwdError('New password must be at least 8 characters long.');
      return;
    }

    // Password validation rules: 8+ characters, at least 1 number, at least 1 uppercase letter
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(settingsNewPassword)) {
      setSettingsPwdError('Password must include at least 8 characters, contain at least 1 number and 1 upper case letter.');
      return;
    }

    if (settingsNewPassword !== settingsConfirmPassword) {
      setSettingsPwdError('New passwords do not match. Please re-enter.');
      return;
    }

    setSettingsPwdLoading(true);
    try {
      const res = await performHybridPasswordChange(userEmail, settingsCurrentPassword, settingsNewPassword);
      if (res.success) {
        setSettingsPwdSuccess('Your password has been updated successfully.');
        setSettingsCurrentPassword('');
        setSettingsNewPassword('');
        setSettingsConfirmPassword('');
      } else {
        setSettingsPwdError(res.message || 'Unable to update password. Please try again.');
      }
    } catch (err: any) {
      setSettingsPwdError(err.message || 'An error occurred while updating password. Please try again.');
    } finally {
      setSettingsPwdLoading(false);
    }
  };

  const handleSettingsEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid new email address.');
      return;
    }

    if (newEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
      setEmailError('New email is the same as your current email.');
      return;
    }

    setEmailLoading(true);
    try {
      const res = await changeApplicantEmail(userEmail, newEmail, emailAuthPassword);
      if (res.success && res.user) {
        setEmailSuccess('Your email address has been updated successfully.');
        sessionStorage.setItem('userEmail', res.user.email);
        setUserEmail(res.user.email);
        setNewEmail('');
        setEmailAuthPassword('');
      } else {
        setEmailError(res.message || 'Unable to update email address. Please try again.');
      }
    } catch (err: any) {
      setEmailError(err.message || 'An error occurred while updating email address. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const normEmail = userEmail.toLowerCase().trim();
        const isSubmittedLocal = localStorage.getItem(`kpi_app_submitted_${normEmail}`) === 'true';
        
        const res = await fetchApplication(userEmail);
        if (res) {
          if (res.candidateStatus) {
            setCandidateStatus(res.candidateStatus);
          }

          if (res.application?.status === 'submitted' || res.candidateStatus === 'Applied' || isSubmittedLocal) {
            setAppStatus('submitted');
            setLastSaved(res.application?.submitted_at || res.application?.submittedAt || res.application?.last_saved_at || new Date().toISOString());
          } else if (res.application) {
            setAppStatus(res.application.status || 'draft');
            setLastSaved(res.application.last_saved_at || res.application.lastSavedAt || null);
          } else if (isSubmittedLocal) {
            setAppStatus('submitted');
          }
        }
      } catch (err) {
        console.error('Failed to load application status:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  const handleContinueApplication = () => {
    handleTabClick('application');
    setTimeout(() => {
      const lastSection = sessionStorage.getItem('lastApplicationSection') || 'personal';
      const sectionIdMap: Record<string, string> = {
        personal: 'field-section-personal',
        professional: 'field-section-professional',
        academic: 'field-section-academic',
        community: 'field-section-community',
        essays: 'field-section-essays',
        disclosures: 'field-section-disclosures',
        social: 'field-section-social',
      };
      const targetId = sectionIdMap[lastSection] || 'application-form-section';
      const element = document.getElementById(targetId) || document.getElementById('application-form-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleTabClick = (tab: 'application' | 'timeline' | 'instructions' | 'account') => {
    if (activeTab === 'application' && hasUnsavedChanges && tab !== 'application') {
      setPendingAction(() => () => setActiveTab(tab));
      setShowExitPrompt(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userFirstName');
    sessionStorage.removeItem('userRole');
    navigate('/applicant-login');
  };

  const handleLogoutClick = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => handleLogout);
      setShowExitPrompt(true);
    } else {
      handleLogout();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] w-full text-ivy font-display">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 space-y-12">
        {/* Top Applicant Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gold/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full">
              <ShieldCheck size={12} className="text-gold" />
              <span className="text-[9px] font-bold text-ivy uppercase tracking-[0.2em]">FY27 Prospective Candidate Portal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-ivy">
              Welcome, <span className="text-gold">{userFirstName}</span>
            </h1>
            <p className="text-ivy/60 text-xs md:text-sm font-body">
              Signed in as <span className="font-bold text-ivy">{userEmail}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'application' && appStatus !== 'submitted' && (
              <button
                type="button"
                onClick={async () => {
                  if (saveRef.current) {
                    await saveRef.current();
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold/40 bg-gold text-ivy text-xs font-bold uppercase tracking-widest hover:brightness-105 transition-all shadow-md cursor-pointer"
              >
                <Save size={14} className="text-ivy" />
                Save Draft
              </button>
            )}
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold/30 bg-white text-ivy text-xs font-bold uppercase tracking-widest hover:bg-gold/10 transition-all shadow-soft cursor-pointer"
            >
              <LogOut size={14} className="text-gold" />
              Log Out
            </button>
          </div>
        </div>

        {/* Application Status Dashboard Card */}
        <div className="bg-white border border-gold/30 rounded-[32px] p-8 md:p-10 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <ClipboardList size={180} className="text-ivy" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  appStatus === 'submitted'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : appStatus === 'draft'
                      ? 'bg-amber-500/10 text-amber-800 border border-amber-300/50 bg-amber-50'
                      : 'bg-gold/15 text-ivy border border-gold/30'
                }`}>
                  {appStatus === 'submitted' ? (
                    <>
                      <CheckCircle size={12} className="text-green-600" />
                      {candidateStatus && !['Inquiry', 'Applied'].includes(candidateStatus) ? `Under Review (${candidateStatus})` : 'Submitted & Under Review'}
                    </>
                  ) : appStatus === 'draft' ? (
                    <>
                      <Clock size={12} className="text-amber-600" />
                      Draft - In Progress
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-gold" />
                      Not Started
                    </>
                  )}
                </span>
                {lastSaved && (
                  <span className="text-[10px] text-ivy/50 uppercase tracking-widest font-body">
                    Updated: {new Date(lastSaved).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-ivy uppercase tracking-tight">
                New Member Application Space
              </h2>
              <p className="text-ivy/70 text-sm font-body leading-relaxed max-w-xl">
                Fill out each required section of your application below. You may save your draft and return at any time. Once submitted, your application is automatically transmitted to the Membership Committee for formal administrative review.
              </p>
            </div>

            <div className="bg-cream/60 border border-gold/20 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-ivy text-cream rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <FileText size={24} className="text-gold" />
              </div>
              <button
                onClick={handleContinueApplication}
                className="w-full py-3 bg-gold text-ivy rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-105 transition-all shadow-md cursor-pointer"
              >
                {appStatus === 'submitted' ? 'View Submitted Application' : 'Continue Application'}
              </button>
            </div>
          </div>

          {/* Progress Bar Section */}
          {(() => {
            const steps = [
              { 
                label: 'Not Started', 
                desc: 'Form is ready',
                icon: Clock,
              },
              { 
                label: 'In Progress', 
                desc: 'Saved as draft',
                icon: FileText,
              },
              { 
                label: 'Submitted', 
                desc: 'Transmitted successfully',
                icon: CheckCircle,
              },
              { 
                label: 'Under Review', 
                desc: 'Committee evaluating',
                icon: ShieldCheck,
              }
            ];

            let currentStepIndex = 0;
            if (appStatus === 'draft') {
              currentStepIndex = 1;
            } else if (appStatus === 'submitted') {
              currentStepIndex = 2;
              if (candidateStatus && !['Inquiry', 'Applied'].includes(candidateStatus)) {
                currentStepIndex = 3;
              }
            }

            return (
              <div className="mt-10 pt-8 border-t border-gold/20 relative z-10">
                <div className="hidden md:flex items-center justify-between relative">
                  {/* Connecting Line Background */}
                  <div className="absolute left-[12.5%] top-[22px] right-[12.5%] h-0.5 bg-cream border border-gold/10 -z-10" />
                  {/* Connecting Line Active */}
                  <div 
                    className="absolute left-[12.5%] top-[22px] h-0.5 bg-ivy -z-10 transition-all duration-500" 
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 75}%` }}
                  />

                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 text-center relative px-2">
                        {/* Circle Indicator */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-ivy border-ivy text-gold shadow-md'
                            : isActive
                              ? 'bg-gold border-gold text-ivy ring-4 ring-gold/15 shadow-lg'
                              : 'bg-white border-gold/20 text-ivy/30'
                        }`}>
                          <Icon size={18} className={isActive ? 'text-ivy' : isCompleted ? 'text-gold' : 'text-ivy/40'} />
                        </div>

                        {/* Labels */}
                        <div className="mt-4 space-y-1">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${
                            isActive ? 'text-ivy font-extrabold' : isCompleted ? 'text-ivy/80' : 'text-ivy/40'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] font-body text-ivy/50 max-w-[140px] mx-auto leading-tight">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Vertical Layout */}
                <div className="md:hidden space-y-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">
                    Application Journey
                  </div>
                  <div className="relative pl-6 border-l-2 border-gold/20 ml-3 space-y-6">
                    {steps.map((step, idx) => {
                      const Icon = step.icon;
                      const isCompleted = idx < currentStepIndex;
                      const isActive = idx === currentStepIndex;

                      return (
                        <div key={idx} className="relative flex gap-4 items-start">
                          {/* Circle Indicator on Left Margin */}
                          <div className={`absolute -left-[31px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-ivy border-ivy text-gold shadow-md'
                              : isActive
                                ? 'bg-gold border-gold text-ivy ring-4 ring-gold/15 shadow-lg'
                                : 'bg-white border-gold/20 text-ivy/30'
                          }`}>
                            <Icon size={14} className={isActive ? 'text-ivy' : isCompleted ? 'text-gold' : 'text-ivy/40'} />
                          </div>

                          {/* Labels */}
                          <div className="space-y-0.5">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${
                              isActive ? 'text-ivy font-extrabold' : isCompleted ? 'text-ivy/80' : 'text-ivy/40'
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-[9px] font-body text-ivy/50 leading-tight">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 border-b border-gold/20 pb-4">
          <button
            onClick={() => handleTabClick('application')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'application'
                ? 'bg-ivy text-cream shadow-md'
                : 'bg-white border border-gold/20 text-ivy hover:bg-gold/10'
            }`}
          >
            <FileText size={16} className={activeTab === 'application' ? 'text-gold' : 'text-ivy/60'} />
            Application Form
          </button>

          <button
            onClick={() => handleTabClick('timeline')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-ivy text-cream shadow-md'
                : 'bg-white border border-gold/20 text-ivy hover:bg-gold/10'
            }`}
          >
            <CalendarDays size={16} className={activeTab === 'timeline' ? 'text-gold' : 'text-ivy/60'} />
            Intake Timeline & Process
          </button>

          <button
            onClick={() => handleTabClick('instructions')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'instructions'
                ? 'bg-ivy text-cream shadow-md'
                : 'bg-white border border-gold/20 text-ivy hover:bg-gold/10'
            }`}
          >
            <HelpCircle size={16} className={activeTab === 'instructions' ? 'text-gold' : 'text-ivy/60'} />
            Applicant Guidelines & FAQs
          </button>

          <button
            onClick={() => handleTabClick('account')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'account'
                ? 'bg-ivy text-cream shadow-md'
                : 'bg-white border border-gold/20 text-ivy hover:bg-gold/10'
            }`}
          >
            <Settings size={16} className={activeTab === 'account' ? 'text-gold' : 'text-ivy/60'} />
            Account Settings
          </button>

        </div>

        {/* Tab Content */}
        <div 
          id="application-form-section" 
          className={`bg-white border border-gold/20 rounded-[32px] p-4 md:p-8 shadow-soft ${activeTab !== 'application' ? 'hidden' : ''}`}
        >
          {linkedGoogleFormId && (
            <div className="mb-6 p-5 bg-gold/10 border border-gold/30 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gold/20 rounded-md text-[9px] font-bold text-ivy uppercase tracking-wider">
                  <Sparkles size={10} className="text-gold" /> Google Forms Option
                </div>
                <h4 className="text-xs font-bold text-ivy uppercase">Google Forms Application Available</h4>
                <p className="text-[11px] text-ivy/60">
                  You can optionally complete your FY27 membership intake application using our official Google Form instead of this interactive portal.
                </p>
              </div>
              <a
                href={`https://docs.google.com/forms/d/${linkedGoogleFormId}/viewform`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                Go to Google Form &rarr;
              </a>
            </div>
          )}

          <Application 
            onUnsavedChangesChange={setHasUnsavedChanges}
            saveRef={saveRef}
          />
        </div>

        {activeTab === 'timeline' && (
          <div className="bg-white border border-gold/20 rounded-[32px] p-8 md:p-12 space-y-8 shadow-soft">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  step: "Phase 1", 
                  title: "Application Submission", 
                  date: "Active Open Period", 
                  status: "In Progress", 
                  desc: "Complete all sections of the official online application." 
                },
                { 
                  step: "Phase 2", 
                  title: "Committee Review and Application Scoring", 
                  date: "Following Submission", 
                  status: "Upcoming", 
                  desc: "Applicants who meet the targeted score will advance to Phase 3." 
                },
                { 
                  step: "Phase 3", 
                  title: "Candidate Interview", 
                  date: "By Invitation Only", 
                  status: "Upcoming", 
                  desc: "Invited candidates participate in formal interview panels." 
                }
              ].map((phase, idx) => (
                <div key={idx} className="bg-cream/40 border border-gold/20 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold">{phase.step}</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-ivy text-cream rounded-full">
                      {phase.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg text-ivy">{phase.title}</h4>
                  <p className="text-xs font-body text-ivy/70 leading-relaxed">{phase.desc}</p>
                  <p className="text-[11px] font-bold text-gold uppercase tracking-wider">{phase.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'instructions' && (
          <div className="bg-white border border-gold/20 rounded-[32px] p-8 md:p-12 space-y-8 shadow-soft">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-ivy">
                Applicant Guidelines & Frequently Asked Questions
              </h3>
              <p className="text-ivy/60 text-sm font-body leading-relaxed">
                Important details for prospective candidates completing their applications.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-cream/30 rounded-2xl border border-gold/20 space-y-2">
                <h4 className="font-bold text-ivy text-base">How do I save my progress?</h4>
                <p className="text-ivy/70 text-sm font-body leading-relaxed">
                  Click the "Save Draft" button at the bottom of the application space at any time. Your responses will be saved to your candidate account.
                </p>
              </div>

              <div className="p-6 bg-cream/30 rounded-2xl border border-gold/20 space-y-2">
                <h4 className="font-bold text-ivy text-base">Who reviews my application once submitted?</h4>
                <p className="text-ivy/70 text-sm font-body leading-relaxed">
                  Upon submission, your application is securely vaulted and made available to the official Members of the Kappa Pi Membership Committee for formal evaluation.
                </p>
              </div>

              <div className="p-6 bg-cream/30 rounded-2xl border border-gold/20 space-y-2">
                <h4 className="font-bold text-ivy text-base">Can I edit my application after submitting?</h4>
                <p className="text-ivy/70 text-sm font-body leading-relaxed">
                  Once an application is submitted, it enters the official review stage. If you need to update critical contact information, please reach out to the Membership Committee.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="bg-white border border-gold/20 rounded-[32px] p-6 md:p-10 space-y-8 shadow-soft">
            <div className="space-y-2 pb-6 border-b border-gold/10">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-ivy">
                Account Settings & Security
              </h3>
              <p className="text-ivy/60 text-xs md:text-sm font-body leading-relaxed">
                Manage your candidate portal authentication credentials. Changes to your email address will update your login username.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Change Email Form */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gold" />
                    <h4 className="font-bold text-base md:text-lg text-ivy uppercase tracking-wide">Change Email Address</h4>
                  </div>
                  <p className="text-xs text-ivy/60 font-body">
                    Update your account email address. This will also update your official candidate records.
                  </p>
                </div>

                {emailError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-body">
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-body flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 shrink-0" />
                    <span>{emailSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSettingsEmailChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Current Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full bg-[#FAF9F5] border border-gold/20 rounded-xl py-2.5 px-4 text-ivy/60 text-xs focus:outline-none cursor-not-allowed font-body"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">New Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail size={14} className="text-gold" />
                      </div>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all font-body"
                        placeholder="new.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Confirm Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={14} className="text-gold" />
                      </div>
                      <input
                        type="password"
                        value={emailAuthPassword}
                        onChange={(e) => setEmailAuthPassword(e.target.value)}
                        className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all font-body"
                        placeholder="Authorize with your password"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full py-3 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-display"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-gold" /> Updating Email...
                      </>
                    ) : (
                      'Update Email Address'
                    )}
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-gold" />
                    <h4 className="font-bold text-base md:text-lg text-ivy uppercase tracking-wide">Change Password</h4>
                  </div>
                  <p className="text-xs text-ivy/60 font-body">
                    Update your account password. Passwords must be at least 8 characters with a capital letter and a number.
                  </p>
                </div>

                {settingsPwdError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-body">
                    {settingsPwdError}
                  </div>
                )}

                {settingsPwdSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-body flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600 shrink-0" />
                    <span>{settingsPwdSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSettingsPasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={14} className="text-gold" />
                      </div>
                      <input
                        type="password"
                        value={settingsCurrentPassword}
                        onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                        className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all font-body"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={14} className="text-gold" />
                      </div>
                      <input
                        type="password"
                        value={settingsNewPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all font-body"
                        placeholder="At least 8 characters, 1 uppercase, 1 number"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock size={14} className="text-gold" />
                      </div>
                      <input
                        type="password"
                        value={settingsConfirmPassword}
                        onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                        className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all font-body"
                        placeholder="Confirm your new password"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsPwdLoading}
                    className="w-full py-3 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-display"
                  >
                    {settingsPwdLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-gold" /> Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unsaved Changes Prompt Modal */}
      <AnimatePresence>
        {showExitPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowExitPrompt(false);
                setPendingAction(null);
              }}
              className="absolute inset-0 bg-ivy/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gold/30 rounded-[24px] p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6"
            >
              <div className="space-y-3">
                <h3 className="text-2xl font-bold uppercase tracking-tight text-ivy font-display">
                  Unsaved Draft Changes
                </h3>
                <p className="text-ivy/70 text-sm font-body leading-relaxed">
                  You have entered new information since the last time you saved. Would you like to save your progress before exiting?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (saveRef.current) {
                      await saveRef.current();
                    }
                    setShowExitPrompt(false);
                    if (pendingAction) {
                      pendingAction();
                      setPendingAction(null);
                    }
                  }}
                  className="w-full py-4 bg-gold text-ivy rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  Save and Continue
                </button>
                <button
                  onClick={() => {
                    setHasUnsavedChanges(false); // Discard changes
                    setShowExitPrompt(false);
                    if (pendingAction) {
                      pendingAction();
                      setPendingAction(null);
                    }
                  }}
                  className="w-full py-4 border border-gold/30 hover:bg-gold/5 text-ivy rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Discard Changes & Exit
                </button>
                <button
                  onClick={() => {
                    setShowExitPrompt(false);
                    setPendingAction(null);
                  }}
                  className="w-full py-4 text-ivy/50 hover:text-ivy text-[11px] uppercase tracking-widest font-bold text-center transition-colors cursor-pointer"
                >
                  Cancel / Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showFirstLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ivy/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gold/40 rounded-[28px] p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <button
                type="button"
                onClick={() => {
                  setShowFirstLoginModal(false);
                  setPwdError('');
                }}
                className="absolute top-5 right-5 text-ivy/40 hover:text-ivy transition-colors p-1.5 rounded-full hover:bg-gold/10 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gold/15 text-ivy rounded-2xl flex items-center justify-center mx-auto border border-gold/30 font-display">
                  <KeyRound size={22} className="text-gold" />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-ivy font-display">
                  First-Time Security Setup
                </h3>
                <p className="text-ivy/70 text-xs font-body leading-relaxed">
                  Welcome to the Candidate Application Portal! Please update your initial password to set up your account credentials.
                </p>
              </div>

              {pwdError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-body">
                  {pwdError}
                </div>
              )}

              {pwdSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-body flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Current Password (Initial Pass)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={14} className="text-gold" />
                    </div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all"
                      placeholder="e.g. last 4 digits of phone"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={14} className="text-gold" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock size={14} className="text-gold" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-cream/40 border border-gold/20 rounded-xl py-2.5 pl-10 pr-4 text-ivy text-xs focus:outline-none focus:border-ivy focus:bg-white transition-all"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full py-3.5 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-gold" /> Updating Password...
                    </>
                  ) : (
                    'Set Password & Enter Portal'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFirstLoginModal(false);
                    setPwdError('');
                  }}
                  className="w-full py-2.5 text-ivy/70 hover:text-ivy font-bold uppercase tracking-widest text-xs transition-all cursor-pointer hover:bg-gold/10 rounded-xl"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
