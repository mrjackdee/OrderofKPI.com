import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CommitteeSlug, STANDING_COMMITTEES } from '../types';
import { hasCommitteeAccess, isCommitteeChair, normalizeUserRBAC, is1stAntiBasileus } from '../lib/memberDb';
import { useSystemFeatures, isCommitteeFeatureActive } from '../lib/settings';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  committeeSlug?: CommitteeSlug;
  requireChair?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  committeeSlug,
  requireChair
}) => {
  const location = useLocation();
  const { features } = useSystemFeatures();
  const isAuthenticated = !!sessionStorage.getItem('userEmail');
  const userRole = sessionStorage.getItem('userRole') || '';
  const userEmail = sessionStorage.getItem('userEmail') || '';
  
  let userCommittees: string[] = [];
  let userCommitteeRoles: Record<string, string> = {};
  try {
    const rawCommittees = sessionStorage.getItem('userCommittees');
    if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
    const rawRoles = sessionStorage.getItem('userCommitteeRoles');
    if (rawRoles) userCommitteeRoles = JSON.parse(rawRoles);
  } catch (e) {}

  if (!isAuthenticated) {
    if (location.pathname === '/applicant-portal') {
      return <Navigate to="/applicant-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in as applicant or prospective candidate, isolate access strictly to the application process
  const isApplicant = userRole === 'applicant' || userRole === 'prospective';
  if (isApplicant) {
    const allowedApplicantPaths = ['/applicant-portal', '/membership-application', '/privacy-policy', '/terms-of-service'];
    if (!allowedApplicantPaths.includes(location.pathname)) {
      return <Navigate to="/applicant-portal" replace />;
    }
  }

  const normEmail = userEmail.toLowerCase().trim();
  const normUser = normalizeUserRBAC({
    email: normEmail,
    role: userRole,
    committees: userCommittees,
    committeeRoles: userCommitteeRoles
  });

  const isAdmin = normUser.role === 'admin';
  const isOfficer = normUser.role === 'officer';
  const isSuperChair = normUser.title === 'Super Committee Chair';
  const is1stAnti = is1stAntiBasileus(normUser) || is1stAntiBasileus({ email: normEmail, role: userRole });

  const committeeFeatureActive = isCommitteeFeatureActive(normUser, features);

  // Standing committees route protection:
  if (location.pathname.startsWith('/committee/')) {
    if (!committeeFeatureActive && !isAdmin) {
      return <Navigate to="/member-portal" replace />;
    }
    const routeSlug = location.pathname.replace('/committee/', '').split('/')[0] as CommitteeSlug;
    const targetSlug = committeeSlug || routeSlug;
    if (targetSlug && !hasCommitteeAccess(targetSlug, normUser)) {
      return <Navigate to="/member-portal" replace />;
    }
  } else if (committeeSlug) {
    if ((!committeeFeatureActive && !isAdmin) || !hasCommitteeAccess(committeeSlug, normUser)) {
      return <Navigate to="/member-portal" replace />;
    }
  }

  if (location.pathname === '/chair-dashboard') {
    if (!committeeFeatureActive && !isAdmin) {
      return <Navigate to="/member-portal" replace />;
    }
    const isAnyChair = STANDING_COMMITTEES.some(c => isCommitteeChair(c.slug, normUser));
    if (!isAdmin && !isOfficer && !isSuperChair && !is1stAnti && !isAnyChair) {
      return <Navigate to="/member-portal" replace />;
    }
  }

  // Role-Based Access Control Checks
  if (allowedRoles && allowedRoles.length > 0) {
    // Admins, Super Committee Chair, and 1st Anti-Basileus always bypass checks
    if (!isAdmin && !isSuperChair && !is1stAnti) {
      const isChair = isCommitteeChair('membership_intake', normUser);
      const isCommittee = hasCommitteeAccess('membership_intake', normUser);

      const hasAccess = allowedRoles.some(role => {
        if (role === normUser.role) return true;
        if (role === userRole) return true;
        if (role === 'officer' && isOfficer) return true;
        if (role === 'member' && normUser.role !== 'applicant' && normUser.role !== 'prospective') return true;
        if ((role === 'Membership Committee' || role === 'membership_intake') && isCommittee && committeeFeatureActive) return true;
        if ((role === 'Membership Committee Chair' || role === 'Membership Intake Chair' || role === 'membership_chair') && (isChair || normEmail === 'james.haywood@orderofkpi.org') && committeeFeatureActive) return true;
        if ((role === 'brian' || role === 'brian.johnson@orderofkpi.org') && normEmail === 'brian.johnson@orderofkpi.org') return true;
        if (role === 'Super Committee Chair') return true;
        if (role === normEmail) return true;
        return false;
      });

      if (!hasAccess) {
        return <Navigate to="/member-portal" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
