/**
 * @file rbac.ts
 * @description Centralized Role-Based Access Control (RBAC) logic for orderofkpi.org.
 *
 * This module defines all roles, permissions, and route-access mappings for the
 * application. All role/permission checks should be performed through the helpers
 * exported here rather than inline string comparisons scattered across the codebase.
 *
 * Session storage keys used:
 *  - `userRole`  — the authenticated user's role (one of `UserRole`)
 *  - `userEmail` — the authenticated user's email address
 *
 * @module rbac
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * All valid roles a user may hold within the Order of KPI application.
 *
 * - `admin`                      — Full super-user access; currently pinned to
 *                                   admin@orderofkpi.org.
 * - `officer`                    — Chapter officer with broad access, excluding
 *                                   the Admin Dashboard.
 * - `Membership Committee Chair` — Chair of the Membership Committee; has all
 *                                   committee permissions plus the Chair Dashboard.
 *                                   Currently pinned to james.haywood@orderofkpi.org.
 * - `Membership Committee`       — Standard committee member; can track candidates
 *                                   and review applications.
 * - `member`                     — Full chapter member; accesses core member utilities
 *                                   and the Process Timeline.
 * - `prospective`                — Prospective/interested applicant; restricted to
 *                                   the applicant portal and membership form.
 * - `applicant`                  — Active applicant (alias of `prospective` in terms
 *                                   of access); restricted to the applicant portal
 *                                   and membership form.
 */
export type UserRole =
  | 'admin'
  | 'officer'
  | 'Membership Committee Chair'
  | 'Membership Committee'
  | 'member'
  | 'prospective'
  | 'applicant';

/**
 * Granular permission tokens used to gate individual features or data access.
 *
 * Naming convention: `<verb>:<resource>`
 *
 * - `view:adminDashboard`     — Access the Admin Dashboard page.
 * - `view:candidateTracker`   — Access the Candidate Tracker page.
 * - `view:reviewApplications` — Access the Review Applications page.
 * - `view:chairDashboard`     — Access the Committee Chair Dashboard page.
 * - `view:processTimeline`    — Access the Process / Gantt-chart Timeline page.
 * - `view:memberCore`         — Access core member utilities (roster, calendar,
 *                                 finances, voting).
 * - `view:applicantPortal`    — Access the Applicant Portal page.
 * - `write:candidates`        — Create or modify candidate records.
 * - `read:allApplications`    — Read any member's application data.
 * - `read:ownApplication`     — Read only the current user's own application.
 */
export type Permission =
  | 'view:adminDashboard'
  | 'view:candidateTracker'
  | 'view:reviewApplications'
  | 'view:chairDashboard'
  | 'view:processTimeline'
  | 'view:memberCore'
  | 'view:applicantPortal'
  | 'write:candidates'
  | 'read:allApplications'
  | 'read:ownApplication';

// ---------------------------------------------------------------------------
// Role -> Permission matrix
// ---------------------------------------------------------------------------

/**
 * Canonical mapping of every role to the permissions it grants.
 *
 * This is the single source of truth for access control decisions.
 * Update this map whenever role requirements change — all downstream helpers
 * (`hasPermission`, `getAllowedRoutes`, etc.) derive from it automatically.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  /** Admin — unrestricted access to every permission in the system. */
  admin: [
    'view:adminDashboard',
    'view:candidateTracker',
    'view:reviewApplications',
    'view:chairDashboard',
    'view:processTimeline',
    'view:memberCore',
    'view:applicantPortal',
    'write:candidates',
    'read:allApplications',
    'read:ownApplication',
  ],

  /** Officer — broad access but explicitly excluded from the Admin Dashboard. */
  officer: [
    'view:candidateTracker',
    'view:reviewApplications',
    'view:chairDashboard',
    'view:processTimeline',
    'view:memberCore',
    'write:candidates',
    'read:allApplications',
  ],

  /**
   * Membership Committee Chair — full committee access plus the Chair Dashboard.
   * Currently held by james.haywood@orderofkpi.org.
   */
  'Membership Committee Chair': [
    'view:candidateTracker',
    'view:reviewApplications',
    'view:chairDashboard',
    'view:processTimeline',
    'read:allApplications',
    'write:candidates',
  ],

  /**
   * Membership Committee — can track candidates, review applications,
   * and view the process timeline.
   */
  'Membership Committee': [
    'view:candidateTracker',
    'view:reviewApplications',
    'view:processTimeline',
    'read:allApplications',
  ],

  /**
   * Member — access to the process timeline and core member utilities
   * (roster, calendar, finances, voting).
   */
  member: [
    'view:processTimeline',
    'view:memberCore',
  ],

  /** Prospective — restricted to the applicant portal and their own application. */
  prospective: [
    'view:applicantPortal',
    'read:ownApplication',
  ],

  /** Applicant — same access as `prospective`; represents an active applicant. */
  applicant: [
    'view:applicantPortal',
    'read:ownApplication',
  ],
};

