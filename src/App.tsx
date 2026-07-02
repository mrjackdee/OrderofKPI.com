/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import FinancialRoster from './pages/FinancialRoster';
import GanttChart from './pages/GanttChart';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [hasEntered, setHasEntered] = useState(() => {
    try {
      return sessionStorage.getItem('kpi_splash_entered') === 'true';
    } catch {
      return false;
    }
  });

  const handleEnter = () => {
    try {
      sessionStorage.setItem('kpi_splash_entered', 'true');
    } catch (error) {
      console.warn('Failed to set sessionStorage key:', error);
    }
    setHasEntered(true);
  };

  return (
    <Router>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <LandingPage onEnter={handleEnter} />
        ) : (
          <React.Fragment key="app-content">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="save-the-date" element={<ProtectedRoute><SaveTheDate /></ProtectedRoute>} />
                <Route path="agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                <Route path="registration" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
                <Route path="registration-list" element={<ProtectedRoute><RegistrationList /></ProtectedRoute>} />
                <Route path="party" element={<ProtectedRoute><Party /></ProtectedRoute>} />
                <Route path="success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
                <Route path="congratulations" element={<ProtectedRoute><Congratulations /></ProtectedRoute>} />
                <Route path="elections" element={<ProtectedRoute><Elections /></ProtectedRoute>} />
                <Route path="voting-portal" element={<ProtectedRoute><VotingPortal /></ProtectedRoute>} />
                <Route path="admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="constitution" element={<ProtectedRoute><Constitution /></ProtectedRoute>} />
                <Route path="portal" element={<ProtectedRoute><ConferencePortal /></ProtectedRoute>} />
                <Route path="intake-calendar" element={<ProtectedRoute><IntakeCalendar /></ProtectedRoute>} />
                <Route path="gantt-chart" element={<ProtectedRoute><GanttChart /></ProtectedRoute>} />
                <Route path="login" element={<Login />} />
                <Route path="financial-roster" element={<ProtectedRoute><FinancialRoster /></ProtectedRoute>} />
              </Route>
            </Routes>
          </React.Fragment>
        )}
      </AnimatePresence>
    </Router>
  );
}
