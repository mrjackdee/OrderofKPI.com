import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Member, CommitteeSlug } from '../types';

export type PermissionKey =
  | 'admin_dashboard'
  | 'candidate_tracker'
  | 'review_applications'
  | 'candidate_voting'
  | 'candidate_voting_audit'
  | 'candidate_voting_report'
  | 'selection_voting'
  | 'dean_nomination'
  | 'dean_nomination_dashboard'
  | 'dean_audit_dashboard'
  | 'dean_voting'
  | 'dean_voting_dashboard'
  | 'dean_voting_audit'
  | 'financial_roster'
  | 'member_directory'
  | 'committee_workspaces'
  | 'committee_chair_dashboard'
  | 'governance_archives'
  | 'intake_calendar'
  | 'gantt_chart'
  | 'classroom_portal';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Administration & Security' | 'Candidate & Intake Ops' | 'Voting & Elections' | 'Membership & Governance' | 'Committees';
  description: string;
  route: string;
  iconName: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Administration & Security
  {
    key: 'admin_dashboard',
    label: 'Admin Control Center & Tools',
    category: 'Administration & Security',
    description: 'Full administrative access to user directory, candidates, system settings, RBAC, and audit trail.',
    route: '/admin-dashboard',
    iconName: 'Shield'
  },
  {
    key: 'dean_audit_dashboard',
    label: 'Dean Nomination Audit Trail',
    category: 'Administration & Security',
    description: 'Access to security audit logs for Dean of Intake nominations.',
    route: '/dean-audit-dashboard',
    iconName: 'Clock'
  },
  {
    key: 'dean_voting_audit',
    label: 'Dean Election Voting Audit Trail',
    category: 'Administration & Security',
    description: 'Security and verification audit trail for Dean of Intake voting tallies.',
    route: '/dean-voting-audit',
    iconName: 'ShieldAlert'
  },
  {
    key: 'candidate_voting_audit',
    label: 'Candidate Voting Audit Trail',
    category: 'Administration & Security',
    description: 'Audit logs and raw voting tallies for active candidate ballots.',
    route: '/candidate-voting-audit',
    iconName: 'ShieldCheck'
  },

  // Candidate & Intake Ops
  {
    key: 'candidate_tracker',
    label: 'Candidate Pipeline & Tracker',
    category: 'Candidate & Intake Ops',
    description: 'Manage, track, and advance prospective candidates across pipeline stages.',
    route: '/candidate-tracker',
    iconName: 'UserCheck'
  },
  {
    key: 'review_applications',
    label: 'Review & Score Applications',
    category: 'Candidate & Intake Ops',
    description: 'Access applicant submissions, questionnaires, and evaluation scoring sheets.',
    route: '/review-applications',
    iconName: 'ClipboardCheck'
  },
  {
    key: 'intake_calendar',
    label: 'Intake Operations Calendar',
    category: 'Candidate & Intake Ops',
    description: 'Official intake schedule, milestones, and interview review timeline.',
    route: '/intake-calendar',
    iconName: 'CalendarDays'
  },
  {
    key: 'gantt_chart',
    label: 'Intake Gantt Chart Timeline',
    category: 'Candidate & Intake Ops',
    description: 'Interactive project management Gantt chart for intake operations.',
    route: '/gantt-chart',
    iconName: 'FolderKanban'
  },
  {
    key: 'classroom_portal',
    label: 'Candidate Classroom Portal',
    category: 'Candidate & Intake Ops',
    description: 'Candidate educational curriculum, materials, and onboarding assignments.',
    route: '/classroom-portal',
    iconName: 'BookOpen'
  },

  // Voting & Elections
  {
    key: 'candidate_voting',
    label: 'Candidate Secret Ballot Voting',
    category: 'Voting & Elections',
    description: 'Cast official candidate votes during the scheduled voting window.',
    route: '/candidate-voting',
    iconName: 'Vote'
  },
  {
    key: 'candidate_voting_report',
    label: 'Candidate Voting Certified Report',
    category: 'Voting & Elections',
    description: 'View certified candidate election results and voting breakdowns.',
    route: '/candidate-voting-report',
    iconName: 'FileCheck'
  },
  {
    key: 'selection_voting',
    label: 'Intake Selection Voting Session',
    category: 'Voting & Elections',
    description: 'Real-time intake selection voting room for authorized membership.',
    route: '/selection-voting',
    iconName: 'CheckSquare'
  },
  {
    key: 'dean_nomination',
    label: 'Dean Nomination Form',
    category: 'Voting & Elections',
    description: 'Submit official nominations for Dean of Intake.',
    route: '/dean-nomination',
    iconName: 'Award'
  },
  {
    key: 'dean_nomination_dashboard',
    label: 'Dean Nominations Management',
    category: 'Voting & Elections',
    description: 'Review and manage active Dean of Intake nominations.',
    route: '/dean-nomination-dashboard',
    iconName: 'ListOrdered'
  },
  {
    key: 'dean_voting',
    label: 'Dean Election Voting Form',
    category: 'Voting & Elections',
    description: 'Cast official ballot for Dean of Intake elections.',
    route: '/dean-voting',
    iconName: 'Vote'
  },
  {
    key: 'dean_voting_dashboard',
    label: 'Dean Election Voting Dashboard',
    category: 'Voting & Elections',
    description: 'Track live voting turnout and tallies for Dean of Intake elections.',
    route: '/dean-voting-dashboard',
    iconName: 'BarChart3'
  },

  // Membership & Governance
  {
    key: 'member_directory',
    label: 'Active Member Directory',
    category: 'Membership & Governance',
    description: 'Searchable member directory with contact info and industry tags.',
    route: '/member-directory',
    iconName: 'Users'
  },
  {
    key: 'financial_roster',
    label: 'Financial Roster & Dues',
    category: 'Membership & Governance',
    description: 'Official roster showing dues standings and financial membership records.',
    route: '/financial-roster',
    iconName: 'DollarSign'
  },
  {
    key: 'governance_archives',
    label: 'Governance Archives & Bylaws',
    category: 'Membership & Governance',
    description: 'Access official constitution, bylaws, standing rules, and amendments.',
    route: '/governance-archives',
    iconName: 'Archive'
  },

  // Committees
  {
    key: 'committee_workspaces',
    label: 'Standing Committee Workspaces',
    category: 'Committees',
    description: 'Access assigned committee drives, meeting agendas, and workspaces.',
    route: '/committee/:slug',
    iconName: 'Layers'
  },
  {
    key: 'committee_chair_dashboard',
    label: 'Committee Chair Control Center',
    category: 'Committees',
    description: 'Leadership dashboard for committee chairs to manage rosters & links.',
    route: '/chair-dashboard',
    iconName: 'Crown'
  }
];

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  color: string;
  defaultPermissions: PermissionKey[];
}

