import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  X,
  Search,
  Shield,
  Users,
  UserCheck,
  Vote,
  Layers,
  Settings,
  Mail,
  Lock,
  CalendarDays,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Archive,
  Lightbulb,
  Award
} from 'lucide-react';

interface AdminUserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

interface GuideSection {
  id: string;
  title: string;
  category: 'Overview & Basics' | 'Member & Access Control' | 'Candidate & Intake' | 'Elections & Voting' | 'System & Security';
  icon: any;
  summary: string;
  wiifm: string; // What's In It For Me
  steps: string[];
  proTips: string[];
  relatedTab?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'user_management',
    title: 'Managing Members & User Accounts',
    category: 'Member & Access Control',
    icon: Users,
    summary: 'Easily view, add, edit, or reset credentials for any member of the organization without writing code or accessing complex databases.',
    wiifm: 'You can update member contact information, grant officer titles, issue password resets, or resend welcome emails in seconds—keeping your membership directory 100% up to date.',
    steps: [
      'Navigate to the "Identity & Access" hub and select "User Management".',
      'Use the search bar to locate any member by name, email address, or title.',
      'Click the "Edit" button to change their name, phone number, financial standing, or assign multiple roles.',
      'To add a brand-new member, click "Add New Member", fill in their details, and save. The system automatically creates their secure login profile.',
      'If a member forgets their password, click "Reset Password" to generate a temporary login code and send them instructions.'
    ],
    proTips: [
      'Changes are instantly saved to both cloud storage and local database simultaneously (Zero Data-Loss Dual-Write).',
      'Financial status directly determines whether a member can access voting portals during general elections.'
    ],
    relatedTab: 'users'
  },
  {
    id: 'rbac_control',
    title: 'Role-Based Access Control (RBAC)',
    category: 'Member & Access Control',
    icon: Shield,
    summary: 'Grant or restrict access to any page or tool across the entire site by user role or individual user email with real-time toggle switches.',
    wiifm: 'You never have to ask developers to change who can see which dashboard. You have complete, instant authority over who can view applications, tally votes, or edit committee files.',
    steps: [
      'Open the "Identity & Access" hub and choose "Role & Access Control (RBAC)".',
      'Under "Role Permissions", pick any role (e.g., Officer, Committee Chair, Membership Committee) and toggle features ON or OFF.',
      'Under "User Rights & Role Assignment", search for any individual member to grant them multiple roles simultaneously.',
      'Use "Granular Capability Rights" to give a single user custom access to a feature (like Review Applications) without changing their overall title.',
      'Check the "Full Access Matrix" for a panoramic, spreadsheet-style view of every capability across every role in the organization.'
    ],
    proTips: [
      'All changes take effect immediately without requiring users to log out and log back in.',
      'If you ever make a mistake, click "Reset to Defaults" on any role to restore standard organizational settings in 1 click.'
    ],
    relatedTab: 'rbac'
  },
  {
    id: 'candidate_pipeline',
    title: 'Candidate Intake & Application Pipeline',
    category: 'Candidate & Intake',
    icon: UserCheck,
    summary: 'Track prospective candidates from their initial inquiry and application submission all the way through interview scoring and final voting.',
    wiifm: 'No lost paperwork or messy email attachments. You get a single consolidated pipeline showing every candidate’s application status, interview scorecards, and uploaded documents.',
    steps: [
      'Open the "Intake & Candidates" hub and select "Candidate Pipeline".',
      'Filter candidates by stage: Inquiry, Applied, Interviewed, Nominated, or Selected.',
      'Click on any candidate to view their submitted questionnaire responses, resume, and official review scores.',
      'Advance candidates through pipeline stages as they complete intake requirements.',
      'To remove an inactive or ineligible applicant, click the "Remove Candidate" option with audit tracking.'
    ],
    proTips: [
      'When a candidate submits their application through the portal, their status automatically upgrades from "Inquiry" to "Applied" with zero admin effort.',
      'Candidate login passwords default to the last 4 digits of their phone number for effortless onboarding.'
    ],
    relatedTab: 'candidates'
  },
  {
    id: 'site_navigator',
    title: 'Site-Wide Navigation & Command Explorer',
    category: 'Overview & Basics',
    icon: Sparkles,
    summary: 'Instantly jump to any page, voting room, committee workspace, or document repository across the entire website from one central hub.',
    wiifm: 'Eliminates hunting through complex menus or remembering bookmarks. You can navigate, inspect, and test every single corner of the platform in 1 click.',
    steps: [
      'Click "Site-Wide Navigator" from the dashboard tabs or top shortcut bar.',
      'Use the quick search box to find any page (e.g. "Voting", "Bylaws", "Scholarship Committee").',
      'Review which roles have permission to view that page and its current status.',
      'Click "Open Page" to jump directly into that experience.'
    ],
    proTips: [
      'Use the Site Navigator during meetings to quickly pull up live scoreboards, minutes, or candidate ballots in real-time.'
    ],
    relatedTab: 'siteNavigator'
  },
  {
    id: 'voting_elections',
    title: 'Managing Elections & Secret Ballots',
    category: 'Elections & Voting',
    icon: Vote,
    summary: 'Coordinate transparent, cryptographically certified elections for Candidate Intake and Dean of Intake.',
    wiifm: 'Run smooth, dispute-free elections with live turnout tracking, certified PDF reports, and tamper-proof audit trails that protect organizational integrity.',
    steps: [
      'For Dean of Intake elections: Direct members to the Dean Nomination Form, then monitor submissions on the Dean Nomination Dashboard.',
      'When voting opens: Direct financial members to the Dean Voting Form or Candidate Voting Form.',
      'Monitor live turnout in real-time on the Dean Voting Dashboard or Candidate Voting Report.',
      'Verify election validity and tally integrity using the Dean Voting Audit Trail and Candidate Voting Audit Trail.'
    ],
    proTips: [
      'The voting system automatically enforces one-vote-per-member and verifies financial standing before accepting ballots.',
      'Audit logs record timestamps and cryptographic verification hashes for every vote cast.'
    ]
  },
  {
    id: 'workspace_email',
    title: 'Google Workspace & Email Broadcast Console',
    category: 'System & Security',
    icon: Mail,
    summary: 'Connect official Google Forms to sync intake responses directly into the database, and send official email notifications to candidates and members.',
    wiifm: 'Automate data collection from Google Forms and broadcast important intake announcements directly from the admin dashboard without juggling multiple browser tabs.',
    steps: [
      'Navigate to "Workspace & Forms" under the Intake hub.',
      'Sign in with your authorized Google Workspace account.',
      'Enter your Google Form ID to link and automatically import applicant submissions.',
      'Use the Gmail Console to compose and send formatted emails to individual candidates or the entire intake cohort.'
    ],
    proTips: [
      'All email transmissions and Google Form syncs are logged in the System Audit Trail for compliance.'
    ],
    relatedTab: 'googleForms'
  },
  {
    id: 'security_audits',
    title: 'Security Logs & Audit Trails',
    category: 'System & Security',
    icon: Clock,
    summary: 'Review an immutable, chronological record of all administrative actions, password resets, application evaluations, and system events.',
    wiifm: 'Complete visibility into who accessed what and when. You can verify compliance, investigate issues, and maintain organizational accountability with zero guesswork.',
    steps: [
      'Navigate to the "Governance & Compliance" hub and select "Audit Trail & System Logs".',
      'Filter logs by action type: Portal Access, Application Reviews, Candidate Changes, or Security Events.',
      'Search by administrator email, candidate name, or date range.',
      'Check the "Password Security Logs" tab to see all password change histories and failed login attempts.'
    ],
    proTips: [
      'Audit logs are permanently preserved and cannot be altered by standard users.',
      'Failed login attempts are highlighted to help you spot unauthorized access attempts immediately.'
    ],
    relatedTab: 'audits'
  },
  {
    id: 'system_settings',
    title: 'System Settings & Global Controls',
    category: 'System & Security',
    icon: Settings,
    summary: 'Toggle organizational modules on/off (e.g. Standing Committees), manage cloud database synchronization, and perform system health checks.',
    wiifm: 'You can enable or disable entire features across the site with a single toggle switch when transitioning between active intake cycles or committee terms.',
    steps: [
      'Navigate to "System & Operations" and select "System Settings".',
      'Toggle "Enable Standing Committees" to show or hide committee workspaces across the entire site.',
      'Click "Ping / Hydrate Cloud Storage" to manually force a two-way synchronization between Cloud Firestore and local storage.',
      'Review server status and database connectivity metrics.'
    ],
    proTips: [
      'The application automatically syncs with Cloud Firestore in the background on every page load, so manual sync is only needed during initial setup.'
    ],
    relatedTab: 'systemSettings'
  }
];

