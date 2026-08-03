import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const isAuthenticated = !!sessionStorage.getItem('userEmail');
  const userRole = sessionStorage.getItem('userRole');
  const userEmail = sessionStorage.getItem('userEmail');

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

  // Role-Based Access Control Checks
  if (allowedRoles && allowedRoles.length > 0) {
    const normEmail = (userEmail || '').toLowerCase().trim();
    const isAdmin = userRole === 'admin' || normEmail === 'admin@orderofkpi.org';

    // Admins always bypass checks
    if (!isAdmin) {
      const isChair = normEmail === 'james.haywood@orderofkpi.org' || userRole === 'Membership Committee Chair';
      const isCommittee = userRole === 'Membership Committee' || isChair;

      const hasAccess = allowedRoles.some(role => {
        if (role === userRole) return true;
        if (role === 'Membership Committee' && isCommittee) return true;
        if (role === 'Membership Committee Chair' && isChair) return true;
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
