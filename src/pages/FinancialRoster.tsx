import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  CalendarDays, 
  LayoutList,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  XCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Award,
  Briefcase,
  UserCheck,
  Edit3,
  Save,
  CheckCheck,
  Trash2
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { Member, STANDING_COMMITTEES, CommitteeSlug, CommitteeRole } from '../types';
import { syncApplicationsFromFirestore, normalizeUserRBAC } from '../lib/memberDb';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';
import { firebaseSyncPortalMember } from '../lib/firebase';
import { useSystemFeatures } from '../lib/settings';

export default function FinancialRoster() {
  const navigate = useNavigate();
  const { features } = useSystemFeatures();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName'>('firstName');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [selectedProfileMember, setSelectedProfileMember] = useState<Member | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingIndustry, setIsEditingIndustry] = useState(false);
  const [industryInput, setIndustryInput] = useState('');
  const [isSavingIndustry, setIsSavingIndustry] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUserEmail = (sessionStorage.getItem('userEmail') || '').toLowerCase().trim();
  const currentUserRole = (sessionStorage.getItem('userRole') || '').toLowerCase().trim();
  const isAdmin = currentUserRole === 'admin' || currentUserEmail === 'admin@orderofkpi.org' || currentUserEmail === 'qa.admin@orderofkpi.org' || currentUserEmail === 'info@kpi2012.org';

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role || role === 'applicant' || role === 'prospective') {
      navigate(role ? '/applicant-portal' : '/login', { replace: true });
      return;
    }
    syncApplicationsFromFirestore().catch(() => {}).finally(() => {
      fetchMembers();
    });
  }, [navigate]);

  const handleSaveIndustry = async () => {
    if (!selectedProfileMember) return;
    setIsSavingIndustry(true);
    const newIndustry = industryInput.trim();
    const targetEmail = selectedProfileMember.email.toLowerCase().trim();

    // Dual-write: 1) Cloud Firestore
    const firestoreTask = firebaseSyncPortalMember({
      email: targetEmail,
      name: selectedProfileMember.name || targetEmail,
      role: selectedProfileMember.role || 'member',
      title: selectedProfileMember.title || '',
      financial_status: selectedProfileMember.financial_status || 'active',
      industry: newIndustry,
      committees: selectedProfileMember.committees || [],
      committeeRoles: selectedProfileMember.committeeRoles || {}
    });

    // Dual-write: 2) Server API
    const apiTask = (async () => {
      try {
        const res = await fetch(`/api/members/${encodeURIComponent(targetEmail)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: newIndustry,
            adminEmail: currentUserEmail
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        }
        return { success: res.ok };
      } catch (e) {
        return { success: false, error: e };
      }
    })();

    const [fsRes, apiRes] = await Promise.allSettled([firestoreTask, apiTask]);

    const fsSuccess = fsRes.status === 'fulfilled' && (fsRes.value as any)?.success !== false;
    const apiSuccess = apiRes.status === 'fulfilled' && (apiRes.value as any)?.success;

    if (fsSuccess || apiSuccess) {
      setSelectedProfileMember(prev => prev ? { ...prev, industry: newIndustry } : null);
      setMembers(prev => prev.map(m => m.email.toLowerCase() === targetEmail ? { ...m, industry: newIndustry } : m));
      setIsEditingIndustry(false);
      setActionMessage({ type: 'success', text: `Industry/Profession for "${selectedProfileMember.name || targetEmail}" has been saved.` });
      setTimeout(() => setActionMessage(null), 5000);
    } else {
      setActionMessage({ type: 'error', text: 'We were unable to update Industry/Profession. Please verify connection and try again.' });
      setTimeout(() => setActionMessage(null), 5000);
    }
    setIsSavingIndustry(false);
  };

  // Admin states and handlers for absolute CRUD controls across the Member Portal
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editAdminForm, setEditAdminForm] = useState<{
    name: string;
    role: any;
    title: string;
    financial_status: any;
    industry: string;
    committees: string[];
    committeeRoles: Record<string, string>;
  }>({
    name: '',
    role: 'member',
    title: '',
    financial_status: 'inactive',
    industry: '',
    committees: [],
    committeeRoles: {}
  });
  const [savingAdmin, setSavingAdmin] = useState(false);

  const handleStartAdminEdit = (member: Member) => {
    const norm = normalizeUserRBAC(member);
    setEditAdminForm({
      name: member.name || '',
      role: member.role || 'member',
      title: member.title || '',
      financial_status: member.financial_status || 'inactive',
      industry: member.industry || '',
      committees: [...norm.committees],
      committeeRoles: { ...norm.committeeRoles }
    });
    setIsEditingAdmin(true);
  };

  const handleSaveAdminEdit = async () => {
    if (!selectedProfileMember) return;
    setSavingAdmin(true);
    const targetEmail = selectedProfileMember.email.toLowerCase().trim();

    const updatedCommittees = editAdminForm.committees as CommitteeSlug[];
    const updatedRoles = editAdminForm.committeeRoles as Record<string, CommitteeRole>;

    // Dual-write: 1) Cloud Firestore
    const firestoreTask = firebaseSyncPortalMember({
      email: targetEmail,
      name: editAdminForm.name || targetEmail,
      role: editAdminForm.role || 'member',
      title: editAdminForm.title || '',
      financial_status: editAdminForm.financial_status || 'active',
      industry: editAdminForm.industry || '',
      committees: updatedCommittees,
      committeeRoles: updatedRoles
    });

    // Dual-write: 2) Server API
    const apiTask = (async () => {
      try {
        const res = await fetch(`/api/members/${encodeURIComponent(targetEmail)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editAdminForm,
            adminEmail: currentUserEmail
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        }
        return { success: res.ok };
      } catch (e) {
        return { success: false, error: e };
      }
    })();

    const [fsRes, apiRes] = await Promise.allSettled([firestoreTask, apiTask]);

    const fsSuccess = fsRes.status === 'fulfilled' && (fsRes.value as any)?.success !== false;
    const apiSuccess = apiRes.status === 'fulfilled' && (apiRes.value as any)?.success;

    if (fsSuccess || apiSuccess) {
      const merged = {
        ...editAdminForm,
        committees: updatedCommittees,
        committeeRoles: updatedRoles
      };
      setSelectedProfileMember(prev => prev ? { ...prev, ...merged } : null);
      setMembers(prev => prev.map(m => m.email.toLowerCase() === targetEmail ? { ...m, ...merged } : m));
      setIsEditingAdmin(false);
      setActionMessage({ type: 'success', text: `Details for "${editAdminForm.name || targetEmail}" have been saved.` });
      setTimeout(() => setActionMessage(null), 5000);
    } else {
      setActionMessage({ type: 'error', text: 'Failed to update member profile in database. Please check connection and try again.' });
      setTimeout(() => setActionMessage(null), 5000);
    }
    setSavingAdmin(false);
  };

  const handleDeleteAdminMember = async () => {
    if (!selectedProfileMember) return;
    if (!window.confirm(`Are you sure you want to permanently delete member "${selectedProfileMember.name}" (${selectedProfileMember.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(selectedProfileMember.email)}?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.email.toLowerCase() !== selectedProfileMember.email.toLowerCase()));
        setSelectedProfileMember(null);
        setIsEditingAdmin(false);
      } else {
        alert(data.message || 'Failed to delete member');
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Error connecting to server');
    }
  };

  const isOfficer = (member: Member): boolean => {
    if (!member) return false;
    const role = (member.role || '').toLowerCase();
    const title = (member.title || '').toLowerCase();
    if (role === 'officer' || role === 'membership committee' || role === 'membership committee chair') {
      return true;
    }
    if (title && title !== 'administrator' && title !== 'member' && title !== 'candidate') {
      return true;
    }
    return false;
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Helper to check if a member is Admin or a Test Credential
      const isExcludedUser = (m: Partial<Member>): boolean => {
        const email = (m.email || '').toLowerCase().trim();
        const role = (m.role || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const isTest = m.is_test_credential === 1 || m.is_test_credential === true || email.startsWith('qa.') || email.startsWith('test.');
        const isAdmin = role === 'admin' || title === 'administrator' || email === 'admin@orderofkpi.org';
        const isApplicantOrCandidate = role === 'applicant' || role === 'prospective' || role === 'candidate' || title === 'candidate';
        return isTest || isAdmin || isApplicantOrCandidate || email === 'brandon.addison@orderofkpi.org';
      };

      // 1. Fetch directory members from backend API for metadata (role, title, profile_photo, industry)
      let dirMembers: Member[] = [];
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.success && Array.isArray(data.members)) {
          dirMembers = data.members.filter((m: Member) => !isExcludedUser(m));
        }
      } catch (err) {
        console.warn('Could not fetch backend directory members:', err);
      }

      // 2. Fetch live Google Sheet data
      const sheetData = await getLiveGoogleSheetRoster();
      const activeFinancialMembers: Member[] = [];

      for (const row of sheetData.members) {
        if ((row.fy26Paid || row.fy27Paid) && (row.firstName || row.lastName)) {
          const fullName = row.fullName;
          const email = row.kpiEmail;

          // Match with local directory member if exists
          const matchedDirMember = dirMembers.find(m => 
            m.email.toLowerCase() === email || 
            m.name.toLowerCase() === fullName.toLowerCase()
          );

          const memberObj: Member = {
            name: fullName,
            first_name: row.firstName,
            last_name: row.lastName,
            email: email,
            role: matchedDirMember?.role || 'member',
            title: matchedDirMember?.title || '',
            is_first_login: false,
            financial_status: 'active',
            profile_photo: matchedDirMember?.profile_photo || '',
            industry: matchedDirMember?.industry || '',
            committees: matchedDirMember?.committees || [],
            is_test_credential: matchedDirMember?.is_test_credential
          };

          if (!isExcludedUser(memberObj)) {
            activeFinancialMembers.push(memberObj);
          }
        }
      }

      // Also merge any active members from directory that might not be in the spreadsheet yet (e.g. newly provisioned active members)
      for (const dm of dirMembers) {
        if ((dm.financial_status || '').toLowerCase() === 'active') {
          const emailNorm = (dm.email || '').toLowerCase().trim();
          if (!isExcludedUser(dm) && !activeFinancialMembers.some(m => m.email.toLowerCase() === emailNorm)) {
            activeFinancialMembers.push(dm);
          }
        }
      }

      // Enforce strict syntax logic: Financial Status = "Active" and exclude Admin & Test users
      const finalRoster = activeFinancialMembers.filter(m => {
        const isFinActive = (m.financial_status || '').toLowerCase() === 'active';
        return !isExcludedUser(m) && isFinActive;
      });

      setMembers(finalRoster);
    } catch (err: any) {
      console.error('Error fetching financial members:', err);
      // Fallback to active financial members in API directory
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members.filter((m: Member) => {
            const email = (m.email || '').toLowerCase().trim();
            const role = (m.role || '').toLowerCase();
            const title = (m.title || '').toLowerCase();
            const isTest = m.is_test_credential === 1 || m.is_test_credential === true || email.startsWith('qa.') || email.startsWith('test.');
            const isAdmin = role === 'admin' || title === 'administrator' || email === 'admin@orderofkpi.org';
            const isApplicantOrCandidate = role === 'applicant' || role === 'prospective' || role === 'candidate' || title === 'candidate';
            return !isTest && !isAdmin && !isApplicantOrCandidate && email !== 'brandon.addison@orderofkpi.org' && (m.financial_status || '').toLowerCase() === 'active';
          }));
        }
      } catch (fallbackErr) {
        setError('Roster Data not yet available.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFirstName = (member: Member): string => {
    if (member.first_name) return member.first_name;
    const parts = member.name.trim().split(' ');
    return parts[0] || '';
  };

  const getLastName = (member: Member): string => {
    if (member.last_name) return member.last_name;
    const parts = member.name.trim().split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  const filteredRoster = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'firstName') {
      const firstA = getFirstName(a).toLowerCase();
      const firstB = getFirstName(b).toLowerCase();
      const comp = firstA.localeCompare(firstB);
      if (comp !== 0) return comp;
      return getLastName(a).toLowerCase().localeCompare(getLastName(b).toLowerCase());
    } else {
      const lastA = getLastName(a).toLowerCase();
      const lastB = getLastName(b).toLowerCase();
      const comp = lastA.localeCompare(lastB);
      if (comp !== 0) return comp;
      return getFirstName(a).toLowerCase().localeCompare(getFirstName(b).toLowerCase());
    }
  });

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-20 relative overflow-x-clip">
      {/* Draft Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
        <h1 className="text-[15rem] md:text-[25rem] font-black uppercase text-[#1E3F20] -rotate-45 select-none whitespace-nowrap">
          Official
        </h1>
      </div>

      <div className="relative z-10">
        <div className="pt-24">
          <MemberHeader />
        </div>

        <div className="pt-8 px-4 md:px-12 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <Link to="/intake-calendar" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <CalendarDays size={14} /> Intake Calendar
            </Link>
            <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
              <Users size={14} /> Membership Dues & Status
            </div>
            <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <Users size={14} /> Member Directory
            </Link>
          </div>
        </div>

      <div className="pt-8 pb-8 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-[#B8860B]" />
            <ShieldCheck className="text-[#1E3F20]" size={24} />
            <div className="h-px w-16 bg-[#B8860B]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display text-[#1E3F20] tracking-wider uppercase text-center max-w-4xl">
            Membership Dues & Status
          </h1>
          <p className="text-[#1E3F20]/70 text-xs md:text-sm mt-2 max-w-xl font-medium">
            Active financial members in good standing. Click any member name to view their profile.
          </p>
        </motion.div>
      </div>

      {/* Controls Bar: Search, Sort, View Toggle */}
      <div className="w-full max-w-5xl mx-auto mb-8 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={16} className="text-[#1E3F20]/60" />
          </div>
          <input
            type="text"
            placeholder="Search by first name, last name, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-[#B8860B]/30 rounded-xl py-2.5 pl-12 pr-4 text-[#1E3F20] text-sm focus:outline-none focus:border-[#B8860B] transition-all placeholder:text-[#1E3F20]/40 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3F20]/60 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border-2 border-[#B8860B]/30 rounded-xl py-2.5 px-3.5 text-[#1E3F20] text-xs font-bold focus:outline-none focus:border-[#B8860B] transition-all shadow-sm outline-none cursor-pointer uppercase tracking-wider"
            >
              <option value="firstName">Alphabetical: First Name</option>
              <option value="lastName">Alphabetical: Last Name</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="bg-white border-2 border-[#B8860B]/30 rounded-xl p-1 flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              title="Alphabetical List View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'list' 
                  ? 'bg-[#1E3F20] text-[#FDFCF0] shadow-xs' 
                  : 'text-[#1E3F20]/70 hover:text-[#1E3F20] hover:bg-[#B8860B]/10'
              }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'cards' 
                  ? 'bg-[#1E3F20] text-[#FDFCF0] shadow-xs' 
                  : 'text-[#1E3F20]/70 hover:text-[#1E3F20] hover:bg-[#B8860B]/10'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-10 h-10 text-[#B8860B] animate-spin opacity-40" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E3F20]/60">Loading Financial Roster...</p>
          </div>
        ) : viewMode === 'list' ? (
          /* ALPHABETICAL LIST VIEW (DEFAULT) */
          <div className="bg-white border-2 border-[#B8860B]/30 rounded-2xl shadow-[0_8px_30px_rgba(30,63,32,0.06)] overflow-hidden">
            <div className="px-6 py-4 bg-[#1E3F20] text-cream flex items-center justify-between border-b border-[#B8860B]/40">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-[#B8860B]" />
                <h2 className="font-display text-sm md:text-base font-bold uppercase tracking-wider text-cream">
                  Active Financial Directory
                </h2>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-cream/70 bg-white/10 px-3 py-1 rounded-full">
                {filteredRoster.length} {filteredRoster.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <div className="divide-y divide-[#B8860B]/15">
              {filteredRoster.map((member, index) => {
                const firstName = getFirstName(member);
                const lastName = getLastName(member);
                return (
                  <div
                    key={member.email || index}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFCF0]/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar */}
                      <button
                        onClick={() => setSelectedProfileMember(member)}
                        className="w-11 h-11 rounded-full bg-[#FDFCF0] border-2 border-[#B8860B]/30 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#B8860B] transition-colors cursor-pointer"
                        title={`View ${member.name}'s Profile`}
                      >
                        {member.profile_photo ? (
                          <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-[#1E3F20]">
                            {firstName[0]}{lastName[0]}
                          </span>
                        )}
                      </button>

                      {/* Name & Hyperlink */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setSelectedProfileMember(member)}
                            className="text-left font-bold text-base text-[#1E3F20] group-hover:text-[#B8860B] transition-colors hover:underline flex items-center gap-1.5 cursor-pointer"
                            title={`View profile for ${member.name}`}
                          >
                            <span>{firstName} {lastName}</span>
                            <ExternalLink size={13} className="text-[#B8860B] opacity-60 group-hover:opacity-100 transition-opacity" />
                          </button>

                          {isOfficer(member) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#B8860B]/15 border border-[#B8860B]/30 text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                              Officer
                            </span>
                          )}
                        </div>

                        {member.title && 
                         member.title.toLowerCase() !== 'member' && 
                         member.title.toLowerCase() !== 'financial member' && 
                         member.title.toLowerCase() !== 'candidate' && 
                         member.title.toLowerCase() !== 'administrator' ? (
                          <p className="text-[#B8860B] text-xs font-bold uppercase tracking-wider mt-0.5">
                            {member.title}
                          </p>
                        ) : (
                          <p className="text-[#1E3F20]/50 text-xs font-medium mt-0.5">
                            Active Financial Member
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email, Status & Action */}
                    <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end pl-15 sm:pl-0 border-t sm:border-t-0 border-[#B8860B]/10 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right hidden md:block">
                        <span className="text-xs text-[#1E3F20]/70 font-medium block truncate max-w-[200px]">
                          {member.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black uppercase tracking-widest text-green-700">
                          <CheckCircle2 size={12} /> Active
                        </span>

                        <button
                          onClick={() => setSelectedProfileMember(member)}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1E3F20] bg-[#FDFCF0] hover:bg-[#1E3F20] hover:text-[#FDFCF0] border border-[#B8860B]/30 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRoster.map((member, index) => (
              <motion.div
                key={member.email || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white border-2 border-[#B8860B] rounded-xl p-5 shadow-[0_8px_20px_rgba(30,63,32,0.08)] relative hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <button
                      onClick={() => setSelectedProfileMember(member)}
                      className="w-12 h-12 rounded-full bg-[#FDFCF0] border border-[#B8860B]/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#B8860B] transition-colors"
                      title="View Member Profile"
                    >
                      {member.profile_photo ? (
                        <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users size={20} className="text-[#1E3F20]" />
                      )}
                    </button>
                    {member.financial_status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[9px] font-black uppercase tracking-widest text-red-700">
                        <XCircle size={10} /> Inactive
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedProfileMember(member)}
                    className="text-left font-bold text-lg text-[#1E3F20] hover:text-[#B8860B] hover:underline mb-1 block transition-colors cursor-pointer"
                  >
                    {member.name}
                  </button>

                  {member.title && 
                   member.title.toLowerCase() !== 'member' && 
                   member.title.toLowerCase() !== 'financial member' && 
                   member.title.toLowerCase() !== 'candidate' && 
                   member.title.toLowerCase() !== 'administrator' && (
                    <div className="text-[#B8860B] text-xs font-body italic font-bold mb-2 uppercase tracking-wide">
                      {member.title}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                      Member
                    </span>
                    {isOfficer(member) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                        Officer
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="space-y-2 mt-4 pt-4 border-t border-[#B8860B]/20">
                    <div className="flex items-center gap-2.5 text-[#1E3F20]/70">
                      <Mail size={12} />
                      <span className="text-[11px] truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#1E3F20]/70">
                      <CalendarDays size={12} />
                      <span className="text-[11px] truncate text-[#B8860B] font-semibold">Status: Paid</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProfileMember(member)}
                    className="mt-4 w-full py-2 bg-[#FDFCF0] hover:bg-[#1E3F20] text-[#1E3F20] hover:text-[#FDFCF0] border border-[#B8860B]/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Profile</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredRoster.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#B8860B]/20 p-8 shadow-sm">
            <Users size={48} className="text-[#1E3F20]/20 mx-auto mb-4" />
            <h3 className="text-[#1E3F20] text-lg font-bold mb-2">No members found</h3>
            <p className="text-[#1E3F20]/60 text-sm">Adjust your search or sorting criteria to find active members.</p>
          </div>
        )}
      </div>
      </div>

      {/* MEMBER PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border-2 border-[#B8860B] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Header Banner */}
              <div className="bg-[#1E3F20] p-6 text-cream relative">
                <button
                  onClick={() => setSelectedProfileMember(null)}
                  className="absolute top-4 right-4 text-cream/70 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
                  title="Close Profile"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-full bg-[#FDFCF0] border-2 border-[#B8860B] flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                    {selectedProfileMember.profile_photo ? (
                      <img src={selectedProfileMember.profile_photo} alt={selectedProfileMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={32} className="text-[#1E3F20]" />
                    )}
                  </div>
                  <div className="min-w-0 pr-6">
                    <h3 className="text-xl font-display font-bold uppercase tracking-wider text-cream truncate">
                      {selectedProfileMember.name}
                    </h3>
                    {selectedProfileMember.title && 
                     selectedProfileMember.title.toLowerCase() !== 'member' && 
                     selectedProfileMember.title.toLowerCase() !== 'financial member' && 
                     selectedProfileMember.title.toLowerCase() !== 'candidate' && 
                     selectedProfileMember.title.toLowerCase() !== 'administrator' ? (
                      <p className="text-[#B8860B] text-xs font-bold uppercase tracking-widest mt-0.5">
                        {selectedProfileMember.title}
                      </p>
                    ) : (
                      <p className="text-cream/70 text-xs font-medium mt-0.5">
                        Financial Member
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/20 border border-green-400/40 text-[9px] font-black uppercase tracking-widest text-green-300">
                        <CheckCircle2 size={10} /> Active Financial
                      </span>
                      {isOfficer(selectedProfileMember) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B8860B]/30 border border-[#B8860B] text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                          Officer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Body */}
              <div className="p-6 space-y-5 bg-[#FDFCF0]/50 overflow-y-auto max-h-[60vh]">
                {isEditingAdmin ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Email Address (Read-only)
                      </label>
                      <input
                        type="text"
                        value={selectedProfileMember.email}
                        disabled
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E3F20]/10 bg-[#1E3F20]/5 text-[#1E3F20]/60 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editAdminForm.name}
                        onChange={e => setEditAdminForm({ ...editAdminForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1E3F20]/20 focus:border-[#1E3F20] bg-white text-[#1E3F20] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Administrative Role
                      </label>
                      <select
                        value={editAdminForm.role}
                        onChange={e => setEditAdminForm({ ...editAdminForm, role: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1E3F20]/20 focus:border-[#1E3F20] bg-white text-[#1E3F20] outline-none"
                      >
                        <option value="member">General Member</option>
                        <option value="officer">Officer</option>
                        <option value="Membership Committee">Committee Member</option>
                        <option value="Membership Committee Chair">Committee Chair</option>
                        <option value="admin">Administrator</option>
                        <option value="prospective">Prospective Candidate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Officer / Roster Title
                      </label>
                      <input
                        type="text"
                        value={editAdminForm.title}
                        onChange={e => setEditAdminForm({ ...editAdminForm, title: e.target.value })}
                        placeholder="e.g. Grammateus, 2nd Anti-Basileus"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1E3F20]/20 focus:border-[#1E3F20] bg-white text-[#1E3F20] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Financial Status
                      </label>
                      <select
                        value={editAdminForm.financial_status}
                        onChange={e => setEditAdminForm({ ...editAdminForm, financial_status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1E3F20]/20 focus:border-[#1E3F20] bg-white text-[#1E3F20] outline-none"
                      >
                        <option value="active">Active (Dues Paid)</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-1">
                        Industry / Profession
                      </label>
                      <input
                        type="text"
                        value={editAdminForm.industry}
                        onChange={e => setEditAdminForm({ ...editAdminForm, industry: e.target.value })}
                        placeholder="e.g. Finance, Tech, Medical"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1E3F20]/20 focus:border-[#1E3F20] bg-white text-[#1E3F20] outline-none"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-3 border-t border-[#1E3F20]/10 mt-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 mb-2">
                        Standing Committee Assignments
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FDFCF0] p-3 rounded-lg border border-[#B8860B]/20">
                        {STANDING_COMMITTEES.map(c => {
                          const isAssigned = (editAdminForm.committees || []).includes(c.slug);
                          const currentRole = (editAdminForm.committeeRoles || {})[c.slug] || 'member';
                          return (
                            <div key={c.slug} className="flex flex-col gap-1.5 p-2 bg-white rounded border border-[#1E3F20]/10">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E3F20]">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={e => {
                                    const nextComms = e.target.checked
                                      ? [...(editAdminForm.committees || []), c.slug]
                                      : (editAdminForm.committees || []).filter(item => item !== c.slug);
                                    setEditAdminForm({ ...editAdminForm, committees: nextComms });
                                  }}
                                  className="rounded text-[#1E3F20] focus:ring-0"
                                />
                                <span>{c.name}</span>
                              </label>
                              {isAssigned && (
                                <select
                                  value={currentRole}
                                  onChange={e => {
                                    const nextRoles = { ...(editAdminForm.committeeRoles || {}), [c.slug]: e.target.value };
                                    setEditAdminForm({ ...editAdminForm, committeeRoles: nextRoles });
                                  }}
                                  className="text-[10px] px-2 py-1 bg-[#FDFCF0] border border-[#1E3F20]/20 rounded font-bold text-[#1E3F20]"
                                >
                                  <option value="member">General Member</option>
                                  <option value="chair">Committee Chair</option>
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contact Section */}
                    <div className="bg-white rounded-xl p-4 border border-[#B8860B]/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 flex items-center gap-1.5">
                          <Mail size={12} className="text-[#B8860B]" /> Official Email Address
                        </span>
                        <button
                          onClick={() => handleCopyEmail(selectedProfileMember.email)}
                          className="text-[10px] font-bold text-[#1E3F20] hover:text-[#B8860B] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedEmail ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                          <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <a
                        href={`mailto:${selectedProfileMember.email}`}
                        className="text-sm font-semibold text-[#1E3F20] hover:text-[#B8860B] transition-colors block truncate hover:underline"
                      >
                        {selectedProfileMember.email}
                      </a>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3.5 border border-[#B8860B]/20">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#1E3F20]/50 block mb-1">
                          Membership Status
                        </span>
                        <div className="flex items-center gap-1.5 text-[#1E3F20]">
                          <UserCheck size={14} className="text-green-600" />
                          <span className="text-xs font-bold">Good Standing</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-[#B8860B]/20">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#1E3F20]/50 block mb-1">
                          Dues & Assessment
                        </span>
                        <div className="flex items-center gap-1.5 text-[#1E3F20]">
                          <CheckCircle2 size={14} className="text-green-600" />
                          <span className="text-xs font-bold text-green-700">FY27 Paid</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-[#B8860B]/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#1E3F20]/50 block">
                            Industry / Profession
                          </span>
                          {(isAdmin || currentUserEmail === selectedProfileMember.email.toLowerCase()) && !isEditingIndustry && (
                            <button
                              onClick={() => {
                                setIndustryInput(selectedProfileMember.industry || '');
                                setIsEditingIndustry(true);
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider text-[#B8860B] hover:text-[#1E3F20] flex items-center gap-1 cursor-pointer"
                              title="Edit Industry / Profession"
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                          )}
                        </div>
                        {isEditingIndustry ? (
                          <div className="space-y-2 mt-1">
                            <input
                              type="text"
                              value={industryInput}
                              onChange={(e) => setIndustryInput(e.target.value)}
                              placeholder="e.g. Financial Services, Tech"
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-[#B8860B]/40 focus:outline-none focus:ring-1 focus:ring-[#B8860B] bg-cream/30 text-[#1E3F20]"
                              autoFocus
                            />
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => setIsEditingIndustry(false)}
                                className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveIndustry}
                                disabled={isSavingIndustry}
                                className="px-2.5 py-1 text-[10px] font-bold bg-[#1E3F20] text-cream rounded flex items-center gap-1 hover:bg-[#1E3F20]/90 disabled:opacity-50"
                              >
                                <Save size={10} className="text-[#B8860B]" />
                                {isSavingIndustry ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#1E3F20]">
                            <Briefcase size={14} className="text-[#B8860B]" />
                            <span className="text-xs font-bold truncate">
                              {selectedProfileMember.industry || 'Not specified'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Committees */}
                    {selectedProfileMember.committees && selectedProfileMember.committees.length > 0 && (features.committee_enabled || isAdmin) && (
                      <div className="bg-white rounded-xl p-4 border border-[#B8860B]/20">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E3F20]/60 block mb-2">
                          Committee Appointments
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProfileMember.committees.map(c => (
                            <span key={c} className="px-2.5 py-1 bg-[#1E3F20]/5 border border-[#B8860B]/30 rounded-md text-[10px] font-bold text-[#1E3F20] uppercase tracking-wider">
                              {c.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-[#B8860B]/20 flex flex-wrap items-center justify-between gap-3">
                {isEditingAdmin ? (
                  <>
                    <button
                      onClick={handleDeleteAdminMember}
                      className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-bold uppercase tracking-wider rounded border border-red-200 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete Member
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingAdmin(false)}
                        className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#1E3F20]/70 hover:text-[#1E3F20]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAdminEdit}
                        disabled={savingAdmin}
                        className="px-4 py-2 bg-[#1E3F20] text-cream text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#1E3F20]/90 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Save size={13} className="text-[#B8860B]" />
                        <span>{savingAdmin ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${selectedProfileMember.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3F20] text-cream text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#1E3F20]/90 transition-all shadow-sm"
                      >
                        <Mail size={14} className="text-[#B8860B]" />
                        <span>Send Email</span>
                      </a>
                      
                      {isAdmin && (
                        <button
                          onClick={() => handleStartAdminEdit(selectedProfileMember)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#B8860B]/30 rounded-lg text-xs font-bold text-[#1E3F20] bg-gold/10 hover:bg-gold/20 uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Edit3 size={13} /> Edit Profile
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedProfileMember(null)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1E3F20]/70 hover:text-[#1E3F20] transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