export default function AdminUserGuideModal({ isOpen, onClose, onNavigateTab }: AdminUserGuideModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSectionId, setActiveSectionId] = useState<string>(GUIDE_SECTIONS[0].id);

  if (!isOpen) return null;

  const categories = ['all', 'Overview & Basics', 'Member & Access Control', 'Candidate & Intake', 'Elections & Voting', 'System & Security'];

  const filteredSections = GUIDE_SECTIONS.filter(sec => {
    const matchesSearch = !searchTerm || 
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.wiifm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeSection = GUIDE_SECTIONS.find(s => s.id === activeSectionId) || filteredSections[0] || GUIDE_SECTIONS[0];
  const IconComponent = activeSection.icon;

  const handleJumpToTab = (tabKey?: string) => {
    if (tabKey && onNavigateTab) {
      onNavigateTab(tabKey);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-cream w-full max-w-5xl rounded-3xl border border-gold/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-ivy"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-ivy via-forest to-ivy p-6 text-cream border-b border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold text-ivy">
                  Administrator Reference
                </span>
                <span className="text-[10px] text-cream/70 font-semibold uppercase tracking-wider">
                  Plain-English Operations Guide
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-cream flex items-center gap-2.5">
                <BookOpen className="w-7 h-7 text-gold" /> Admin Dashboard User Guide
              </h2>
              <p className="text-xs text-cream/80 max-w-2xl">
                A non-technical, outcome-focused guide designed to help administrators manage members, candidate intake, access control, and elections with complete confidence.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-cream rounded-2xl transition-colors shrink-0 self-end sm:self-center cursor-pointer"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body with 2-Column Layout */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
            {/* Left Column: Navigation & Search (4.5 cols on md) */}
            <div className="md:col-span-4 lg:col-span-4 bg-white border-r border-gold/20 p-4 flex flex-col gap-3 min-h-0 overflow-y-auto scrollbar-thin">
              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search guide topics, WIIFM..."
                  className="w-full pl-9 pr-3 py-2 bg-cream/40 border border-gold/25 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold/30 text-ivy"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1 shrink-0 pb-1 border-b border-gold/15">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-ivy text-cream shadow-xs'
                        : 'bg-cream/60 text-ivy/70 hover:bg-gold/10'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Section Buttons List */}
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const SecIcon = sec.icon;
                  const isSelected = activeSectionId === sec.id;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cream border-gold ring-2 ring-gold/40 shadow-xs'
                          : 'bg-white border-gold/15 hover:border-gold/30 hover:bg-cream/20'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isSelected ? 'bg-ivy text-gold' : 'bg-cream text-ivy/70'}`}>
                        <SecIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">
                          {sec.category}
                        </span>
                        <h4 className="font-bold text-xs text-ivy line-clamp-1">{sec.title}</h4>
                        <p className="text-[10px] text-ivy/60 line-clamp-1">{sec.summary}</p>
                      </div>
                    </button>
                  );
                })}

                {filteredSections.length === 0 && (
                  <div className="p-6 text-center text-ivy/50 text-xs">
                    No matching guide topics found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Detailed Topic Content (7.5 cols on md) */}
            <div className="md:col-span-8 lg:col-span-8 p-6 overflow-y-auto bg-cream/30 space-y-6 scrollbar-thin">
              {activeSection && (
                <div className="space-y-6">
                  {/* Topic Title Header */}
                  <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-ivy border border-gold/30">
                        {activeSection.category}
                      </span>
                      {activeSection.relatedTab && (
                        <button
                          onClick={() => handleJumpToTab(activeSection.relatedTab)}
                          className="text-xs font-bold text-ivy hover:text-gold flex items-center gap-1 cursor-pointer bg-cream px-3 py-1 rounded-xl border border-gold/20 transition-colors"
                        >
                          <span>Open Tool in Dashboard</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-ivy text-gold shrink-0">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-ivy">{activeSection.title}</h3>
                        <p className="text-xs text-ivy/70 leading-relaxed mt-1">{activeSection.summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* WIIFM Card (What's In It For Me) */}
                  <div className="bg-gradient-to-br from-amber-50 to-gold/10 p-5 rounded-3xl border border-gold/30 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold shrink-0" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ivy">
                        What's In It For You (The Administrator Benefit)
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-ivy font-medium leading-relaxed">
                      "{activeSection.wiifm}"
                    </p>
                  </div>

                  {/* Step-by-Step Walkthrough */}
                  <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-4">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ivy flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Step-by-Step Instructions
                    </h4>

                    <div className="space-y-3">
                      {activeSection.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-ivy">
                          <span className="w-5 h-5 rounded-full bg-ivy text-cream font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro Tips & Best Practices */}
                  <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 space-y-3">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-emerald-700" /> Pro Tips & Best Practices
                    </h4>
                    <ul className="space-y-2">
                      {activeSection.proTips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-emerald-950 flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Action Footer in Modal */}
                  {activeSection.relatedTab && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => handleJumpToTab(activeSection.relatedTab)}
                        className="px-6 py-3 bg-ivy text-cream hover:bg-forest rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-gold" /> Jump to {activeSection.title.split(' ')[0]} Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-white p-4 border-t border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-ivy/60">
            <span>
              💡 <strong>Need additional help?</strong> Contact the system administrator at <code className="text-ivy font-mono">info@orderofkpi.org</code>.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-ivy text-cream rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