export const ALL_SYSTEM_ROLES: SystemRole[] = [
  {
    id: 'admin',
    name: 'Super Administrator',
    description: 'Full, unrestricted administrative authority across the entire platform, user database, and security configuration.',
    isSystemRole: true,
    color: 'bg-red-100 text-red-900 border-red-300',
    defaultPermissions: PERMISSION_DEFINITIONS.map(p => p.key)
  },
  {
    id: 'officer',
    name: 'Officer / 1st Anti-Basileus',
    description: 'Executive leadership oversight across intake operations, governance archives, candidate tracking, and committee portfolios.',
    isSystemRole: true,
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    defaultPermissions: [
      'candidate_tracker',
      'review_applications',
      'candidate_voting',
      'candidate_voting_report',
      'dean_nomination',
      'dean_nomination_dashboard',
      'dean_voting',
      'dean_voting_dashboard',
      'financial_roster',
      'member_directory',
      'committee_workspaces',
      'committee_chair_dashboard',
      'governance_archives',
      'intake_calendar',
      'gantt_chart'
    ]
  },
  {
    id: 'Super Committee Chair',
    name: 'Super Committee Chair',
    description: 'Executive chair oversight granting access across all standing organizational committee workspaces.',
    isSystemRole: true,
    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    defaultPermissions: [
      'member_directory',
      'financial_roster',
      'candidate_voting',
      'dean_nomination',
      'dean_voting',
      'committee_workspaces',
      'committee_chair_dashboard',
      'governance_archives',
      'intake_calendar',
      'gantt_chart'
    ]
  },
  {
    id: 'Committee Chair',
    name: 'Standing Committee Chair',
    description: 'Assigned leader of a specific standing committee with chair management rights.',
    isSystemRole: true,
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    defaultPermissions: [
      'member_directory',
      'financial_roster',
      'candidate_voting',
      'dean_nomination',
      'dean_voting',
      'committee_workspaces',
      'committee_chair_dashboard',
      'governance_archives',
      'intake_calendar'
    ]
  },
  {
    id: 'Membership Committee Chair',
    name: 'Membership Committee Chair',
    description: 'Leader of Membership & Intake with full candidate review and pipeline management rights.',
    isSystemRole: true,
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    defaultPermissions: [
      'candidate_tracker',
      'review_applications',
      'candidate_voting',
      'candidate_voting_report',
      'dean_nomination',
      'dean_nomination_dashboard',
      'dean_voting',
      'dean_voting_dashboard',
      'member_directory',
      'financial_roster',
      'committee_workspaces',
      'committee_chair_dashboard',
      'governance_archives',
      'intake_calendar',
      'gantt_chart'
    ]
  },
  {
    id: 'Membership Committee',
    name: 'Membership Committee Member',
    description: 'Assigned committee member for intake interviews, application scoring, and tracker evaluation.',
    isSystemRole: true,
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    defaultPermissions: [
      'candidate_tracker',
      'review_applications',
      'candidate_voting',
      'dean_nomination',
      'dean_voting',
      'member_directory',
      'financial_roster',
      'committee_workspaces',
      'governance_archives',
      'intake_calendar',
      'gantt_chart'
    ]
  },
  {
    id: 'member',
    name: 'Active Financial Member',
    description: 'Standard member access to directory, financial roster, official voting, and assigned committee rooms.',
    isSystemRole: true,
    color: 'bg-blue-100 text-blue-900 border-blue-300',
    defaultPermissions: [
      'member_directory',
      'financial_roster',
      'candidate_voting',
      'dean_nomination',
      'dean_voting',
      'governance_archives',
      'intake_calendar',
      'committee_workspaces'
    ]
  },
  {
    id: 'applicant',
    name: 'Intake Candidate / Applicant',
    description: 'Prospective applicant with restricted access limited to the candidate classroom and application portal.',
    isSystemRole: true,
    color: 'bg-stone-100 text-stone-800 border-stone-300',
    defaultPermissions: [
      'classroom_portal'
    ]
  }
];

