import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical,
  ChevronRight,
  GraduationCap,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Camera,
  RefreshCw,
  Briefcase,
  Trash2,
  Edit3,
  Save,
  X,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Member } from '../types';
import { syncApplicationsFromFirestore } from '../lib/memberDb';
import { firebaseSyncPortalMember } from '../lib/firebase';

export default function MemberDirectory() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Admin and Super-user authorization checks
  const currentUserEmail = (sessionStorage.getItem('userEmail') || '').toLowerCase().trim();
  const currentUserRole = (sessionStorage.getItem('userRole') || '').toLowerCase().trim();
  const isAdmin = currentUserRole === 'admin' || currentUserEmail === 'admin@orderofkpi.org' || currentUserEmail === 'qa.admin@orderofkpi.org' || currentUserEmail === 'info@kpi2012.org';

  // Administration State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'member' as any,
    title: '',
    financial_status: 'inactive' as any,
    industry: ''
  });
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Admin handlers
  const handleDeleteMember = async (email: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove "${name}" (${email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(email)}?adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
        setToastMessage({ type: 'success', text: `Successfully deleted member "${name}" from the system.` });
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage({ type: 'error', text: data.message || 'Failed to delete member' });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error deleting member:', err);
      setToastMessage({ type: 'error', text: 'Error connecting to server' });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleStartEdit = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name || '',
      role: member.role || 'member',
      title: member.title || '',
      financial_status: member.financial_status || 'inactive',
      industry: member.industry || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setSaving(true);
    const targetEmail = editingMember.email.toLowerCase().trim();

    // Dual-write: 1) Cloud Firestore
    const firestoreTask = firebaseSyncPortalMember({
      email: targetEmail,
      name: editForm.name || editingMember.name || targetEmail,
      role: editForm.role || 'member',
      title: editForm.title || '',
      financial_status: editForm.financial_status || 'active',
      industry: editForm.industry || '',
      committees: editingMember.committees || [],
      committeeRoles: editingMember.committeeRoles || {}
    });

    // Dual-write: 2) Server API
    const apiTask = (async () => {
      try {
        const res = await fetch(`/api/members/${encodeURIComponent(targetEmail)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editForm,
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
      setMembers(prev => prev.map(m => m.email.toLowerCase() === targetEmail ? {
        ...m,
        ...editForm
      } : m));
      setEditingMember(null);
      setToastMessage({ type: 'success', text: `Successfully updated profile details and Industry/Profession for "${editForm.name}".` });
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage({ type: 'error', text: 'Failed to update member profile in database. Please verify connection.' });
      setTimeout(() => setToastMessage(null), 4000);
    }
    setSaving(false);
  };

  const filteredMembers = members.filter(member => {
    const name = member.name || '';
    const email = member.email || '';
    const title = member.title || '';
    const industry = member.industry || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-cream pb-12 w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-ivy py-16 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display text-cream mb-4"
          >
            Member Directory
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-cream/80 max-w-2xl mx-auto font-body"
          >
            Directory of active member accounts and contact emails.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-soft border-gold/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-ivy/10 rounded-md bg-white text-ivy outline-none"
              >
                <option value="all">All Roles</option>
                <option value="officer">Officers</option>
                <option value="admin">Admins</option>
                <option value="member">Members</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.email}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border-gold/30 border shadow-soft overflow-hidden group hover:border-gold transition-all"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-cream border border-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                    {member.profile_photo ? (
                      <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-display text-ivy truncate mb-1">
                      {member.name}
                    </h3>
                    {member.title && 
                     member.title.toLowerCase() !== 'member' && 
                     member.title.toLowerCase() !== 'financial member' && 
                     member.title.toLowerCase() !== 'candidate' && 
                     member.title.toLowerCase() !== 'administrator' && (
                      <p className="text-gold font-semibold text-sm uppercase tracking-wider mb-2">
                        {member.title}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Member
                      </span>
                      {(member.is_test_credential === 1 || member.is_test_credential === true || member.email?.toLowerCase().startsWith('qa.') || member.email?.toLowerCase().startsWith('test.')) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-black uppercase tracking-widest text-amber-700">
                          Test Account
                        </span>
                      )}
                      {isOfficer(member) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                          Officer
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-ivy/60 text-sm mb-1.5">
                      <Mail className="w-4 h-4 text-gold/70" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {member.industry && (
                      <div className="flex items-center gap-2 text-ivy/70 text-xs font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-gold" />
                        <span className="truncate">{member.industry}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-cream grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivy/40 font-bold mb-1">Membership</p>
                    <div className="flex items-center gap-1 text-ivy">
                      <History className="w-3 h-3 text-gold" />
                      <span className="text-sm font-medium">Member</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivy/40 font-bold mb-1">Financial Status</p>
                    <div className="flex items-center gap-1">
                      {member.financial_status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-sm font-medium text-red-500">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative Actions Roster Overlay */}
              {isAdmin && (
                <div className="px-6 pb-6 pt-3 flex items-center justify-end gap-3 border-t border-cream/50 bg-cream/5">
                  <button
                    onClick={() => handleStartEdit(member)}
                    className="px-3 py-1.5 bg-ivy/5 text-ivy hover:bg-gold hover:text-ivy text-xs font-bold uppercase tracking-wider rounded border border-gold/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Edit Account Details"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.email, member.name)}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-bold uppercase tracking-wider rounded border border-red-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && !loading && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gold/20 mx-auto mb-4" />
            <h3 className="text-xl font-display text-ivy">No members found</h3>
            <p className="text-ivy/60">Try adjusting your search or filter settings.</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION WINDOW */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border border-gold/30 flex items-center gap-3 bg-white"
          >
            {toastMessage.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Check size={18} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <X size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-ivy">
                {toastMessage.type === 'success' ? 'Success' : 'Error'}
              </p>
              <p className="text-xs text-ivy/70">{toastMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUPER-USER ADMINISTRATOR EDIT MODAL */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-2 border-gold rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative my-auto"
            >
              <div className="bg-ivy p-6 text-cream">
                <button
                  onClick={() => setEditingMember(null)}
                  className="absolute top-4 right-4 text-cream/70 hover:text-cream bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-cream">
                  Edit Member Account
                </h3>
                <p className="text-xs text-cream/70 mt-1">
                  Database changes sync automatically across server and Firestore backups.
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-cream/30">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="text"
                    value={editingMember.email}
                    disabled
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-ivy/10 bg-ivy/5 text-ivy/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ivy/20 focus:border-ivy bg-white text-ivy outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-1">
                    Administrative Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ivy/20 focus:border-ivy bg-white text-ivy outline-none"
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
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-1">
                    Officer / Roster Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g. Grammateus, 2nd Anti-Basileus"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ivy/20 focus:border-ivy bg-white text-ivy outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-1">
                    Dues & Assessment Status
                  </label>
                  <select
                    value={editForm.financial_status}
                    onChange={e => setEditForm({ ...editForm, financial_status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ivy/20 focus:border-ivy bg-white text-ivy outline-none"
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
                    value={editForm.industry}
                    onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                    placeholder="e.g. Financial Services, Corporate Law"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-ivy/20 focus:border-ivy bg-white text-ivy outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-white border-t border-ivy/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/60 hover:text-ivy"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-5 py-2 bg-ivy hover:bg-ivy/90 text-cream text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                >
                  <Save size={13} className="text-gold" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