// ---------------------------------------------------------------------------
// Route -> Allowed roles map
// ---------------------------------------------------------------------------

/**
 * Maps each application route path to the set of roles that may access it.
 *
 * Used by route guards to redirect unauthorized users. A user is allowed on a
 * route if their role appears in that route's array.
 *
 * | Path                     | Allowed roles                                               |
 * |--------------------------|-------------------------------------------------------------|
 * | /admin-dashboard         | admin                                                       |
 * | /candidate-tracker       | admin, officer, Membership Committee Chair/Committee        |
 * | /review-applications     | admin, officer, Membership Committee Chair/Committee        |
 * | /chair-dashboard         | admin, officer, Membership Committee Chair                  |
 * | /gantt-chart             | admin, officer, Membership Committee Chair/Committee, member|
 * | /member-portal           | admin, officer, member                                      |
 * | /applicant-portal        | admin, prospective, applicant                               |
 * | /membership-application  | prospective, applicant                                      |
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/admin-dashboard': ['admin'],

  '/candidate-tracker': [
    'admin',
    'officer',
    'Membership Committee Chair',
    'Membership Committee',
  ],

  '/review-applications': [
    'admin',
    'officer',
    'Membership Committee Chair',
    'Membership Committee',
  ],

  '/chair-dashboard': [
    'admin',
    'officer',
    'Membership Committee Chair',
  ],

  '/gantt-chart': [
    'admin',
    'officer',
    'Membership Committee Chair',
    'Membership Committee',
    'member',
  ],

  '/member-portal': [
    'admin',
    'officer',
    'member',
  ],

  '/applicant-portal': [
    'admin',
    'prospective',
    'applicant',
  ],

  '/membership-application': [
    'prospective',
    'applicant',
  ],
};

// ---------------------------------------------------------------------------
// Privileged identity constants
// ---------------------------------------------------------------------------

/** Email address that is unconditionally treated as an admin. */
const ADMIN_EMAIL = 'admin@orderofkpi.org';

/** Email address of the Membership Committee Chair. */
const CHAIR_EMAIL = 'james.haywood@orderofkpi.org';

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Reads the current user's role from `sessionStorage`.
 *
 * Returns `null` if no role is stored (i.e. the user is unauthenticated or
 * the session has expired). The stored value is validated against the known
 * set of `UserRole` values before being returned to prevent spoofing.
 *
 * @returns The current {@link UserRole}, or `null` if unavailable.
 *
 * @example
 * const role = getCurrentUserRole();
 * if (!role) { redirectToLogin(); }
 */
export function getCurrentUserRole(): UserRole | null {
  if (typeof window === 'undefined') {
    // SSR / non-browser environment — sessionStorage is unavailable.
    return null;
  }

  const raw = sessionStorage.getItem('userRole');
  if (!raw) return null;

  const knownRoles: UserRole[] = [
    'admin',
    'officer',
    'Membership Committee Chair',
    'Membership Committee',
    'member',
    'prospective',
    'applicant',
  ];

  return knownRoles.includes(raw as UserRole) ? (raw as UserRole) : null;
}

/**
 * Reads the current user's email from `sessionStorage`.
 *
 * @returns The user's email string, or `null` if not stored.
 */
function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('userEmail');
}

// ---------------------------------------------------------------------------
// Core permission check
// ---------------------------------------------------------------------------