export type RolePermissionsMap = Record<string, PermissionKey[]>;
export type UserOverridesMap = Record<string, Record<string, boolean>>; // userEmail/id -> { permissionKey: true/false }

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = ALL_SYSTEM_ROLES.reduce((acc, role) => {
  acc[role.id] = [...role.defaultPermissions];
  return acc;
}, {} as RolePermissionsMap);

const RBAC_STORAGE_KEY = 'kpi_rbac_role_permissions_v1';
const RBAC_OVERRIDES_KEY = 'kpi_rbac_user_overrides_v1';
const RBAC_EVENT_NAME = 'kpi_rbac_state_changed';

function getStoredRolePermissions(): RolePermissionsMap {
  try {
    const raw = localStorage.getItem(RBAC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_ROLE_PERMISSIONS;
}

function getStoredUserOverrides(): UserOverridesMap {
  try {
    const raw = localStorage.getItem(RBAC_OVERRIDES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {};
}

function persistRbacLocally(rolePermissions: RolePermissionsMap, userOverrides: UserOverridesMap) {
  try {
    localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(rolePermissions));
    localStorage.setItem(RBAC_OVERRIDES_KEY, JSON.stringify(userOverrides));
    window.dispatchEvent(new CustomEvent(RBAC_EVENT_NAME, {
      detail: { rolePermissions, userOverrides }
    }));
  } catch (e) {}
}

/**
 * Universal Permission Evaluator
 * Checks whether a user possesses a specific permission taking into account:
 * 1. Admin / superuser bypass
 * 2. User-level explicit grant / revoke override (keyed by email or ID)
 * 3. Dynamic role-level permissions (from live Firestore/Express state)
 * 4. Backward-compatible fallback
 */
export function checkUserPermission(
  user: {
    email?: string;
    role?: string;
    roles?: string[];
    title?: string;
    permissions?: Record<string, boolean>;
  } | null,
  permissionKey: PermissionKey,
  rolePermissions: RolePermissionsMap = getStoredRolePermissions(),
  userOverrides: UserOverridesMap = getStoredUserOverrides()
): boolean {
  if (!user) return false;

  const email = (user.email || '').toLowerCase().trim();
  const rawRole = (user.role || '').toLowerCase().trim();
  const roles = (user.roles && user.roles.length > 0) ? user.roles : (user.role ? [user.role] : ['member']);

  // Admin bypass
  const isAdmin = rawRole === 'admin' ||
                  roles.includes('admin') ||
                  email === 'admin@orderofkpi.org' ||
                  email === 'qa.admin@orderofkpi.org' ||
                  email === 'info@kpi2012.org';
  if (isAdmin) return true;

  // Check direct user-level permission override
  const directOverride = user.permissions?.[permissionKey] ?? userOverrides[email]?.[permissionKey];
  if (directOverride !== undefined) {
    return directOverride === true;
  }

  // Check roles against role-permissions matrix
  for (const role of roles) {
    const perms = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    if (perms.includes(permissionKey)) {
      return true;
    }
    // Check partial matches for committee chairs (e.g. 'Scholarship Committee Chair')
    if (role.toLowerCase().includes('chair')) {
      const chairPerms = rolePermissions['Committee Chair'] || DEFAULT_ROLE_PERMISSIONS['Committee Chair'] || [];
      if (chairPerms.includes(permissionKey)) return true;
    }
    if (role.toLowerCase().includes('membership')) {
      const memPerms = rolePermissions['Membership Committee'] || DEFAULT_ROLE_PERMISSIONS['Membership Committee'] || [];
      if (memPerms.includes(permissionKey)) return true;
    }
  }

  return false;
}

/**
 * Hook for consuming live real-time RBAC configuration
 */
export function useRBAC() {
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(getStoredRolePermissions);
  const [userOverrides, setUserOverrides] = useState<UserOverridesMap>(getStoredUserOverrides);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ rolePermissions: RolePermissionsMap; userOverrides: UserOverridesMap }>;
      if (customEvent.detail) {
        if (customEvent.detail.rolePermissions) setRolePermissions(customEvent.detail.rolePermissions);
        if (customEvent.detail.userOverrides) setUserOverrides(customEvent.detail.userOverrides);
      }
    };
    window.addEventListener(RBAC_EVENT_NAME, handleLocalUpdate);

    // 1. Fetch from Express API
    fetch('/api/rbac/config')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          const mergedRoles = { ...DEFAULT_ROLE_PERMISSIONS, ...(data.rolePermissions || {}) };
          const overrides = data.userOverrides || {};
          setRolePermissions(mergedRoles);
          setUserOverrides(overrides);
          persistRbacLocally(mergedRoles, overrides);
        }
      })
      .catch(() => {});

    // 2. Real-time Firestore sync
    let unsubscribeRoles = () => {};
    let unsubscribeOverrides = () => {};
    try {
      const roleRef = doc(db, 'system_settings', 'role_permissions');
      unsubscribeRoles = onSnapshot(roleRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as RolePermissionsMap;
          const merged = { ...DEFAULT_ROLE_PERMISSIONS, ...cloudData };
          setRolePermissions(merged);
          persistRbacLocally(merged, userOverrides);
        }
      }, () => {});

      const overrideRef = doc(db, 'system_settings', 'user_overrides');
      unsubscribeOverrides = onSnapshot(overrideRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudOverrides = docSnap.data() as UserOverridesMap;
          setUserOverrides(cloudOverrides);
          persistRbacLocally(rolePermissions, cloudOverrides);
        }
      }, () => {});
    } catch (e) {}

    return () => {
      window.removeEventListener(RBAC_EVENT_NAME, handleLocalUpdate);
      unsubscribeRoles();
      unsubscribeOverrides();
    };
  }, []);

  return {
    rolePermissions,
    userOverrides,
    loading,
    hasPermission: (user: any, permissionKey: PermissionKey) => checkUserPermission(user, permissionKey, rolePermissions, userOverrides)
  };
}

