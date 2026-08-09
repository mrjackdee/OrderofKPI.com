/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SaveTheDate from './pages/SaveTheDate';
import Agenda from './pages/Agenda';
import Registration from './pages/Registration';
import RegistrationList from './pages/RegistrationList';
import Party from './pages/Party';
import Success from './pages/Success';
import Congratulations from './pages/Congratulations';
import Elections from './pages/Elections';
import VotingPortal from './pages/VotingPortal';
import AdminDashboard from './pages/AdminDashboard';
import Constitution from './pages/Constitution';
import ConferencePortal from './pages/ConferencePortal';
import IntakeCalendar from './pages/IntakeCalendar';
import Login from './pages/Login';
import ApplicantLogin from './pages/ApplicantLogin';
import ApplicantPortal from './pages/ApplicantPortal';
import FinancialRoster from './pages/FinancialRoster';
import GanttChart from './pages/GanttChart';
import MemberPortal from './pages/MemberPortal';
import MemberDirectory from './pages/MemberDirectory';
import CandidateTracker from './pages/CandidateTracker';
import SelectionVoting from './pages/SelectionVoting';
import Application from './pages/Application';
import StandaloneApplication from './pages/StandaloneApplication';
import ReviewApplications from './pages/ReviewApplications';
import CommitteeChairDashboard from './pages/CommitteeChairDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ClassroomPortal from './pages/ClassroomPortal';
import DeanNominationForm from './pages/DeanNominationForm';
import DeanNominationDashboard from './pages/DeanNominationDashboard';
import DeanAuditLogDashboard from './pages/DeanAuditLogDashboard';
import DeanVotingForm from './pages/DeanVotingForm';
import DeanVotingDashboard from './pages/DeanVotingDashboard';
import DeanVotingAuditDashboard from './pages/DeanVotingAuditDashboard';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ToastContext';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="member-portal" element={<ProtectedRoute><MemberPortal /></ProtectedRoute>} />
          <Route path="conference-portal" element={<ConferencePortal />} />
          <Route path="save-the-date" element={<ProtectedRoute><SaveTheDate /></ProtectedRoute>} />
          <Route path="agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="registration" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
          <Route path="registration-list" element={<ProtectedRoute><RegistrationList /></ProtectedRoute>} />
          <Route path="party" element={<ProtectedRoute><Party /></ProtectedRoute>} />
          <Route path="success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
          <Route path="congratulations" element={<ProtectedRoute><Congratulations /></ProtectedRoute>} />
          <Route path="elections" element={<ProtectedRoute><Elections /></ProtectedRoute>} />
          <Route path="voting-portal" element={<ProtectedRoute><VotingPortal /></ProtectedRoute>} />
          <Route path="admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="candidate-tracker" element={<ProtectedRoute allowedRoles={['admin', 'officer', 'Membership Committee', 'Membership Committee Chair']}><CandidateTracker /></ProtectedRoute>} />
          <Route path="selection-voting" element={<ProtectedRoute allowedRoles={['admin']}><SelectionVoting /></ProtectedRoute>} />
          <Route path="constitution" element={<ProtectedRoute><Constitution /></ProtectedRoute>} />
          <Route path="intake-calendar" element={<ProtectedRoute><IntakeCalendar /></ProtectedRoute>} />
          <Route path="classroom-portal" element={<ProtectedRoute><ClassroomPortal /></ProtectedRoute>} />
          <Route path="gantt-chart" element={<ProtectedRoute allowedRoles={['admin', 'officer', 'Membership Committee', 'Membership Committee Chair', 'member']}><GanttChart /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="applicant-login" element={<ApplicantLogin />} />
          <Route path="applicant-portal" element={<ProtectedRoute><ApplicantPortal /></ProtectedRoute>} />
          <Route path="financial-roster" element={<ProtectedRoute><FinancialRoster /></ProtectedRoute>} />
          <Route path="member-directory" element={<ProtectedRoute><MemberDirectory /></ProtectedRoute>} />
          <Route path="membership-application" element={<ProtectedRoute><Application /></ProtectedRoute>} />
          <Route path="standalone-application" element={<StandaloneApplication />} />
          <Route path="review-applications" element={<ProtectedRoute allowedRoles={['admin', 'Membership Committee', 'Membership Committee Chair']}><ReviewApplications /></ProtectedRoute>} />
          <Route path="chair-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'officer', 'Membership Committee Chair']}><CommitteeChairDashboard /></ProtectedRoute>} />
          <Route path="dean-nomination" element={<ProtectedRoute><DeanNominationForm /></ProtectedRoute>} />
          <Route path="dean-nomination-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'Membership Committee', 'Membership Committee Chair']}><DeanNominationDashboard /></ProtectedRoute>} />
          <Route path="dean-audit-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DeanAuditLogDashboard /></ProtectedRoute>} />
          <Route path="dean-voting" element={<ProtectedRoute><DeanVotingForm /></ProtectedRoute>} />
          <Route path="dean-voting-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'Membership Committee', 'Membership Committee Chair']}><DeanVotingDashboard /></ProtectedRoute>} />
          <Route path="dean-voting-audit" element={<ProtectedRoute allowedRoles={['admin']}><DeanVotingAuditDashboard /></ProtectedRoute>} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
        </Route>
      </Routes>
      </ToastProvider>
    </Router>
  );
}
