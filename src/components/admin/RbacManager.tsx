import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Search,
  Check,
  X,
  Plus,
  RotateCcw,
  Sliders,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  Crown,
  Key,
  FolderKanban,
  CalendarDays,
  Vote,
  Award,
  DollarSign,
  BookOpen,
  Archive,
  BarChart3,
  ListOrdered,
  FileCheck,
  CheckSquare,
  ClipboardCheck,
  Sparkles
} from 'lucide-react';
import { Member, UserRole } from '../../types';
import {
  PermissionKey,
  PermissionDefinition,
  PERMISSION_DEFINITIONS,
  ALL_SYSTEM_ROLES,
  SystemRole,
  RolePermissionsMap,
  UserOverridesMap,
  useRBAC,
  updateRolePermissions,
  updateUserPermissionOverride,
  updateUserRoles,
  checkUserPermission
} from '../../lib/rbac';

interface RbacManagerProps {
  members: Member[];
  onMembersUpdated: () => void;
  adminEmail: string;
}

export default function RbacManager({ members, onMembersUpdated, adminEmail }: RbacManagerProps) {
  const { rolePermissions, userOverrides, loading: rbacLoading } = useRBAC();

  // Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'matrix'>('users');

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // --- USER ROLE MANAGEMENT STATE ---
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  // New role input for quick-add
  const [roleToAdd, setRoleToAdd] = useState('');

  // --- ROLE MANAGEMENT STATE ---
  const [selectedRoleId, setSelectedRoleId] = useState<string>('officer');
  const [roleSearch, setRoleSearch] = useState('');
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Custom role creation modal
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionKey[]>([]);

  // Dynamically derive all available roles from system + assigned in member directory
  const availableRoles = useMemo(() => {
    const roleMap = new Map<string, { id: string; name: string; description: string; count: number; color: string }>();

    // Add base system roles
    ALL_SYSTEM_ROLES.forEach(r => {
      roleMap.set(r.id, {
        id: r.id,
        name: r.name,
        description: r.description,
        count: 0,
        color: r.color
      });
    });

    // Add any custom roles that might exist in rolePermissions
    Object.keys(rolePermissions).forEach(roleId => {
      if (!roleMap.has(roleId)) {
        roleMap.set(roleId, {
          id: roleId,
          name: roleId,
          description: 'Custom configured organizational role',
          count: 0,
          color: 'bg-teal-100 text-teal-900 border-teal-300'
        });
      }
    });

    // Count user assignments
    members.forEach(m => {
      const userRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role || 'member'];
      userRoles.forEach(r => {
        if (roleMap.has(r)) {
          const item = roleMap.get(r)!;
          item.count += 1;
        } else {
          roleMap.set(r, {
            id: r,
            name: r,
            description: 'Assigned directory role',
            count: 1,
            color: 'bg-stone-100 text-stone-900 border-stone-300'
          });
        }
      });
    });

    return Array.from(roleMap.values());
  }, [members, rolePermissions]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const email = (m.email || '').toLowerCase();
      const name = (m.name || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      const roles = m.roles && m.roles.length > 0 ? m.roles : [m.role || 'member'];
      
      const searchMatch = !userSearch || 
        email.includes(userSearch.toLowerCase()) || 
        name.includes(userSearch.toLowerCase()) || 
        title.includes(userSearch.toLowerCase());

      if (!searchMatch) return false;

      if (userRoleFilter === 'all') return true;
      if (userRoleFilter === 'overridden') {
        return !!userOverrides[email] && Object.keys(userOverrides[email]).length > 0;
      }
      return roles.some(r => r.toLowerCase() === userRoleFilter.toLowerCase());
    });
  }, [members, userSearch, userRoleFilter, userOverrides]);

  // Selected member object
  const selectedMember = useMemo(() => {
    if (!selectedUserEmail) return null;
    return members.find(m => (m.email || '').toLowerCase() === selectedUserEmail.toLowerCase()) || null;
  }, [members, selectedUserEmail]);

  // Selected role object
  const selectedRole = useMemo(() => {
    return availableRoles.find(r => r.id === selectedRoleId) || availableRoles[0];
  }, [availableRoles, selectedRoleId]);

  // Icon mapper helper
  const renderPermIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Shield': return <Shield className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'ShieldAlert': return <ShieldAlert className={className} />;
      case 'UserCheck': return <UserCheck className={className} />;
      case 'ClipboardCheck': return <ClipboardCheck className={className} />;
      case 'CalendarDays': return <CalendarDays className={className} />;
      case 'FolderKanban': return <FolderKanban className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Vote': return <Vote className={className} />;
      case 'FileCheck': return <FileCheck className={className} />;
      case 'CheckSquare': return <CheckSquare className={className} />;
      case 'Award': return <Award className={className} />;
      case 'ListOrdered': return <ListOrdered className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Users': return <Users className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      case 'Archive': return <Archive className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Clock': return <Clock className={className} />;
      default: return <Key className={className} />;
    }
  };

  // Grouped permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {
      'Administration & Security': [],
      'Candidate & Intake Ops': [],
      'Voting & Elections': [],
      'Membership & Governance': [],
      'Committees': []
    };

    PERMISSION_DEFINITIONS.forEach(p => {
      if (categoryFilter === 'all' || categoryFilter === p.category) {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
      }
    });

    return groups;
  }, [categoryFilter]);

  // Categories list
  const categories = ['all', 'Administration & Security', 'Candidate & Intake Ops', 'Voting & Elections', 'Membership & Governance', 'Committees'];

  // Handle Assigning Role to a User
  const handleAssignRoleToUser = async (targetEmail: string, roleToAssign: string) => {
    if (!targetEmail || !roleToAssign) return;
    setUserActionLoading(true);

    const member = members.find(m => m.email.toLowerCase() === targetEmail.toLowerCase());
    const currentRoles = member?.roles && member.roles.length > 0 ? [...member.roles] : [member?.role || 'member'];

    if (currentRoles.includes(roleToAssign)) {
      showFeedback('error', `User ${targetEmail} already has the role '${roleToAssign}'.`);
      setUserActionLoading(false);
      return;
    }

    const nextRoles = [...currentRoles, roleToAssign];
    const result = await updateUserRoles(targetEmail, nextRoles, adminEmail);

    if (result.success) {
      showFeedback('success', `✓ Role '${roleToAssign}' successfully assigned to ${targetEmail}.`);
      onMembersUpdated();
      setRoleToAdd('');
    } else {
      showFeedback('error', result.message || 'Failed to assign role.');
    }
    setUserActionLoading(false);
  };

  // Handle Removing Role from a User
  const handleRemoveRoleFromUser = async (targetEmail: string, roleToRemove: string) => {
    if (!targetEmail || !roleToRemove) return;
    setUserActionLoading(true);

    const member = members.find(m => m.email.toLowerCase() === targetEmail.toLowerCase());
    const currentRoles = member?.roles && member.roles.length > 0 ? [...member.roles] : [member?.role || 'member'];

    const nextRoles = currentRoles.filter(r => r !== roleToRemove);
    if (nextRoles.length === 0) {
      nextRoles.push('member'); // Default fallback so user always has at least member role
    }

    const result = await updateUserRoles(targetEmail, nextRoles, adminEmail);

    if (result.success) {
      showFeedback('success', `✓ Role '${roleToRemove}' removed from ${targetEmail}.`);
      onMembersUpdated();
    } else {
      showFeedback('error', result.message || 'Failed to remove role.');
    }
    setUserActionLoading(false);
  };

  // Handle Toggle Permission for Role
  const handleToggleRolePermission = async (roleId: string, permissionKey: PermissionKey) => {
    setRoleActionLoading(true);
    const currentPerms = rolePermissions[roleId] || ALL_SYSTEM_ROLES.find(r => r.id === roleId)?.defaultPermissions || [];
    const isEnabled = currentPerms.includes(permissionKey);

    const nextPerms = isEnabled
      ? currentPerms.filter(p => p !== permissionKey)
      : [...currentPerms, permissionKey];

    const success = await updateRolePermissions(roleId, nextPerms);
    if (success) {
      const permDef = PERMISSION_DEFINITIONS.find(p => p.key === permissionKey);
      showFeedback(
        'success',
        `✓ Updated Role '${roleId}': ${permDef?.label || permissionKey} is now ${!isEnabled ? 'ENABLED' : 'DISABLED'}.`
      );
    } else {
      showFeedback('error', 'Failed to update role permissions. Please try again.');
    }
    setRoleActionLoading(false);
  };

  // Handle User Direct Permission Override Toggle (Cycle: Inherit -> Force Allow -> Force Deny -> Inherit)
  const handleToggleUserOverride = async (userEmail: string, permissionKey: PermissionKey) => {
    const normEmail = userEmail.toLowerCase().trim();
    const currentVal = userOverrides[normEmail]?.[permissionKey];

    let nextVal: boolean | undefined;
    if (currentVal === undefined) {
      nextVal = true; // Force Allow
    } else if (currentVal === true) {
      nextVal = false; // Force Deny
    } else {
      nextVal = undefined; // Reset to Inherit
    }

    const success = await updateUserPermissionOverride(normEmail, permissionKey, nextVal);
    if (success) {
      const permDef = PERMISSION_DEFINITIONS.find(p => p.key === permissionKey);
      const stateLabel = nextVal === true ? 'FORCE ENABLED' : nextVal === false ? 'FORCE DISABLED' : 'RESET TO ROLE DEFAULT';
      showFeedback('success', `✓ ${permDef?.label || permissionKey} for ${normEmail} set to: ${stateLabel}.`);
    } else {
      showFeedback('error', 'Failed to update user permission override.');
    }
  };

  // Reset Role Permissions to Factory Defaults
  const handleResetRoleDefaults = async (roleId: string) => {
    const sysRole = ALL_SYSTEM_ROLES.find(r => r.id === roleId);
    if (!sysRole) {
      showFeedback('error', `Cannot reset custom role '${roleId}' without factory defaults.`);
      return;
    }

    setRoleActionLoading(true);
    const success = await updateRolePermissions(roleId, [...sysRole.defaultPermissions]);
    if (success) {
      showFeedback('success', `✓ Role '${roleId}' has been reset to system factory default permissions.`);
    } else {
      showFeedback('error', 'Failed to reset role permissions.');
    }
    setRoleActionLoading(false);
  };

  // Create New Custom Role
  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const roleId = newRoleName.trim();
    setRoleActionLoading(true);

    const success = await updateRolePermissions(roleId, newRolePermissions);
    if (success) {
      showFeedback('success', `✓ Custom role '${newRoleName}' created with ${newRolePermissions.length} permissions.`);
      setShowNewRoleModal(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePermissions([]);
      setSelectedRoleId(roleId);
    } else {
      showFeedback('error', 'Failed to create custom role.');
    }
    setRoleActionLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metric Summary */}
      <div className="bg-gradient-to-br from-ivy via-forest to-ivy/95 rounded-3xl p-6 sm:p-8 text-cream shadow-xl border border-gold/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gold/20 text-gold border border-gold/30">
                  Real-Time RBAC Engine
                </span>
                <span className="text-[10px] uppercase font-bold text-cream/60 tracking-wider">
                  Cloud Firestore & Local Dual-Write
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-cream tracking-wide">
                Role & Access Control <span className="text-gold">Center</span>
              </h2>
              <p className="text-xs sm:text-sm text-cream/70 max-w-2xl leading-relaxed">
                Empower your organization with granular, real-time Role-Based Access Control. Assign or remove roles by User ID/Email, modify role-level feature visibility, and configure custom permission overrides with zero downtime.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-nowrap shrink-0">
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="px-4 py-2.5 bg-gold text-ivy rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Custom Role
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-cream/10">
            <div className="bg-white/5 border border-cream/10 rounded-2xl p-3.5 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/60 block">Total Active Users</span>
              <span className="text-xl font-display font-bold text-gold">{members.length}</span>
            </div>
            <div className="bg-white/5 border border-cream/10 rounded-2xl p-3.5 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/60 block">Configured Roles</span>
              <span className="text-xl font-display font-bold text-cream">{availableRoles.length}</span>
            </div>
            <div className="bg-white/5 border border-cream/10 rounded-2xl p-3.5 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/60 block">Protected Capabilities</span>
              <span className="text-xl font-display font-bold text-cream">{PERMISSION_DEFINITIONS.length}</span>
            </div>
            <div className="bg-white/5 border border-cream/10 rounded-2xl p-3.5 backdrop-blur-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/60 block">User Overrides</span>
              <span className="text-xl font-display font-bold text-gold">
                {Object.keys(userOverrides).filter(k => Object.keys(userOverrides[k] || {}).length > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-lg ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/30'
                : 'bg-red-50 text-red-900 border-red-300 ring-1 ring-red-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-ivy/40 hover:text-ivy p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gold/20 pb-3">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-ivy text-cream shadow-md border border-gold/30'
              : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
          }`}
        >
          <Users className="w-4 h-4 text-gold" /> User Rights & Role Assignment
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{members.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'roles'
              ? 'bg-ivy text-cream shadow-md border border-gold/30'
              : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
          }`}
        >
          <Shield className="w-4 h-4 text-gold" /> Role Permissions & Visibility
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{availableRoles.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-ivy text-cream shadow-md border border-gold/30'
              : 'bg-white text-ivy/70 hover:bg-gold/10 border border-gold/15'
          }`}
        >
          <Sliders className="w-4 h-4 text-gold" /> Full Access Matrix
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold/20 text-gold">{PERMISSION_DEFINITIONS.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USER ROLE & RIGHTS ASSIGNMENT (USER ID / EMAIL BASED) */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: User Directory List (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-ivy text-sm uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" /> Select User by ID / Email
                </h3>
                <span className="text-[11px] text-ivy/60 font-semibold">{filteredMembers.length} users</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/40" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by User ID, email, name..."
                  className="w-full pl-10 pr-8 py-2.5 bg-cream/30 border border-gold/20 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold/30"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivy/40 hover:text-ivy">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role Filter Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    userRoleFilter === 'all' ? 'bg-ivy text-cream' : 'bg-cream/50 text-ivy/70 hover:bg-gold/10'
                  }`}
                >
                  All ({members.length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    userRoleFilter === 'admin' ? 'bg-ivy text-cream' : 'bg-cream/50 text-ivy/70 hover:bg-gold/10'
                  }`}
                >
                  Admins
                </button>
                <button
                  onClick={() => setUserRoleFilter('officer')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    userRoleFilter === 'officer' ? 'bg-ivy text-cream' : 'bg-cream/50 text-ivy/70 hover:bg-gold/10'
                  }`}
                >
                  Officers
                </button>
                <button
                  onClick={() => setUserRoleFilter('Committee Chair')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    userRoleFilter === 'Committee Chair' ? 'bg-ivy text-cream' : 'bg-cream/50 text-ivy/70 hover:bg-gold/10'
                  }`}
                >
                  Chairs
                </button>
                <button
                  onClick={() => setUserRoleFilter('overridden')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    userRoleFilter === 'overridden' ? 'bg-amber-600 text-cream' : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  ★ Overrides
                </button>
              </div>

              {/* Scrollable User List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredMembers.map((m) => {
                  const email = (m.email || '').toLowerCase().trim();
                  const isSelected = selectedUserEmail?.toLowerCase() === email;
                  const roles = m.roles && m.roles.length > 0 ? m.roles : [m.role || 'member'];
                  const hasCustomOverrides = !!userOverrides[email] && Object.keys(userOverrides[email]).length > 0;

                  return (
                    <button
                      key={m.email}
                      type="button"
                      onClick={() => setSelectedUserEmail(m.email)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-cream/80 border-gold ring-2 ring-gold/40 shadow-sm'
                          : 'bg-white border-gold/15 hover:border-gold/40 hover:bg-cream/20'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-ivy truncate">{m.name || m.email}</span>
                          {hasCustomOverrides && (
                            <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                              Override Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ivy/60 font-mono truncate">{m.email}</p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {roles.map((r, i) => (
                            <span
                              key={i}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                r === 'admin'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : r === 'officer'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : r.toLowerCase().includes('chair')
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-gold translate-x-1' : 'text-ivy/30'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: User RBAC Configurator (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedMember ? (
              <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-6">
                {/* User Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/15 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/60">
                        User ID / Account Authorization
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedMember.financial_status === 'active' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {selectedMember.financial_status === 'active' ? '● Financial' : '○ Inactive'}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-ivy">{selectedMember.name}</h3>
                    <p className="text-xs text-ivy/70 font-mono">{selectedMember.email}</p>
                    {selectedMember.title && (
                      <p className="text-xs text-gold font-semibold italic">{selectedMember.title}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/60 block mb-1">
                      Account Status
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 bg-cream/60 rounded-xl border border-gold/20 inline-block text-ivy">
                      {selectedMember.is_first_login ? 'First-Time Setup Pending' : 'Verified & Active'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Role Management (Add / Remove Roles) */}
                <div className="space-y-3 bg-cream/30 p-5 rounded-2xl border border-gold/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-ivy text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gold" /> Assigned Roles
                      </h4>
                      <p className="text-[11px] text-ivy/60">
                        Users inherit all capabilities granted to their assigned roles.
                      </p>
                    </div>
                  </div>

                  {/* Active Roles Pills with 1-click removal */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(selectedMember.roles && selectedMember.roles.length > 0 ? selectedMember.roles : [selectedMember.role || 'member']).map((r, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gold/30 text-ivy shadow-xs text-xs font-bold"
                      >
                        <span className="text-gold">●</span>
                        <span>{r}</span>
                        <button
                          type="button"
                          disabled={userActionLoading}
                          onClick={() => handleRemoveRoleFromUser(selectedMember.email, r)}
                          title={`Remove role '${r}' from user`}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Quick Assign New Role Selector */}
                  <div className="pt-3 border-t border-gold/15 flex flex-col sm:flex-row items-center gap-2">
                    <select
                      value={roleToAdd}
                      onChange={(e) => setRoleToAdd(e.target.value)}
                      className="w-full sm:w-auto flex-1 px-3.5 py-2 bg-white border border-gold/25 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer text-ivy"
                    >
                      <option value="">-- Select a Role to Assign --</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.id})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!roleToAdd || userActionLoading}
                      onClick={() => handleAssignRoleToUser(selectedMember.email, roleToAdd)}
                      className="w-full sm:w-auto px-4 py-2 bg-ivy text-cream rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-gold" /> Assign Role
                    </button>
                  </div>
                </div>

                {/* Section 2: Direct User-Level Permission Overrides */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold/15 pb-2">
                    <div>
                      <h4 className="font-bold text-ivy text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-gold" /> Granular Capability Rights (Per User ID)
                      </h4>
                      <p className="text-[11px] text-ivy/60">
                        Override specific feature access for this individual user without changing their entire role.
                      </p>
                    </div>
                  </div>

                  {/* Permissions List */}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {PERMISSION_DEFINITIONS.map((perm) => {
                      const userNormEmail = selectedMember.email.toLowerCase().trim();
                      const overrideVal = userOverrides[userNormEmail]?.[perm.key];
                      const effectiveAccess = checkUserPermission(selectedMember, perm.key, rolePermissions, userOverrides);

                      return (
                        <div
                          key={perm.key}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            overrideVal === true
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : overrideVal === false
                              ? 'bg-red-50/60 border-red-300'
                              : 'bg-white border-gold/15'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-cream text-ivy shrink-0 mt-0.5">
                              {renderPermIcon(perm.iconName, 'w-4 h-4 text-gold')}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-ivy">{perm.label}</span>
                                <span className="text-[10px] text-ivy/50 font-mono">{perm.route}</span>
                              </div>
                              <p className="text-[11px] text-ivy/70 line-clamp-1">{perm.description}</p>
                            </div>
                          </div>

                          {/* 3-State Toggle Button */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserOverride(selectedMember.email, perm.key)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                overrideVal === true
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : overrideVal === false
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : effectiveAccess
                                  ? 'bg-cream text-ivy/80 border border-gold/25 hover:border-gold'
                                  : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                              }`}
                            >
                              {overrideVal === true && <span>✓ Force Granted</span>}
                              {overrideVal === false && <span>✕ Force Revoked</span>}
                              {overrideVal === undefined && (
                                <span>
                                  {effectiveAccess ? '● Granted (Role)' : '○ Denied (Role)'}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gold/30 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cream mx-auto flex items-center justify-center text-gold">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-ivy">No User Selected</h3>
                  <p className="text-xs text-ivy/60 max-w-sm mx-auto">
                    Select a member from the directory on the left to view, assign, or modify their user-specific roles and direct access overrides.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: ROLE PERMISSIONS MATRIX & VISIBILITY (ROLE LEVEL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Role Selector (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-ivy text-sm uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gold" /> System & Custom Roles
                </h3>
                <span className="text-[11px] text-ivy/60 font-semibold">{availableRoles.length} roles</span>
              </div>

              {/* Role Cards List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {availableRoles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  const enabledPerms = rolePermissions[role.id] || ALL_SYSTEM_ROLES.find(r => r.id === role.id)?.defaultPermissions || [];

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 cursor-pointer ${
                        isSelected
                          ? 'bg-cream/80 border-gold ring-2 ring-gold/40 shadow-sm'
                          : 'bg-white border-gold/15 hover:border-gold/40 hover:bg-cream/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${role.color}`}>
                            {role.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-ivy/60 bg-cream/70 px-2 py-0.5 rounded-full border border-gold/15">
                          {role.count} {role.count === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      <p className="text-[11px] text-ivy/70 line-clamp-2 leading-relaxed">
                        {role.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-gold/10 text-[10px] font-semibold text-ivy/60">
                        <span>{enabledPerms.length} / {PERMISSION_DEFINITIONS.length} capabilities active</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-gold translate-x-1' : 'text-ivy/30'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Role Permission Configurator (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRole && (
              <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-6">
                {/* Role Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/15 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedRole.color}`}>
                        {selectedRole.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-ivy/60 tracking-wider">
                        Role Identifier: <code className="font-mono text-gold">{selectedRole.id}</code>
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-ivy">{selectedRole.name} Permissions</h3>
                    <p className="text-xs text-ivy/70 leading-relaxed max-w-xl">{selectedRole.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={roleActionLoading}
                      onClick={() => handleResetRoleDefaults(selectedRole.id)}
                      className="px-3.5 py-2 border border-gold/30 rounded-xl text-xs font-bold uppercase tracking-wider text-ivy/80 hover:bg-cream transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gold" /> Reset to Defaults
                    </button>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-1.5 border-b border-gold/10 pb-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-ivy text-cream shadow-xs'
                          : 'bg-cream/40 text-ivy/70 hover:bg-gold/10 border border-gold/15'
                      }`}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                {/* Permissions Toggles by Group */}
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    if (perms.length === 0) return null;
                    const activePermsForRole = rolePermissions[selectedRole.id] || ALL_SYSTEM_ROLES.find(r => r.id === selectedRole.id)?.defaultPermissions || [];

                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2 border-b border-gold/10 pb-1">
                          <span>{category}</span>
                          <span className="text-[10px] text-ivy/50 font-normal">
                            ({perms.filter(p => activePermsForRole.includes(p.key)).length} / {perms.length} enabled)
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {perms.map((perm) => {
                            const isPermEnabled = activePermsForRole.includes(perm.key);

                            return (
                              <div
                                key={perm.key}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                  isPermEnabled
                                    ? 'bg-cream/30 border-gold/30 shadow-xs'
                                    : 'bg-stone-50/60 border-stone-200 opacity-70'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="p-1.5 rounded-lg bg-white border border-gold/20 text-gold shrink-0">
                                        {renderPermIcon(perm.iconName, 'w-3.5 h-3.5')}
                                      </div>
                                      <span className="font-bold text-xs text-ivy truncate">{perm.label}</span>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                      type="button"
                                      disabled={roleActionLoading}
                                      onClick={() => handleToggleRolePermission(selectedRole.id, perm.key)}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isPermEnabled ? 'bg-green-600' : 'bg-gray-300'
                                      }`}
                                    >
                                      <span className="sr-only">Toggle Permission</span>
                                      <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isPermEnabled ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  <p className="text-[11px] text-ivy/70 leading-relaxed">{perm.description}</p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono text-ivy/50 pt-2 border-t border-gold/10">
                                  <span>{perm.route}</span>
                                  <span className={`font-bold uppercase ${isPermEnabled ? 'text-emerald-700' : 'text-stone-500'}`}>
                                    {isPermEnabled ? '● Visible' : '○ Hidden'}
                                  </span>
                                </div>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: FULL ACCESS MATRIX TABLE */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/15 pb-4">
            <div>
              <h3 className="font-display font-bold text-ivy text-sm uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gold" /> System-Wide Role vs. Capability Matrix
              </h3>
              <p className="text-xs text-ivy/70">
                Cross-sectional view of every capability across all standard and custom roles. Click any cell to toggle access in real-time.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gold/20 bg-cream/30 text-ivy font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 sticky left-0 bg-cream/90 backdrop-blur-xs z-10">Platform Capability</th>
                  {availableRoles.map((role) => (
                    <th key={role.id} className="p-3.5 text-center whitespace-nowrap">
                      <span>{role.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {PERMISSION_DEFINITIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-cream/10 transition-colors">
                    <td className="p-3.5 font-semibold text-ivy sticky left-0 bg-white shadow-xs z-10">
                      <div className="flex items-center gap-2">
                        {renderPermIcon(perm.iconName, 'w-3.5 h-3.5 text-gold shrink-0')}
                        <div>
                          <p className="font-bold text-xs">{perm.label}</p>
                          <p className="text-[10px] text-ivy/50 font-mono">{perm.route}</p>
                        </div>
                      </div>
                    </td>

                    {availableRoles.map((role) => {
                      const activePerms = rolePermissions[role.id] || ALL_SYSTEM_ROLES.find(r => r.id === role.id)?.defaultPermissions || [];
                      const hasAccess = activePerms.includes(perm.key);

                      return (
                        <td key={role.id} className="p-3.5 text-center">
                          <button
                            type="button"
                            disabled={roleActionLoading}
                            onClick={() => handleToggleRolePermission(role.id, perm.key)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center ${
                              hasAccess
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-stone-100 text-stone-400 hover:bg-stone-200 border border-stone-300'
                            }`}
                            title={`Toggle ${perm.label} for ${role.name}`}
                          >
                            {hasAccess ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE NEW CUSTOM ROLE MODAL */}
      <AnimatePresence>
        {showNewRoleModal && (
          <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-gold/30 border p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gold/10 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-display font-bold text-ivy">Create Custom System Role</h3>
                  <p className="text-xs text-ivy/60">Define a new role and configure its baseline capability set.</p>
                </div>
                <button
                  onClick={() => setShowNewRoleModal(false)}
                  className="text-ivy/40 hover:text-ivy p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Role Name *</label>
                  <input
                    required
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none text-xs"
                    placeholder="e.g. Elections Supervisor, Financial Auditor"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none text-xs"
                    placeholder="Describe the scope and responsibilities of this role..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold uppercase tracking-widest text-ivy/60">
                      Initial Capabilities ({newRolePermissions.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newRolePermissions.length === PERMISSION_DEFINITIONS.length) {
                          setNewRolePermissions([]);
                        } else {
                          setNewRolePermissions(PERMISSION_DEFINITIONS.map(p => p.key));
                        }
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-gold hover:underline"
                    >
                      {newRolePermissions.length === PERMISSION_DEFINITIONS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-cream/20 rounded-xl border border-gold/15">
                    {PERMISSION_DEFINITIONS.map((p) => {
                      const isSelected = newRolePermissions.includes(p.key);
                      return (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gold/10 cursor-pointer hover:bg-gold/5"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRolePermissions([...newRolePermissions, p.key]);
                              } else {
                                setNewRolePermissions(newRolePermissions.filter(k => k !== p.key));
                              }
                            }}
                            className="rounded border-gold/30 text-gold focus:ring-gold/20"
                          />
                          <span className="text-[11px] font-medium text-ivy truncate">{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setShowNewRoleModal(false)}
                    className="flex-1 px-5 py-2.5 border border-gold/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cream transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={roleActionLoading || !newRoleName.trim()}
                    className="flex-1 px-5 py-2.5 bg-ivy text-cream rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {roleActionLoading ? 'Creating...' : 'Create Role'}
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