/**
 * Real-time Dual-Write for Role Permissions
 */
export async function updateRolePermissions(roleId: string, permissions: PermissionKey[]): Promise<boolean> {
  const current = getStoredRolePermissions();
  const nextRoles: RolePermissionsMap = {
    ...current,
    [roleId]: permissions
  };
  const overrides = getStoredUserOverrides();
  persistRbacLocally(nextRoles, overrides);

  let cloudSuccess = false;
  let backendSuccess = false;

  // Cloud Firestore Dual-Write
  try {
    const roleRef = doc(db, 'system_settings', 'role_permissions');
    await setDoc(roleRef, nextRoles, { merge: true });
    cloudSuccess = true;
  } catch (e) {
    console.warn("Firestore update role permissions notice:", e);
  }

  // Express API Dual-Write
  try {
    const res = await fetch('/api/rbac/role-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, permissions })
    });
    if (res.ok) backendSuccess = true;
  } catch (e) {
    console.warn("Express API update role permissions notice:", e);
  }

  return cloudSuccess || backendSuccess;
}

/**
 * Real-time Dual-Write for User Level Permissions Override
 */
export async function updateUserPermissionOverride(
  userEmail: string,
  permissionKey: PermissionKey,
  value: boolean | undefined // undefined means reset to role default
): Promise<boolean> {
  const normEmail = userEmail.toLowerCase().trim();
  const currentOverrides = getStoredUserOverrides();
  const userMap = { ...(currentOverrides[normEmail] || {}) };

  if (value === undefined) {
    delete userMap[permissionKey];
  } else {
    userMap[permissionKey] = value;
  }

  const nextOverrides: UserOverridesMap = {
    ...currentOverrides,
    [normEmail]: userMap
  };

  const rolePerms = getStoredRolePermissions();
  persistRbacLocally(rolePerms, nextOverrides);

  let cloudSuccess = false;
  let backendSuccess = false;

  // Cloud Firestore Dual-Write
  try {
    const overrideRef = doc(db, 'system_settings', 'user_overrides');
    await setDoc(overrideRef, nextOverrides, { merge: true });
    cloudSuccess = true;
  } catch (e) {
    console.warn("Firestore user override update notice:", e);
  }

  // Express API Dual-Write
  try {
    const res = await fetch('/api/rbac/user-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, permissionKey, value })
    });
    if (res.ok) backendSuccess = true;
  } catch (e) {
    console.warn("Express API user override update notice:", e);
  }

  return cloudSuccess || backendSuccess;
}

