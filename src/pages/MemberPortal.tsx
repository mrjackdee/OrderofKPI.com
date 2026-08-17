import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { 
  ShieldCheck,
  Users,
  CalendarDays,
  ClipboardCheck,
  Award,
  Settings,
  LayoutGrid,
  ChevronRight,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { logPortalSectionAccess } from '../lib/auditLogger';
import MemberHeader from '../components/MemberHeader';
import { syncApplicationsFromFirestore } from '../lib/memberDb';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';

export default function MemberPortal() {
  const userRole = sessionStorage.getItem('userRole');
  const userEmail = sessionStorage.getItem('userEmail');

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
  const isAdmin = userRole === 'admin' || userEmail?.toLowerCase() === 'admin@orderofkpi.org';
  const isChair = userEmail?.toLowerCase() === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || normalizedRole.includes('chair') || isAdmin;
  const isBrian = userEmail?.toLowerCase() === 'brian.johnson@orderofkpi.org';
  const isMembershipCommittee = userRole === 'Membership Committee' || normalizedRole.includes('membership committee') || normalizedRole.includes('committee') || isChair || isAdmin;
  
  useEffect(() => {
    logPortalSectionAccess('Member Portal');
    syncApplicationsFromFirestore().catch(() => {});

    // Poll live Google Sheet for real-time voter eligibility criteria
    getLiveGoogleSheetRoster()
      .then(res => {
        if (res && Array.isArray(res.eligibleVoters) && res.eligibleVoters.length > 0) {
          setEligibleVoters(res.eligibleVoters);
        }
      })
      .catch(err => console.warn('Live Google Sheet fetch notice:', err));
  }, []);

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
              Secure Member Access
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter text-ivy">
            Membership <span className="text-gold">Portal</span>
          </h1>
        </motion.div>

        {/* Core Member Tools Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/financial-roster"
            className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
          >
            <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
              <Users size={28} />
            </div>
            <div>
              <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Financial Membership Roster</h4>
              <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Active Financial Members</p>
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
              <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Intake Calendar</h4>
              <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Process Schedule</p>
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
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Voting Portal</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Selection Committee</p>
              </div>
            </Link>
          )}

          <Link
            to="/dean-nomination"
            className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
          >
            <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
              <Award size={28} />
            </div>
            <div>
              <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Intake Dean Nominees</h4>
              <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Roster & Status (Closed)</p>
            </div>
          </Link>

          {(() => {
            const normEmail = (userEmail || '').toLowerCase().trim();
            const isEligibleVoter = isAdmin || eligibleVoters.includes(normEmail);
            if (!isEligibleVoter) return null;
            return (
              <Link
                to="/dean-voting"
                className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
              >
                <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                  <Award size={28} />
                </div>
                <div>
                  <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Vote for Intake Dean</h4>
                  <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Team Voting Ballot</p>
                </div>
              </Link>
            );
          })()}
        </motion.div>

        {/* Administrative Tools */}
        {!isApplicant && (
          <motion.section variants={itemVariants} className="mb-20">
            <h2 className="text-2xl font-display text-ivy mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">Administrative Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Access Directory', 
                  desc: 'All system logins and member accounts.', 
                  icon: ClipboardCheck, 
                  path: '/member-directory',
                  color: 'bg-gold text-ivy',
                  roles: ['admin']
                },
                { 
                  title: 'Admin Dashboard', 
                  desc: 'Member & system management.', 
                  icon: Settings, 
                  path: '/admin-dashboard',
                  color: 'bg-ivy text-cream',
                  roles: ['admin']
                },
                { 
                  title: 'Candidate Tracker', 
                  desc: 'Manage membership intake.', 
                  icon: Users, 
                  path: '/candidate-tracker',
                  color: 'bg-gold text-ivy',
                  roles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair']
                },
                { 
                  title: 'Dean Audit & Management', 
                  desc: 'Admin log mapping voters to nominees with edit/delete.', 
                  icon: ShieldCheck, 
                  path: '/dean-audit-dashboard',
                  color: 'bg-gold text-ivy',
                  roles: ['admin']
                },
                { 
                  title: 'Dean Nomination Results', 
                  desc: 'Anonymous aggregated nominee tallies.', 
                  icon: Award, 
                  path: '/dean-nomination-dashboard',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'Membership Committee Chair', 'Membership Committee']
                },
                { 
                  title: 'Dean Voting Audit & Mgmt', 
                  desc: 'Admin log mapping voters to votes with edit/delete.', 
                  icon: ShieldCheck, 
                  path: '/dean-voting-audit',
                  color: 'bg-gold text-ivy',
                  roles: ['admin']
                },
                { 
                  title: 'Dean Voting Results', 
                  desc: 'Anonymous aggregated vote tallies.', 
                  icon: Award, 
                  path: '/dean-voting-dashboard',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'Membership Committee Chair', 'Membership Committee']
                },
                { 
                  title: 'Member Directory Administration', 
                  desc: 'Provision member accounts, roles, and 2-way cloud sync.', 
                  icon: Users, 
                  path: '/admin-dashboard?tab=users',
                  color: 'bg-gold text-ivy',
                  roles: ['admin']
                },
                { 
                  title: 'Membership Chair Portal', 
                  desc: 'Review audit logs, committee access & candidate removal.', 
                  icon: ShieldCheck, 
                  path: '/chair-dashboard',
                  color: 'bg-gold text-ivy',
                  roles: ['admin', 'officer', 'Membership Committee Chair']
                },
                { 
                  title: 'Process Timeline', 
                  desc: 'FY27 MIP Strategic Roadmap.', 
                  icon: LayoutGrid, 
                  path: '/gantt-chart',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair', 'member']
                },
                { 
                  title: 'Review Applications', 
                  desc: 'Review intake submissions.', 
                  icon: ClipboardCheck, 
                  path: '/review-applications',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'Membership Committee', 'Membership Committee Chair']
                }
              ]
              .filter(tool => {
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
                    Enter Tool <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
    </div>
  );
}
