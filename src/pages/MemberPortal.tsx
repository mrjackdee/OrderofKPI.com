import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { 
  ShieldCheck,
  Users,
  CalendarDays,
  ClipboardCheck,
  Award,
  Settings,
  ChevronRight,
  FolderGit2,
  Archive,
  Mail,
  X,
  UserCheck,
  AlertCircle,
  LifeBuoy
} from 'lucide-react';
import { logPortalSectionAccess } from '../lib/auditLogger';
import MemberHeader from '../components/MemberHeader';
import { SupportCenterPreview } from '../components/SupportCenterPreview';
import { UrgentBannerTicker } from '../components/UrgentBannerTicker';
import { 
  syncApplicationsFromFirestore, 
  getVisibleCommitteesForUser, 
  isCommitteeChair, 
  hasCommitteeAccess, 
  normalizeUserRBAC,
  isTestUser,
  is1stAntiBasileus,
  defaultMembers
} from '../lib/memberDb';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';
import { CommitteeSlug, STANDING_COMMITTEES, CommitteeDefinition, Member } from '../types';
import { useSystemFeatures, isCommitteeFeatureActive } from '../lib/settings';
import { getCandidateVotingStatus, CANDIDATE_VOTING_WINDOW_TEXT } from '../lib/votingWindow';