/**
 * Assign or Remove Roles for a user by Email/User ID with live Dual-Write
 */
export async function updateUserRoles(
  userEmail: string,
  roles: string[],
  adminEmail?: string
): Promise<{ success: boolean; message: string }> {
  const normEmail = userEmail.toLowerCase().trim();
  const primaryRole = roles[0] || 'member';

  let cloudSuccess = false;
  let backendSuccess = false;

  // 1. Update in Express backend API
  try {
    const res = await fetch(`/api/members/${encodeURIComponent(normEmail)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normEmail,
        role: primaryRole,
        roles: roles,
        adminEmail: adminEmail || 'admin'
      })
    });
    if (res.ok) {
      backendSuccess = true;
    }
  } catch (e) {
    console.warn("Backend user roles update error:", e);
  }

  // 2. Dual-Write to Cloud Firestore `portal_members`
  try {
    const memberDocRef = doc(db, 'portal_members', normEmail.replace(/\//g, '_'));
    await setDoc(memberDocRef, {
      email: normEmail,
      role: primaryRole,
      roles: roles,
      updated_at: new Date().toISOString()
    }, { merge: true });
    cloudSuccess = true;
  } catch (e) {
    console.warn("Firestore portal_members update error:", e);
  }

  if (cloudSuccess || backendSuccess) {
    return {
      success: true,
      message: `Roles updated for ${normEmail}.`
    };
  }

  return {
    success: false,
    message: `Failed to update roles for ${normEmail}. Please check network connection.`
  };
}
