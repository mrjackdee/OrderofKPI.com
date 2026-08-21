import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CommitteeSlug } from '../types';
import { hasCommitteeAccess, isCommitteeChair, normalizeUserRBAC } from '../lib/memberDb';

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
  const isBrian = normEmail === 'brian.johnson@orderofkpi.org';

  // Standing committees route protection: only admins and brian.johnson@orderofkpi.org can access committee pages or chair dashboard
  if (committeeSlug || location.pathname === '/chair-dashboard' || location.pathname.startsWith('/committee/')) {
    if (!isAdmin && !isBrian) {
      return <Navigate to="/member-portal" replace />;
    }
  }

  // Role-Based Access Control Checks
  if (allowedRoles && allowedRoles.length > 0) {
    // Admins always bypass checks
    if (!isAdmin) {
      const isChair = isCommitteeChair('membership_intake', normUser);
      const isCommittee = hasCommitteeAccess('membership_intake', normUser);

      const hasAccess = allowedRoles.some(role => {
        if (role === normUser.role) return true;
        if (role === userRole) return true;
        if (role === 'officer' && isOfficer) return true;
        if (role === 'member' && normUser.role !== 'applicant' && normUser.role !== 'prospective') return true;
        if ((role === 'Membership Committee' || role === 'membership_intake') && isCommittee) return true;
        if ((role === 'Membership Committee Chair' || role === 'membership_chair') && isChair) return true;
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
