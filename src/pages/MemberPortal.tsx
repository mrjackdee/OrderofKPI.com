import React from 'react';
import { motion } from 'motion/react';
import { 
  Video, 
  FileText, 
  Presentation, 
  ClipboardList, 
  ShieldCheck,
  Users,
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';
import GooglePickerButton from '../components/GooglePickerButton';
import { createMeetSpace, createGoogleDoc, createGoogleSlide, createGoogleForm } from '../lib/googleWorkspace';

interface WorkspaceActionCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  color?: string;
}

const WorkspaceActionCard = ({ icon: Icon, title, subtitle, onClick, color = "primary" }: WorkspaceActionCardProps) => (
  <button 
    onClick={onClick}
    className="w-full bg-pure-black/90 border border-white/5 hover:border-primary/50 hover:bg-primary/5 rounded-3xl p-8 flex flex-col items-center text-center gap-4 transition-all duration-500 shadow-2xl group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative z-10">
      <Icon className="text-primary w-8 h-8" />
    </div>
    <div className="relative z-10">
      <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
      <p className="text-silver/40 text-[10px] uppercase tracking-widest">{subtitle}</p>
    </div>
  </button>
);

export default function MemberPortal() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-7xl px-6 py-12 md:py-24 space-y-16"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Secure Member Access</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter text-white">
          Member <span className="text-primary">Portal</span>
        </h1>
        <p className="text-silver/60 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Welcome back. Access your organizational tools, collaborative workspaces, and administrative resources.
        </p>
      </motion.div>

      {/* Primary Workspace Tools */}
      <motion.section variants={itemVariants} className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <h2 className="text-silver/40 text-xs font-black uppercase tracking-[0.3em]">Google Workspace Integration</h2>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WorkspaceActionCard 
            icon={Video}
            title="Google Meet"
            subtitle="Start Virtual Meeting"
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
            title="Docs"
            subtitle="New KPI Document"
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
            title="Slides"
            subtitle="New Presentation"
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
            title="Forms"
            subtitle="Organizational Survey"
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
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between items-start space-y-8">
          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold uppercase tracking-tight">Organization Drive</h3>
            <p className="text-silver/60 text-sm leading-relaxed">
              Securely browse and manage your organizational files directly from your Google Drive.
            </p>
          </div>
          <GooglePickerButton 
            className="w-full bg-primary text-black hover:bg-white transition-all shadow-xl shadow-primary/20"
            onFileSelect={(file) => window.open(file.url, '_blank')}
          />
        </div>

        {/* Quick Links / Status Card */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.a
            href="/financial-roster"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
              <FileSpreadsheet className="text-green-500" size={24} />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold uppercase tracking-wider">Financial Roster</h4>
              <p className="text-silver/40 text-[10px] uppercase">Management View</p>
            </div>
          </motion.a>

          <motion.a
            href="/gantt-chart"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <LayoutDashboard className="text-blue-500" size={24} />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold uppercase tracking-wider">Project Timeline</h4>
              <p className="text-silver/40 text-[10px] uppercase">KPI Milestones</p>
            </div>
          </motion.a>

          <motion.a
            href="/agenda"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-all group"
          >
            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <CalendarDays className="text-purple-500" size={24} />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold uppercase tracking-wider">Conference Archive</h4>
              <p className="text-silver/40 text-[10px] uppercase">View Past Agenda</p>
            </div>
          </motion.a>

          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 opacity-50 cursor-not-allowed"
          >
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold uppercase tracking-wider">Member Directory</h4>
              <p className="text-silver/40 text-[10px] uppercase">Coming Soon</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div variants={itemVariants} className="pt-12 border-t border-white/10 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] text-silver/20">
        <span>© 2026 The Order of KP, Inc.</span>
        <span>Powered by DonOra Global</span>
      </motion.div>
    </motion.div>
  );
}
