import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  RefreshCcw, 
  FileText, 
  Trash2, 
  Users, 
  CalendarDays, 
  UserPlus, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History, 
  ArrowRight, 
  Edit2, 
  Search, 
  Filter, 
  UserX, 
  Shield, 
  ExternalLink, 
  Layers, 
  CheckSquare, 
  BarChart2, 
  Eye, 
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import { Member, Candidate } from '../types';
import { logPortalSectionAccess } from '../lib/auditLogger';

interface SystemLog {
  id?: number;
  timestamp: string;
  email: string;
  event_type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

interface ApplicationAuditLog {
  id: string;
  reviewer_email: string;
  reviewer_name: string;
  applicant_email: string;
  applicant_name: string;
  action: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'candidates' | 'audits' | 'intake' | 'revisions'>('users');
  
  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  
  // Candidates State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStageFilter, setCandidateStageFilter] = useState('all');

  // Audit Logs State
  const [appAuditLogs, setAppAuditLogs] = useState<ApplicationAuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');

  // Revisions & Loading State
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', status: 'Inquiry' });

  const currentUserEmail = sessionStorage.getItem('userEmail') || 'admin@orderofkpi.org';

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

    logPortalSectionAccess('Admin Dashboard');

    loadAllData();

    // Firestore Bylaw Revisions Listener
    const qRevisions = query(collection(db, 'revisions'));
    const unsubRevisions = onSnapshot(qRevisions, (snap) => {
      setRevisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('Firestore revisions error:', err));

    // Real-time System Logs Stream
    const eventSource = new EventSource('/api/admin/logs/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'history') {
          setSystemLogs(data.data);
        } else {
          setSystemLogs(prev => [data, ...prev].slice(0, 100));
        }
      } catch (err) {
        console.warn('Error parsing log stream:', err);
      }
    };

    return () => {
      unsubRevisions();
      eventSource.close();
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMembers(),
      fetchCandidates(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/applications/audit');
      const data = await response.json();
      if (data.success) {
        setAppAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // --- MEMBER MANAGEMENT ---
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.email || !editingMember?.name || !editingMember?.role) return;

    setActionLoading(true);
    try {
      const url = isNewMember ? '/api/members' : `/api/members/${editingMember.email}`;
      const method = isNewMember ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUserEmail
        },
        body: JSON.stringify({
          ...editingMember,
          adminEmail: currentUserEmail
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('success', isNewMember ? `Added new user ${editingMember.name}` : `Updated user ${editingMember.email}`);
        setShowMemberModal(false);
        fetchMembers();
      } else {
        showToast('error', data.message || 'Failed to save member record.');
      }
    } catch (error) {
      showToast('error', 'Error saving member record.');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMember = async (email: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove member "${name}" (${email}) from the active directory?`)) return;
    
    try {
      const response = await fetch(`/api/members/${email}?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUserEmail }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('success', `Deleted user ${email} from system.`);
        fetchMembers();
      } else {
        showToast('error', data.message || 'Failed to delete user.');
      }
    } catch (error) {
      showToast('error', 'Error deleting user.');
    }
  };

