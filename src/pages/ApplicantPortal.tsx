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
  ClipboardList
} from 'lucide-react';
import { fetchApplication } from '../lib/memberDb';
import Application from './Application';

export default function ApplicantPortal() {
  const [activeTab, setActiveTab] = useState<'application' | 'timeline' | 'instructions'>('application');
  const [appStatus, setAppStatus] = useState<'not_started' | 'draft' | 'submitted'>('not_started');
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || 'Applicant';
  const userFirstName = sessionStorage.getItem('userFirstName') || userName.split(' ')[0];

  useEffect(() => {
    async function loadData() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetchApplication(userEmail);
        if (res) {
          if (res.application) {
            setAppStatus(res.application.status || 'draft');
            setLastSaved(res.application.submitted_at || res.application.last_saved_at || null);
          }
          if (res.candidateStatus) {
            setCandidateStatus(res.candidateStatus);
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
    setActiveTab('application');
    setTimeout(() => {
      const element = document.getElementById('application-form-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userFirstName');
    sessionStorage.removeItem('userRole');
    navigate('/applicant-login');
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

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold/30 bg-white text-ivy text-xs font-bold uppercase tracking-widest hover:bg-gold/10 transition-all shadow-soft"
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
            onClick={() => setActiveTab('application')}
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
            onClick={() => setActiveTab('timeline')}
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
            onClick={() => setActiveTab('instructions')}
            className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === 'instructions'
                ? 'bg-ivy text-cream shadow-md'
                : 'bg-white border border-gold/20 text-ivy hover:bg-gold/10'
            }`}
          >
            <HelpCircle size={16} className={activeTab === 'instructions' ? 'text-gold' : 'text-ivy/60'} />
            Applicant Guidelines & FAQs
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'application' && (
          <div id="application-form-section" className="bg-white border border-gold/20 rounded-[32px] p-4 md:p-8 shadow-soft">
            <Application />
          </div>
        )}

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
      </div>
    </div>
  );
}
