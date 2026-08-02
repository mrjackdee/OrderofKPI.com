import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = !!sessionStorage.getItem('userEmail');
  const userRole = sessionStorage.getItem('userRole');

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

  return <>{children}</>;
};

export default ProtectedRoute;
