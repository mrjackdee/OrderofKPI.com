import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Filter,
  FileText,
  Mail,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { fetchAllApplications } from '../lib/memberDb';

interface Application {
  id: string;
  email: string;
  status: 'draft' | 'submitted';
  last_saved_at: string;
  submitted_at?: string;
  data: any;
}

export default function ReviewApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    const loadApps = async () => {
      const res = await fetchAllApplications();
      if (res.success) {
        setApplications(res.applications);
      }
      setLoading(false);
    };
    loadApps();
  }, []);

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data.firstName && app.data.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.data.lastName && app.data.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const renderDetail = (label: string, value: any) => (
    <div className="space-y-1.5 p-4 rounded-xl bg-white border border-gold/10 shadow-soft">
      <p className="text-[10px] text-ivy/40 font-bold uppercase tracking-widest">{label}</p>
      <p className="text-ivy text-sm leading-relaxed font-body">{value || <span className="text-ivy/20 italic">Not provided</span>}</p>
    </div>
  );

  const renderEssay = (label: string, value: any) => (
    <div className="space-y-3 p-6 rounded-2xl bg-white border border-gold/20 shadow-soft">
      <p className="text-[11px] text-ivy font-bold uppercase tracking-widest flex items-center gap-2">
        <FileText size={14} className="text-gold" /> {label}
      </p>
      <div className="text-ivy/80 text-sm leading-relaxed whitespace-pre-wrap font-body">
        {value || <span className="text-ivy/20 italic">Not provided</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full">
            <ShieldCheck size={12} className="text-gold" />
            <span className="text-[9px] font-bold text-ivy uppercase tracking-[0.2em]">Administrative Review</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-ivy tracking-tighter uppercase italic">
            Application <span className="text-gold">Vault</span>
          </h1>
          <p className="text-ivy/40 text-sm max-w-xl font-body">
            Reviewing new member submissions for the FY27 Intake Class. All information is sensitive and strictly for internal use.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ivy/30 group-focus-within:text-ivy transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-gold/20 rounded-2xl text-ivy text-sm focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all w-full md:w-80 shadow-soft"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-6 py-3.5 bg-white border border-gold/20 rounded-2xl text-ivy text-sm focus:outline-none focus:border-gold transition-all appearance-none cursor-pointer shadow-soft"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Application List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] text-ivy/40 font-bold uppercase tracking-widest">{filteredApps.length} Candidates Found</p>
            <Filter size={14} className="text-ivy/20" />
          </div>
          
          <div className="space-y-3">
            {filteredApps.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gold/20 rounded-3xl bg-white/50">
                <Users size={32} className="mx-auto text-ivy/20 mb-4" />
                <p className="text-ivy/40 text-sm italic font-body">No applications found matching your criteria.</p>
              </div>
            ) : (
              filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${
                    selectedApp?.id === app.id 
                    ? 'bg-ivy border-ivy shadow-xl shadow-ivy/20' 
                    : 'bg-white border-gold/10 hover:border-gold/40 hover:bg-gold/5'
                  }`}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className={`font-display font-bold uppercase tracking-tight text-lg italic ${selectedApp?.id === app.id ? 'text-cream' : 'text-ivy'}`}>
                        {app.data.firstName} {app.data.lastName}
                      </h4>
                      <p className={`text-[10px] font-bold ${selectedApp?.id === app.id ? 'text-gold' : 'text-ivy/40'}`}>
                        {app.email}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${selectedApp?.id === app.id ? 'bg-gold text-ivy' : 'bg-gold/10 text-ivy'}`}>
                      {app.status === 'submitted' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${selectedApp?.id === app.id ? 'text-cream/60' : 'text-ivy/20'}`}>
                      {app.status === 'submitted' ? `Submitted ${new Date(app.submitted_at!).toLocaleDateString()}` : 'Draft in progress'}
                    </span>
                    <ChevronRight size={14} className={`transition-transform duration-300 ${selectedApp?.id === app.id ? 'translate-x-1 text-gold' : 'text-gold'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedApp ? (
              <motion.div
                key={selectedApp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gold/20 rounded-[32px] overflow-hidden shadow-soft"
              >
                <div className="p-8 md:p-12 border-b border-gold/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-gold/5 to-transparent">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-display font-bold text-ivy uppercase italic tracking-tighter">
                      {selectedApp.data.firstName} <span className="text-gold">{selectedApp.data.lastName}</span>
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-ivy/60 text-xs font-body">
                        <Mail size={14} className="text-gold" />
                        {selectedApp.email}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        selectedApp.status === 'submitted' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gold/10 text-gold border border-gold/20'
                      }`}>
                        {selectedApp.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-white border border-gold/20 rounded-xl text-ivy font-bold uppercase tracking-widest text-[10px] hover:bg-gold/5 transition-all flex items-center gap-2">
                      <Mail size={14} /> Send Message
                    </button>
                    <button className="px-6 py-3 bg-ivy text-cream font-bold uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2">
                      <ExternalLink size={14} /> Official Review
                    </button>
                  </div>
                </div>

                <div className="p-8 md:p-12 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderDetail("First Name", selectedApp.data.firstName)}
                    {renderDetail("Middle Name", selectedApp.data.middleName)}
                    {renderDetail("Last Name", selectedApp.data.lastName)}
                    {renderDetail("Date of Birth", selectedApp.data.dateOfBirth)}
                    {renderDetail("Phone Number", selectedApp.data.phone)}
                    {renderDetail("Email", selectedApp.email)}
                    {renderDetail("Place of Employment", selectedApp.data.employment)}
                    {renderDetail("Title / Position", selectedApp.data.position)}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-ivy/40 font-bold uppercase tracking-[0.2em] text-[11px] border-b border-gold/10 pb-4">Academic & Community Profile</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {renderDetail("Degrees Earned", selectedApp.data.degrees)}
                      {renderDetail("Honors & Achievements", selectedApp.data.honors)}
                      {renderDetail("Organization Involvement", selectedApp.data.organizations)}
                      {renderDetail("Prior Knowledge", selectedApp.data.priorKnowledge)}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-ivy/40 font-bold uppercase tracking-[0.2em] text-[11px] border-b border-gold/10 pb-4">Questions</h3>
                    {renderEssay("Purpose of Kappa Pi", selectedApp.data.essay1)}
                    {renderEssay("Community Role Model", selectedApp.data.essay2)}
                    {renderEssay("Service Projects", selectedApp.data.essay3)}
                    {renderEssay("Societal Pressures / Self-Esteem", selectedApp.data.essay4)}
                    {renderEssay("Status & Talents", selectedApp.data.essay5)}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-ivy/40 font-bold uppercase tracking-[0.2em] text-[11px] border-b border-gold/10 pb-4">Disclosures & Presence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderDetail("Fraternity Member", selectedApp.data.isFraternityMember)}
                      {renderDetail("Fraternity Details", selectedApp.data.fraternityDetails)}
                      {renderDetail("AKA Family", selectedApp.data.hasAkaFamily)}
                      {renderDetail("AKA Family Details", selectedApp.data.akaFamilyDetails)}
                      {renderDetail("Previous Applied", selectedApp.data.previousApplied)}
                      {renderDetail("Previous Details", selectedApp.data.previousAppliedDetails)}
                    </div>
                    {renderDetail("Social Media / Website URLs", selectedApp.data.socialUrls)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-gold/10 rounded-[32px] text-center space-y-6 bg-white shadow-soft">
                <div className="p-6 bg-gold/5 rounded-full text-gold/40">
                  <FileText size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold text-ivy uppercase tracking-tight">Select a Candidate</h3>
                  <p className="text-ivy/40 text-sm max-w-xs mx-auto font-body">
                    Choose an application from the left panel to review full candidate details, written questions, and professional background.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
