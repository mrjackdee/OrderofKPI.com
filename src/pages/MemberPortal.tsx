import React from 'react';
import { motion } from 'motion/react';
import { Link, Navigate } from 'react-router-dom';
import { 
  Video, 
  FileText, 
  Presentation, 
  ClipboardList, 
  ShieldCheck,
  Users,
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  ArrowRight,
  ClipboardCheck,
  Award,
  Settings,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import GooglePickerButton from '../components/GooglePickerButton';
import { createMeetSpace, createGoogleDoc, createGoogleSlide, createGoogleForm } from '../lib/googleWorkspace';
import { logPortalSectionAccess } from '../lib/auditLogger';

interface WorkspaceActionCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const WorkspaceActionCard = ({ icon: Icon, title, subtitle, onClick }: WorkspaceActionCardProps) => (
  <button 
    onClick={onClick}
    className="w-full bg-white border border-gold/20 hover:border-gold hover:shadow-lg rounded-lg p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 shadow-soft group relative overflow-hidden"
  >
    <div className="w-16 h-16 rounded-full bg-cream border border-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10">
      <Icon className="text-ivy w-8 h-8" />
    </div>
    <div className="relative z-10">
      <h3 className="text-ivy text-sm font-bold uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-ivy/40 text-[10px] uppercase tracking-widest">{subtitle}</p>
    </div>
  </button>
);

export default function MemberPortal() {
  const userRole = sessionStorage.getItem('userRole');
  const userEmail = sessionStorage.getItem('userEmail');

  const isApplicant = userRole === 'applicant' || userRole === 'prospective';

  // If logged in as applicant or prospective, isolate to Applicant Portal
  if (isApplicant) {
    return <Navigate to="/applicant-portal" replace />;
  }

  const isAdmin = userRole === 'admin' || userEmail?.toLowerCase() === 'admin@orderofkpi.org';
  const isChair = userEmail?.toLowerCase() === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair' || isAdmin;
  const isMembershipCommittee = userRole === 'Membership Committee' || isChair || isAdmin;
  const isAdminOrOfficer = (userRole && userRole !== 'member' && !isApplicant) || isMembershipCommittee || isAdmin;

  React.useEffect(() => {
    logPortalSectionAccess('Member Portal');
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
        className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-24"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-4">
            <ShieldCheck size={14} className="text-gold" />
            <span className="text-[10px] font-bold text-ivy uppercase tracking-[0.2em]">
              Secure Member Access
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter text-ivy">
            Member <span className="text-gold">Portal</span>
          </h1>
          <p className="text-ivy/60 text-lg md:text-xl font-body max-w-2xl mx-auto leading-relaxed">
            Welcome back. Access organizational tools, collaborate with members, and manage administrative workflows.
          </p>
        </motion.div>

        {/* Primary Workspace Tools */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gold/20" />
            <h2 className="text-ivy/40 text-[10px] font-bold uppercase tracking-[0.3em]">Google Workspace Console</h2>
            <div className="h-px flex-1 bg-gold/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WorkspaceActionCard 
              icon={Video}
              title="Google Meet"
              subtitle="Start Session"
              onClick={async () => {
                try {
                  const space = await createMeetSpace();
                  window.open(space.meetingUri || space.meetingCode, '_blank');
                } catch (err) {
                  console.error(err);
                  alert('Please sign in to Workspace to start a meeting');
                }
              }}
            />

            <WorkspaceActionCard 
              icon={FileText}
              title="KPI Docs"
              subtitle="New Document"
              onClick={async () => {
                try {
                  const doc = await createGoogleDoc('New KPI Document');
                  window.open(`https://docs.google.com/document/d/${doc.documentId}/edit`, '_blank');
                } catch (err) {
                  console.error(err);
                  alert('Please sign in to Workspace to create a document');
                }
              }}
            />

            <WorkspaceActionCard 
              icon={Presentation}
              title="KPI Slides"
              subtitle="New Deck"
              onClick={async () => {
                try {
                  const slide = await createGoogleSlide('New KPI Presentation');
                  window.open(`https://docs.google.com/presentation/d/${slide.presentationId}/edit`, '_blank');
                } catch (err) {
                  console.error(err);
                  alert('Please sign in to Workspace to create a presentation');
                }
              }}
            />

            <WorkspaceActionCard 
              icon={ClipboardList}
              title="KPI Forms"
              subtitle="Collect Data"
              onClick={async () => {
                try {
                  const form = await createGoogleForm('New KPI Form');
                  window.open(form.responderUri, '_blank');
                } catch (err) {
                  console.error(err);
                  alert('Please sign in to Workspace to create a form');
                }
              }}
            />
          </div>
        </motion.section>

        {/* Secondary Resources */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Drive Browser Card */}
          <div className="lg:col-span-1 bg-white border border-gold/20 rounded-lg p-10 flex flex-col justify-between items-start space-y-12 shadow-soft">
            <div className="space-y-4">
              <h3 className="text-ivy text-2xl font-display font-bold uppercase tracking-tight">Archives</h3>
              <p className="text-ivy/60 text-sm leading-relaxed font-body">
                Securely browse and manage organizational records directly from your Google Drive integration.
              </p>
            </div>
            <GooglePickerButton 
              className="w-full bg-ivy text-cream hover:brightness-110 transition-all shadow-lg py-4 font-bold uppercase tracking-widest text-xs"
              onFileSelect={(file) => window.open(file.url, '_blank')}
            />
          </div>

          {/* Quick Links / Status Card */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/member-directory"
              className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
            >
              <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                <Users size={28} />
              </div>
              <div>
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Membership Roster</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Member Directory</p>
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

            <Link
              to="/financial-roster"
              className="bg-white border border-gold/20 rounded-lg p-8 flex items-center gap-6 hover:shadow-lg transition-all group shadow-soft"
            >
              <div className="p-4 bg-cream rounded-full border border-gold/10 group-hover:bg-ivy group-hover:text-cream transition-all duration-500">
                <ClipboardCheck size={28} />
              </div>
              <div>
                <h4 className="text-ivy text-sm font-bold uppercase tracking-wider">Financial Status</h4>
                <p className="text-ivy/40 text-[10px] uppercase tracking-widest mt-1">Dues Verification</p>
              </div>
            </Link>

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
          </div>
        </motion.div>

        {/* Administrative Tools */}
        {(isAdminOrOfficer || isMembershipCommittee) && (
          <motion.section variants={itemVariants} className="mb-20">
            <h2 className="text-2xl font-display text-ivy mb-8 uppercase tracking-widest border-b border-gold/20 pb-4">Administrative Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Admin Dashboard', 
                  desc: 'Member & system management.', 
                  icon: Settings, 
                  path: '/admin-dashboard',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'officer']
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
                  title: 'Process Timeline', 
                  desc: 'FY27 MIP Strategic Roadmap.', 
                  icon: LayoutGrid, 
                  path: '/gantt-chart',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'officer']
                },
                { 
                  title: 'Meeting Minutes', 
                  desc: 'AI-powered minutes generator.', 
                  icon: FileText, 
                  path: '/meeting-minutes',
                  color: 'bg-gold text-ivy',
                  roles: ['admin', 'officer']
                },
                { 
                  title: 'Review Applications', 
                  desc: 'Review intake submissions.', 
                  icon: ClipboardCheck, 
                  path: '/review-applications',
                  color: 'bg-ivy text-cream',
                  roles: ['admin', 'officer', 'Membership Committee', 'Membership Committee Chair']
                },
                { 
                  title: 'Membership Chair Portal', 
                  desc: 'Review audit logs, committee access & candidate removal.', 
                  icon: ShieldCheck, 
                  path: '/chair-dashboard',
                  color: 'bg-gold text-ivy',
                  roles: ['admin', 'officer', 'Membership Committee Chair', 'Membership Committee']
                }
              ]
              .filter(tool => 
                !tool.roles || 
                tool.roles.includes(userRole || '') || 
                isAdmin || 
                (isChair && tool.roles.includes('Membership Committee Chair')) ||
                (isMembershipCommittee && tool.roles.includes('Membership Committee'))
              )
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