export default function MemberPortal() {
  const userRole = sessionStorage.getItem('userRole');
  const userEmail = sessionStorage.getItem('userEmail');
  const { features } = useSystemFeatures();
  let userCommittees: CommitteeSlug[] = [];
  let userCommitteeRoles: Record<string, 'chair' | 'member'> = {};
  let userRoles: string[] = [];

  try {
    const rawCommittees = sessionStorage.getItem('userCommittees');
    if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
    const rawCommitteeRoles = sessionStorage.getItem('userCommitteeRoles');
    if (rawCommitteeRoles) userCommitteeRoles = JSON.parse(rawCommitteeRoles);
    const rawRoles = sessionStorage.getItem('userRoles');
    if (rawRoles) userRoles = JSON.parse(rawRoles);
  } catch (e) {}

  const [currentUser, setCurrentUser] = useState(() => {
    let userCommittees: CommitteeSlug[] = [];
    let userCommitteeRoles: Record<string, 'chair' | 'member'> = {};
    let userRoles: string[] = [];

    try {
      const rawCommittees = sessionStorage.getItem('userCommittees');
      if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
      const rawCommitteeRoles = sessionStorage.getItem('userCommitteeRoles');
      if (rawCommitteeRoles) userCommitteeRoles = JSON.parse(rawCommitteeRoles);
      const rawRoles = sessionStorage.getItem('userRoles');
      if (rawRoles) userRoles = JSON.parse(rawRoles);
    } catch (e) {}

    return normalizeUserRBAC({
      email: userEmail || '',
      role: userRole || 'member',
      roles: userRoles.length > 0 ? userRoles : (userRole ? [userRole] : ['member']),
      committees: userCommittees,
      committeeRoles: userCommitteeRoles
    });
  });

  const visibleCommittees = getVisibleCommitteesForUser(currentUser);

  const [allMembers, setAllMembers] = useState<Member[]>(defaultMembers as Member[]);
  const [selectedCommitteeModal, setSelectedCommitteeModal] = useState<CommitteeDefinition | null>(null);
  const [contactCommitteeSlug, setContactCommitteeSlug] = useState<string | null>(null);

  const [eligibleVoters, setEligibleVoters] = useState<string[]>([
    "anthony.jones@orderofkpi.org", "antjones_cpm@yahoo.com",
    "brandon.owens@orderofkpi.org", "bmusicallyinclined@gmail.com",
    "brian.johnson@orderofkpi.org", "brianojohnson80@gmail.com",
    "brian.goings@orderofkpi.org", "brianbgoings@gmail.com",
    "darron.jenkins@orderofkpi.org", "dajenkins06@gmail.com",
    "denzel.talley@orderofkpi.org", "denzeltalley@gmail.com",
    "deshaun.safford@orderofkpi.org", "dsafford06@yahoo.com",
    "dominic.goodman@orderofkpi.org", "dominicsgoodman@gmail.com",
    "donald.mitchell@orderofkpi.org", "dmitchell02@gmail.com",
    "edward.cook@orderofkpi.org", "edward.j.cook@gmail.com",
    "ishmeal.allensworth@orderofkpi.org", "imallenswort@gmail.com",
    "jack.dee@orderofkpi.org", "jackdee@att.net",
    "james.haywood@orderofkpi.org", "jhaywood2008@gmail.com",
    "jason.pilar@orderofkpi.org", "jpilar06@gmail.com",
    "kameron.whitfield@orderofkpi.org", "kmaurw@gmail.com",
    "keith.woods@orderofkpi.org", "kwoods509@gmail.com",
    "tobias.bordley@orderofkpi.org", "c.tbordley@gmail.com",
    "candidate@gmail.com",
    "admin@orderofkpi.org",
    "qa.admin@orderofkpi.org",
    "info@kpi2012.org"
  ]);

  const isApplicant = userRole === 'applicant' || userRole === 'prospective';

  // If logged in as applicant or prospective, isolate to Applicant Portal
  if (isApplicant) {
    return <Navigate to="/applicant-portal" replace />;
  }

  const normalizedRole = (userRole || '').toLowerCase();
  const isAdmin = currentUser.role === 'admin' || userRoles.includes('admin') || userEmail?.toLowerCase() === 'admin@orderofkpi.org' || userEmail?.toLowerCase() === 'qa.admin@orderofkpi.org' || userEmail?.toLowerCase() === 'info@kpi2012.org';
  const isChair = userEmail?.toLowerCase() === 'james.haywood@orderofkpi.org' || 
                  userRoles.some(r => {
                    const low = r.toLowerCase();
                    return low.includes('chair') || low === 'super committee' || low === 'officer';
                  }) || 
                  normalizedRole.includes('chair') || 
                  normalizedRole === 'super committee' || 
                  normalizedRole === 'officer' || 
                  isAdmin;
  const isBrian = currentUser.email === 'brian.johnson@orderofkpi.org' || userEmail?.toLowerCase() === 'brian.johnson@orderofkpi.org';
  const isMembershipCommittee = 
    userRoles.some(r => {
      const low = r.toLowerCase();
      return low === 'membership committee' || low === 'membership committee chair' || low === 'super committee';
    }) || 
    normalizedRole === 'membership committee' || 
    normalizedRole === 'membership committee chair' || 
    normalizedRole === 'super committee' || 
    isChair || 
    isAdmin;
  
  useEffect(() => {
    logPortalSectionAccess('Member Portal');
    syncApplicationsFromFirestore().catch(() => {});

    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        const memberList = data && data.success && Array.isArray(data.members) ? data.members : (Array.isArray(data) ? data : []);
        if (memberList.length > 0) {
          setAllMembers(memberList);
          if (userEmail) {
            const myEmail = userEmail.toLowerCase().trim();
            const myRecord = memberList.find((m: any) => m.email && m.email.toLowerCase().trim() === myEmail);
            if (myRecord) {
              const updatedNorm = normalizeUserRBAC(myRecord);
              setCurrentUser(updatedNorm);
              try {
                sessionStorage.setItem('userRole', updatedNorm.role);
                sessionStorage.setItem('userRoles', JSON.stringify(myRecord.roles || [updatedNorm.role]));
                sessionStorage.setItem('userCommittees', JSON.stringify(updatedNorm.committees));
                sessionStorage.setItem('userCommitteeRoles', JSON.stringify(updatedNorm.committeeRoles));
                if (myRecord.title) sessionStorage.setItem('userTitle', myRecord.title);
              } catch (e) {}
            }
          }
        }
      })
      .catch(() => {});

    // Poll live Google Sheet for real-time voter eligibility criteria
    getLiveGoogleSheetRoster()
      .then(res => {
        if (res) {
          const set = new Set<string>();
          if (Array.isArray(res.eligibleVoters)) {
            res.eligibleVoters.forEach(e => set.add(e.toLowerCase().trim()));
          }
          if (Array.isArray(res.members)) {
            res.members.forEach((m: any) => {
              if (m.fy27MipEligible) {
                if (m.kpiEmail) set.add(m.kpiEmail.toLowerCase().trim());
                if (m.personalEmail) set.add(m.personalEmail.toLowerCase().trim());
              }
            });
          }
          if (set.size > 0) {
            setEligibleVoters(Array.from(set));
          }
        }
      })
      .catch(err => console.warn('Live Google Sheet fetch notice:', err));
  }, []);

  const getCommitteeChairs = (slug: CommitteeSlug) => {
    return allMembers.filter(m => {
      if (isTestUser(m)) return false;
      const norm = normalizeUserRBAC(m);
      if (norm.role === 'admin' || norm.title === 'Super Committee Chair') {
        return false;
      }
      return isCommitteeChair(slug, m) || norm.committeeRoles?.[slug] === 'chair';
    });
  };

  const getCommitteeMembers = (slug: CommitteeSlug) => {
    const chairs = getCommitteeChairs(slug);
    const chairEmails = new Set(chairs.map(c => (c.email || '').toLowerCase().trim()));

    return allMembers.filter(m => {
      if (isTestUser(m)) return false;
      const norm = normalizeUserRBAC(m);
      const email = (m.email || '').toLowerCase().trim();
      if (chairEmails.has(email)) return false;
      if (norm.role === 'admin' || norm.title === 'Super Committee Chair') return false;
      return norm.committees.includes(slug) || norm.committeeRoles?.[slug] === 'member';
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const candidateVotingStatus = getCandidateVotingStatus(userEmail || '', userRole || '');
  const normUserEmail = (userEmail || '').toLowerCase().trim();
  const isCandidateVoterEligible = isAdmin || 
    normUserEmail === 'candidate@gmail.com' || 
    normUserEmail === 'qa.admin@orderofkpi.org' || 
    normUserEmail === 'info@kpi2012.org' ||
    eligibleVoters.some(e => e.toLowerCase().trim() === normUserEmail);

  return (
    <div className="min-h-screen bg-cream w-full overflow-x-hidden">
      {/* Urgent Announcement Marquee Banner */}
      <UrgentBannerTicker />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12 space-y-10 md:space-y-12"
      >
        <motion.div variants={itemVariants}>
          <MemberHeader />
        </motion.div>

        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-1">
            <ShieldCheck size={14} className="text-gold" />
            <span className="text-[10px] font-bold text-ivy uppercase tracking-[0.2em]">
              Member Access
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter text-ivy">
            Member <span className="text-gold">Portal</span>
          </h1>
        </motion.div>

        {/* KP Support Center Feature Preview */}
        <motion.div variants={itemVariants} className="w-full">
          <SupportCenterPreview />
        </motion.div>

        {/* Core Member Tools Grid */}
        <motion.div variants={itemVariants} className="w-full overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            <Link
              to="/financial-roster"
              className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
            >
              <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                <Users size={28} />
              </div>
              <div>
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Membership Dues & Status</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Active members & dues standing</p>
              </div>
            </Link>

            <Link
              to="/intake-calendar"
              className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
            >
              <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                <CalendarDays size={28} />
              </div>
              <div>
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Intake Schedule & Calendar</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Key dates, meetings & tea time</p>
              </div>
            </Link>

            {!isApplicant && isCandidateVoterEligible && (
              <Link
                to="/candidate-voting"
                className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft relative overflow-hidden"
              >
                <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500 shrink-0">
                  <Award size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">FY27 Candidate Voting</h4>
                    {!candidateVotingStatus.isOpen && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        Voting Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-ivy/60 text-[11px] font-medium mt-1 leading-snug">
                    {!candidateVotingStatus.isOpen ? (
                      <>
                        Voting will open Wed, Aug 26, 2026 at 5:00 PM ET and close on Fri August 28, 2026 at 8:00 AM ET. If you have any questions, please reach out to{' '}
                        <a 
                          href="mailto:james.haywood@orderofkpi.org" 
                          onClick={(e) => e.stopPropagation()} 
                          className="underline hover:text-ivy font-semibold text-amber-900"
                        >
                          JR Haywood
                        </a>.
                      </>
                    ) : (
                      "Cast and submit candidate votes"
                    )}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </motion.div>

        {/* KP Committees Directory Section */}
        {isCommitteeFeatureActive(currentUser, features) && !isApplicant && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">
                    KP Committees
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivy/60">
                    Directory ({STANDING_COMMITTEES.length})
                  </span>
                  {!features.committee_enabled && isAdmin && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
                      Admin Stealth Preview (Hidden from Members)
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-display text-ivy uppercase tracking-widest mt-1">
                  Organizational Committees
                </h2>
              </div>
              <p className="text-ivy/60 text-xs max-w-md">
                Browse organizational committees, review rosters, and learn how to join.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {STANDING_COMMITTEES.map((committee) => {
                const userHasAccess = hasCommitteeAccess(committee.slug, currentUser);
                const userIsChair = isCommitteeChair(committee.slug, currentUser);

                return (
                  <div
                    key={committee.slug}
                    id={`committee-card-${committee.slug}`}
                    className="bg-white border border-gold/20 rounded-2xl p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-cream rounded-xl border border-gold/20 text-ivy shadow-xs shrink-0">
                            <FolderGit2 size={20} />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-ivy uppercase tracking-wide text-sm">{committee.name}</h3>
                            <span className="text-[10px] font-body text-ivy/50">{committee.shortName}</span>
                          </div>
                        </div>
                        {userIsChair ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gold/20 text-ivy border border-gold/40 rounded-full shrink-0">
                            Chair
                          </span>
                        ) : userHasAccess && currentUser.committees.includes(committee.slug) ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-ivy/10 text-ivy border border-ivy/20 rounded-full shrink-0">
                            Member
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ivy/70 leading-relaxed font-body line-clamp-3">
                        {committee.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gold/15 flex items-center gap-2">
                      {userHasAccess ? (
                        <>
                          <Link
                            id={`open-workspace-${committee.slug}`}
                            to={`/committee/${committee.slug}`}
                            className="py-2 px-6 bg-ivy text-cream text-center text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gold hover:text-ivy transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Open Workspace</span>
                            <ChevronRight size={13} />
                          </Link>
                          <button
                            id={`view-details-${committee.slug}`}
                            onClick={() => setSelectedCommitteeModal(committee)}
                            className="py-2 px-3 bg-cream border border-gold/30 text-ivy text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gold/10 transition-all text-center shrink-0"
                            title="View Roster & Leadership Details"
                          >
                            Details
                          </button>
                        </>
                      ) : (
                        <button
                          id={`view-details-${committee.slug}`}
                          onClick={() => setSelectedCommitteeModal(committee)}
                          className="w-fit py-2.5 px-8 bg-cream border border-gold/30 text-ivy hover:bg-gold hover:text-ivy text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs mx-auto"
                        >
                          <span>View Details & Join</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Officer & Committee Tools */}
        {(() => {
          const lowerEmail = (userEmail || '').toLowerCase().trim();
          const accessibleTools = [
            { 
              title: 'Member Directory', 
              desc: 'View active member accounts and contact emails.', 
              icon: ClipboardCheck, 
              path: '/member-directory',
              color: 'bg-gold text-ivy',
              roles: ['admin']
            },
            { 
              title: 'Admin Dashboard', 
              desc: 'Manage member accounts, permissions, and settings.', 
              icon: Settings, 
              path: '/admin-dashboard',
              color: 'bg-ivy text-cream',
              roles: ['admin']
            },
            { 
              title: 'Candidate Tracker', 
              desc: 'Track applicant stages and intake progress.', 
              icon: Users, 
              path: '/candidate-tracker',
              color: 'bg-gold text-ivy',
              roles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair']
            },
            { 
              title: 'Past Elections & Records', 
              desc: 'Official results and archive records from past elections.', 
              icon: Archive, 
              path: '/governance-archives',
              color: 'bg-ivy text-cream',
              roles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair']
            },
            { 
              title: 'Member Account Management', 
              desc: 'Update member profiles, titles, and permissions.', 
              icon: Users, 
              path: '/admin-dashboard?tab=users',
              color: 'bg-gold text-ivy',
              roles: ['admin']
            },
            { 
              title: 'Membership Dashboard', 
              desc: 'Manage applicant stages, review activity, and committee members.', 
              icon: ShieldCheck, 
              path: '/chair-dashboard',
              color: 'bg-gold text-ivy',
              roles: features.committee_enabled ? ['admin', 'officer', 'Membership Committee Chair'] : ['admin']
            },
            { 
              title: 'Review Applications', 
              desc: 'Read and review submitted candidate applications.', 
              icon: ClipboardCheck, 
              path: '/review-applications',
              color: 'bg-ivy text-cream',
              roles: features.committee_enabled ? ['admin', 'Membership Committee', 'Membership Committee Chair'] : ['admin']
            },
            {
              title: 'FY27 Candidate Voting Mgmt & Audit',
              desc: 'Admin audit log and management for candidate voting records.',
              icon: ShieldCheck,
              path: '/candidate-voting-audit',
              color: 'bg-ivy text-cream',
              roles: ['admin']
            },
            {
              title: 'FY27 Candidate Voting Report',
              desc: 'Rolled-up candidate voting results calculated at the 50.1% threshold.',
              icon: Award,
              path: '/candidate-voting-report',
              color: 'bg-gold text-ivy',
              roles: ['admin', 'Membership Committee Chair', 'Membership Intake Chair', 'brian.johnson@orderofkpi.org']
            }
          ].filter(tool => {
            if (tool.title === 'FY27 Candidate Voting Report') {
              return isAdmin || isBrian || isChair || userRole === 'Membership Committee Chair' || userRole === 'Membership Intake Chair' || lowerEmail === 'james.haywood@orderofkpi.org';
            }
            if ((lowerEmail === 'james.haywood@orderofkpi.org' || lowerEmail === 'brian.johnson@orderofkpi.org') && 
                (tool.title === 'Past Elections & Records' || tool.title === 'Membership Dashboard')) {
              return true;
            }
            if (!tool.roles) return true;
            if (isAdmin) return true;
            if (isBrian && tool.roles.includes('brian')) return true;
            
            // Check direct role inclusion
            if (userRoles.some(r => tool.roles.includes(r))) return true;
            if (tool.roles.includes(userRole || '')) return true;
            
            // Chair falls back to Committee actions
            if (isChair && (tool.roles.includes('Membership Committee Chair') || tool.roles.includes('Membership Committee'))) return true;
            
            // Committee members match committee roles
            if (isMembershipCommittee && tool.roles.includes('Membership Committee')) return true;
            
            return false;
          });

          if (!isApplicant && accessibleTools.length > 0) {
            return (
              <motion.section variants={itemVariants} className="mb-20">
                <h2 className="text-2xl font-display text-ivy mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">Officer & Committee Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {accessibleTools.map((tool) => (
                    <Link
                      key={tool.title}
                      to={tool.path}
                      className={`p-6 rounded-lg shadow-soft hover:scale-[1.02] transition-all border border-gold/10 flex flex-col h-full ${tool.color}`}
                    >
                      <tool.icon className="w-8 h-8 mb-4 opacity-80" />
                      <h3 className="text-xl font-display mb-2">{tool.title}</h3>
                      <p className="text-[10px] opacity-70 font-body mb-6 flex-1">{tool.desc}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest group">
                        Open <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            );
          }
          return null;
        })()}

        {/* Footer Branding */}
        <motion.div variants={itemVariants} className="pt-12 border-t border-gold/10 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-ivy/20 font-bold">
          <span>© 2026 The Order of KPI, Inc.</span>
          <span>Tradition & Excellence</span>
        </motion.div>
      </motion.div>

      {/* Committee Roster Popup Modal */}
      <AnimatePresence>        {selectedCommitteeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gold/30 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto flex flex-col pointer-events-auto"
            >
              <div className="flex items-start justify-between border-b border-gold/20 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">
                    Standing Committee Roster
                  </span>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-ivy">
                    {selectedCommitteeModal.name}
                  </h3>
                  <p className="text-xs text-ivy/60 font-body leading-relaxed">
                    {selectedCommitteeModal.description}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedCommitteeModal(null); setContactCommitteeSlug(null); }}
                  className="p-2 rounded-full hover:bg-cream text-ivy/50 hover:text-ivy transition-colors"
                  title="Close Roster"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Committee Chairs & Members Content */}
              <div className="text-sm p-4 text-ivy">Content Loading...</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