  // --- CANDIDATE MANAGEMENT ---
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCandidate,
          adminEmail: currentUserEmail
        }),
      });
      const data = await response.json();

      if (data.success) {
        showToast('success', `Added new candidate ${newCandidate.name}`);
        setShowCandidateModal(false);
        setNewCandidate({ name: '', email: '', phone: '', status: 'Inquiry' });
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', data.message || 'Failed to add candidate.');
      }
    } catch (error) {
      showToast('error', 'Error adding candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCandidateStatus = async (id: string, candidate: Candidate, newStatus: Candidate['status']) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...candidate,
          status: newStatus,
          reviewerEmail: currentUserEmail
        }),
      });

      if (response.ok) {
        showToast('success', `Updated candidate ${candidate.name} stage to ${newStatus}`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', 'Failed to update candidate status.');
      }
    } catch (error) {
      showToast('error', 'Error updating candidate status.');
    }
  };

  const handleRemoveCandidate = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove candidate "${name}" from the active intake tracking roster?`)) return;

    try {
      const response = await fetch(`/api/candidates/${id}?chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        showToast('success', `Removed candidate ${name} from intake roster.`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', data.message || 'Failed to remove candidate.');
      }
    } catch (error) {
      showToast('error', 'Error removing candidate.');
    }
  };

  // Filtered lists
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.role && m.role.toLowerCase().includes(memberSearch.toLowerCase())) ||
    (m.title && m.title.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchesStage = candidateStageFilter === 'all' || c.status === candidateStageFilter;
    return matchesSearch && matchesStage;
  });

  const filteredAuditLogs = appAuditLogs.filter(log => {
    const matchesSearch = 
      log.reviewer_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.reviewer_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_name.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesType = 
      auditTypeFilter === 'all' || 
      (auditTypeFilter === 'portal' && log.action.startsWith('ACCESSED_PORTAL_SECTION')) ||
      (auditTypeFilter === 'app' && (log.action === 'ACCESSED_APPLICATION' || log.action === 'DOWNLOADED_PDF' || log.action === 'PERFORMED_OFFICIAL_REVIEW')) ||
      (auditTypeFilter === 'candidate' && (log.action === 'CANDIDATE_STATUS_CHANGE' || log.action === 'CANDIDATE_REMOVED' || log.action === 'CANDIDATE_CREATED'));
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Top Banner */}
      <div className="bg-ivy text-cream py-10 px-6 border-b border-gold/30 shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-ivy font-bold rounded-full text-[10px] uppercase tracking-widest shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-ivy" />
              Super User Administration Console
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase italic">
              Portal <span className="text-gold">Administrator</span>
            </h1>
            <p className="text-cream/70 text-xs md:text-sm font-body max-w-2xl">
              Logged in as <span className="text-gold font-bold">admin@orderofkpi.org</span>. Full administrative authorization to oversee directory users, candidate pipelines, status transitions, and comprehensive system access audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllData}
              className="px-4 py-2.5 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-xl text-cream text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Console
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                <span>{notification.text}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-[10px] uppercase opacity-60 hover:opacity-100">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Super User Launchpad */}
        <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ivy uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" /> Super User Quick Access Portals
            </h3>
            <span className="text-[10px] text-ivy/40 uppercase font-mono">Full Permission Authorization Active</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Link to="/member-portal" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Users className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Member Portal</p>
            </Link>
            <Link to="/candidate-tracker" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Layers className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Candidate Tracker</p>
            </Link>
            <Link to="/review-applications" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <FileText className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Review Applications</p>
            </Link>
            <Link to="/chair-dashboard" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <ShieldCheck className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Chair Portal</p>
            </Link>
            <Link to="/selection-voting" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <CheckSquare className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Selection Voting</p>
            </Link>
            <Link to="/membership-application" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Edit2 className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Applicant View</p>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gold/20 pb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-ivy text-cream shadow-md border border-gold/30' : 'bg-white text-ivy/70 hover:bg-gold/10'
            }`}
          >
            <Users className="w-4 h-4 text-gold" /> User Management
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{members.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'candidates' ? 'bg-ivy text-cream shadow-md border border-gold/30' : 'bg-white text-ivy/70 hover:bg-gold/10'
            }`}
          >
            <UserX className="w-4 h-4 text-gold" /> Candidate Pipeline & Removal
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{candidates.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('audits')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'audits' ? 'bg-ivy text-cream shadow-md border border-gold/30' : 'bg-white text-ivy/70 hover:bg-gold/10'
            }`}
          >
            <Clock className="w-4 h-4 text-gold" /> Audit Trail & System Logs
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{appAuditLogs.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('intake')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'intake' ? 'bg-ivy text-cream shadow-md border border-gold/30' : 'bg-white text-ivy/70 hover:bg-gold/10'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-gold" /> Intake Ops
          </button>

          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'revisions' ? 'bg-ivy text-cream shadow-md border border-gold/30' : 'bg-white text-ivy/70 hover:bg-gold/10'
            }`}
          >
            <FileText className="w-4 h-4 text-gold" /> Bylaw Revisions ({revisions.length})
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  User Directory <span className="text-gold">Administration</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Add new users, assign roles (Administrator, Committee Chair, Committee Member, Officer, Member), or delete existing accounts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search user name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsNewMember(true);
                    setEditingMember({ role: 'member', financial_status: 'inactive' });
                    setShowMemberModal(true);
                  }}
                  className="bg-ivy text-cream px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-ivy/90 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4 text-gold" /> Add New User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-soft overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-ivy text-cream border-b border-gold/10 text-[10px] font-display uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Assigned Role</th>
                    <th className="px-6 py-4">Title / Intake Class</th>
                    <th className="px-6 py-4">Financial Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-xs text-ivy font-body">
                  {filteredMembers.map(member => (
                    <tr key={member.email} className="hover:bg-gold/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-ivy/5 border border-gold/20 flex items-center justify-center font-bold text-gold">
                            {member.name ? member.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-ivy">{member.name}</p>
                            <p className="text-[10px] text-ivy/50">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          member.role === 'Membership Committee Chair' ? 'bg-gold text-ivy font-extrabold' :
                          member.role === 'Membership Committee' ? 'bg-emerald-100 text-emerald-800' :
                          member.role === 'officer' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gold">{member.title || '-'}</p>
                        <p className="text-[10px] text-ivy/50">{member.intake_class || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          member.financial_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.financial_status || 'inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setIsNewMember(false);
                              setEditingMember(member);
                              setShowMemberModal(true);
                            }}
                            className="p-2 text-ivy/60 hover:text-ivy hover:bg-gold/10 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMember(member.email, member.name)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE PIPELINE & REMOVAL */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  Candidate Pipeline & <span className="text-gold">Status Control</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Add candidates, delete non-viable applicants, or transition candidates across intake pipeline stages.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <select
                  value={candidateStageFilter}
                  onChange={(e) => setCandidateStageFilter(e.target.value)}
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
                  onClick={() => setShowCandidateModal(true)}
                  className="bg-gold text-ivy px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" /> Add Candidate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => (
                <div 
                  key={candidate.id}
                  className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft hover:border-gold/50 transition-all flex flex-col justify-between space-y-4"
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

                    <div className="text-xs text-ivy/60 space-y-1 pt-2 border-t border-gold/10">
                      <p><span className="font-bold text-ivy">Phone:</span> {candidate.phone || 'N/A'}</p>
                      <p><span className="font-bold text-ivy">Applied Date:</span> {candidate.application_date ? new Date(candidate.application_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gold/10">
                    <div>
                      <label className="text-[10px] text-ivy/40 font-bold uppercase tracking-wider block mb-1">
                        Move Candidate Stage
                      </label>
                      <select
                        value={candidate.status}
                        onChange={(e) => handleUpdateCandidateStatus(candidate.id, candidate, e.target.value as any)}
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
                      <Trash2 className="w-3.5 h-3.5" /> Delete Candidate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL & SYSTEM LOGS */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  Portal & Application <span className="text-gold">Audit Center</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Complete audit trail determining which users accessed specific applications, member portal sections, candidate statuses, or user directory permissions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reviewer, applicant, or page..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
                >
                  <option value="all">All Audit Events</option>
                  <option value="portal">Portal Section Accesses</option>
                  <option value="app">Application Access & Downloads</option>
                  <option value="candidate">Candidate Changes & Removals</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 overflow-hidden shadow-soft">
              <div className="p-4 bg-ivy text-cream font-display uppercase tracking-wider text-[11px] flex justify-between items-center">
                <span>Application Access & Portal Activity Records ({filteredAuditLogs.length})</span>
                <span className="text-gold font-mono text-[10px]">Real-Time Verified</span>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="p-16 text-center text-ivy/40 space-y-3">
                  <Clock className="w-10 h-10 mx-auto text-gold/30" />
                  <p className="font-body text-sm italic">No audit records match the selected filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream border-b border-gold/10 text-[10px] font-bold uppercase tracking-widest text-ivy/50">
                      <tr>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">User / Reviewer</th>
                        <th className="py-4 px-6">Target / Section</th>
                        <th className="py-4 px-6">Audit Event</th>
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
                              <Shield className="w-3.5 h-3.5 text-gold" />
                              <span>{log.reviewer_name}</span>
                            </div>
                            <p className="text-[10px] text-ivy/40 font-normal">{log.reviewer_email}</p>
                          </td>
                          <td className="py-4 px-6 font-bold text-ivy">
                            <span>{log.applicant_name}</span>
                            {log.applicant_email !== 'portal_system' && (
                              <p className="text-[10px] text-ivy/40 font-normal">{log.applicant_email}</p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.action.startsWith('ACCESSED_PORTAL_SECTION') ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              log.action === 'DOWNLOADED_PDF' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              log.action === 'CANDIDATE_REMOVED' ? 'bg-red-100 text-red-800 border border-red-200' :
                              log.action === 'CANDIDATE_STATUS_CHANGE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              <Activity className="w-3 h-3" />
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

            {/* Live Event Log Stream */}
            <div className="bg-white rounded-3xl border border-gold/20 shadow-soft overflow-hidden">
              <div className="p-4 bg-cream border-b border-gold/10 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ivy flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gold" /> Live System Event Stream
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-ivy/40 uppercase tracking-widest">Connected</span>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-cream p-2">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="p-3.5 flex gap-4 items-start hover:bg-cream/30 transition-colors text-xs">
                    <div className="shrink-0 w-24">
                      <p className="text-[10px] font-mono text-ivy/40">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
                          log.severity === 'error' ? 'bg-red-100 text-red-700' : 
                          log.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 
                          'bg-ivy/10 text-ivy'
                        }`}>
                          {log.event_type}
                        </span>
                        <span className="text-[10px] text-ivy/40">{log.email}</span>
                      </div>
                      <p className="text-xs text-ivy/80">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTAKE OPS */}
        {activeTab === 'intake' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-4">
                <History className="w-10 h-10 text-gold mb-2" />
                <h3 className="text-xl font-display font-bold text-ivy">Active Candidate Pipeline</h3>
                <p className="text-xs text-ivy/60">Manage and monitor candidate transitions from inquiry through intake in real time.</p>
                <Link to="/candidate-tracker" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-wider text-xs hover:text-gold transition-colors pt-2">
                  Go to Pipeline Board <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-4">
                <ShieldCheck className="w-10 h-10 text-gold mb-2" />
                <h3 className="text-xl font-display font-bold text-ivy">Selection Committee Portal</h3>
                <p className="text-xs text-ivy/60">Review candidate dossiers and cast official selection votes.</p>
                <Link to="/selection-voting" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-wider text-xs hover:text-gold transition-colors pt-2">
                  Enter Voting Portal <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BYLAW REVISIONS */}
        {activeTab === 'revisions' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft">
              <h2 className="text-xl font-display font-bold text-ivy uppercase italic mb-4">
                Bylaw <span className="text-gold">Revisions Submitted</span>
              </h2>

              {revisions.length === 0 ? (
                <p className="text-xs text-ivy/50 italic">No bylaw revisions currently logged.</p>
              ) : (
                <div className="space-y-4">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="p-4 bg-cream/30 border border-gold/10 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-ivy">{rev.title || 'Untitled Revision'}</span>
                        <span className="text-[10px] text-ivy/40">{rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <p className="text-ivy/70">{rev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MEMBER EDIT / CREATE MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-gold/30 border overflow-hidden"
          >
            <div className="p-6 bg-ivy flex justify-between items-center text-cream">
              <h2 className="text-2xl font-display font-bold">{isNewMember ? 'Add New Directory User' : 'Edit Directory User'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="text-cream/60 hover:text-cream">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMember} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    value={editingMember?.name || ''}
                    onChange={e => setEditingMember({...editingMember!, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Email Address</label>
                  <input
                    required
                    disabled={!isNewMember}
                    type="email"
                    value={editingMember?.email || ''}
                    onChange={e => setEditingMember({...editingMember!, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none disabled:bg-cream"
                    placeholder="user@orderofkpi.org"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Role</label>
                  <select
                    value={editingMember?.role || 'member'}
                    onChange={e => setEditingMember({...editingMember!, role: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
                  >
                    <option value="member">Member</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Administrator</option>
                    <option value="Membership Committee">Membership Committee Member</option>
                    <option value="Membership Committee Chair">Membership Committee Chair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Official Title</label>
                  <input
                    type="text"
                    value={editingMember?.title || ''}
                    onChange={e => setEditingMember({...editingMember!, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Grammateus / Administrator"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Intake Class</label>
                  <input
                    type="text"
                    value={editingMember?.intake_class || ''}
                    onChange={e => setEditingMember({...editingMember!, intake_class: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Charter / Fall '24"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Financial Status</label>
                  <select
                    value={editingMember?.financial_status || 'inactive'}
                    onChange={e => setEditingMember({...editingMember!, financial_status: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gold/10">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-6 py-3 border border-gold/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-ivy text-cream rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Member Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CANDIDATE ADD MODAL */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-gold/30 border p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-gold/10 pb-4">
              <h2 className="text-xl font-display font-bold text-ivy">Add New Candidate</h2>
              <button onClick={() => setShowCandidateModal(false)} className="text-ivy/40 hover:text-ivy">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="e.g. John Candidate"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="candidate@gmail.com"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="(555) 000-0000"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Initial Stage</label>
                <select
                  value={newCandidate.status}
                  onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
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

              <div className="flex gap-4 pt-4 border-t border-gold/10">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gold/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gold text-ivy rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