/**
 * Determines whether a user with the given role holds the specified permission.
 *
 * If `role` is omitted or `null`, the current session role is used as a
 * fallback via {@link getCurrentUserRole}.
 *
 * @param permission - The {@link Permission} token to check.
 * @param role       - Optional role to check against; defaults to the session role.
 * @returns `true` if the role grants the permission, `false` otherwise.
 *
 * @example
 * // Check the current session user:
 * if (hasPermission('view:adminDashboard')) { showAdminLink(); }
 *
 * // Check a specific role explicitly:
 * if (hasPermission('write:candidates', 'officer')) { enableEditButton(); }
 */
export function hasPermission(
  permission: Permission,
  role?: UserRole | null,
): boolean {
  const effectiveRole = role !== undefined ? role : getCurrentUserRole();
  if (!effectiveRole) return false;

  const permissions: Permission[] = ROLE_PERMISSIONS[effectiveRole] ?? [];
  return permissions.includes(permission);
}

// ---------------------------------------------------------------------------
// Convenience role checks
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the current session user should be treated as an admin.
 *
 * A user is considered an admin if **either**:
 * 1. Their stored `userRole` is `'admin'`, **or**
 * 2. Their stored `userEmail` matches `admin@orderofkpi.org`, regardless of
 *    what role value is stored.
 *
 * The email override acts as a safety net so the designated admin account
 * always retains full access even if the stored role value is missing or
 * corrupted.
 *
 * @returns `true` if the current user is an admin.
 *
 * @example
 * if (isAdmin()) { renderAdminPanel(); }
 */
export function isAdmin(): boolean {
  const role = getCurrentUserRole();
  const email = getCurrentUserEmail();
  return role === 'admin' || email === ADMIN_EMAIL;
}

/**
 * Returns `true` if the current session user is a prospective member or an
 * active applicant (i.e. their role is `'prospective'` or `'applicant'`).
 *
 * @returns `true` if the current user is in the applicant funnel.
 *
 * @example
 * if (isApplicant()) { showMembershipForm(); }
 */
export function isApplicant(): boolean {
  const role = getCurrentUserRole();
  return role === 'prospective' || role === 'applicant';
}

/**
 * Returns `true` if the current session user is the Membership Committee Chair.
 *
 * A user is considered the Chair if **either**:
 * 1. Their stored `userRole` is `'Membership Committee Chair'`, **or**
 * 2. Their stored `userEmail` matches `james.haywood@orderofkpi.org`.
 *
 * @returns `true` if the current user is the Committee Chair.
 */
export function isCommitteeChair(): boolean {
  const role = getCurrentUserRole();
  const email = getCurrentUserEmail();
  return role === 'Membership Committee Chair' || email === CHAIR_EMAIL;
}

// ---------------------------------------------------------------------------
// Route-level helpers
// ---------------------------------------------------------------------------

/**
 * Returns the list of route paths that the given role is permitted to access,
 * derived from {@link ROUTE_PERMISSIONS}.
 *
 * Useful for dynamically building navigation menus that only surface links
 * relevant to the current user.
 *
 * @param role - The {@link UserRole} to resolve routes for.
 * @returns An array of route path strings the role may visit.
 *
 * @example
 * const routes = getAllowedRoutes('member');
 * // -> ['/gantt-chart', '/member-portal']
 *
 * const adminRoutes = getAllowedRoutes('admin');
 * // -> all eight routes
 */
export function getAllowedRoutes(role: UserRole): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route);
}

/**
 * Determines whether the given role is authorized to access a specific route.
 *
 * If `role` is omitted, the current session role is used as a fallback via
 * {@link getCurrentUserRole}. Returns `false` for any route not listed in
 * {@link ROUTE_PERMISSIONS}.
 *
 * @param routePath - The route path to check (e.g. `'/admin-dashboard'`).
 * @param role      - Optional role override; defaults to the session role.
 * @returns `true` if the role may access the route, `false` otherwise.
 *
 * @example
 * if (!canAccessRoute('/admin-dashboard')) {
 *   router.push('/member-portal');
 * }
 */
export function canAccessRoute(
  routePath: string,
  role?: UserRole | null,
): boolean {
  const effectiveRole = role !== undefined ? role : getCurrentUserRole();
  if (!effectiveRole) return false;

  const allowedRoles = ROUTE_PERMISSIONS[routePath];
  if (!allowedRoles) {
    // Route not listed in ROUTE_PERMISSIONS — treat as inaccessible.
    return false;
  }
  return allowedRoles.includes(effectiveRole);
}
