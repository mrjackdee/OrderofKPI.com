import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Calendar, Folder, UserMinus, UserPlus, 
  ShieldCheck, AlertCircle, Loader2, CheckCircle2, Shield
} from 'lucide-react';
import { Member, CommitteeSlug, CommitteeRole, STANDING_COMMITTEES } from '../types';
import { normalizeUserRBAC } from '../lib/memberDb';
import { firebaseSyncPortalMember, firebaseRemoveCommitteeMember } from '../lib/firebase';

interface CommitteeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  committeeSlug: CommitteeSlug;
  currentUserRole?: string;
  currentUserEmail?: string;
  onRosterUpdated?: () => void;
}

export const CommitteeDetailsModal: React.FC<CommitteeDetailsModalProps> = ({
  isOpen,
  onClose,
  committeeSlug,
  currentUserRole = '',
  currentUserEmail = '',
  onRosterUpdated
}) => {
  const committeeDef = STANDING_COMMITTEES.find(c => c.slug === committeeSlug);

  const [activeTab, setActiveTab] = useState<'roster' | 'info'>('roster');
  const [members, setMembers] = useState<Member[]>([]);
  const [allAvailableMembers, setAllAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'chair' | 'member'>('member');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = currentUserRole === 'admin' || 
    currentUserEmail.toLowerCase() === 'admin@orderofkpi.org' || 
    currentUserEmail.toLowerCase() === 'qa.admin@orderofkpi.org' || 
    currentUserEmail.toLowerCase() === 'info@kpi2012.org';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCommitteeData = async () => {
    if (!committeeSlug) return;
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setAllAvailableMembers(data.members);
          const filtered = data.members.filter((m: Member) => {
            const norm = normalizeUserRBAC(m);
            return norm.committees.includes(committeeSlug) || norm.committeeRoles?.[committeeSlug] !== undefined;
          });
          setMembers(filtered);
        }
      }
    } catch (err) {
      console.error('Error fetching committee members in modal:', err);
      showNotification('error', 'Unable to load committee roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && committeeSlug) {
      fetchCommitteeData();
    }
  }, [isOpen, committeeSlug]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberEmail || actionLoading) return;

    const normEmail = selectedMemberEmail.toLowerCase().trim();
    const target = allAvailableMembers.find(m => m.email.toLowerCase().trim() === normEmail);
    if (!target) return;

    setActionLoading('add');
    const norm = normalizeUserRBAC(target);
    const updatedCommittees = Array.from(new Set([...norm.committees, committeeSlug]));
    const updatedRoles = { ...norm.committeeRoles, [committeeSlug]: selectedMemberRole };

    try {
      const firestoreTask = firebaseSyncPortalMember({
        email: normEmail,
        name: target.name || normEmail,
        role: target.role || 'member',
        title: target.title,
        financial_status: target.financial_status,
        industry: target.industry,
        committees: updatedCommittees,
        committeeRoles: updatedRoles
      });

      const apiTask = fetch('/api/committee/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normEmail,
          committeeSlug,
          committeeRole: selectedMemberRole,
          chairEmail: currentUserEmail
        })
      }).then(r => r.headers.get('content-type')?.includes('application/json') ? r.json() : { success: r.ok });

      const [fsRes, apiRes] = await Promise.allSettled([firestoreTask, apiTask]);
      const isSuccess = (apiRes.status === 'fulfilled' && (apiRes.value as any)?.success) ||
                        (fsRes.status === 'fulfilled' && (fsRes.value as any)?.success !== false);

      if (isSuccess) {
        const updatedMember: Member = {
          ...target,
          committees: updatedCommittees,
          committeeRoles: updatedRoles
        };
        setMembers(prev => {
          const exists = prev.some(m => m.email.toLowerCase().trim() === normEmail);
          if (exists) {
            return prev.map(m => m.email.toLowerCase().trim() === normEmail ? updatedMember : m);
          }
          return [...prev, updatedMember];
        });
        setSelectedMemberEmail('');
        showNotification('success', `Added "${target.name || normEmail}" to ${committeeDef?.name || 'committee'}.`);
        if (onRosterUpdated) onRosterUpdated();
      } else {
        showNotification('error', 'Failed to save committee assignment.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating committee member.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberEmail: string, memberName?: string) => {
    const normEmail = memberEmail.toLowerCase().trim();
    const displayName = memberName || memberEmail;

    if (!window.confirm(`Remove ${displayName} from ${committeeDef?.name || 'committee'}?`)) {
      return;
    }

    setActionLoading(normEmail);
    // Instant optimistic state removal
    setMembers(prev => prev.filter(m => m.email.toLowerCase().trim() !== normEmail));

    const target = allAvailableMembers.find(m => m.email.toLowerCase().trim() === normEmail);
    const norm = target ? normalizeUserRBAC(target) : { committees: [], committeeRoles: {} };
    const filteredCommittees = norm.committees.filter(c => c !== committeeSlug);
    const filteredRoles = { ...norm.committeeRoles };
    delete filteredRoles[committeeSlug];

    try {
      const firestoreTask = Promise.allSettled([
        firebaseSyncPortalMember({
          email: normEmail,
          name: target?.name || displayName,
          role: target?.role || 'member',
          title: target?.title,
          financial_status: target?.financial_status,
          industry: target?.industry,
          committees: filteredCommittees,
          committeeRoles: filteredRoles
        }),
        firebaseRemoveCommitteeMember(committeeSlug, normEmail)
      ]);

      const apiTask = fetch(`/api/committee/members/${encodeURIComponent(normEmail)}?slug=${committeeSlug}&chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      }).then(r => r.headers.get('content-type')?.includes('application/json') ? r.json() : { success: r.ok });

      const [fsRes, apiRes] = await Promise.allSettled([firestoreTask, apiTask]);
      const isSuccess = (apiRes.status === 'fulfilled' && (apiRes.value as any)?.success) ||
                        (fsRes.status === 'fulfilled');

      if (isSuccess) {
        showNotification('success', `Removed ${displayName} from committee.`);
        if (onRosterUpdated) onRosterUpdated();
      } else {
        // Rollback on complete failure
        fetchCommitteeData();
        showNotification('error', 'Failed to remove member. Please check connection.');
      }
    } catch (err: any) {
      fetchCommitteeData();
      showNotification('error', err.message || 'Error removing member.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen || !committeeDef) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-gold/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-ivy"
        >
          {/* Header */}
          <div className="bg-[#1E3F20] text-cream p-5 flex items-center justify-between border-b border-gold/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gold/20 text-gold rounded-xl border border-gold/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight font-sans text-cream">
                  {committeeDef.name}
                </h3>
                <p className="text-xs text-cream/70">
                  Active Roster & Committee Configuration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-cream/70 hover:text-cream rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications */}
          {notification && (
            <div className={`p-3 text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-200 bg-stone-50 px-5 pt-3 gap-4 shrink-0">
            <button
              onClick={() => setActiveTab('roster')}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'roster' ? 'border-ivy text-ivy' : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Committee Roster ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                activeTab === 'info' ? 'border-ivy text-ivy' : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Overview & Purpose
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-ivy" />
                <span className="text-sm font-medium">Loading committee details...</span>
              </div>
            ) : activeTab === 'roster' ? (
              <div className="space-y-4">
                {/* Admin Add Member Form */}
                {isAdmin && (
                  <form onSubmit={handleAddMember} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-ivy uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-gold" /> Add Member to Roster
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <select
                        value={selectedMemberEmail}
                        onChange={(e) => setSelectedMemberEmail(e.target.value)}
                        className="sm:col-span-2 text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-ivy focus:outline-none"
                      >
                        <option value="">Select a member...</option>
                        {allAvailableMembers
                          .filter(m => !members.some(cm => cm.email.toLowerCase().trim() === m.email.toLowerCase().trim()))
                          .map(m => (
                            <option key={m.email} value={m.email}>
                              {m.name || m.email} ({m.email})
                            </option>
                          ))}
                      </select>

                      <select
                        value={selectedMemberRole}
                        onChange={(e) => setSelectedMemberRole(e.target.value as 'chair' | 'member')}
                        className="text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-ivy focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="chair">Chair</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedMemberEmail || actionLoading === 'add'}
                      className="w-full py-2.5 bg-ivy hover:bg-ivy/90 text-cream text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === 'add' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>Assign To Committee</span>
                    </button>
                  </form>
                )}

                {/* Member List */}
                {members.length === 0 ? (
                  <div className="py-8 text-center bg-stone-50 border border-dashed border-stone-300 rounded-xl p-6">
                    <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-stone-700">No members currently assigned</p>
                    <p className="text-xs text-stone-500 mt-1">Use the control above to assign directory members to this committee.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map(m => {
                      const norm = normalizeUserRBAC(m);
                      const isCommitteeChair = norm.committeeRoles?.[committeeSlug] === 'chair';
                      const isRemoving = actionLoading === m.email.toLowerCase().trim();

                      return (
                        <div
                          key={m.email}
                          className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-ivy/10 text-ivy font-bold text-xs flex items-center justify-center shrink-0">
                              {(m.name || m.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-stone-900 truncate">
                                  {m.name || m.email}
                                </p>
                                {isCommitteeChair && (
                                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gold/20 text-gold border border-gold/40 rounded-full">
                                    Chair
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 truncate">{m.email}</p>
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => handleRemoveMember(m.email, m.name)}
                              disabled={isRemoving}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Remove member"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                              ) : (
                                <UserMinus className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs leading-relaxed text-stone-700">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-ivy uppercase tracking-wider text-xs">Official Committee Purpose</h4>
                  <p>{committeeDef.purpose || committeeDef.description}</p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-ivy uppercase tracking-wider text-xs">Standing Order Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <span className="font-semibold block text-stone-800">Slug Identifier</span>
                      <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-[11px]">{committeeSlug}</code>
                    </div>
                    <div>
                      <span className="font-semibold block text-stone-800">Roster Capacity</span>
                      <span>Active Standing Committee</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
