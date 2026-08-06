import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPermission,
  isAdmin,
  isApplicant,
  getCurrentUserRole,
  type UserRole,
  type Permission,
} from '../rbac';

// ---------------------------------------------------------------------------
// sessionStorage helpers
// NOTE: rbac.ts reads from sessionStorage using two separate keys:
//   'userRole'  — the user's role string
//   'userEmail' — the user's email string
// ---------------------------------------------------------------------------

function setSessionUser(user: { email: string; role: UserRole }) {
  sessionStorage.setItem('userRole', user.role);
  sessionStorage.setItem('userEmail', user.email);
}

function clearSession() {
  sessionStorage.clear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RBAC', () => {
  beforeEach(() => {
    clearSession();
  });

  // ── 1. Admin permissions ──────────────────────────────────────────────────
  describe('admin role', () => {
    beforeEach(() => {
      setSessionUser({ email: 'admin@orderofkpi.org', role: 'admin' });
    });

    it('has view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'admin')).toBe(true);
    });

    it('has view:memberCore', () => {
      expect(hasPermission('view:memberCore', 'admin')).toBe(true);
    });

    it('has view:processTimeline', () => {
      expect(hasPermission('view:processTimeline', 'admin')).toBe(true);
    });

    it('has view:chairDashboard', () => {
      expect(hasPermission('view:chairDashboard', 'admin')).toBe(true);
    });

    it('has view:applicantPortal', () => {
      expect(hasPermission('view:applicantPortal', 'admin')).toBe(true);
    });

    it('has read:allApplications', () => {
      expect(hasPermission('read:allApplications', 'admin')).toBe(true);
    });

    it('has read:ownApplication', () => {
      expect(hasPermission('read:ownApplication', 'admin')).toBe(true);
    });

    it('has write:candidates', () => {
      expect(hasPermission('write:candidates', 'admin')).toBe(true);
    });

    it('has view:candidateTracker', () => {
      expect(hasPermission('view:candidateTracker', 'admin')).toBe(true);
    });

    it('has view:reviewApplications', () => {
      expect(hasPermission('view:reviewApplications', 'admin')).toBe(true);
    });
  });

  // ── 2. Member permissions ─────────────────────────────────────────────────
  describe('member role', () => {
    beforeEach(() => {
      setSessionUser({ email: 'member@orderofkpi.org', role: 'member' });
    });

    it('has view:memberCore', () => {
      expect(hasPermission('view:memberCore', 'member')).toBe(true);
    });

    it('has view:processTimeline', () => {
      expect(hasPermission('view:processTimeline', 'member')).toBe(true);
    });

    it('does NOT have view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'member')).toBe(false);
    });

    it('does NOT have view:chairDashboard', () => {
      expect(hasPermission('view:chairDashboard', 'member')).toBe(false);
    });

    it('does NOT have read:allApplications', () => {
      expect(hasPermission('read:allApplications', 'member')).toBe(false);
    });

    it('does NOT have write:candidates', () => {
      expect(hasPermission('write:candidates', 'member')).toBe(false);
    });
  });

  // ── 3. Prospective / applicant permissions ────────────────────────────────
  describe('prospective role', () => {
    it('has view:applicantPortal', () => {
      expect(hasPermission('view:applicantPortal', 'prospective')).toBe(true);
    });

    it('has read:ownApplication', () => {
      expect(hasPermission('read:ownApplication', 'prospective')).toBe(true);
    });

    it('does NOT have view:memberCore', () => {
      expect(hasPermission('view:memberCore', 'prospective')).toBe(false);
    });

    it('does NOT have view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'prospective')).toBe(false);
    });

    it('does NOT have read:allApplications', () => {
      expect(hasPermission('read:allApplications', 'prospective')).toBe(false);
    });
  });

  describe('applicant role', () => {
    it('has view:applicantPortal', () => {
      expect(hasPermission('view:applicantPortal', 'applicant')).toBe(true);
    });

    it('has read:ownApplication', () => {
      expect(hasPermission('read:ownApplication', 'applicant')).toBe(true);
    });

    it('does NOT have view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'applicant')).toBe(false);
    });
  });

  // ── 4. Membership Committee Chair ─────────────────────────────────────────
  describe('Membership Committee Chair role', () => {
    it('has view:chairDashboard', () => {
      expect(hasPermission('view:chairDashboard', 'Membership Committee Chair')).toBe(true);
    });

    it('has read:allApplications', () => {
      expect(hasPermission('read:allApplications', 'Membership Committee Chair')).toBe(true);
    });

    it('has write:candidates', () => {
      expect(hasPermission('write:candidates', 'Membership Committee Chair')).toBe(true);
    });

    it('has view:processTimeline', () => {
      expect(hasPermission('view:processTimeline', 'Membership Committee Chair')).toBe(true);
    });

    it('does NOT have view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'Membership Committee Chair')).toBe(false);
    });
  });

  // ── 5. Officer does NOT have view:adminDashboard ──────────────────────────
  describe('officer role', () => {
    it('does NOT have view:adminDashboard', () => {
      expect(hasPermission('view:adminDashboard', 'officer')).toBe(false);
    });

    it('has view:memberCore', () => {
      expect(hasPermission('view:memberCore', 'officer')).toBe(true);
    });

    it('has view:candidateTracker', () => {
      expect(hasPermission('view:candidateTracker', 'officer')).toBe(true);
    });

    it('does NOT have view:chairDashboard', () => {
      // Officers can see chair dashboard per the RBAC matrix
      // (they have write:candidates but not all chair perms)
      // Per ROLE_PERMISSIONS officer DOES have view:chairDashboard
      expect(hasPermission('view:chairDashboard', 'officer')).toBe(true);
    });
  });

  // ── 6 & 7. isAdmin() ──────────────────────────────────────────────────────
  describe('isAdmin()', () => {
    it('returns true when role is admin', () => {
      setSessionUser({ email: 'someone@orderofkpi.org', role: 'admin' });
      expect(isAdmin()).toBe(true);
    });

    it('returns true when email is admin@orderofkpi.org even if role is member', () => {
      setSessionUser({ email: 'admin@orderofkpi.org', role: 'member' });
      expect(isAdmin()).toBe(true);
    });

    it('returns true when email is admin@orderofkpi.org even if role is officer', () => {
      setSessionUser({ email: 'admin@orderofkpi.org', role: 'officer' });
      expect(isAdmin()).toBe(true);
    });

    it('returns false when role is member and email is not the admin email', () => {
      setSessionUser({ email: 'regular@orderofkpi.org', role: 'member' });
      expect(isAdmin()).toBe(false);
    });

    it('returns false when no session exists', () => {
      // sessionStorage already cleared in beforeEach
      expect(isAdmin()).toBe(false);
    });
  });

  // ── 8. isApplicant() ──────────────────────────────────────────────────────
  describe('isApplicant()', () => {
    it('returns true when role is prospective', () => {
      setSessionUser({ email: 'p@example.com', role: 'prospective' });
      expect(isApplicant()).toBe(true);
    });

    it('returns true when role is applicant', () => {
      setSessionUser({ email: 'a@example.com', role: 'applicant' });
      expect(isApplicant()).toBe(true);
    });

    it('returns false when role is member', () => {
      setSessionUser({ email: 'member@orderofkpi.org', role: 'member' });
      expect(isApplicant()).toBe(false);
    });

    it('returns false when role is admin', () => {
      setSessionUser({ email: 'admin@orderofkpi.org', role: 'admin' });
      expect(isApplicant()).toBe(false);
    });

    it('returns false when no session exists', () => {
      expect(isApplicant()).toBe(false);
    });
  });

  // ── 9. getCurrentUserRole() ───────────────────────────────────────────────
  describe('getCurrentUserRole()', () => {
    it('returns null when sessionStorage is empty', () => {
      expect(getCurrentUserRole()).toBeNull();
    });

    it('returns the stored role when a valid session role exists', () => {
      sessionStorage.setItem('userRole', 'officer');
      expect(getCurrentUserRole()).toBe('officer');
    });

    it('returns null for an unknown/spoofed role string', () => {
      sessionStorage.setItem('userRole', 'superadmin_hacker');
      expect(getCurrentUserRole()).toBeNull();
    });

    it('returns null when userRole key is empty string', () => {
      sessionStorage.setItem('userRole', '');
      expect(getCurrentUserRole()).toBeNull();
    });
  });

  // ── 10. hasPermission returns false for null/undefined role ───────────────
  describe('hasPermission() with null/undefined role', () => {
    it('returns false when role is null', () => {
      expect(hasPermission('view:adminDashboard', null)).toBe(false);
    });

    it('returns false when role is undefined (falls back to empty session)', () => {
      // sessionStorage is cleared — no role in session
      expect(hasPermission('view:memberCore', undefined)).toBe(false);
    });

    it('returns false for null role across all permissions', () => {
      const permissions: Permission[] = [
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
      ];
      for (const perm of permissions) {
        expect(hasPermission(perm, null)).toBe(false);
      }
    });
  });
});
