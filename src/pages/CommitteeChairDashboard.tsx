import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  UserCheck, 
  RefreshCw, 
  AlertTriangle,
  Mail,
  UserX,
  ExternalLink,
  Shield,
  Layers,
  Award
} from 'lucide-react';
import { Candidate, Member } from '../types';
import { prospectiveMembers, fetchAllApplications, syncApplicationsFromFirestore } from '../lib/memberDb';
import { logPortalSectionAccess } from '../lib/auditLogger';

interface AuditLog {
  id: string;
  reviewer_email: string;
  reviewer_name: string;
  applicant_email: string;
  applicant_name: string;
  action: string;
  timestamp: string;
}

export default function CommitteeChairDashboard() {
  const [activeTab, setActiveTab] = useState<'audit' | 'candidates' | 'committee'>('audit');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState<{ firstName: string; lastName: string; email: string; phone: string; status: Candidate['status'] }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Inquiry'
  });

  // Committee roster state
  const [committeeMembers, setCommitteeMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUserEmail = sessionStorage.getItem('userEmail') || 'james.haywood@orderofkpi.org';

  useEffect(() => {
    logPortalSectionAccess('Membership Chair Portal');
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await syncApplicationsFromFirestore();
    } catch (e) {
      console.warn('Sync applications error during loadAllData:', e);
    }
    await Promise.all([
      fetchAuditLogs(),
      fetchCandidates(),
      fetchCommitteeMembers(),
      fetchAllMembers(),
      fetchApplications()
    ]);
    setLoading(false);
  };

  const fetchApplications = async () => {
    try {
      const res = await fetchAllApplications();
      if (res.success && Array.isArray(res.applications)) {
        setApplications(res.applications);
      }
    } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/applications/audit');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      const apiCandidates: Candidate[] = (data.success && Array.isArray(data.candidates)) ? data.candidates : [];

      if (apiCandidates.length > 0) {
        setCandidates(apiCandidates);
      } else {
        const fallbacks: Candidate[] = prospectiveMembers.map(m => ({
          id: 'cand_' + m.email.replace(/[^a-z0-9]/g, '_'),
          name: m.name,
          email: m.email,
          status: 'Inquiry',
          application_date: ''
        }));
        setCandidates(fallbacks);
      }
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      const fallbacks: Candidate[] = prospectiveMembers.map(m => ({
        id: 'cand_' + m.email.replace(/[^a-z0-9]/g, '_'),
        name: m.name,
        email: m.email,
        status: 'Inquiry',
        application_date: ''
      }));
      setCandidates(fallbacks);
    }
  };

  const fetchCommitteeMembers = async () => {
    try {
      const res = await fetch('/api/committee/members');
      const data = await res.json();
      if (data.success) {
        setCommitteeMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch committee members:', err);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success) {
        setAllMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch all members:', err);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Candidate Status Change
  const handleUpdateStatus = async (candidateId: string, currentCandidate: Candidate, newStatus: Candidate['status']) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...currentCandidate, 
          status: newStatus,
          reviewerEmail: currentUserEmail 
        })
      });
      if (res.ok) {
        showNotification('success', `Successfully updated the candidate's intake stage to "${newStatus}" and committed changes to the database!`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showNotification('error', 'We were unable to update the candidate status. Please try again.');
      }
    } catch (err) {
      showNotification('error', 'We encountered an error updating the candidate\'s status. Please check your connection and try again.');
    }
  };

  // Add Candidate
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email) {
      showNotification('error', 'Please enter a first name, last name, and email address to proceed.');
      return;
    }

    const fullName = `${newCandidate.firstName.trim()} ${newCandidate.lastName.trim()}`;

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newCandidate.firstName.trim(),
          lastName: newCandidate.lastName.trim(),
          name: fullName,
          email: newCandidate.email.trim(),
          phone: newCandidate.phone.trim(),
          status: newCandidate.status,
          adminEmail: currentUserEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Successfully registered candidate "${fullName}" and saved their applicant account in the database!`);
        setShowAddCandidateModal(false);
        setNewCandidate({ firstName: '', lastName: '', email: '', phone: '', status: 'Inquiry' });
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showNotification('error', data.message || 'We could not add the candidate. Please make sure the email is not already registered and try again.');
      }
    } catch (err) {
      showNotification('error', 'We had trouble adding this candidate. Please check your connection and try again.');
    }
  };

  // Candidate Removal
  const handleRemoveCandidate = async (candidateId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove applicant "${name}" from the candidate tracker?`)) return;

    // Optimistically update candidate state
    setCandidates(prev => prev.filter(c => c.id !== candidateId && c.email?.toLowerCase().trim() !== candidateId.toLowerCase().trim()));

    try {
      const res = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}?chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Successfully removed candidate "${name}" from the intake roster and deleted their record from the database.`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showNotification('error', data.message || 'We were unable to remove this candidate from the database. Please try again.');
        fetchCandidates();
      }
    } catch (err) {
      showNotification('error', 'We ran into a connection issue while removing the candidate from the database. Please try again.');
      fetchCandidates();
    }
  };

  // Add Member to Membership Committee
  const handleAddCommitteeMember = async () => {
    if (!selectedMemberToAdd) {
      showNotification('error', 'Please select a directory user to grant committee permissions.');
      return;
    }

    try {
      const res = await fetch('/api/committee/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedMemberToAdd,
          chairEmail: currentUserEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Successfully granted Membership Committee access to "${selectedMemberToAdd}" and updated the permissions database!`);
        setSelectedMemberToAdd('');
        fetchCommitteeMembers();
        fetchAllMembers();
      } else {
        showNotification('error', data.message || 'We were unable to add this member to the committee. Please try again.');
      }
    } catch (err) {
      showNotification('error', 'We had trouble updating the committee roster. Please verify your connection and try again.');
    }
  };

  // Remove Member from Committee
  const handleRemoveCommitteeMember = async (email: string, name: string) => {
    if (!window.confirm(`Revoke Membership Committee access for ${name}?`)) return;

    try {
      const res = await fetch(`/api/committee/members/${encodeURIComponent(email)}?chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Successfully revoked Membership Committee access for "${name}" and updated the permissions database.`);
        fetchCommitteeMembers();
        fetchAllMembers();
      } else {
        showNotification('error', data.message || 'We were unable to revoke committee permissions. Please try again.');
      }
    } catch (err) {
      showNotification('error', 'We encountered an error updating committee permissions. Please try again.');
    }
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesText = 
      log.reviewer_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.reviewer_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_name.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesText && matchesAction;
  });

  // Merged candidates combining roster and submitted applications
  const mergedCandidates = useMemo(() => {
    const submittedAppsMap = new Map<string, any>();
    applications.forEach(app => {
      if (app && (app.status === 'submitted' || app.submitted_at || app.submittedAt)) {
        if (app.email) submittedAppsMap.set(app.email.toLowerCase().trim(), app);
      }
    });

    const seenEmails = new Set<string>();
    const updated = candidates.map(c => {
      const normEmail = (c.email || '').toLowerCase().trim();
      if (normEmail) seenEmails.add(normEmail);
      if (normEmail && submittedAppsMap.has(normEmail)) {
        const app = submittedAppsMap.get(normEmail);
        const appPhone = app?.data?.phone || app?.phone || c.phone || '';
        const appDate = (app?.submitted_at || app?.submittedAt || app?.last_saved_at || app?.lastSavedAt || '').split('T')[0];
        return {
          ...c,
          status: (c.status === 'Inquiry' ? 'Applied' : c.status) as Candidate['status'],
          phone: appPhone,
          application_date: c.application_date || appDate || ''
        };
      }
      return c;
    });

    // Synthesize missing candidates from submitted applications
    submittedAppsMap.forEach((app, normEmail) => {
      if (!seenEmails.has(normEmail)) {
        const firstName = app.data?.firstName || app.firstName || normEmail.split('@')[0];
        const lastName = app.data?.lastName || app.lastName || '';
        const name = `${firstName} ${lastName}`.trim();
        const appPhone = app.data?.phone || app.phone || '';
        const appDate = (app.submitted_at || app.submittedAt || app.last_saved_at || app.lastSavedAt || new Date().toISOString()).split('T')[0];
        
        updated.push({
          id: 'cand_' + normEmail.replace(/[^a-z0-9]/g, '_'),
          name: name || normEmail,
          email: normEmail,
          phone: appPhone,
          status: 'Applied',
          application_date: appDate,
          scores: {},
          notes: '',
          document_vault: []
        });
      }
    });

    return updated;
  }, [candidates, applications]);

  // Filtered Candidates
  const filteredCandidates = mergedCandidates.filter(cand => {
    const matchesSearch = 
      cand.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      cand.email.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchesStage = stageFilter === 'all' || cand.status === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Non-committee members for dropdown
  const availableMembersToAdd = allMembers.filter(
    m => m.role !== 'Membership Committee' && m.role !== 'Membership Committee Chair' && m.email !== 'james.haywood@orderofkpi.org'
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-10">
      {/* Header Banner */}
      <div className="bg-ivy text-cream p-8 md:p-12 rounded-[32px] border border-gold/30 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gold/20 border border-gold/40 rounded-full text-gold">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Membership Committee Chair Control Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight uppercase italic">
              Membership <span className="text-gold">Chair Portal</span>
            </h1>
            <p className="text-cream/70 text-sm max-w-2xl font-body">
              Chairmanship administrative controls for James Haywood Jr (<span className="text-gold font-bold">james.haywood@orderofkpi.org</span>). Oversee application review audit trails, direct applicant statuses, execute removals, and grant committee access permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/candidate-tracker"
              className="px-5 py-3 bg-gold text-ivy hover:bg-gold-light border border-gold rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md hover:scale-105"
            >
              <Users size={16} /> Open Candidate Tracker
            </Link>
            <button 
              onClick={loadAllData}
              className="px-5 py-3 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-2xl text-cream text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Update Portal Data
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
              actionMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs uppercase opacity-60 hover:opacity-100">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gold/20 pb-4">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 ${
            activeTab === 'audit' 
              ? 'bg-ivy text-cream shadow-lg shadow-ivy/20 border border-gold/30' 
              : 'bg-white border border-gold/20 text-ivy/60 hover:text-ivy hover:bg-gold/5'
          }`}
        >
          <Clock size={16} className={activeTab === 'audit' ? 'text-gold' : ''} />
          Application Review Audit Logs
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold font-bold">{auditLogs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 ${
            activeTab === 'candidates' 
              ? 'bg-ivy text-cream shadow-lg shadow-ivy/20 border border-gold/30' 
              : 'bg-white border border-gold/20 text-ivy/60 hover:text-ivy hover:bg-gold/5'
          }`}
        >
          <UserX size={16} className={activeTab === 'candidates' ? 'text-gold' : ''} />
          Candidate Status & Removal
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold font-bold">{candidates.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('committee')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 ${
            activeTab === 'committee' 
              ? 'bg-ivy text-cream shadow-lg shadow-ivy/20 border border-gold/30' 
              : 'bg-white border border-gold/20 text-ivy/60 hover:text-ivy hover:bg-gold/5'
          }`}
        >
          <UserCheck size={16} className={activeTab === 'committee' ? 'text-gold' : ''} />
          Membership Committee Roster
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold font-bold">{committeeMembers.length}</span>
        </button>
      </div>

      {/* TAB 1: APPLICATION REVIEW AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
            <div>
              <h3 className="font-display font-bold text-xl text-ivy uppercase italic">
                Application Review <span className="text-gold">Access Logs</span>
              </h3>
              <p className="text-ivy/60 text-xs mt-1">
                Real-time audit record showing which committee members have accessed or reviewed candidate applications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30" />
                <input
                  type="text"
                  placeholder="Search reviewer or candidate..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="all">All Actions</option>
                <option value="ACCESSED_APPLICATION">Accessed Application</option>
                <option value="DOWNLOADED_PDF">Downloaded PDF</option>
                <option value="PERFORMED_OFFICIAL_REVIEW">Official Review</option>
                <option value="CANDIDATE_STATUS_CHANGE">Status Change</option>
                <option value="CANDIDATE_REMOVED">Candidate Removal</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gold/20 overflow-hidden shadow-soft">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-16 text-center text-ivy/40 space-y-3">
                <Clock size={40} className="mx-auto text-gold/30" />
                <p className="font-body text-sm italic">No application access audit events logged yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivy text-cream font-display uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Committee Reviewer</th>
                      <th className="py-4 px-6">Applicant</th>
                      <th className="py-4 px-6">Action Performed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10 text-ivy font-body">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gold/5 transition-colors">
                        <td className="py-4 px-6 text-ivy/50 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-bold text-ivy">
                          <div className="flex items-center gap-2">
                            <Shield size={14} className="text-gold" />
                            <span>{log.reviewer_name}</span>
                          </div>
                          <p className="text-[10px] text-ivy/40 font-normal">{log.reviewer_email}</p>
                        </td>
                        <td className="py-4 px-6 font-bold text-ivy">
                          <span>{log.applicant_name}</span>
                          <p className="text-[10px] text-ivy/40 font-normal">{log.applicant_email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.action === 'DOWNLOADED_PDF' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            log.action === 'CANDIDATE_REMOVED' ? 'bg-red-100 text-red-800 border border-red-200' :
                            log.action === 'CANDIDATE_STATUS_CHANGE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <FileText size={12} />
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE STATUS & REMOVAL MANAGEMENT */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
            <div>
              <h3 className="font-display font-bold text-xl text-ivy uppercase italic">
                Applicant Status & <span className="text-gold">Candidate Removal</span>
              </h3>
              <p className="text-ivy/60 text-xs mt-1">
                Directly change applicant stages or remove non-viable candidates from the official active intake roster.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="Inquiry">Inquiry</option>
                <option value="Applied">Applied</option>
                <option value="Tea Time">Tea Time</option>
                <option value="Interview">Interview</option>
                <option value="Selection">Selection</option>
                <option value="Intake">Intake</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                onClick={() => setShowAddCandidateModal(true)}
                className="flex items-center gap-2 bg-gold text-ivy px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-sm"
              >
                <UserPlus size={16} /> Add Candidate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.length === 0 ? (
              <div className="col-span-full p-16 text-center text-ivy/40 bg-white rounded-3xl border border-gold/20">
                <Users size={40} className="mx-auto text-gold/30 mb-2" />
                <p className="font-body text-sm italic">No candidates match the specified filter criteria.</p>
              </div>
            ) : (
              filteredCandidates.map((candidate) => {
                const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                return (
                <div 
                  key={candidate.id}
                  className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft hover:border-gold/50 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-bold text-lg text-ivy">{candidate.name}</h4>
                        <p className="text-xs text-ivy/60 font-body">{candidate.email}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        candidate.status === 'Intake' ? 'bg-purple-100 text-purple-800' :
                        candidate.status === 'Selection' ? 'bg-indigo-100 text-indigo-800' :
                        candidate.status === 'Interview' ? 'bg-blue-100 text-blue-800' :
                        candidate.status === 'Tea Time' ? 'bg-amber-100 text-amber-800' :
                        candidate.status === 'Applied' ? 'bg-emerald-100 text-emerald-800' :
                        candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>

                    <div className="text-xs text-ivy/60 space-y-1 font-body pt-2 border-t border-gold/10">
                      <p><span className="font-bold text-ivy">Phone:</span> {candidate.phone || matchingApp?.data?.phone || 'N/A'}</p>
                      <p><span className="font-bold text-ivy">Applied:</span> {candidate.application_date ? new Date(candidate.application_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gold/10">
                    <div>
                      <label className="text-[10px] text-ivy/40 font-bold uppercase tracking-wider block mb-1">
                        Update Candidate Stage
                      </label>
                      <select
                        value={candidate.status}
                        onChange={(e) => handleUpdateStatus(candidate.id, candidate, e.target.value as any)}
                        className="w-full px-3 py-2 bg-cream/40 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
                      >
                        <option value="Inquiry">Inquiry</option>
                        <option value="Applied">Applied</option>
                        <option value="Tea Time">Tea Time</option>
                        <option value="Interview">Interview</option>
                        <option value="Selection">Selection</option>
                        <option value="Intake">Intake</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveCandidate(candidate.id, candidate.name)}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Remove Candidate
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBERSHIP COMMITTEE ROSTER */}
      {activeTab === 'committee' && (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-6">
            <div>
              <h3 className="font-display font-bold text-xl text-ivy uppercase italic">
                Add Member to <span className="text-gold">Membership Committee</span>
              </h3>
              <p className="text-ivy/60 text-xs mt-1">
                Adding members here automatically assigns them the <span className="font-bold text-ivy">Membership Committee</span> access role, granting full access to application review vaults and candidate evaluations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <select
                value={selectedMemberToAdd}
                onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                className="flex-1 px-4 py-3 bg-cream/50 border border-gold/30 rounded-2xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="">Select active member from directory...</option>
                {availableMembersToAdd.map((member) => (
                  <option key={member.email} value={member.email}>
                    {member.name} ({member.email}) - {member.title || member.role}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAddCommitteeMember}
                className="px-6 py-3 bg-ivy hover:bg-ivy/90 text-cream rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <UserPlus size={16} className="text-gold" /> Grant Committee Access
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-ivy uppercase tracking-wider">
              Current Membership Committee Roster ({committeeMembers.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {committeeMembers.map((member) => {
                const isChair = member.email.toLowerCase() === 'james.haywood@orderofkpi.org' || member.role === 'Membership Committee Chair';

                return (
                  <div 
                    key={member.email}
                    className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isChair ? 'bg-gold text-ivy' : 'bg-ivy text-cream'
                        }`}>
                          {isChair ? 'Committee Chair' : 'Committee Member'}
                        </span>
                        <ShieldCheck size={18} className="text-gold" />
                      </div>

                      <div>
                        <h4 className="font-display font-bold text-lg text-ivy">{member.name}</h4>
                        <p className="text-xs text-ivy/60 font-body">{member.email}</p>
                      </div>

                      {member.title && 
                       member.title.toLowerCase() !== 'member' && 
                       member.title.toLowerCase() !== 'financial member' && 
                       member.title.toLowerCase() !== 'candidate' && (
                        <p className="text-xs font-bold text-gold uppercase tracking-wider">{member.title}</p>
                      )}
                    </div>

                    {!isChair && (
                      <button
                        onClick={() => handleRemoveCommitteeMember(member.email, member.name)}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mt-2"
                      >
                        <UserX size={14} /> Revoke Access
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      <AnimatePresence>
        {showAddCandidateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gold/30 p-8 max-w-lg w-full shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gold/10">
                <h3 className="text-xl font-display font-bold text-ivy flex items-center gap-2">
                  <UserPlus className="text-gold" size={20} />
                  Add New Candidate
                </h3>
                <button
                  onClick={() => setShowAddCandidateModal(false)}
                  className="text-ivy/40 hover:text-ivy text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ivy mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newCandidate.firstName}
                      onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                      placeholder="First Name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-sm text-ivy focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ivy mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newCandidate.lastName}
                      onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                      placeholder="Last Name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-sm text-ivy focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ivy mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    placeholder="(404) 555-0199"
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                  <p className="text-[10px] text-ivy/50 mt-1">Last 4 digits serve as default initial password.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ivy mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="candidate@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                  <p className="text-[10px] text-ivy/50 mt-1">Serves as email login username.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ivy mb-1">Initial Stage</label>
                  <select
                    value={newCandidate.status}
                    onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value as Candidate['status'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-sm text-ivy focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="Inquiry">Inquiry</option>
                    <option value="Applied">Applied</option>
                    <option value="Tea Time">Tea Time</option>
                    <option value="Interview">Interview</option>
                    <option value="Selection">Selection</option>
                    <option value="Intake">Intake</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-gold/30 text-ivy font-bold text-xs uppercase tracking-wider hover:bg-cream/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gold text-ivy font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
                  >
                    Add Candidate Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
