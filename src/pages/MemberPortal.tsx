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
  UserCheck
} from 'lucide-react';
import { logPortalSectionAccess } from '../lib/auditLogger';
import MemberHeader from '../components/MemberHeader';
import { 
  syncApplicationsFromFirestore, 
  getVisibleCommitteesForUser, 
  isCommitteeChair, 
  hasCommitteeAccess, 
  normalizeUserRBAC,
  defaultMembers
} from '../lib/memberDb';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';
import { CommitteeSlug, STANDING_COMMITTEES, CommitteeDefinition, Member } from '../types';
import { useSystemFeatures } from '../lib/settings';

export default function MemberPortal() {
  const userRole = sessionStorage.getItem('userRole');
  const userEmail = sessionStorage.getItem('userEmail');
  const { features } = useSystemFeatures();
  let userCommittees: CommitteeSlug[] = [];
  let userCommitteeRoles: Record<string, 'chair' | 'member'> = {};

  try {
    const rawCommittees = sessionStorage.getItem('userCommittees');
    if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
    const rawRoles = sessionStorage.getItem('userCommitteeRoles');
    if (rawRoles) userCommitteeRoles = JSON.parse(rawRoles);
  } catch (e) {}

  const normUser = normalizeUserRBAC({
    email: userEmail || '',
    role: userRole || 'member',
    committees: userCommittees,
    committeeRoles: userCommitteeRoles
  });

  const visibleCommittees = getVisibleCommitteesForUser(normUser);

  const [allMembers, setAllMembers] = useState<Member[]>(defaultMembers as Member[]);
  const [selectedCommitteeModal, setSelectedCommitteeModal] = useState<CommitteeDefinition | null>(null);

  const [eligibleVoters, setEligibleVoters] = useState<string[]>([
    "anthony.jones@orderofkpi.org",
    "brandon.owens@orderofkpi.org",
    "brian.johnson@orderofkpi.org",
    "brian.goings@orderofkpi.org",
    "darron.jenkins@orderofkpi.org",
    "denzel.talley@orderofkpi.org",
    "deshaun.safford@orderofkpi.org",
    "dominic.goodman@orderofkpi.org",
    "donald.mitchell@orderofkpi.org",
    "edward.cook@orderofkpi.org",
    "ishmeal.allensworth@orderofkpi.org",
    "jack.dee@orderofkpi.org",
    "james.haywood@orderofkpi.org",
    "jason.pilar@orderofkpi.org",
    "kameron.whitfield@orderofkpi.org",
    "keith.woods@orderofkpi.org",
    "tobias.bordley@orderofkpi.org",
    "candidate@gmail.com",
    "admin@orderofkpi.org"
  ]);

  const isApplicant = userRole === 'applicant' || userRole === 'prospective';

  // If logged in as applicant or prospective, isolate to Applicant Portal
  if (isApplicant) {
    return <Navigate to="/applicant-portal" replace />;
  }

  const normalizedRole = (userRole || '').toLowerCase();
  const isAdmin = normUser.role === 'admin' || userRole === 'admin' || userEmail?.toLowerCase() === 'admin@orderofkpi.org' || userEmail?.toLowerCase() === 'qa.admin@orderofkpi.org' || userEmail?.toLowerCase() === 'info@kpi2012.org';
  const isChair = userEmail?.toLowerCase() === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || normalizedRole.includes('chair') || isAdmin;
  const isBrian = normUser.email === 'brian.johnson@orderofkpi.org' || userEmail?.toLowerCase() === 'brian.johnson@orderofkpi.org';
  const isMembershipCommittee = userRole === 'Membership Committee' || normalizedRole.includes('membership committee') || normalizedRole.includes('committee') || isChair || isAdmin;
  
  useEffect(() => {
    logPortalSectionAccess('Member Portal');
    syncApplicationsFromFirestore().catch(() => {});

    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllMembers(data);
        }
      })
      .catch(() => {});

    // Poll live Google Sheet for real-time voter eligibility criteria
    getLiveGoogleSheetRoster()
      .then(res => {
        if (res && Array.isArray(res.eligibleVoters) && res.eligibleVoters.length > 0) {
          setEligibleVoters(res.eligibleVoters);
        }
      })
      .catch(err => console.warn('Live Google Sheet fetch notice:', err));
  }, []);

  const getCommitteeChairs = (slug: CommitteeSlug) => {
    const chairsFromDb = allMembers.filter(m => {
      return isCommitteeChair(slug, m) || m.committeeRoles?.[slug] === 'chair' || (m.role && m.role.toLowerCase().includes('chair') && m.committees?.includes(slug));
    });

    if (slug === 'membership_intake') {
      if (!chairsFromDb.some(c => c.email.toLowerCase() === 'james.haywood@orderofkpi.org')) {
        chairsFromDb.unshift({
          name: 'James Haywood Jr',
          email: 'james.haywood@orderofkpi.org',
          role: 'officer' as any,
          title: '2nd Anti-Basileus / Committee Chair',
          is_first_login: false
        });
      }
    } else {
      if (!chairsFromDb.some(c => c.email.toLowerCase() === 'brian.johnson@orderofkpi.org')) {
        chairsFromDb.unshift({
          name: 'Brian Johnson',
          email: 'brian.johnson@orderofkpi.org',
          role: 'officer' as any,
          title: 'Super Committee Chair',
          is_first_login: false
        });
      }
    }

    if (!chairsFromDb.some(c => c.email.toLowerCase() === 'anthony.jones@orderofkpi.org')) {
      chairsFromDb.push({
        name: 'Anthony Jones',
        email: 'anthony.jones@orderofkpi.org',
        role: 'officer' as any,
        title: '1st Anti-Basileus',
        is_first_login: false
      });
    }

    return chairsFromDb;
  };

  const getCommitteeMembers = (slug: CommitteeSlug) => {
    const chairs = getCommitteeChairs(slug);
    const chairEmails = new Set(chairs.map(c => c.email.toLowerCase()));

    let membersFromDb = allMembers.filter(m => {
      if (chairEmails.has(m.email.toLowerCase())) return false;
      return m.committees?.includes(slug) || m.committeeRoles?.[slug] === 'member';
    });

    if (membersFromDb.length === 0) {
      if (slug === 'membership_intake') {
        membersFromDb = [
          { name: 'Deshaun Safford', email: 'deshaun.safford@orderofkpi.org', role: 'member', title: 'Intake Member', is_first_login: false },
          { name: 'Jason Pilar', email: 'jason.pilar@orderofkpi.org', role: 'member', title: 'Intake Member', is_first_login: false }
        ];
      } else if (slug === 'annual_event') {
        membersFromDb = [
          { name: 'Keith Woods', email: 'keith.woods@orderofkpi.org', role: 'member', title: 'Event Planning Member', is_first_login: false },
          { name: 'Sammie Poe', email: 'sammie.poe@orderofkpi.org', role: 'member', title: 'Event Coordinator', is_first_login: false }
        ];
      } else if (slug === 'digital_technology') {
        membersFromDb = [
          { name: 'Alejandro Araujo', email: 'alejandro.araujo@orderofkpi.org', role: 'member', title: 'Tech Infrastructure Lead', is_first_login: false },
          { name: 'Kameron Whitfield', email: 'kameron.whitfield@orderofkpi.org', role: 'member', title: 'Digital Media Specialist', is_first_login: false }
        ];
      } else if (slug === 'judicial_ethics') {
        membersFromDb = [
          { name: 'Edward Cook', email: 'edward.cook@orderofkpi.org', role: 'officer', title: 'Epistoleus / Ethics Member', is_first_login: false },
          { name: 'Donald Mitchell', email: 'donald.mitchell@orderofkpi.org', role: 'member', title: 'Compliance Auditor', is_first_login: false }
        ];
      } else if (slug === 'scholarship') {
        membersFromDb = [
          { name: 'Dominic Goodman', email: 'dominic.goodman@orderofkpi.org', role: 'member', title: 'Foundation Trustee', is_first_login: false },
          { name: 'Denzel Talley', email: 'denzel.talley@orderofkpi.org', role: 'member', title: 'Scholarship Reviewer', is_first_login: false }
        ];
      } else if (slug === 'transfer_member') {
        membersFromDb = [
          { name: 'Demetrist Thomas', email: 'demetrist.thomas@orderofkpi.org', role: 'member', title: 'Onboarding Specialist', is_first_login: false },
          { name: 'Tobias Bordley', email: 'tobias.bordley@orderofkpi.org', role: 'member', title: 'Transfer Liaison', is_first_login: false }
        ];
      }
    }

    return membersFromDb;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-cream">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-7xl mx-auto px-6 py-6 md:py-12 space-y-12"
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

        {/* Core Member Tools Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {isAdmin && (
            <Link
              to="/selection-voting"
              className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
            >
              <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                <Award size={28} />
              </div>
              <div>
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Candidate Intake Voting</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Cast and submit intake votes</p>
              </div>
            </Link>
          )}
        </motion.div>

        {/* Standing Committees Directory Table Section */}
        {!isApplicant && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">
                    Standing Committees
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivy/60">
                    Directory ({STANDING_COMMITTEES.length})
                  </span>
                </div>
                <h2 className="text-2xl font-display text-ivy uppercase tracking-widest mt-1">
                  Organizational Committees
                </h2>
              </div>
              <p className="text-ivy/60 text-xs max-w-md">
                Browse standing committees, review leadership rosters, or contact committee chairs to request joining.
              </p>
            </div>

            {/* Committees Table */}
            <div className="overflow-x-auto bg-white border border-gold/20 rounded-2xl shadow-soft">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/60 border-b border-gold/20 text-[10px] font-bold uppercase tracking-widest text-ivy/70">
                    <th className="py-4 px-6">Committee Name</th>
                    <th className="py-4 px-6 max-w-md">Description</th>
                    <th className="py-4 px-6 text-center">Roster & Leadership</th>
                    <th className="py-4 px-6 text-center">Join Committee</th>
                    <th className="py-4 px-6 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-sm">
                  {STANDING_COMMITTEES.map((committee) => {
                    const committeeChairs = getCommitteeChairs(committee.slug);
                    const committeeMembers = getCommitteeMembers(committee.slug);
                    const primaryChair = committeeChairs[0] || { name: 'Anthony Jones', email: 'anthony.jones@orderofkpi.org' };
                    const mailtoSubject = encodeURIComponent(`Interest in Joining ${committee.name}`);
                    const mailtoBody = encodeURIComponent(`Dear ${primaryChair.name},\n\nI am interested in joining the ${committee.name}. Please contact me regarding committee meetings and membership steps.\n\nFraternally,`);
                    const mailtoLink = `mailto:${primaryChair.email}?subject=${mailtoSubject}&body=${mailtoBody}`;
                    const userHasAccess = hasCommitteeAccess(committee.slug, normUser);

                    return (
                      <tr key={committee.slug} className="hover:bg-cream/40 transition-colors">
                        <td className="py-5 px-6 font-display font-bold text-ivy text-base">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-cream rounded-xl border border-gold/20 text-ivy shadow-xs">
                              <FolderGit2 size={20} />
                            </div>
                            <div>
                              <span className="block font-bold text-ivy uppercase tracking-wide text-sm">{committee.name}</span>
                              <span className="text-[10px] font-body font-normal text-ivy/50">{committee.shortName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 max-w-md text-xs text-ivy/70 leading-relaxed font-body">
                          {committee.description}
                        </td>
                        <td className="py-5 px-6 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCommitteeModal(committee)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-ivy hover:text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 transition-all cursor-pointer"
                          >
                            <Users size={14} className="text-gold" />
                            <span>View Roster ({committeeChairs.length + committeeMembers.length})</span>
                          </button>
                        </td>
                        <td className="py-5 px-6 text-center whitespace-nowrap">
                          <a
                            href={mailtoLink}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-ivy hover:text-cream bg-gold hover:bg-ivy border border-gold transition-all shadow-xs"
                          >
                            <Mail size={13} />
                            <span>Contact Chair</span>
                          </a>
                        </td>
                        <td className="py-5 px-6 text-right whitespace-nowrap">
                          {userHasAccess ? (
                            <Link
                              to={`/committee/${committee.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ivy hover:text-gold transition-colors"
                            >
                              <span>Open Workspace</span>
                              <ChevronRight size={14} />
                            </Link>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-ivy/40 font-bold px-2.5 py-1 bg-cream rounded-lg border border-gold/10">
                              Member Contact
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* Officer & Committee Tools */}
        {!isApplicant && (
          <motion.section variants={itemVariants} className="mb-20">
            <h2 className="text-2xl font-display text-ivy mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">Officer & Committee Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
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
                  roles: ['admin', 'Membership Committee', 'Membership Committee Chair']
                }
              ]
              .filter(tool => {
                const lowerEmail = (userEmail || '').toLowerCase().trim();
                if ((lowerEmail === 'james.haywood@orderofkpi.org' || lowerEmail === 'brian.johnson@orderofkpi.org') && 
                    (tool.title === 'Past Elections & Records' || tool.title === 'Membership Dashboard')) {
                  return true;
                }
                if (!tool.roles) return true;
                if (isAdmin) return true;
                if (isBrian && tool.roles.includes('brian')) return true;
                
                // Check direct role inclusion
                if (tool.roles.includes(userRole || '')) return true;
                
                // Chair falls back to Committee actions
                if (isChair && (tool.roles.includes('Membership Committee Chair') || tool.roles.includes('Membership Committee'))) return true;
                
                // Committee members match committee roles
                if (isMembershipCommittee && tool.roles.includes('Membership Committee')) return true;
                
                return false;
              })
              .map((tool) => (
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
        )}

        {/* Footer Branding */}
        <motion.div variants={itemVariants} className="pt-12 border-t border-gold/10 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-ivy/20 font-bold">
          <span>© 2026 The Order of KPI, Inc.</span>
          <span>Tradition & Excellence</span>
        </motion.div>
      </motion.div>

      {/* Committee Roster Popup Modal */}
      <AnimatePresence>
        {selectedCommitteeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gold/30 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
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
                  onClick={() => setSelectedCommitteeModal(null)}
                  className="p-2 rounded-full hover:bg-cream text-ivy/50 hover:text-ivy transition-colors"
                  title="Close Roster"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Committee Chairs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ivy/80 flex items-center gap-2">
                  <UserCheck size={16} className="text-gold" />
                  <span>Committee Chair(s)</span>
                </h4>
                <div className="space-y-2">
                  {getCommitteeChairs(selectedCommitteeModal.slug).map((chair, idx) => (
                    <div key={idx} className="p-3.5 bg-cream/60 border border-gold/20 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-ivy text-sm">{chair.name}</p>
                        <p className="text-[11px] text-gold font-semibold">{chair.title || 'Committee Chair'}</p>
                        <p className="text-xs text-ivy/60 font-body">{chair.email}</p>
                      </div>
                      <a
                        href={`mailto:${chair.email}?subject=${encodeURIComponent(`Interest in Joining ${selectedCommitteeModal.name}`)}`}
                        className="px-3.5 py-1.5 bg-ivy text-cream hover:bg-gold hover:text-ivy rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Mail size={12} />
                        <span>Email Chair</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Committee Members */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ivy/80 flex items-center gap-2">
                  <Users size={16} className="text-gold" />
                  <span>Current Committee Members</span>
                </h4>
                {getCommitteeMembers(selectedCommitteeModal.slug).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {getCommitteeMembers(selectedCommitteeModal.slug).map((member, idx) => (
                      <div key={idx} className="p-3 bg-cream/30 border border-gold/15 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-ivy text-xs">{member.name}</p>
                          <p className="text-[10px] text-ivy/50">{member.email}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gold/10 text-gold rounded-full">
                          Member
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ivy/50 italic p-4 bg-cream/20 rounded-xl border border-dashed border-gold/20 text-center">
                    No general members currently listed. Contact the chair to request joining!
                  </p>
                )}
              </div>

              {/* Footer CTA */}
              <div className="pt-4 border-t border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-ivy/60">
                  Interested in joining? Contact the committee chair directly.
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedCommitteeModal(null)}
                    className="px-4 py-2 border border-gold/20 rounded-xl text-xs font-bold uppercase tracking-wider text-ivy hover:bg-cream transition-colors w-full sm:w-auto"
                  >
                    Close
                  </button>
                  <a
                    href={`mailto:${getCommitteeChairs(selectedCommitteeModal.slug)[0]?.email || 'anthony.jones@orderofkpi.org'}?subject=${encodeURIComponent(`Interest in Joining ${selectedCommitteeModal.name}`)}`}
                    className="px-5 py-2 bg-gold text-ivy font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-ivy hover:text-cream transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                  >
                    <Mail size={14} />
                    <span>Contact Chair to Join</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
