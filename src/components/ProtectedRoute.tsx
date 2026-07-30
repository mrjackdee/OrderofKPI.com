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

  // If logged in as prospective candidate, redirect away from internal member tools to applicant portal
  if (userRole === 'prospective' && location.pathname !== '/applicant-portal' && location.pathname !== '/membership-application') {
    return <Navigate to="/applicant-portal" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
