import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  ChevronLeft,
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
  RefreshCw,
  LayoutList,
  Kanban,
  ArrowUpDown,
  Download,
  Eye,
  Lock,
  ChevronDown,
  ChevronUp
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
  const [hasError, setHasError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // View switch: 'list' is default for desktop
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All'); // 'All', '7days', '30days', '90days'
  const [isFilterOpenMobile, setIsFilterOpenMobile] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'stage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add Candidate Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete Candidate Confirmation Modal
  const [candidateToRemoveModal, setCandidateToRemoveModal] = useState<{ id: string; name: string } | null>(null);

  // Collapsed stages state for Board view (collapse empty stages by default)
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({
    'Inquiry': true,
    'Applied': true,
    'Tea Time': true,
    'Interview': true,
  });

  const toggleStageCollapse = (stage: string) => {
    setCollapsedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

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
    fetchCandidates();
    fetchApplications();

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

    const rosterMatch = prospectiveMembers.find(p => p.email.toLowerCase().trim() === normEmail);
    if (rosterMatch && rosterMatch.name && rosterMatch.name.trim()) {
      return rosterMatch.name.trim();
    }

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
    setLoading(true);
    setHasError(false);
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
      setHasError(true);
    } finally {
      setLoading(false);
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

  const confirmRemoveCandidate = async () => {
    if (!candidateToRemoveModal) return;
    const { id, name } = candidateToRemoveModal;

    const targetCand = candidates.find(c => c.id === id || c.email?.toLowerCase().trim() === id.toLowerCase().trim());
    const targetEmail = targetCand?.email;

    setCandidates(prev => prev.filter(c => c.id !== id && c.email?.toLowerCase().trim() !== id.toLowerCase().trim()));
    if (targetEmail) {
      setApplications(prev => prev.filter(app => app.email?.toLowerCase().trim() !== targetEmail.toLowerCase().trim()));
    }
    setCandidateToRemoveModal(null);

    try {
      if (targetEmail) {
        try {
          const { deleteApplication } = await import('../lib/memberDb');
          await deleteApplication(targetEmail);
        } catch (fsErr) {
          console.warn('Error deleting application from Firestore:', fsErr);
        }
      }

      const res = await fetch(`/api/candidates?id=${encodeURIComponent(id)}&chairEmail=${encodeURIComponent(currentUserEmail)}`, {
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

    setCandidates(prev => prev.map(c => c.id === id ? { ...c, name: candName, status: newStatus } : c));

    try {
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
      
      const response = await fetch(`/api/candidates?id=${encodeURIComponent(id)}`, {
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

  // Filter and Sort Candidates
  const filteredCandidates = useMemo(() => {
    return mergedCandidates.filter(c => {
      // Search
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Stage Filter
      if (stageFilter !== 'All' && c.status !== stageFilter) {
        return false;
      }

      // Application Status Filter
      const matchingApp = applications.find(a => a.email.toLowerCase() === c.email.toLowerCase());
      const appStatus = matchingApp ? (matchingApp.status || 'submitted') : 'not_started';
      if (statusFilter === 'Submitted' && appStatus !== 'submitted') return false;
      if (statusFilter === 'Draft' && appStatus !== 'draft') return false;
      if (statusFilter === 'Not Started' && appStatus !== 'not_started') return false;

      // Date Filter
      if (dateFilter !== 'All' && c.application_date) {
        const appDate = new Date(c.application_date).getTime();
        const now = Date.now();
        const daysDiff = (now - appDate) / (1000 * 3600 * 24);
        if (dateFilter === '7days' && daysDiff > 7) return false;
        if (dateFilter === '30days' && daysDiff > 30) return false;
        if (dateFilter === '90days' && daysDiff > 90) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'date') {
        const dateA = a.application_date ? new Date(a.application_date).getTime() : 0;
        const dateB = b.application_date ? new Date(b.application_date).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'stage') {
        const indexA = STAGES.indexOf(a.status);
        const indexB = STAGES.indexOf(b.status);
        return sortOrder === 'asc' ? indexA - indexB : indexB - indexA;
      }
      return 0;
    });
  }, [mergedCandidates, searchQuery, stageFilter, statusFilter, dateFilter, sortBy, sortOrder, applications]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stageFilter, statusFilter, dateFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCandidates.slice(start, start + pageSize);
  }, [filteredCandidates, currentPage, pageSize]);

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

  const maskEmail = (email: string) => {
    if (isChairOrAdmin) return email;
    if (!email || !email.includes('@')) return '*****@*****';
    const [user, domain] = email.split('@');
    return `${user.substring(0, 2)}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (isChairOrAdmin) return phone || 'N/A';
    if (!phone) return 'N/A';
    return `(***) ***-${phone.slice(-4)}`;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStageFilter('All');
    setStatusFilter('All');
    setDateFilter('All');
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <div className="min-h-screen bg-cream pb-12 w-full overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-ivy py-10 px-4 mb-8 w-full border-b border-gold/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/15 border border-gold/30 rounded-full mb-3">
              <ShieldCheck size={13} className="text-gold" />
              <span className="text-[10px] font-bold text-cream uppercase tracking-widest">
                FY27 Membership Intake Portal
              </span>
            </div>
            <h1 className="text-3xl font-display text-cream mb-1 break-words">Candidate Tracker</h1>
            <p className="text-cream/70 font-body text-sm max-w-xl">
              Monitor candidate progression, application statuses, and committee intake stages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-gold/20 hover:bg-gold/30 border border-gold/40 text-cream px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer text-xs justify-center whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-gold' : ''}`} />
              Update Portal Data
            </button>

            {canAddCandidate && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gold text-ivy px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-md text-xs justify-center whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add Candidate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 min-w-0 space-y-6">
        {/* Stage Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const cfg = getStatusBadgeConfig(stage);
            const count = mergedCandidates.filter(c => c.status === stage).length;
            const isSelected = stageFilter === stage;

            return (
              <button 
                key={stage}
                type="button"
                onClick={() => setStageFilter(stageFilter === stage ? 'All' : stage)}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer text-left ${
                  isSelected 
                    ? 'ring-2 ring-gold border-gold bg-gold/10 shadow-md' 
                    : `${cfg.bg} hover:border-gold/50 shadow-xs`
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{stage}</span>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
                <span className="text-2xl font-display font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Filter Bar & View Toggle Controls */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gold/20 shadow-soft space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cream/30 border border-ivy/10 rounded-xl focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none transition-all text-sm font-body"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ivy/40 hover:text-ivy p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop Filters & Controls */}
            <div className="hidden md:flex flex-wrap items-center gap-3">
              {/* Stage Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ivy/50 uppercase tracking-wider">Stage:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-2 bg-cream/40 border border-ivy/15 rounded-xl text-xs font-semibold text-ivy outline-none cursor-pointer focus:border-gold"
                >
                  <option value="All">All Stages</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ivy/50 uppercase tracking-wider">App Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-cream/40 border border-ivy/15 rounded-xl text-xs font-semibold text-ivy outline-none cursor-pointer focus:border-gold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ivy/50 uppercase tracking-wider">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 bg-cream/40 border border-ivy/15 rounded-xl text-xs font-semibold text-ivy outline-none cursor-pointer focus:border-gold"
                >
                  <option value="All">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>

              {/* Sorting Control */}
              <div className="flex items-center gap-1.5 border-l border-gold/20 pl-3">
                <span className="text-xs font-bold text-ivy/50 uppercase tracking-wider">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-cream/40 border border-ivy/15 rounded-xl text-xs font-semibold text-ivy outline-none cursor-pointer focus:border-gold"
                >
                  <option value="name">Candidate Name</option>
                  <option value="date">Application Date</option>
                  <option value="stage">Current Stage</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-xl bg-cream/40 hover:bg-gold/10 border border-ivy/15 text-ivy/70 hover:text-ivy transition-all cursor-pointer"
                  title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-cream/60 p-1 rounded-xl border border-gold/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-ivy text-cream shadow-xs' 
                      : 'text-ivy/60 hover:text-ivy'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'board' 
                      ? 'bg-ivy text-cream shadow-xs' 
                      : 'text-ivy/60 hover:text-ivy'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  Board
                </button>
              </div>
            </div>

            {/* Mobile Filter Toggle & View Switcher */}
            <div className="flex md:hidden items-center justify-between gap-2 border-t border-gold/10 pt-3">
              <button
                type="button"
                onClick={() => setIsFilterOpenMobile(!isFilterOpenMobile)}
                className="flex items-center gap-2 px-3.5 py-2 bg-cream/50 border border-ivy/15 rounded-xl text-xs font-bold text-ivy"
              >
                <Filter className="w-3.5 h-3.5 text-gold" />
                Filters & Sorting
                {isFilterOpenMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center bg-cream/60 p-1 rounded-xl border border-gold/20">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-ivy text-cream' : 'text-ivy/60'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'board' ? 'bg-ivy text-cream' : 'text-ivy/60'
                  }`}
                >
                  <Kanban className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Collapsible Filters */}
          {isFilterOpenMobile && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              className="md:hidden pt-3 border-t border-gold/10 grid grid-cols-2 gap-3"
            >
              <div>
                <label className="block text-[10px] font-bold text-ivy/50 uppercase mb-1">Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-cream/40 border border-ivy/15 rounded-lg text-xs font-semibold text-ivy"
                >
                  <option value="All">All Stages</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ivy/50 uppercase mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-cream/40 border border-ivy/15 rounded-lg text-xs font-semibold text-ivy"
                >
                  <option value="All">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ivy/50 uppercase mb-1">Date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-cream/40 border border-ivy/15 rounded-lg text-xs font-semibold text-ivy"
                >
                  <option value="All">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ivy/50 uppercase mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-cream/40 border border-ivy/15 rounded-lg text-xs font-semibold text-ivy"
                >
                  <option value="name">Candidate Name</option>
                  <option value="date">Application Date</option>
                  <option value="stage">Current Stage</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-gold/20 shadow-soft space-y-4">
            <div className="flex items-center justify-center gap-3 py-12 text-ivy/60">
              <RefreshCw className="w-6 h-6 animate-spin text-gold" />
              <span className="font-bold text-sm font-mono">Loading candidates and applications...</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-cream/40 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : hasError ? (
          /* FAILURE / ERROR STATE */
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-soft text-center space-y-4">
            <AlertCircle className="w-10 h-10 mx-auto text-red-600" />
            <div>
              <h3 className="font-display font-bold text-lg text-ivy">Unable to Load Candidate Records</h3>
              <p className="text-xs text-ivy/60 max-w-md mx-auto mt-1">
                A server connection issue occurred while fetching the intake candidate list. Please verify your connection or click retry.
              </p>
            </div>
            <button
              onClick={fetchCandidates}
              className="px-5 py-2.5 bg-ivy text-cream font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-ivy/90 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-gold" />
              Retry Connection
            </button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white p-12 rounded-2xl border border-gold/20 shadow-soft text-center space-y-4">
            <Users className="w-12 h-12 mx-auto text-gold/40" />
            <div>
              <h3 className="font-display font-bold text-lg text-ivy">No Candidates Match Your Filters</h3>
              <p className="text-xs text-ivy/60 max-w-md mx-auto mt-1">
                There are currently no candidates matching the active search query or selected stage/status filters.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-gold/15 border border-gold/30 text-ivy font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gold/25 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* DESKTOP & MOBILE COMPACT LIST / TABLE VIEW */
          <div className="bg-white rounded-2xl border border-gold/20 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream/60 border-b border-gold/20 text-[11px] font-bold uppercase tracking-wider text-ivy/70">
                    <th className="py-3.5 px-4 md:px-6">Candidate Name</th>
                    <th className="py-3.5 px-4">Current Stage</th>
                    <th className="py-3.5 px-4">App Status</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Primary Action</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10 text-xs">
                  {paginatedCandidates.map((candidate) => {
                    const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                    const isSubmitted = matchingApp && (matchingApp.status === 'submitted' || !!matchingApp.submitted_at);
                    const isDraft = matchingApp && matchingApp.status === 'draft';
                    const stageCfg = getStatusBadgeConfig(candidate.status || 'Inquiry');
                    const StageIcon = stageCfg.icon;

                    return (
                      <tr key={candidate.id} className="hover:bg-cream/20 transition-colors group">
                        {/* Name */}
                        <td className="py-4 px-4 md:px-6 font-bold text-ivy">
                          {isSubmitted ? (
                            <button
                              onClick={() => setSelectedApplicationForView(matchingApp)}
                              className="font-display text-sm text-gold hover:text-ivy underline text-left cursor-pointer transition-colors"
                            >
                              {candidate.name}
                            </button>
                          ) : (
                            <span className="font-display text-sm text-ivy">{candidate.name}</span>
                          )}
                        </td>

                        {/* Stage */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${stageCfg.bg}`}>
                            <StageIcon className="w-3 h-3" />
                            {stageCfg.label}
                          </span>
                        </td>

                        {/* App Status */}
                        <td className="py-4 px-4">
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-800 border border-green-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Submitted
                            </span>
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <Clock className="w-3 h-3 text-amber-500" /> Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3 text-gray-400" /> Not Started
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-ivy/70 font-mono">
                          {candidate.application_date || 'N/A'}
                        </td>

                        {/* Contact Info */}
                        <td className="py-4 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-ivy/70 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-gold/70" />
                            <span>{maskEmail(candidate.email)}</span>
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center gap-1.5 text-ivy/60 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-gold/70" />
                              <span>{maskPhone(candidate.phone)}</span>
                            </div>
                          )}
                        </td>

                        {/* Primary Action */}
                        <td className="py-4 px-4">
                          {isSubmitted ? (
                            <button
                              onClick={() => setSelectedApplicationForView(matchingApp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ivy text-cream hover:bg-ivy/90 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-gold/30 shadow-xs"
                            >
                              <Eye className="w-3 h-3 text-gold" />
                              Review Application
                            </button>
                          ) : (
                            <span className="text-ivy/40 text-[10px] font-bold uppercase tracking-wider">
                              Awaiting Application
                            </span>
                          )}
                        </td>

                        {/* Secondary Action Menu */}
                        <td className="py-4 px-4 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuCandidateId(openMenuCandidateId === candidate.id ? null : candidate.id);
                              }}
                              className="p-1.5 text-ivy/50 hover:text-ivy rounded-lg hover:bg-gold/10 transition-colors cursor-pointer"
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
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gold/30 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden text-left">
                                  {isSubmitted && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateApplicationPDF(matchingApp.data, candidate.email);
                                        setOpenMenuCandidateId(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-ivy hover:bg-gold/10 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                      <Download className="w-3.5 h-3.5 text-gold" />
                                      Download PDF
                                    </button>
                                  )}

                                  {canMoveCandidateStatus && (
                                    <>
                                      <div className="px-3.5 py-1.5 border-t border-gold/10 text-[9px] font-bold uppercase tracking-widest text-ivy/50">
                                        Update Stage Status
                                      </div>
                                      {STAGES.filter(s => s !== candidate.status).map(s => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCandidateStatus(candidate.id, s);
                                            setOpenMenuCandidateId(null);
                                          }}
                                          className="w-full px-3.5 py-1.5 text-xs text-ivy hover:bg-gold/10 transition-colors flex items-center gap-2 cursor-pointer"
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
                                        className="w-full px-3.5 py-2 text-xs text-amber-800 hover:bg-amber-50 transition-colors flex items-center gap-2 border-t border-gold/10 cursor-pointer"
                                      >
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        Mark as Rejected
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCandidateToRemoveModal({ id: candidate.id, name: candidate.name });
                                          setOpenMenuCandidateId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-red-700 hover:bg-red-50 font-bold transition-colors border-t border-gold/10 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        Remove Candidate
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-cream/40 border-t border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body">
              <div className="text-ivy/60">
                Showing <span className="font-bold text-ivy">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-bold text-ivy">{Math.min(currentPage * pageSize, filteredCandidates.length)}</span> of{' '}
                <span className="font-bold text-ivy">{filteredCandidates.length}</span> candidates
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-ivy/15 bg-white text-ivy disabled:opacity-40 hover:bg-gold/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-ivy bg-white border border-ivy/15 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-ivy/15 bg-white text-ivy disabled:opacity-40 hover:bg-gold/10 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* OPTIONAL BOARD VIEW (KANBAN) */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-ivy/60">
              <span className="font-bold uppercase tracking-wider">Stage Pipeline Board</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollapsedStages({ 'Inquiry': true, 'Applied': true, 'Tea Time': true, 'Interview': true })}
                  className="px-2.5 py-1 bg-white hover:bg-gold/10 text-ivy rounded-lg border border-gold/20 font-bold uppercase tracking-wider text-[10px]"
                >
                  Collapse Inactive
                </button>
                <button
                  type="button"
                  onClick={() => setCollapsedStages({})}
                  className="px-2.5 py-1 bg-white hover:bg-gold/10 text-ivy rounded-lg border border-gold/20 font-bold uppercase tracking-wider text-[10px]"
                >
                  Expand All
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 scroll-smooth touch-pan-x items-start w-full max-w-full scrollbar-thin">
              {STAGES.map(stage => {
                const stageCfg = getStatusBadgeConfig(stage);
                const count = filteredCandidates.filter(c => c.status === stage).length;
                const isCollapsed = !!collapsedStages[stage];

                if (isCollapsed) {
                  return (
                    <div 
                      key={stage}
                      onClick={() => toggleStageCollapse(stage)}
                      className="w-16 min-w-[64px] flex-shrink-0 flex flex-col items-center justify-between bg-white rounded-2xl border border-gold/20 p-3 hover:bg-gold/10 cursor-pointer transition-all shadow-xs min-h-[420px]"
                      title={`Click to expand ${stage}`}
                    >
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <span className={`w-3 h-3 rounded-full ${stageCfg.dot}`} />
                        <span className="bg-ivy/10 text-ivy px-2 py-0.5 rounded-full text-xs font-bold">
                          {count}
                        </span>
                      </div>
                      <div className="[writing-mode:vertical-lr] rotate-180 font-bold uppercase tracking-widest text-ivy text-xs py-4 text-center">
                        {stage}
                      </div>
                      <div className="text-[10px] text-ivy/50 font-bold">
                        Expand ➔
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={stage} className="w-[85vw] max-w-[320px] sm:w-[300px] flex-shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white rounded-xl border border-gold/20 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stageCfg.dot}`} />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-ivy">{stage}</h2>
                        <span className="bg-ivy/10 text-ivy px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {count}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleStageCollapse(stage)}
                        className="text-ivy/40 hover:text-ivy text-[10px] font-bold uppercase cursor-pointer"
                      >
                        Collapse ✕
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[400px]">
                      {filteredCandidates.filter(c => c.status === stage).map(candidate => {
                        const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                        const isSubmitted = matchingApp && (matchingApp.status === 'submitted' || !!matchingApp.submitted_at);

                        return (
                          <div
                            key={candidate.id}
                            className="bg-white p-4 rounded-xl border border-gold/20 shadow-xs hover:border-gold transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              {isSubmitted ? (
                                <button
                                  onClick={() => setSelectedApplicationForView(matchingApp)}
                                  className="font-display text-base text-gold hover:text-ivy underline text-left cursor-pointer transition-colors"
                                >
                                  {candidate.name}
                                </button>
                              ) : (
                                <h3 className="font-display text-base text-ivy">{candidate.name}</h3>
                              )}
                            </div>

                            <div className="space-y-1.5 text-xs text-ivy/70 mb-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gold" />
                                <span className="truncate">{maskEmail(candidate.email)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-gold" />
                                <span>{candidate.application_date || 'N/A'}</span>
                              </div>
                            </div>

                            {isSubmitted && (
                              <button
                                onClick={() => setSelectedApplicationForView(matchingApp)}
                                className="w-full py-1.5 bg-ivy text-cream text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-ivy/90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-gold" /> Review App
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE CANDIDATE REMOVAL */}
      {candidateToRemoveModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-md w-full p-6 rounded-2xl border border-gold/30 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-600 border-b border-gold/10 pb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-bold text-lg text-ivy">Confirm Candidate Removal</h3>
            </div>
            <p className="text-xs text-ivy/80 font-body leading-relaxed">
              Are you sure you want to permanently remove candidate <strong className="text-ivy">{candidateToRemoveModal.name}</strong> from the FY27 intake tracker?
            </p>
            <p className="text-[11px] text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
              This action will remove their intake candidate status and clear associated local application tracking entries.
            </p>

            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setCandidateToRemoveModal(null)}
                className="px-4 py-2 border border-ivy/20 text-ivy rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-cream transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveCandidate}
                className="px-4 py-2 bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-800 transition-colors shadow-xs cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-gold/30 border p-8 my-auto max-h-[90vh] overflow-y-auto"
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
                    className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none text-sm"
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
                    className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none text-sm"
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
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none text-sm"
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
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none text-sm"
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
                  className="px-6 py-2.5 border border-ivy/10 rounded-xl font-bold uppercase tracking-widest text-ivy hover:bg-cream transition-all text-xs disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-ivy text-cream rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
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
                className="text-cream/60 hover:text-cream transition-colors p-2 hover:bg-white/5 rounded-full cursor-pointer"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  </div>
                </div>
              </div>
            </div>

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
