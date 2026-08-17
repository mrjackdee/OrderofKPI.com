import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  X,
  ShieldCheck,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Candidate } from '../types';
import { fetchAllApplications, prospectiveMembers, syncApplicationsFromFirestore } from '../lib/memberDb';
import { firebaseUpdateCandidateStatus, firebaseFetchAllCandidates } from '../lib/firebase';
import { generateApplicationPDF } from '../utils/pdfGenerator';
import { logPortalSectionAccess } from '../lib/auditLogger';

const STAGES: Candidate['status'][] = ['Inquiry', 'Applied', 'Tea Time', 'Interview', 'Selection', 'Intake'];

export default function CandidateTracker() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationForView, setSelectedApplicationForView] = useState<any | null>(null);
  const [openMenuCandidateId, setOpenMenuCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await syncApplicationsFromFirestore();
    } catch (e) {
      console.warn('Sync from Firestore skipped or failed:', e);
    }
    await Promise.all([
      fetchCandidates(),
      fetchApplications()
    ]);
    setIsSyncing(false);
  };

  useEffect(() => {
    logPortalSectionAccess('Candidate Tracker');
    // Fetch local server candidates and applications immediately for instant UI load
    fetchCandidates();
    fetchApplications();

    // Perform Firestore sync in background without delaying initial render
    const bgSync = async () => {
      try {
        const syncRes = await syncApplicationsFromFirestore();
        if (syncRes && syncRes.success) {
          fetchCandidates();
          fetchApplications();
        }
      } catch (e) {
        console.warn('Sync from Firestore skipped or failed:', e);
      }
    };
    bgSync();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetchAllApplications();
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const resolveCandidateName = (email: string, currentName?: string, appData?: any): string => {
    const normEmail = (email || '').toLowerCase().trim();
    if (!normEmail) return currentName || '';

    // 1. Check prospectiveMembers roster map
    const rosterMatch = prospectiveMembers.find(p => p.email.toLowerCase().trim() === normEmail);
    if (rosterMatch && rosterMatch.name && rosterMatch.name.trim()) {
      return rosterMatch.name.trim();
    }

    // 2. Check application data
    if (appData) {
      const dataObj = appData.data || appData;
      const fn = dataObj.firstName || dataObj.first_name || dataObj.personalInformation?.firstName || appData.firstName;
      const ln = dataObj.lastName || dataObj.last_name || dataObj.personalInformation?.lastName || appData.lastName;
      if (fn || ln) {
        const full = `${fn || ''} ${ln || ''}`.trim();
        if (full && !full.includes('@') && full.toLowerCase() !== normEmail.split('@')[0].toLowerCase()) {
          return full;
        }
      }
    }

    // 3. If currentName is provided and is a valid real name (not email, not email prefix like 'averyt16')
    const emailPrefix = normEmail.split('@')[0].toLowerCase();
    if (currentName && currentName.trim()) {
      const trimmed = currentName.trim();
      if (!trimmed.includes('@') && trimmed.toLowerCase() !== emailPrefix) {
        return trimmed;
      }
    }

    if (currentName && !currentName.includes('@')) {
      return currentName;
    }
    return emailPrefix;
  };

  const fetchCandidates = async () => {
    try {
      const apiFetch = fetch('/api/candidates')
        .then(res => res.json())
        .catch(() => ({ success: false, candidates: [] }));
      const fbFetch = firebaseFetchAllCandidates()
        .catch(() => ({ success: false, candidates: [] }));

      const [data, fbData] = await Promise.all([apiFetch, fbFetch]);

      const apiCandidates: Candidate[] = (data && data.success && Array.isArray(data.candidates)) ? data.candidates : [];
      const fbCandidates: Candidate[] = (fbData && fbData.success && Array.isArray(fbData.candidates)) ? fbData.candidates : [];

      const candMap = new Map<string, Candidate>();
      apiCandidates.forEach(c => {
        const e = (c.email || '').toLowerCase().trim();
        if (e) {
          const resolvedName = resolveCandidateName(e, c.name);
          candMap.set(e, { ...c, name: resolvedName });
        }
      });

      fbCandidates.forEach(c => {
        const e = (c.email || '').toLowerCase().trim();
        if (!e) return;
        const resolvedName = resolveCandidateName(e, c.name);
        if (!candMap.has(e)) {
          candMap.set(e, {
            id: c.id || 'cand_' + e.replace(/[^a-z0-9]/g, '_'),
            name: resolvedName,
            email: e,
            phone: c.phone || '',
            status: (c.status || 'Applied') as Candidate['status'],
            application_date: c.application_date || (c as any).appliedDate || (c as any).applicationDate || '',
            scores: c.scores || {},
            notes: c.notes || '',
            document_vault: c.document_vault || []
          });
        } else {
          const existing = candMap.get(e)!;
          if (c.status) {
            existing.status = c.status as Candidate['status'];
          }
          if (resolvedName && resolvedName !== e.split('@')[0]) {
            existing.name = resolvedName;
          }
          if (c.phone) existing.phone = c.phone;
          if (c.scores && Object.keys(c.scores).length > 0) existing.scores = c.scores;
          if (c.notes) existing.notes = c.notes;
          if (c.document_vault && c.document_vault.length > 0) existing.document_vault = c.document_vault;
        }
      });

      setCandidates(Array.from(candMap.values()));
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email) {
      setFormError('First Name, Last Name, and Email Address are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const fullName = `${newCandidate.firstName.trim()} ${newCandidate.lastName.trim()}`;

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newCandidate.firstName.trim(),
          lastName: newCandidate.lastName.trim(),
          name: fullName,
          email: newCandidate.email.trim(),
          phone: newCandidate.phone.trim(),
          adminEmail: currentUserEmail
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFormSuccess(`Candidate ${fullName} added with applicant account successfully!`);
        setTimeout(() => {
          setShowAddModal(false);
          setNewCandidate({ firstName: '', lastName: '', email: '', phone: '' });
          setFormError(null);
          setFormSuccess(null);
          fetchCandidates();
        }, 800);
      } else {
        setFormError(data.message || 'Unable to create candidate record. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      setFormError('Server error while creating candidate record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUserEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = currentUserEmail.toLowerCase().trim();
  const isChairOrAdmin = 
    userRole === 'admin' || 
    userRole === 'Membership Committee Chair' || 
    normEmail === 'james.haywood@orderofkpi.org' || 
    normEmail === 'admin@orderofkpi.org' || 
    normEmail === 'info@kpi2012.org';

  const canAddCandidate = isChairOrAdmin;
  const canMoveCandidateStatus = isChairOrAdmin;

  const handleRemoveCandidate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove candidate "${name}" from the tracker?`)) return;

    // Find candidate email for cleanup
    const targetCand = candidates.find(c => c.id === id || c.email?.toLowerCase().trim() === id.toLowerCase().trim());
    const targetEmail = targetCand?.email;

    // Optimistically remove from state so the UI updates immediately
    setCandidates(prev => prev.filter(c => c.id !== id && c.email?.toLowerCase().trim() !== id.toLowerCase().trim()));
    if (targetEmail) {
      setApplications(prev => prev.filter(app => app.email?.toLowerCase().trim() !== targetEmail.toLowerCase().trim()));
    }

    try {
      // 1. Delete application from Firestore if email is available
      if (targetEmail) {
        try {
          const { deleteApplication } = await import('../lib/memberDb');
          await deleteApplication(targetEmail);
        } catch (fsErr) {
          console.warn('Error deleting application from Firestore:', fsErr);
        }
      }

      // 2. Delete candidate and local application records from the backend
      const res = await fetch(`/api/candidates/${encodeURIComponent(id)}?chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCandidates();
      } else {
        console.error('Failed to remove candidate:', data.message);
        fetchCandidates();
      }
    } catch (err) {
      console.error('Error removing candidate:', err);
      fetchCandidates();
    }
  };

  const mergedCandidates = useMemo(() => {
    const submittedAppsMap = new Map<string, any>();
    applications.forEach(app => {
      const appStatus = (app?.status || app?.data?.status || '').toString().toLowerCase().trim();
      const isSubmitted = appStatus === 'submitted' || !!app?.submitted_at || !!app?.submittedAt;
      if (app && isSubmitted) {
        const appEmail = (app.email || app.data?.email || '').toLowerCase().trim();
        if (appEmail) submittedAppsMap.set(appEmail, app);
      }
    });

    const seenEmails = new Set<string>();
    const updated = candidates.map(c => {
      const normEmail = (c.email || '').toLowerCase().trim();
      if (normEmail) seenEmails.add(normEmail);
      const app = submittedAppsMap.get(normEmail);
      const resolvedName = resolveCandidateName(normEmail, c.name, app);
      if (normEmail && submittedAppsMap.has(normEmail)) {
        const appPhone = app?.data?.phone || app?.phone || c.phone || '';
        const rawDate = app?.submitted_at || app?.submittedAt || app?.last_saved_at || app?.lastSavedAt || '';
        const appDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
        return {
          ...c,
          name: resolvedName,
          status: (c.status === 'Inquiry' ? 'Applied' : c.status) as Candidate['status'],
          phone: appPhone || c.phone,
          application_date: c.application_date || appDate || ''
        };
      }
      return {
        ...c,
        name: resolvedName
      };
    });

    // Synthesize missing candidates from submitted applications
    submittedAppsMap.forEach((app, normEmail) => {
      if (!seenEmails.has(normEmail)) {
        const resolvedName = resolveCandidateName(normEmail, undefined, app);
        const appPhone = app.data?.phone || app.phone || '';
        const rawDate = app.submitted_at || app.submittedAt || app.last_saved_at || app.lastSavedAt || new Date().toISOString();
        const appDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '';
        
        updated.push({
          id: 'cand_' + normEmail.replace(/[^a-z0-9]/g, '_'),
          name: resolvedName,
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

    return updated.filter(c => {
      const e = (c.email || '').toLowerCase().trim();
      return e !== 'jackdee.sync@gmail.com' && e !== 'candidate@gmail.com' && e !== 'dennis@gmail.com';
    });
  }, [candidates, applications]);

  const updateCandidateStatus = async (id: string, newStatus: Candidate['status']) => {
    const candidate = mergedCandidates.find(c => c.id === id);
    if (!candidate) return;

    const candName = candidate.name || resolveCandidateName(candidate.email);

    // Optimistically update candidate status
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, name: candName, status: newStatus } : c));

    try {
      // Async persist to Firebase
      if (candidate.email) {
        await firebaseUpdateCandidateStatus(
          candidate.email, 
          newStatus, 
          candidate.scores, 
          candidate.notes, 
          candidate.document_vault,
          candName,
          candidate.phone
        );
      }
      
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...candidate, 
          name: candName, 
          status: newStatus, 
          reviewerEmail: currentUserEmail 
        }),
      });
      if (response.ok) {
        fetchCandidates();
      } else {
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
      fetchCandidates();
    }
  };

  const filteredCandidates = mergedCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'Inquiry':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Inquiry',
          icon: Users
        };
      case 'Applied':
      case 'Review':
      case 'Under Review':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: status === 'Applied' ? 'Applied' : status,
          icon: FileText
        };
      case 'Tea Time':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Tea Time',
          icon: Clock
        };
      case 'Interview':
        return {
          bg: 'bg-cyan-50 text-cyan-900 border-cyan-300',
          dot: 'bg-cyan-500',
          label: 'Interview',
          icon: Users
        };
      case 'Selection':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Selection',
          icon: CheckCircle2
        };
      case 'Intake':
      case 'Approved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: status === 'Approved' ? 'Approved' : 'Intake',
          icon: ShieldCheck
        };
      case 'Rejected':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          dot: 'bg-red-500',
          label: 'Rejected',
          icon: AlertCircle
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          dot: 'bg-slate-400',
          label: status || 'Inquiry',
          icon: Users
        };
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-12 w-full overflow-x-hidden">
      <div className="bg-ivy py-12 px-4 mb-8 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display text-cream mb-2 break-words">Candidate Tracker</h1>
            <p className="text-cream/70 font-body mb-2 break-words">Manage and monitor the FY27 Membership Intake Process.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-gold/20 hover:bg-gold/30 border border-gold/40 text-cream px-5 py-3 rounded-md font-bold uppercase tracking-widest transition-all cursor-pointer w-full md:w-auto justify-center whitespace-nowrap text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Update Portal Data
            </button>
            {canAddCandidate && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gold text-ivy px-6 py-3 rounded-md font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg w-full md:w-auto justify-center whitespace-nowrap"
              >
                <UserPlus className="w-5 h-5" />
                Add Candidate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 overflow-hidden">
        {/* Stage Summary / Color-Coded Status Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {STAGES.map(stage => {
            const cfg = getStatusBadgeConfig(stage);
            const count = mergedCandidates.filter(c => c.status === stage).length;
            return (
              <div 
                key={stage} 
                className={`p-3 rounded-xl border flex flex-col justify-between bg-white shadow-xs transition-all ${cfg.bg}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{stage}</span>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <span className="text-xl font-display font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-ivy/10 rounded-lg shadow-soft focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none transition-all text-sm"
          />
        </div>

        {/* Kanban Board */}
        <div className="sm:hidden text-center text-xs text-ivy/50 mb-4 flex items-center justify-center gap-1.5">
          <span>← Swipe horizontally to view process stages →</span>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 scroll-smooth touch-pan-x">
          {STAGES.map(stage => {
            const stageCfg = getStatusBadgeConfig(stage);
            return (
              <div key={stage} className="min-w-[320px] flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2 py-1.5 bg-white/60 backdrop-blur-xs rounded-xl border border-gold/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stageCfg.dot}`} />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-ivy">{stage}</h2>
                    <span className="bg-ivy/10 text-ivy px-2 py-0.5 rounded-full text-xs font-bold">
                      {filteredCandidates.filter(c => c.status === stage).length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 min-h-[400px]">
                  {filteredCandidates.filter(c => c.status === stage).map(candidate => {
                    const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                    const isSubmitted = matchingApp && matchingApp.status === 'submitted';
                    const isDraft = matchingApp && matchingApp.status === 'draft';
                    const statusCfg = getStatusBadgeConfig(candidate.status || 'Inquiry');
                    const StatusIcon = statusCfg.icon;

                    return (
                      <motion.div
                        key={candidate.id}
                        layoutId={candidate.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 rounded-xl border border-gold/20 shadow-soft hover:border-gold hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          {isSubmitted ? (
                            <button
                              onClick={() => setSelectedApplicationForView(matchingApp)}
                              className="font-display text-lg text-gold hover:text-ivy underline text-left cursor-pointer transition-colors"
                            >
                              {candidate.name}
                            </button>
                          ) : (
                            <h3 className="font-display text-lg text-ivy">{candidate.name}</h3>
                          )}
                          {canMoveCandidateStatus && (
                            <div className="relative">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuCandidateId(openMenuCandidateId === candidate.id ? null : candidate.id);
                                }}
                                className="text-ivy/40 hover:text-ivy transition-colors p-1.5 rounded-lg hover:bg-gold/10 cursor-pointer"
                                title="Change Candidate Status"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuCandidateId === candidate.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-20" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuCandidateId(null);
                                    }} 
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gold/30 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden">
                                    <div className="px-3.5 py-1.5 border-b border-gold/10 text-[10px] font-bold uppercase tracking-widest text-ivy/50">
                                      Move Candidate Status
                                    </div>
                                    {STAGES.filter(s => s !== stage).map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateCandidateStatus(candidate.id, s);
                                          setOpenMenuCandidateId(null);
                                        }}
                                        className="w-full text-left px-3.5 py-2 text-xs text-ivy hover:bg-gold/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                                      >
                                        <span className={`w-2 h-2 rounded-full ${getStatusBadgeConfig(s).dot}`} />
                                        Move to {s}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateCandidateStatus(candidate.id, 'Rejected');
                                        setOpenMenuCandidateId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-amber-800 hover:bg-amber-50 transition-colors flex items-center gap-2 border-t border-gold/10 cursor-pointer font-medium"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-red-500" />
                                      Mark as Rejected
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveCandidate(candidate.id, candidate.name);
                                        setOpenMenuCandidateId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-red-700 hover:bg-red-50 font-bold transition-colors border-t border-gold/10 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" /> Remove Candidate
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Color-Coded Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Candidate Pipeline Stage Badge */}
                          <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusCfg.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>

                          {/* Application Submission Status Badge */}
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200/60 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Submitted
                            </span>
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              <Clock className="w-3 h-3 text-amber-500" /> Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200/60 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3 text-gray-400" /> Not Started
                            </span>
                          )}
                        </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-ivy/60 text-xs">
                          <Mail className="w-3 h-3" />
                          <span>{candidate.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ivy/60 text-xs">
                          <Phone className="w-3 h-3" />
                          <span>{candidate.phone || matchingApp?.data?.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ivy/60 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {(() => {
                              const submittedDate = matchingApp?.submitted_at || (isSubmitted ? candidate.application_date : (candidate.status !== 'Inquiry' ? candidate.application_date : null));
                              if (submittedDate) {
                                return `Applied: ${new Date(submittedDate).toLocaleDateString()}`;
                              }
                              return 'Applied: Pending Submission';
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-4 border-t border-cream">
                        {matchingApp ? (
                          <button 
                            onClick={() => setSelectedApplicationForView(matchingApp)}
                            className="text-[10px] font-bold text-ivy hover:text-gold transition-colors flex items-center gap-1 bg-gold/10 hover:bg-gold/20 px-2.5 py-1.5 rounded-lg border border-gold/20"
                          >
                            <FileText className="w-3.5 h-3.5 text-gold" />
                            View Application
                          </button>
                        ) : (
                          <button className="text-[10px] font-bold text-ivy/30 cursor-not-allowed flex items-center gap-1" disabled>
                            No Application
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
                {filteredCandidates.filter(c => c.status === stage).length === 0 && (
                  <div className="border-2 border-dashed border-ivy/5 rounded-lg h-32 flex items-center justify-center">
                    <p className="text-ivy/20 text-xs font-bold uppercase tracking-widest">No candidates</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-lg shadow-2xl border-gold/30 border p-8"
          >
            <h2 className="text-2xl font-display text-ivy mb-6">Add New Candidate</h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">First Name *</label>
                  <input
                    required
                    type="text"
                    value={newCandidate.firstName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                    placeholder="First Name"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={newCandidate.lastName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                    placeholder="Last Name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                  placeholder="(555) 000-0000"
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-ivy/50 mt-1">Last 4 digits serve as initial password.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Email Address *</label>
                <input
                  required
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                  placeholder="candidate@example.com"
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-ivy/50 mt-1">Serves as email login username.</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-ivy/10 rounded-md font-bold uppercase tracking-widest text-ivy hover:bg-cream transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-ivy text-cream rounded-md font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Record</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Application Modal */}
      {selectedApplicationForView && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-cream w-full max-w-5xl rounded-2xl shadow-2xl border-gold/30 border overflow-hidden my-8 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-ivy p-6 md:p-8 flex justify-between items-center border-b border-gold/30">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-gold/15 border border-gold/30 rounded-full">
                  <ShieldCheck size={11} className="text-gold" />
                  <span className="text-[9px] font-bold text-cream uppercase tracking-widest">Membership Candidate Review</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display text-cream">
                  {selectedApplicationForView.data.firstName} <span className="text-gold">{selectedApplicationForView.data.lastName}</span>
                </h2>
                <p className="text-cream/60 text-xs font-body">Submitted: {selectedApplicationForView.submitted_at ? new Date(selectedApplicationForView.submitted_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <button 
                onClick={() => setSelectedApplicationForView(null)}
                className="text-cream/60 hover:text-cream transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white px-8 py-4 border-b border-gold/10 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ivy/60 uppercase tracking-wider">
                Status: 
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                  selectedApplicationForView.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedApplicationForView.status}
                </span>
              </div>
              <button
                onClick={() => generateApplicationPDF(selectedApplicationForView.data, selectedApplicationForView.email)}
                className="flex items-center gap-2 bg-gold text-ivy px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:brightness-110 active:scale-95 transition-all shadow cursor-pointer"
              >
                <FileText size={14} />
                Download Application PDF
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-8 space-y-8 overflow-y-auto font-body text-sm text-ivy/80">
              {/* Profile Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal & Employment Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Candidate Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">First Name</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.firstName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Last Name</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Date of Birth</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Phone Number</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Email Address</span>
                      <span className="font-semibold text-ivy break-all">{selectedApplicationForView.email}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Address</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.address}</span>
                    </div>
                  </div>
                </div>

                {/* Professional & Academic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Professional & Academic</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Place of Employment</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.employment || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Title / Position</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.position || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Degree(s) Conferred</span>
                      <span className="font-semibold text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.degrees || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Honors & Achievements</span>
                      <span className="font-semibold text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.honors || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Involvements & Disclosures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gold/10">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Community Involvement</h3>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ivy/40 block">Organization Involvement</span>
                    <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.organizations || 'None'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-ivy/40 block">Prior Knowledge of Kappa Pi</span>
                    <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.priorKnowledge || 'None'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Disclosures</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Other Organization Member?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.isFraternityMember}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Sorority AKA Family?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.hasAkaFamily}</span>
                    </div>
                    {selectedApplicationForView.data.isFraternityMember === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">Organization Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.fraternityDetails}</span>
                      </div>
                    )}
                    {selectedApplicationForView.data.hasAkaFamily === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">AKA Sorority Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.akaFamilyDetails}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Previously Applied?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.previousApplied}</span>
                    </div>
                    {selectedApplicationForView.data.previousApplied === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">Previous Application Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.previousAppliedDetails}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-4 border-t border-gold/10">
                <span className="text-[10px] uppercase font-bold text-ivy/40 block">Social Media & Websites</span>
                <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.socialUrls || 'None'}</span>
              </div>

              {/* Essay Questions Responses */}
              <div className="space-y-6 pt-6 border-t border-gold/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Written Essay Answers</h3>
                
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 1: Purpose of Kappa Pi</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay1 || 'Not provided'}</p>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 2: Community Role Model</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay2 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 3: Service Projects</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay3 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 4: Impact for Black and Brown Queer & Trans Communities</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay4 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 5: Talent Contributions</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay5 || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer buttons */}
            <div className="bg-white p-6 border-t border-gold/20 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedApplicationForView(null)}
                className="px-6 py-2.5 border border-ivy/20 rounded-xl font-semibold uppercase tracking-wider text-[11px] text-ivy hover:bg-cream transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
