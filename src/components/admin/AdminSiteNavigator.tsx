import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  ExternalLink,
  Shield,
  Users,
  Vote,
  Layers,
  FileText,
  CalendarDays,
  FolderKanban,
  BookOpen,
  DollarSign,
  Archive,
  Crown,
  Lock,
  Sparkles,
  ClipboardCheck,
  CheckSquare,
  Award,
  BarChart3,
  Mail,
  ChevronRight,
  Filter,
  CheckCircle2,
  Copy,
  Sliders
} from 'lucide-react';
import { useSystemFeatures } from '../../lib/settings';

export interface SiteRouteItem {
  title: string;
  category: 'Portals & Member Directory' | 'Elections & Voting Suites' | 'Intake Pipeline & Applicants' | 'Committees & Leadership' | 'Governance & Conference' | 'Administration & Security';
  path: string;
  description: string;
  icon: any;
  allowedRoles: string[];
  isPublic?: boolean;
  status: 'Active' | 'Role Restricted' | 'Admin Only' | 'Optional Module';
  badgeColor: string;
}

export const SITE_ROUTES: SiteRouteItem[] = [
  // Portals & Member Directory
  {
    title: 'Member Portal',
    category: 'Portals & Member Directory',
    path: '/member-portal',
    description: 'Central member hub with news, quick actions, committee links, and dues status.',
    icon: Users,
    allowedRoles: ['member', 'officer', 'Committee Chair', 'admin'],
    status: 'Active',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
  },
  {
    title: 'Active Member Directory',
    category: 'Portals & Member Directory',
    path: '/member-directory',
    description: 'Searchable member roster with contact details, professional industries, and chapter roles.',
    icon: Users,
    allowedRoles: ['member', 'officer', 'Committee Chair', 'admin'],
    status: 'Active',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
  },
  {
    title: 'Financial Roster & Dues',
    category: 'Portals & Member Directory',
    path: '/financial-roster',
    description: 'Official roster showing financial dues standing and verified voting eligibility.',
    icon: DollarSign,
    allowedRoles: ['member', 'officer', 'Committee Chair', 'admin'],
    status: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    title: 'Conference & Conclave Portal',
    category: 'Portals & Member Directory',
    path: '/conference-portal',
    description: 'Annual conclave and regional conference registration, hotel details, and agenda.',
    icon: Sparkles,
    allowedRoles: ['Public / All Members'],
    isPublic: true,
    status: 'Active',
    badgeColor: 'bg-gold/20 text-gold-900 border-gold/30'
  },
  {
    title: 'Applicant Portal',
    category: 'Portals & Member Directory',
    path: '/applicant-portal',
    description: 'Candidate landing portal to view intake checklist, interview schedules, and submission status.',
    icon: UserCheckIcon,
    allowedRoles: ['applicant', 'admin'],
    status: 'Role Restricted',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200'
  },
  {
    title: 'Candidate Classroom Portal',
    category: 'Portals & Member Directory',
    path: '/classroom-portal',
    description: 'Educational modules, fraternity history, study materials, and intake assignments.',
    icon: BookOpen,
    allowedRoles: ['applicant', 'admin'],
    status: 'Role Restricted',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200'
  },

  // Elections & Voting Suites
  {
    title: 'Candidate Secret Ballot Voting',
    category: 'Elections & Voting Suites',
    path: '/candidate-voting',
    description: 'Official secret ballot for financial members to cast candidate election votes.',
    icon: Vote,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Candidate Voting Certified Report',
    category: 'Elections & Voting Suites',
    path: '/candidate-voting-report',
    description: 'Certified election results breakdown and PDF export for intake leadership.',
    icon: FileCheckIcon,
    allowedRoles: ['admin', 'Membership Committee Chair', 'officer'],
    status: 'Role Restricted',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Candidate Voting Audit Trail',
    category: 'Elections & Voting Suites',
    path: '/candidate-voting-audit',
    description: 'Tamper-proof cryptographic audit trail and ballot validation timestamps.',
    icon: ShieldCheckIcon,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'Intake Selection Voting Session',
    category: 'Elections & Voting Suites',
    path: '/selection-voting',
    description: 'Live real-time candidate selection voting room for chapter meeting sessions.',
    icon: CheckSquare,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'Dean Nomination Form',
    category: 'Elections & Voting Suites',
    path: '/dean-nomination',
    description: 'Official nomination form for members to nominate brothers for Dean of Intake.',
    icon: Award,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Dean Nomination Dashboard',
    category: 'Elections & Voting Suites',
    path: '/dean-nomination-dashboard',
    description: 'Executive management dashboard to review and certify Dean nominations.',
    icon: Layers,
    allowedRoles: ['admin', 'Membership Committee', 'officer'],
    status: 'Role Restricted',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Dean Election Voting Form',
    category: 'Elections & Voting Suites',
    path: '/dean-voting',
    description: 'Official voting ballot for financial members in Dean of Intake elections.',
    icon: Vote,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Dean Election Voting Dashboard',
    category: 'Elections & Voting Suites',
    path: '/dean-voting-dashboard',
    description: 'Live turnout progress, tally breakdown, and quorum tracking for Dean elections.',
    icon: BarChart3,
    allowedRoles: ['admin', 'Membership Committee', 'officer'],
    status: 'Role Restricted',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    title: 'Dean Election Voting Audit Trail',
    category: 'Elections & Voting Suites',
    path: '/dean-voting-audit',
    description: 'Cryptographic audit trail and ballot verification for Dean elections.',
    icon: ShieldCheckIcon,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'General Elections Portal',
    category: 'Elections & Voting Suites',
    path: '/elections',
    description: 'General officer election hub and candidate statements.',
    icon: Vote,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
  },

  // Intake Pipeline & Applicants
  {
    title: 'Candidate Pipeline & Tracker',
    category: 'Intake Pipeline & Applicants',
    path: '/candidate-tracker',
    description: 'Comprehensive pipeline to track candidates from Inquiry to Initiation.',
    icon: Layers,
    allowedRoles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair'],
    status: 'Role Restricted',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  {
    title: 'Review & Score Applications',
    category: 'Intake Pipeline & Applicants',
    path: '/review-applications',
    description: 'Application evaluation scoring sheets, questionnaire responses, and document reviewer.',
    icon: ClipboardCheck,
    allowedRoles: ['admin', 'Membership Committee', 'Membership Committee Chair'],
    status: 'Role Restricted',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  {
    title: 'Intake Operations Calendar',
    category: 'Intake Pipeline & Applicants',
    path: '/intake-calendar',
    description: 'Intake timeline, milestone dates, interview schedules, and ceremony deadlines.',
    icon: CalendarDays,
    allowedRoles: ['member', 'officer', 'applicant', 'admin'],
    status: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    title: 'Intake Gantt Chart Timeline',
    category: 'Intake Pipeline & Applicants',
    path: '/gantt-chart',
    description: 'Interactive project management Gantt chart for intake scheduling and milestones.',
    icon: FolderKanban,
    allowedRoles: ['member', 'officer', 'Membership Committee', 'admin'],
    status: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    title: 'Official Membership Application',
    category: 'Intake Pipeline & Applicants',
    path: '/membership-application',
    description: 'Official digital membership intake application and background questionnaire.',
    icon: FileText,
    allowedRoles: ['applicant', 'admin'],
    status: 'Active',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200'
  },
  {
    title: 'Standalone Public Application',
    category: 'Intake Pipeline & Applicants',
    path: '/standalone-application',
    description: 'Public self-contained application link for external candidate submissions.',
    icon: ExternalLink,
    allowedRoles: ['Public'],
    isPublic: true,
    status: 'Active',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
  },

  // Committees & Leadership
  {
    title: 'Committee Chair Control Center',
    category: 'Committees & Leadership',
    path: '/chair-dashboard',
    description: 'Leadership dashboard for committee chairs to manage rosters, agendas, and files.',
    icon: Crown,
    allowedRoles: ['admin', 'officer', 'Committee Chair', 'Super Committee Chair'],
    status: 'Role Restricted',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  {
    title: 'Membership & Intake Committee',
    category: 'Committees & Leadership',
    path: '/committee/membership',
    description: 'Workspace for Membership & Intake committee documents, minutes, and resources.',
    icon: Layers,
    allowedRoles: ['admin', 'officer', 'Membership Committee', 'Super Committee Chair'],
    status: 'Optional Module',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-200'
  },
  {
    title: 'Budget & Finance Committee',
    category: 'Committees & Leadership',
    path: '/committee/finance',
    description: 'Financial committee workspace for budget reviews, audits, and dues reconciliation.',
    icon: DollarSign,
    allowedRoles: ['admin', 'officer', 'Finance Committee', 'Super Committee Chair'],
    status: 'Optional Module',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-200'
  },
  {
    title: 'Constitution & Bylaws Committee',
    category: 'Committees & Leadership',
    path: '/committee/bylaws',
    description: 'Governance workspace for tracking amendments, standing rules, and revisions.',
    icon: FileText,
    allowedRoles: ['admin', 'officer', 'Bylaws Committee', 'Super Committee Chair'],
    status: 'Optional Module',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-200'
  },
  {
    title: 'Scholarship & Academic Committee',
    category: 'Committees & Leadership',
    path: '/committee/scholarship',
    description: 'Scholarship endowment, academic review, and student award evaluations.',
    icon: Award,
    allowedRoles: ['admin', 'officer', 'Scholarship Committee', 'Super Committee Chair'],
    status: 'Optional Module',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-200'
  },

  // Governance & Conference
  {
    title: 'Governance Archives & Bylaws',
    category: 'Governance & Conference',
    path: '/governance-archives',
    description: 'Historical archives, certified election records, constitution, and past amendments.',
    icon: Archive,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    title: 'Chapter Constitution & Standing Rules',
    category: 'Governance & Conference',
    path: '/constitution',
    description: 'Official constitution, bylaws, and parliamentary reference documentation.',
    icon: FileText,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    title: 'Save the Date & Conclave Info',
    category: 'Governance & Conference',
    path: '/save-the-date',
    description: 'Upcoming national conclave announcement, host city details, and hotel bookings.',
    icon: CalendarDays,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-gold/20 text-gold-900 border-gold/30'
  },
  {
    title: 'Official Conference Agenda',
    category: 'Governance & Conference',
    path: '/agenda',
    description: 'Day-by-day conference timetable, plenary sessions, and workshop schedules.',
    icon: CalendarDays,
    allowedRoles: ['member', 'officer', 'admin'],
    status: 'Active',
    badgeColor: 'bg-gold/20 text-gold-900 border-gold/30'
  },

  // Administration & Security
  {
    title: 'Admin Control Center',
    category: 'Administration & Security',
    path: '/admin-dashboard',
    description: 'Master administration control center for managing user directory, pipeline, and settings.',
    icon: Shield,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'Role-Based Access Control (RBAC)',
    category: 'Administration & Security',
    path: '/admin-dashboard?tab=rbac',
    description: 'Real-time role permissions, custom roles, and user capability overrides.',
    icon: Sliders,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'System & Application Audit Logs',
    category: 'Administration & Security',
    path: '/admin-dashboard?tab=audits',
    description: 'Complete chronological audit trails of application reviews and system actions.',
    icon: ShieldCheckIcon,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  },
  {
    title: 'Google Workspace & Email Console',
    category: 'Administration & Security',
    path: '/admin-dashboard?tab=googleForms',
    description: 'Connect Google Forms and broadcast email announcements to members/candidates.',
    icon: Mail,
    allowedRoles: ['admin'],
    status: 'Admin Only',
    badgeColor: 'bg-red-100 text-red-900 border-red-200'
  }
];

// Inline Icon Helper components
function UserCheckIcon(props: any) {
  return <Users {...props} />;
}
function FileCheckIcon(props: any) {
  return <FileText {...props} />;
}
function ShieldCheckIcon(props: any) {
  return <Shield {...props} />;
}

export default function AdminSiteNavigator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const { features } = useSystemFeatures();

  const categories = [
    'all',
    'Portals & Member Directory',
    'Elections & Voting Suites',
    'Intake Pipeline & Applicants',
    'Committees & Leadership',
    'Governance & Conference',
    'Administration & Security'
  ];

  const filteredRoutes = useMemo(() => {
    return SITE_ROUTES.filter(route => {
      const matchesSearch = !searchTerm || 
        route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.allowedRoles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || route.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const handleCopyLink = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Navigator Top Header */}
      <div className="bg-gradient-to-br from-ivy via-forest to-ivy/95 rounded-3xl p-6 sm:p-8 text-cream shadow-xl border border-gold/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold text-ivy">
                  Global Site Navigator
                </span>
                <span className="text-[10px] text-cream/70 uppercase font-bold tracking-wider">
                  Complete Platform Command Center
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-cream tracking-wide">
                Site-Wide <span className="text-gold">Navigation & Tool Directory</span>
              </h2>
              <p className="text-xs sm:text-sm text-cream/70 max-w-2xl leading-relaxed">
                Admins have direct 1-click access to every public portal, voting room, committee workspace, applicant tool, and administrative module across the entire platform.
              </p>
            </div>

            <div className="bg-white/10 border border-cream/15 rounded-2xl p-3.5 backdrop-blur-xs shrink-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/60 block">Cataloged Endpoints</span>
              <span className="text-2xl font-display font-bold text-gold">{SITE_ROUTES.length} Destinations</span>
            </div>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any page, route (/voting), or role permission..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-ivy rounded-xl text-xs outline-none border border-gold/30 focus:ring-2 focus:ring-gold/50 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 border-b border-gold/20 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-ivy text-cream shadow-md border border-gold/30'
                : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
            }`}
          >
            {cat === 'all' ? `All Destinations (${SITE_ROUTES.length})` : cat}
          </button>
        ))}
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map((route, idx) => {
          const RouteIcon = route.icon;
          const isCopied = copiedPath === route.path;

          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft hover:shadow-md transition-all flex flex-col justify-between gap-4 group hover:border-gold/50"
            >
              <div className="space-y-2.5">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${route.badgeColor}`}>
                    {route.status}
                  </span>
                  <span className="text-[10px] font-mono text-ivy/50 truncate max-w-[150px]">
                    {route.path}
                  </span>
                </div>

                {/* Title and Icon */}
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-cream text-ivy border border-gold/20 shrink-0 group-hover:bg-ivy group-hover:text-gold transition-colors">
                    <RouteIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-ivy group-hover:text-gold transition-colors">
                      {route.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-ivy/50 uppercase tracking-wider block">
                      {route.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-ivy/70 leading-relaxed line-clamp-2">
                  {route.description}
                </p>

                {/* Allowed Roles */}
                <div className="pt-2 border-t border-gold/10">
                  <span className="text-[9px] uppercase font-bold text-ivy/50 tracking-wider block mb-1">
                    Authorized Access:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {route.allowedRoles.map((role, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[9px] font-semibold bg-cream/70 text-ivy px-2 py-0.5 rounded-md border border-gold/15"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gold/15">
                <Link
                  to={route.path}
                  className="py-2 px-4 bg-ivy text-cream hover:bg-forest rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Open Page</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gold" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleCopyLink(route.path)}
                  title="Copy full page URL"
                  className="p-2 bg-cream/60 hover:bg-gold/20 text-ivy rounded-xl border border-gold/20 transition-colors cursor-pointer"
                >
                  {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gold/30 text-center space-y-3">
          <Compass className="w-10 h-10 text-gold mx-auto" />
          <h3 className="text-base font-bold text-ivy">No Matching Pages Found</h3>
          <p className="text-xs text-ivy/60">Try searching with a different keyword or path name.</p>
        </div>
      )}
    </div>
  );
}
