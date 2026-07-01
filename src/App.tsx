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
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [hasEntered, setHasEntered] = useState(() => {
    try {
      return localStorage.getItem('kpi_splash_entered') === 'true';
    } catch {
      return false;
    }
  });

  const handleEnter = () => {
    try {
      localStorage.setItem('kpi_splash_entered', 'true');
    } catch (error) {
      console.warn('Failed to set localStorage key:', error);
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
                <Route index element={<Home />} />
                <Route path="save-the-date" element={<SaveTheDate />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="registration" element={<Registration />} />
                <Route path="registration-list" element={<RegistrationList />} />
                <Route path="party" element={<Party />} />
                <Route path="success" element={<Success />} />
                <Route path="congratulations" element={<Congratulations />} />
                <Route path="elections" element={<Elections />} />
                <Route path="voting-portal" element={<VotingPortal />} />
                <Route path="admin-dashboard" element={<AdminDashboard />} />
                <Route path="constitution" element={<Constitution />} />
                <Route path="portal" element={<ConferencePortal />} />
                <Route path="intake-calendar" element={<IntakeCalendar />} />
                <Route path="gantt-chart" element={<GanttChart />} />
                <Route path="login" element={<Login />} />
                <Route path="financial-roster" element={<FinancialRoster />} />
              </Route>
            </Routes>
          </React.Fragment>
        )}
      </AnimatePresence>
    </Router>
  );
}
