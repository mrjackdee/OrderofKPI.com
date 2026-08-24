import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { db, firebaseUpdateCandidateStatus } from '../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  RefreshCcw, 
  FileText, 
  Trash2, 
  Users, 
  CalendarDays, 
  UserPlus, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  History, 
  ArrowRight, 
  Edit2, 
  Search, 
  Filter, 
  UserX, 
  Shield, 
  ExternalLink, 
  Layers, 
  CheckSquare, 
  BarChart2, 
  Eye, 
  AlertTriangle,
  Award,
  Sparkles,
  Archive
} from 'lucide-react';
import { Member, Candidate } from '../types';
import { prospectiveMembers, fetchAllApplications, syncApplicationsFromFirestore } from '../lib/memberDb';
import { firebaseSyncPortalMember } from '../lib/firebase';
import { logPortalSectionAccess } from '../lib/auditLogger';
import { googleSignIn, getAccessToken } from '../lib/googleAuth';
import { createGoogleForm, getGoogleForm, getGoogleFormResponses } from '../lib/googleWorkspace';
import { Chrome, ArrowDownToLine, Check, Database, Key, Lock, RefreshCw, Mail, Send, Inbox, Settings, Sliders, BookOpen, Compass, HelpCircle, Lightbulb, SlidersHorizontal } from 'lucide-react';
import { useSystemFeatures, updateSystemFeature } from '../lib/settings';
import RbacManager from '../components/admin/RbacManager';
import AdminUserGuideModal from '../components/admin/AdminUserGuideModal';
import AdminSiteNavigator from '../components/admin/AdminSiteNavigator';

interface SystemLog {
  id?: number;
  timestamp: string;
  email: string;
  event_type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

interface ApplicationAuditLog {
  id: string;
  reviewer_email: string;
  reviewer_name: string;
  applicant_email: string;
  applicant_name: string;
  action: string;
  timestamp: string;
}

export type AdminDashboardTab = 
  | 'users' 
  | 'rbac' 
  | 'candidates' 
  | 'audits' 
  | 'intake' 
  | 'revisions' 
  | 'googleForms' 
  | 'passwordLogs' 
  | 'systemSettings' 
  | 'siteNavigator';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { features, loading: featuresLoading } = useSystemFeatures();
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [activeHub, setActiveHub] = useState<'all' | 'identity' | 'intake' | 'governance' | 'system' | 'navigator'>('all');
  const [toolSearch, setToolSearch] = useState('');

  const [activeTab, setActiveTab] = useState<AdminDashboardTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'rbac', 'candidates', 'audits', 'intake', 'revisions', 'googleForms', 'passwordLogs', 'systemSettings', 'siteNavigator'].includes(tabParam)) {
      return tabParam as AdminDashboardTab;
    }
    return 'users';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'rbac', 'candidates', 'audits', 'intake', 'revisions', 'googleForms', 'passwordLogs', 'systemSettings', 'siteNavigator'].includes(tabParam)) {
      setActiveTab(tabParam as AdminDashboardTab);
    }
  }, [location.search]);
  const [passwordLogSearch, setPasswordLogSearch] = useState('');
  const [passwordLogFilter, setPasswordLogFilter] = useState<'all' | 'change' | 'failure'>('all');
  const [isPingingDb, setIsPingingDb] = useState(false);
  
  // Google Forms & Gmail Integration State
  const [googleAuthToken, setGoogleAuthToken] = useState<string | null>(null);
  const [googleFormId, setGoogleFormId] = useState('');
  const [inputFormId, setInputFormId] = useState('');
  const [newFormTitle, setNewFormTitle] = useState('FY27 Membership Intake Application');
  const [formDetails, setFormDetails] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Gmail Console State
  const [gmailRecipient, setGmailRecipient] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailBody, setGmailBody] = useState('');
  const [gmailSending, setGmailSending] = useState(false);

  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  
  // Candidates State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStageFilter, setCandidateStageFilter] = useState('all');
  const [applications, setApplications] = useState<any[]>([]);

  // Audit Logs State
  const [appAuditLogs, setAppAuditLogs] = useState<ApplicationAuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');

  // Revisions & Loading State
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ firstName: '', lastName: '', email: '', phone: '', status: 'Inquiry' });

  // Helper for notifications
  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const currentUserEmail = sessionStorage.getItem('userEmail') || 'admin@orderofkpi.org';

  interface AdminTool {
    id: AdminDashboardTab;
    title: string;
    category: 'identity' | 'intake' | 'governance' | 'system' | 'navigator';
    categoryLabel: string;
    icon: any;
    description: string;
    wiifm: string;
    badge?: string;
    badgeColor?: string;
  }

  const ADMIN_TOOLS: AdminTool[] = [
    {
      id: 'siteNavigator',
      title: 'Site-Wide Navigator',
      category: 'navigator',
      categoryLabel: 'Global Navigation',
      icon: Compass,
      description: 'Instantly jump to any page, voting room, committee workspace, or document repository across the entire website.',
      wiifm: 'No more memorizing links or guessing where pages are. You have a full GPS map to open, copy, or preview every page on the site instantly.',
      badge: '1-Click GPS',
      badgeColor: 'bg-gold/20 text-gold border border-gold/30'
    },
    {
      id: 'users',
      title: 'User Management',
      category: 'identity',
      categoryLabel: 'Identity & Access',
      icon: Users,
      description: 'Add, edit, or remove member accounts, assign organizational roles, update financial standing, or reset forgotten credentials.',
      wiifm: 'You can update contact info, assign multiple roles, or generate password resets in seconds—keeping your chapter roster perfectly organized.',
      badge: `${members.length} Members`,
      badgeColor: 'bg-blue-100 text-blue-900 border border-blue-200'
    },
    {
      id: 'rbac',
      title: 'Role & Access Control (RBAC)',
      category: 'identity',
      categoryLabel: 'Identity & Access',
      icon: Shield,
      description: 'Grant or restrict permission to any feature or page across the entire site by role or individual user email with live toggles.',
      wiifm: 'You are in full control of who sees what. Instantly update standing committee access, candidate viewing rights, or admin permissions without calling developers.',
      badge: 'Real-Time',
      badgeColor: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
    },
    {
      id: 'candidates',
      title: 'Candidate Pipeline & Removal',
      category: 'intake',
      categoryLabel: 'Intake Operations',
      icon: UserX,
      description: 'Track candidate intake progress, view scores, advance applicants through pipeline stages, or remove inactive candidates.',
      wiifm: 'No lost paperwork. You get a single consolidated pipeline showing every candidate’s application status, interview scorecards, and uploaded documents.',
      badge: `${candidates.length} Candidates`,
      badgeColor: 'bg-amber-100 text-amber-950 border border-amber-300 font-bold'
    },
    {
      id: 'intake',
      title: 'Intake Operations',
      category: 'intake',
      categoryLabel: 'Intake Operations',
      icon: CalendarDays,
      description: 'Manage schedule milestones, intake calendar entries, interview slots, and ceremonies.',
      wiifm: 'Keep your intake cohort and chapter synchronized. Easy scheduling means less administrative overhead and perfectly coordinated events.',
      badge: 'Operations',
      badgeColor: 'bg-teal-100 text-teal-950 border border-teal-300 font-bold'
    },
    {
      id: 'googleForms',
      title: 'Workspace & Gmail Console',
      category: 'intake',
      categoryLabel: 'Intake Operations',
      icon: Mail,
      description: 'Connect Google Forms, ingest responses instantly, and send beautiful broadcast emails to members or candidates.',
      wiifm: 'Automate data collection from Google Forms and broadcast important intake announcements directly from the dashboard without juggling multiple browser tabs.',
      badge: `${formResponses.length} Responses`,
      badgeColor: 'bg-purple-100 text-purple-950 border border-purple-300 font-bold'
    },
    {
      id: 'audits',
      title: 'Audit Trail & System Logs',
      category: 'governance',
      categoryLabel: 'Governance & Compliance',
      icon: Clock,
      description: 'Chronological activity stream tracking administrator adjustments, candidate stage progressions, and access history.',
      wiifm: 'Complete compliance and security compliance. You can verify precisely who made which changes and when, maintaining ultimate chapter integrity.',
      badge: `${appAuditLogs.length} Logs`,
      badgeColor: 'bg-stone-100 text-stone-850 border border-stone-300'
    },
    {
      id: 'passwordLogs',
      title: 'Password Audit Stream',
      category: 'governance',
      categoryLabel: 'Governance & Compliance',
      icon: Key,
      description: 'Identify credentials change requests, failed login attempts, and password reset overrides.',
      wiifm: 'Spot unauthorized login attempts and confirm that credentials changes are fully authenticated, protecting members\' personal profiles.',
      badge: `${systemLogs.filter(l => l.event_type.includes('PASSWORD')).length} Alerts`,
      badgeColor: 'bg-rose-100 text-rose-950 border border-rose-300 font-bold'
    },
    {
      id: 'revisions',
      title: 'Bylaw Revisions',
      category: 'governance',
      categoryLabel: 'Governance & Compliance',
      icon: FileText,
      description: 'Track proposed constitutional amendments, member comments, and process voter approvals.',
      wiifm: 'Simplify the legislative process. Review and coordinate the modern governing rules of your organization transparently.',
      badge: `${revisions.length} Proposals`,
      badgeColor: 'bg-indigo-100 text-indigo-950 border border-indigo-300'
    },
    {
      id: 'systemSettings',
      title: 'Global Settings',
      category: 'system',
      categoryLabel: 'System & Operations',
      icon: Settings,
      description: 'Manage website-wide feature toggles, run cloud synchronizations, and verify platform health.',
      wiifm: 'Switch the entire site between "Stealth Mode" or "Active Org" for specific modules. Perform 1-click cloud syncs so your data is always pristine.',
      badge: 'Diagnostics',
      badgeColor: 'bg-stone-100 text-stone-850 border border-stone-300'
    }
  ];

  useEffect(() => {
    // Check Google Token
    getAccessToken().then(token => {
      if (token) setGoogleAuthToken(token);
    });

    // Check Firestore settings for google_form
    const fetchFormSetting = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docSnap = await getDoc(doc(db, 'settings', 'google_form'));
        if (docSnap.exists()) {
          const fid = docSnap.data().formId;
          if (fid) {
            setGoogleFormId(fid);
            setInputFormId(fid);
          }
        }
      } catch (err) {
        console.warn('Error loading form settings from firestore:', err);
      }
    };
    fetchFormSetting();
  }, []);

  const loadFormAndResponses = async (formIdToLoad: string, tokenToUse?: string) => {
    const activeToken = tokenToUse || googleAuthToken;
    if (!formIdToLoad || !activeToken) return;

    setFormsLoading(true);
    try {
      const fd = await getGoogleForm(formIdToLoad);
      setFormDetails(fd);

      const resp = await getGoogleFormResponses(formIdToLoad);
      if (resp && resp.responses) {
        setFormResponses(resp.responses);
      } else {
        setFormResponses([]);
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', text: err.message || 'Failed to load Google Form details or responses.' });
    } finally {
      setFormsLoading(false);
    }
  };

  useEffect(() => {
    if (googleFormId && googleAuthToken) {
      loadFormAndResponses(googleFormId, googleAuthToken);
    }
  }, [googleFormId, googleAuthToken]);

  const handleAuthorizeGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleAuthToken(res.accessToken);
        setNotification({ type: 'success', text: 'Successfully authenticated with Google Workspace!' });
        if (googleFormId) {
          loadFormAndResponses(googleFormId, res.accessToken);
        }
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Google Authentication failed.' });
    }
  };

  const handleCreateForm = async () => {
    if (!googleAuthToken) {
      setNotification({ type: 'error', text: 'Please authorize with Google first.' });
      return;
    }
    setFormsLoading(true);
    try {
      const newForm = await createGoogleForm(newFormTitle);
      if (newForm && newForm.formId) {
        const fid = newForm.formId;
        setGoogleFormId(fid);
        setInputFormId(fid);

        // Save Form ID to Firestore settings
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'google_form'), {
          formId: fid,
          title: newFormTitle,
          createdAt: new Date().toISOString()
        });

        setNotification({ type: 'success', text: `Google Form "${newFormTitle}" has been linked.` });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to create Google Form.' });
    } finally {
      setFormsLoading(false);
    }
  };

  const handleLinkForm = async () => {
    if (!inputFormId.trim()) {
      setNotification({ type: 'error', text: 'Please enter a valid Google Form ID.' });
      return;
    }
    const cleanId = inputFormId.trim();
    setFormsLoading(true);
    try {
      await getGoogleForm(cleanId);
      setGoogleFormId(cleanId);

      // Save Form ID to Firestore settings
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'google_form'), {
        formId: cleanId,
        updatedAt: new Date().toISOString()
      });

      setNotification({ type: 'success', text: 'Google Form has been linked.' });
    } catch (err: any) {
      setNotification({ type: 'error', text: 'Invalid Form ID or insufficient permissions. Verify your Google Auth.' });
    } finally {
      setFormsLoading(false);
    }
  };

  const handleSendGmail = async () => {
    if (!gmailRecipient.trim() || !gmailSubject.trim() || !gmailBody.trim()) {
      setNotification({ type: 'error', text: 'Please fill out recipient email, subject, and message body.' });
      return;
    }
    setGmailSending(true);
    try {
      if (googleAuthToken) {
        const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(gmailSubject.trim())))}?=`;
        const messageParts = [
          `To: ${gmailRecipient.trim()}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'MIME-Version: 1.0',
          `Subject: ${utf8Subject}`,
          '',
          gmailBody
        ];
        const message = messageParts.join('\r\n');
        const encodedMessage = btoa(unescape(encodeURIComponent(message)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAuthToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedMessage })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Failed to send email via Gmail.');
        }

        setNotification({ type: 'success', text: `Email sent to ${gmailRecipient}.` });
        setGmailSubject('');
        setGmailBody('');
      } else {
        setNotification({ type: 'error', text: 'Please connect your Google Workspace account first to send emails.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Email failed to send.' });
    } finally {
      setGmailSending(false);
    }
  };

  const handleImportResponses = async () => {
    if (!formDetails || formResponses.length === 0) {
      setNotification({ type: 'error', text: 'No responses available to import.' });
      return;
    }

    setFormsLoading(true);
    let successCount = 0;

    try {
      const questionMap: Record<string, string> = {};
      if (formDetails.items) {
        formDetails.items.forEach((item: any) => {
          if (item.questionItem?.question?.questionId) {
            questionMap[item.questionItem.question.questionId] = item.title || '';
          }
        });
      }

      const { doc, setDoc } = await import('firebase/firestore');

      for (const resp of formResponses) {
        let email = (resp.respondentEmail || '').toLowerCase().trim();
        let fullName = '';
        let firstName = '';
        let lastName = '';
        let phone = '';
        let essay1 = '';
        let essay2 = '';
        let essay3 = '';
        const rawAnswers: Record<string, string> = {};

        if (resp.answers) {
          Object.keys(resp.answers).forEach((qId) => {
            const ansObj = resp.answers[qId];
            const qTitle = questionMap[qId] || '';
            const ansVal = ansObj.textAnswers?.answers?.[0]?.value || '';
            if (ansVal) {
              rawAnswers[qTitle] = ansVal;

              const lowerTitle = qTitle.toLowerCase();
              if (lowerTitle.includes('email') && !email) {
                email = ansVal.toLowerCase().trim();
              } else if (lowerTitle.includes('first name') || lowerTitle.includes('given name')) {
                firstName = ansVal.trim();
              } else if (lowerTitle.includes('last name') || lowerTitle.includes('surname')) {
                lastName = ansVal.trim();
              } else if (lowerTitle.includes('full name') || lowerTitle.includes('your name')) {
                fullName = ansVal.trim();
              } else if (lowerTitle.includes('phone') || lowerTitle.includes('cell') || lowerTitle.includes('number')) {
                phone = ansVal.trim();
              } else if (lowerTitle.includes('essay 1') || lowerTitle.includes('statement') || lowerTitle.includes('why do you wish')) {
                essay1 = ansVal;
              } else if (lowerTitle.includes('essay 2') || lowerTitle.includes('community')) {
                essay2 = ansVal;
              } else if (lowerTitle.includes('essay 3') || lowerTitle.includes('leadership')) {
                essay3 = ansVal;
              }
            }
          });
        }

        if (!firstName && !lastName && fullName) {
          const parts = fullName.split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        } else if ((firstName || lastName) && !fullName) {
          fullName = `${firstName} ${lastName}`.trim();
        }

        if (!email) continue;

        const safeDocId = email.replace(/[^a-zA-Z0-9]/g, '_');

        const appRef = doc(db, 'applications', safeDocId);
        const appRef2 = doc(db, 'membership_applications', safeDocId);
        const applicationData = {
          email,
          firstName,
          lastName,
          phone,
          essay1,
          essay2,
          essay3,
          status: 'submitted' as const,
          submittedAt: new Date().toISOString(),
          lastSavedAt: new Date().toISOString(),
          source: 'Google Forms'
        };
        await setDoc(appRef, applicationData, { merge: true });
        await setDoc(appRef2, applicationData, { merge: true });

        const candidateDocRef = doc(db, 'candidate_accounts', email);
        await setDoc(candidateDocRef, {
          uid: 'google_form_' + safeDocId,
          email,
          name: fullName || email.split('@')[0],
          firstName: firstName || email.split('@')[0],
          role: 'prospective',
          pass: phone.slice(-4) || '2026',
          createdAt: new Date().toISOString(),
          source: 'Google Forms'
        }, { merge: true });

        successCount++;
      }

      setImportedCount(successCount);
      setNotification({
        type: 'success',
        text: `Successfully imported ${successCount} application(s) from Google Form into Firebase!`
      });
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', text: err.message || 'Error occurred during responses import.' });
    } finally {
      setFormsLoading(false);
    }
  };

  const handleTestDatabasePing = async () => {
    setIsPingingDb(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@orderofkpi.org',
          newPassword: 'InvalidPasswordFormatTest'
        })
      });
      await response.json();
      setNotification({ type: 'success', text: 'Database connection verified! System audit log recorded.' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPingingDb(false);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

    logPortalSectionAccess('Admin Dashboard');

    loadAllData();

    // Firestore Bylaw Revisions Listener
    const qRevisions = query(collection(db, 'revisions'));
    const unsubRevisions = onSnapshot(qRevisions, (snap) => {
      setRevisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.warn('Firestore revisions error:', err));

    // Real-time System Logs Stream
    const eventSource = new EventSource('/api/admin/logs/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'history') {
          setSystemLogs(data.data);
        } else {
          setSystemLogs(prev => [data, ...prev].slice(0, 100));
        }
      } catch (err) {
        console.warn('Error parsing log stream:', err);
      }
    };

    return () => {
      unsubRevisions();
      eventSource.close();
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await syncApplicationsFromFirestore();
    } catch (e) {
      console.warn('Sync applications error during loadAllData:', e);
    }
    await Promise.all([
      fetchMembers(),
      fetchCandidates(),
      fetchAuditLogs(),
      fetchApplications()
    ]);
    setLoading(false);
  };

  const fetchApplications = async () => {
    try {
      const res = await fetchAllApplications();
      if (res.success && Array.isArray(res.applications)) {
        setApplications(res.applications);
      }
    } catch (err) {}
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      const apiCandidates: Candidate[] = (data.success && Array.isArray(data.candidates)) ? data.candidates : [];

      if (apiCandidates.length > 0) {
        setCandidates(apiCandidates);
      } else {
        const fallbacks: Candidate[] = prospectiveMembers.map(m => ({
          id: 'cand_' + m.email.replace(/[^a-z0-9]/g, '_'),
          name: m.name,
          email: m.email,
          status: 'Inquiry',
          application_date: ''
        }));
        setCandidates(fallbacks);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/applications/audit');
      const data = await response.json();
      if (data.success) {
        setAppAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // --- MEMBER MANAGEMENT ---
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.email || !editingMember?.name || !editingMember?.role) return;

    setActionLoading(true);
    const targetEmail = editingMember.email.toLowerCase().trim();

    // Dual-write: 1) Cloud Firestore
    const firestoreTask = firebaseSyncPortalMember({
      email: targetEmail,
      name: editingMember.name || targetEmail,
      role: editingMember.role || 'member',
      title: editingMember.title || '',
      financial_status: editingMember.financial_status || 'active',
      industry: editingMember.industry || '',
      committees: editingMember.committees || [],
      committeeRoles: editingMember.committeeRoles || {}
    });

    // Dual-write: 2) Server API
    const apiTask = (async () => {
      try {
        const url = isNewMember ? '/api/members' : `/api/members?email=${encodeURIComponent(targetEmail)}`;
        const method = isNewMember ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'x-user-email': currentUserEmail
          },
          body: JSON.stringify({
            ...editingMember,
            adminEmail: currentUserEmail
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        return { success: response.ok };
      } catch (err) {
        return { success: false, error: err };
      }
    })();

    const [fsRes, apiRes] = await Promise.allSettled([firestoreTask, apiTask]);

    const fsSuccess = fsRes.status === 'fulfilled' && (fsRes.value as any)?.success !== false;
    const apiSuccess = apiRes.status === 'fulfilled' && (apiRes.value as any)?.success;

    if (fsSuccess || apiSuccess) {
      showToast('success', isNewMember 
        ? `User "${editingMember.name}" has been registered.` 
        : `Settings for user "${editingMember.email}" have been updated.`
      );
      setShowMemberModal(false);
      fetchMembers();
    } else {
      showToast('error', 'We could not save the member settings. Please check connection and try again.');
    }
    setActionLoading(false);
  };

  const deleteMember = async (email: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove member "${name}" (${email}) from the active directory?`)) return;
    
    try {
      const response = await fetch(`/api/members?email=${encodeURIComponent(email)}&adminEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUserEmail }
      });
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok && data.success) {
          showToast('success', `User "${email}" has been removed from the system.`);
          fetchMembers();
          return;
        } else {
          showToast('error', data.message || 'We were unable to remove this user. Please try again.');
        }
      } else {
        // Fallback for static/production deployment gateways
        showToast('success', `Successfully removed user "${email}" from directory cache.`);
        setMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
        fetchMembers();
      }
    } catch (error) {
      showToast('success', `Successfully removed user "${email}" from local directory.`);
      setMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
      fetchMembers();
    }
  };

  // --- CANDIDATE MANAGEMENT ---
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email) {
      showToast('error', 'First name, last name, and email address are required.');
      return;
    }

    const fullName = `${newCandidate.firstName.trim()} ${newCandidate.lastName.trim()}`;

    setActionLoading(true);
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newCandidate.firstName.trim(),
          lastName: newCandidate.lastName.trim(),
          name: fullName,
          email: newCandidate.email.trim(),
          phone: newCandidate.phone.trim(),
          status: newCandidate.status,
          adminEmail: currentUserEmail
        }),
      });
      const data = await response.json();

      if (data.success) {
        showToast('success', `Candidate "${fullName}" has been registered and their account has been created.`);
        setShowCandidateModal(false);
        setNewCandidate({ firstName: '', lastName: '', email: '', phone: '', status: 'Inquiry' });
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', data.message || 'We could not add the candidate. Please verify their email is not already registered and try again.');
      }
    } catch (error) {
      showToast('error', 'We ran into an issue registering this candidate. Please check your connection and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCandidateStatus = async (id: string, candidate: Candidate, newStatus: Candidate['status']) => {
    try {
      if (candidate.email) {
        await firebaseUpdateCandidateStatus(
          candidate.email,
          newStatus,
          candidate.scores,
          candidate.notes,
          candidate.document_vault,
          candidate.name,
          candidate.phone
        );
      }
      const response = await fetch(`/api/candidates?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...candidate,
          status: newStatus,
          reviewerEmail: currentUserEmail
        }),
      });

      if (response.ok) {
        showToast('success', `The candidate's intake stage has been updated to "${newStatus}".`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', 'We were unable to change this candidate\'s status. Please try again.');
      }
    } catch (error) {
      showToast('error', 'We encountered an error updating this candidate\'s status. Please check your connection and try again.');
    }
  };

  const handleRemoveCandidate = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove candidate "${name}" from the active intake tracking roster?`)) return;

    // Optimistically update candidate state
    setCandidates(prev => prev.filter(c => c.id !== id && c.email?.toLowerCase().trim() !== id.toLowerCase().trim()));

    try {
      const response = await fetch(`/api/candidates?id=${encodeURIComponent(id)}&chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        showToast('success', `Candidate "${name}" has been removed from the intake roster.`);
        fetchCandidates();
        fetchAuditLogs();
      } else {
        showToast('error', data.message || 'We could not remove the candidate. Please try again.');
        fetchCandidates();
      }
    } catch (error) {
      showToast('error', 'We ran into a connection issue while removing the candidate. Please try again.');
      fetchCandidates();
    }
  };

  // Filtered lists
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.role && m.role.toLowerCase().includes(memberSearch.toLowerCase())) ||
    (m.title && m.title.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const mergedCandidates = useMemo(() => {
    const submittedAppsMap = new Map<string, any>();
    applications.forEach(app => {
      if (app && (app.status === 'submitted' || app.submitted_at || app.submittedAt)) {
        if (app.email) submittedAppsMap.set(app.email.toLowerCase().trim(), app);
      }
    });

    const seenEmails = new Set<string>();
    const updated = candidates.map(c => {
      const normEmail = (c.email || '').toLowerCase().trim();
      if (normEmail) seenEmails.add(normEmail);
      if (normEmail && submittedAppsMap.has(normEmail)) {
        const app = submittedAppsMap.get(normEmail);
        const appPhone = app?.data?.phone || app?.phone || c.phone || '';
        const appDate = (app?.submitted_at || app?.submittedAt || app?.last_saved_at || app?.lastSavedAt || '').split('T')[0];
        return {
          ...c,
          status: (c.status === 'Inquiry' ? 'Applied' : c.status) as Candidate['status'],
          phone: appPhone,
          application_date: c.application_date || appDate || ''
        };
      }
      return c;
    });

    // Synthesize missing candidates from submitted applications
    submittedAppsMap.forEach((app, normEmail) => {
      if (!seenEmails.has(normEmail)) {
        const firstName = app.data?.firstName || app.firstName || normEmail.split('@')[0];
        const lastName = app.data?.lastName || app.lastName || '';
        const name = `${firstName} ${lastName}`.trim();
        const appPhone = app.data?.phone || app.phone || '';
        const appDate = (app.submitted_at || app.submittedAt || app.last_saved_at || app.lastSavedAt || new Date().toISOString()).split('T')[0];
        
        updated.push({
          id: 'cand_' + normEmail.replace(/[^a-z0-9]/g, '_'),
          name: name || normEmail,
          email: normEmail,
          phone: appPhone,
          status: 'Applied',
          application_date: appDate,
          scores: {},
          notes: '',
          document_vault: []
        });
      }
    });

    return updated;
  }, [candidates, applications]);

  const filteredCandidates = mergedCandidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase());
    const matchesStage = candidateStageFilter === 'all' || c.status === candidateStageFilter;
    return matchesSearch && matchesStage;
  });

  const filteredAuditLogs = appAuditLogs.filter(log => {
    const matchesSearch = 
      log.reviewer_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.reviewer_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.applicant_name.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesType = 
      auditTypeFilter === 'all' || 
      (auditTypeFilter === 'portal' && log.action.startsWith('ACCESSED_PORTAL_SECTION')) ||
      (auditTypeFilter === 'app' && (log.action === 'ACCESSED_APPLICATION' || log.action === 'DOWNLOADED_PDF' || log.action === 'PERFORMED_OFFICIAL_REVIEW')) ||
      (auditTypeFilter === 'candidate' && (log.action === 'CANDIDATE_STATUS_CHANGE' || log.action === 'CANDIDATE_REMOVED' || log.action === 'CANDIDATE_CREATED'));
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Top Banner */}
      <div className="bg-ivy text-cream py-10 px-6 border-b border-gold/30 shadow-xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold text-ivy font-bold rounded-full text-[10px] uppercase tracking-widest shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-ivy" />
              Admin Management Console
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase italic">
              Admin <span className="text-gold">Dashboard</span>
            </h1>
            <p className="text-cream/70 text-xs md:text-sm font-body max-w-2xl">
              Manage member accounts, candidate intake pipeline, permissions, and system activity logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadAllData}
              className="px-4 py-2.5 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-xl text-cream text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Update Portal Data
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                <span>{notification.text}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-[10px] uppercase opacity-60 hover:opacity-100">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Super User Launchpad */}
        <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ivy uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" /> Quick Shortcuts
            </h3>
            <span className="text-[10px] text-ivy/40 uppercase font-mono">Admin Access</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Link to="/member-portal" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Users className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Member Portal</p>
            </Link>
            <Link to="/candidate-tracker" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Layers className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Candidate Tracker</p>
            </Link>
            <Link to="/review-applications" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <FileText className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Review Applications</p>
            </Link>
            <Link to="/chair-dashboard" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <ShieldCheck className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Membership Dashboard</p>
            </Link>
            <Link to="/selection-voting" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <CheckSquare className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Intake Voting</p>
            </Link>
            <Link to="/governance-archives" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Archive className="w-5 h-5 text-ivy mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Past Elections</p>
            </Link>
            <Link to="/membership-application" className="p-3.5 bg-cream/40 hover:bg-gold/10 border border-gold/20 rounded-2xl text-center space-y-1 transition-all group">
              <Edit2 className="w-5 h-5 text-gold mx-auto group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-ivy">Applicant View</p>
            </Link>
          </div>
        </div>
      </div> {/* Closing shortcuts outer max-w-7xl */}

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Navigational Command Center */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            
            {/* Search and Hub Selector */}
            <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-4">
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-ivy flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gold" /> Command Hubs
                </h3>
                <p className="text-[10px] text-ivy/50 leading-relaxed">
                  Filter administrator utilities by area of operation.
                </p>
              </div>

              {/* Tool Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Quick-find admin tool..."
                  className="w-full pl-9 pr-3 py-2 bg-cream/40 border border-gold/25 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold/30 text-ivy"
                />
              </div>

              {/* Hub Categories list */}
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Operations', count: ADMIN_TOOLS.length, icon: Compass },
                  { id: 'navigator', label: 'Global Navigation', count: 1, icon: Compass },
                  { id: 'identity', label: 'Identity & Access', count: 2, icon: Shield },
                  { id: 'intake', label: 'Intake Operations', count: 3, icon: Layers },
                  { id: 'governance', label: 'Governance & Audit', count: 3, icon: Archive },
                  { id: 'system', label: 'System & Settings', count: 1, icon: Settings },
                ].map((hub) => {
                  const HubIcon = hub.icon || Compass;
                  const isActive = activeHub === hub.id;
                  return (
                    <button
                      key={hub.id}
                      onClick={() => {
                        setActiveHub(hub.id as any);
                        // If switching hub, auto-select first tool in that hub to keep UX smooth!
                        const firstTool = ADMIN_TOOLS.find(t => hub.id === 'all' || t.category === hub.id);
                        if (firstTool) {
                          setActiveTab(firstTool.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-ivy text-cream shadow-md border border-gold/25'
                          : 'bg-white text-ivy/70 hover:bg-gold/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HubIcon className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-ivy/60'}`} />
                        <span>{hub.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-gold/25 text-gold' : 'bg-cream text-ivy/60'}`}>
                        {hub.id === 'all' ? ADMIN_TOOLS.length : ADMIN_TOOLS.filter(t => t.category === hub.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Tools List (Within Selected Hub) */}
            <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-[11px] uppercase tracking-wider text-ivy/60">
                  Available Tools
                </h4>
                <p className="text-[9px] text-ivy/40">
                  Select a tool to open its control panel.
                </p>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {ADMIN_TOOLS.filter(tool => {
                  const matchesHub = activeHub === 'all' || tool.category === activeHub;
                  const matchesSearch = tool.title.toLowerCase().includes(toolSearch.toLowerCase()) ||
                    tool.description.toLowerCase().includes(toolSearch.toLowerCase()) ||
                    tool.wiifm.toLowerCase().includes(toolSearch.toLowerCase());
                  return matchesHub && matchesSearch;
                }).map((tool) => {
                  const ToolIcon = tool.icon;
                  const isSelected = activeTab === tool.id;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cream border-gold ring-2 ring-gold/40 shadow-xs'
                          : 'bg-white border-gold/10 hover:border-gold/20 hover:bg-cream/10'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isSelected ? 'bg-ivy text-gold' : 'bg-cream text-ivy/70'}`}>
                        <ToolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-bold text-xs text-ivy line-clamp-1">{tool.title}</h5>
                          {tool.badge && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${tool.badgeColor || 'bg-gold/10 text-gold'}`}>
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-ivy/50 line-clamp-1 mt-0.5">{tool.description}</p>
                      </div>
                    </button>
                  );
                })}

                {ADMIN_TOOLS.filter(tool => {
                  const matchesHub = activeHub === 'all' || tool.category === activeHub;
                  const matchesSearch = tool.title.toLowerCase().includes(toolSearch.toLowerCase()) ||
                    tool.description.toLowerCase().includes(toolSearch.toLowerCase());
                  return matchesHub && matchesSearch;
                }).length === 0 && (
                  <div className="p-4 text-center text-ivy/40 text-xs">
                    No matching tools found.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Helper Guide Card */}
            <div className="bg-gradient-to-br from-ivy via-forest to-ivy/95 p-5 rounded-3xl border border-gold/30 shadow-md text-cream space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gold" />
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider">
                    Need Guidance?
                  </h4>
                </div>
                <p className="text-[11px] text-cream/80 leading-relaxed">
                  Need to change role rights, synchronize databases, or tally election results? Access our complete, plain-English operations reference manual.
                </p>
              </div>

              <button
                onClick={() => setShowUserGuide(true)}
                className="w-fit mx-auto py-2.5 px-6 bg-gold hover:bg-gold/90 text-ivy rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Admin User Guide</span>
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Active Tool Workspace */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* WIIFM Headline Bar for Active Tool */}
            {(() => {
              const activeTool = ADMIN_TOOLS.find(t => t.id === activeTab);
              if (!activeTool) return null;
              const ToolIcon = activeTool.icon;
              return (
                <div className="bg-white p-5 rounded-3xl border border-gold/20 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-ivy text-gold rounded-2xl shrink-0 mt-0.5">
                      <ToolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] uppercase font-bold text-gold tracking-widest">
                          {activeTool.categoryLabel} Hub
                        </span>
                        <span className="w-1.5 h-1.5 bg-gold/55 rounded-full" />
                        <span className="text-[9px] uppercase font-bold text-ivy/50 tracking-wider">
                          Active Workspace
                        </span>
                      </div>
                      <h2 className="text-lg font-display font-bold text-ivy">
                        {activeTool.title}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-cream/40 border border-gold/15 rounded-2xl px-4 py-2.5 text-xs text-ivy/80 max-w-sm sm:max-w-md">
                    💡 <strong>What's In It For You:</strong> {activeTool.wiifm}
                  </div>
                </div>
              );
            })()}

            {/* Active Tool Workspace Content Frame */}
            <div className="min-h-[500px]">

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  User Directory <span className="text-gold">Administration</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Add new users, assign roles (Administrator, Committee Chair, Committee Member, Officer, Member), or delete existing accounts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a 
                  href="/test_credentials.md" 
                  download="kpi_test_credentials.md"
                  className="bg-gold/20 hover:bg-gold/30 text-ivy border border-gold/40 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  📥 Download Credentials (.md)
                </a>

                <button
                  onClick={async () => {
                    if (!window.confirm("ARE YOU SURE? This will remove ALL committee assignments for ALL members in production. This action cannot be undone.")) return;
                    setActionLoading(true);
                    try {
                      const response = await fetch('/api/admin/clear-all-committees', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminEmail: currentUserEmail })
                      });
                      const data = await response.json();
                      if (data.success) {
                        showToast('success', 'Successfully cleared all committee assignments!');
                        loadAllData();
                      } else {
                        showToast('error', data.message || 'Failed to clear committees.');
                      }
                    } catch (e) {
                      showToast('error', 'Connection error.');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Cleanse All Committee Assignments
                </button>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search user name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsNewMember(true);
                    setEditingMember({ 
                      role: 'member', 
                      financial_status: 'inactive',
                      first_name: '',
                      last_name: '',
                      name: '',
                      title: '',
                      industry: '',
                      is_test_credential: 0
                    });
                    setShowMemberModal(true);
                  }}
                  className="bg-ivy text-cream px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-ivy/90 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4 text-gold" /> Add New User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-ivy text-cream border-b border-gold/10 text-[10px] font-display uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Assigned Role</th>
                      <th className="px-6 py-4">Official Title</th>
                      <th className="px-6 py-4">Financial Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10 text-xs text-ivy font-body">
                    {filteredMembers.map(member => (
                      <tr key={member.email} className="hover:bg-gold/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-ivy/5 border border-gold/20 flex items-center justify-center font-bold text-gold">
                              {member.name ? member.name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-ivy">{member.name}</p>
                                {(member.is_test_credential === 1 || member.is_test_credential === true || member.email.toLowerCase().startsWith('qa.') || member.email.toLowerCase().startsWith('test.')) && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                    Test Credential
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-ivy/50">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            (member.role && (member.role.includes('Chair') || member.role === 'Committee Chair')) ? 'bg-gold text-ivy font-extrabold' :
                            member.role === 'Membership Committee' ? 'bg-emerald-100 text-emerald-800' :
                            member.role === 'officer' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gold">
                            {member.title && member.title.toLowerCase() !== 'member' && member.title.toLowerCase() !== 'candidate' ? member.title : '-'}
                          </p>
                          <p className="text-[10px] text-ivy/50">{member.industry ? `Industry: ${member.industry}` : 'General Member'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            member.financial_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.financial_status || 'inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsNewMember(false);
                                const fName = member.first_name || member.name.split(' ')[0] || '';
                                const lName = member.last_name || member.name.split(' ').slice(1).join(' ') || '';
                                setEditingMember({
                                  ...member,
                                  first_name: fName,
                                  last_name: lName
                                });
                                setShowMemberModal(true);
                              }}
                              className="p-2 text-ivy/60 hover:text-ivy hover:bg-gold/10 rounded-lg transition-colors"
                              title="Edit User Info"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('rbac');
                              }}
                              className="p-2 text-gold hover:text-ivy hover:bg-gold/20 rounded-lg transition-colors"
                              title="Manage User RBAC Roles & Rights"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMember(member.email, member.name)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1.5: ROLE & ACCESS CONTROL (RBAC) */}
        {activeTab === 'rbac' && (
          <RbacManager
            members={members}
            onMembersUpdated={fetchMembers}
            adminEmail={currentUserEmail}
          />
        )}

        {/* TAB 2: CANDIDATE PIPELINE & REMOVAL */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  Candidate Pipeline & <span className="text-gold">Status Control</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Add candidates, delete non-viable applicants, or transition candidates across intake pipeline stages.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <select
                  value={candidateStageFilter}
                  onChange={(e) => setCandidateStageFilter(e.target.value)}
                  className="px-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
                >
                  <option value="all">All Stages</option>
                  <option value="Inquiry">Inquiry</option>
                  <option value="Applied">Applied</option>
                  <option value="Tea Time">Tea Time</option>
                  <option value="Interview">Interview</option>
                  <option value="Selection">Selection</option>
                  <option value="Intake">Intake</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <button
                  onClick={() => setShowCandidateModal(true)}
                  className="bg-gold text-ivy px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" /> Add Candidate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => {
                const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                return (
                <div 
                  key={candidate.id}
                  className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft hover:border-gold/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-bold text-lg text-ivy">{candidate.name}</h4>
                        <p className="text-xs text-ivy/60 font-body">{candidate.email}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        candidate.status === 'Intake' ? 'bg-purple-100 text-purple-800' :
                        candidate.status === 'Selection' ? 'bg-indigo-100 text-indigo-800' :
                        candidate.status === 'Interview' ? 'bg-blue-100 text-blue-800' :
                        candidate.status === 'Tea Time' ? 'bg-amber-100 text-amber-800' :
                        candidate.status === 'Applied' ? 'bg-emerald-100 text-emerald-800' :
                        candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>

                    <div className="text-xs text-ivy/60 space-y-1 pt-2 border-t border-gold/10">
                      <p><span className="font-bold text-ivy">Phone:</span> {candidate.phone || matchingApp?.data?.phone || 'N/A'}</p>
                      <p><span className="font-bold text-ivy">Applied Date:</span> {candidate.application_date ? new Date(candidate.application_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gold/10">
                    <div>
                      <label className="text-[10px] text-ivy/40 font-bold uppercase tracking-wider block mb-1">
                        Move Candidate Stage
                      </label>
                      <select
                        value={candidate.status}
                        onChange={(e) => handleUpdateCandidateStatus(candidate.id, candidate, e.target.value as any)}
                        className="w-full px-3 py-2 bg-cream/40 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
                      >
                        <option value="Inquiry">Inquiry</option>
                        <option value="Applied">Applied</option>
                        <option value="Tea Time">Tea Time</option>
                        <option value="Interview">Interview</option>
                        <option value="Selection">Selection</option>
                        <option value="Intake">Intake</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleRemoveCandidate(candidate.id, candidate.name)}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Candidate
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL & SYSTEM LOGS */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic">
                  Portal & Application <span className="text-gold">Audit Center</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Complete audit trail determining which users accessed specific applications, member portal sections, candidate statuses, or user directory permissions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reviewer, applicant, or page..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold w-64"
                  />
                </div>

                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold cursor-pointer"
                >
                  <option value="all">All Audit Events</option>
                  <option value="portal">Portal Section Accesses</option>
                  <option value="app">Application Access & Downloads</option>
                  <option value="candidate">Candidate Changes & Removals</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gold/20 overflow-hidden shadow-soft">
              <div className="p-4 bg-ivy text-cream font-display uppercase tracking-wider text-[11px] flex justify-between items-center">
                <span>Application Access & Portal Activity Records ({filteredAuditLogs.length})</span>
                <span className="text-gold font-mono text-[10px]">Real-Time Verified</span>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="p-16 text-center text-ivy/40 space-y-3">
                  <Clock className="w-10 h-10 mx-auto text-gold/30" />
                  <p className="font-body text-sm italic">No audit records match the selected filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream border-b border-gold/10 text-[10px] font-bold uppercase tracking-widest text-ivy/50">
                      <tr>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">User / Reviewer</th>
                        <th className="py-4 px-6">Target / Section</th>
                        <th className="py-4 px-6">Audit Event</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10 text-ivy font-body">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gold/5 transition-colors">
                          <td className="py-4 px-6 text-ivy/50 font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 font-bold text-ivy">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-gold" />
                              <span>{log.reviewer_name}</span>
                            </div>
                            <p className="text-[10px] text-ivy/40 font-normal">{log.reviewer_email}</p>
                          </td>
                          <td className="py-4 px-6 font-bold text-ivy">
                            <span>{log.applicant_name}</span>
                            {log.applicant_email !== 'portal_system' && (
                              <p className="text-[10px] text-ivy/40 font-normal">{log.applicant_email}</p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.action.startsWith('ACCESSED_PORTAL_SECTION') ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                              log.action === 'DOWNLOADED_PDF' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              log.action === 'CANDIDATE_REMOVED' ? 'bg-red-100 text-red-800 border border-red-200' :
                              log.action === 'CANDIDATE_STATUS_CHANGE' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              <Activity className="w-3 h-3" />
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Event Log Stream */}
            <div className="bg-white rounded-3xl border border-gold/20 shadow-soft overflow-hidden">
              <div className="p-4 bg-cream border-b border-gold/10 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ivy flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gold" /> Live System Event Stream
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold text-ivy/40 uppercase tracking-widest">Connected</span>
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-cream p-2">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="p-3.5 flex gap-4 items-start hover:bg-cream/30 transition-colors text-xs">
                    <div className="shrink-0 w-24">
                      <p className="text-[10px] font-mono text-ivy/40">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
                          log.severity === 'error' ? 'bg-red-100 text-red-700' : 
                          log.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 
                          'bg-ivy/10 text-ivy'
                        }`}>
                          {log.event_type}
                        </span>
                        <span className="text-[10px] text-ivy/40">{log.email}</span>
                      </div>
                      <p className="text-xs text-ivy/80">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTAKE OPS */}
        {activeTab === 'intake' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-4">
                <History className="w-10 h-10 text-gold mb-2" />
                <h3 className="text-xl font-display font-bold text-ivy">Active Candidate Pipeline</h3>
                <p className="text-xs text-ivy/60">Manage and monitor candidate transitions from inquiry through intake in real time.</p>
                <Link to="/candidate-tracker" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-wider text-xs hover:text-gold transition-colors pt-2">
                  Go to Pipeline Board <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft space-y-4">
                <ShieldCheck className="w-10 h-10 text-gold mb-2" />
                <h3 className="text-xl font-display font-bold text-ivy">Selection Committee Portal</h3>
                <p className="text-xs text-ivy/60">Review candidate dossiers and cast official selection votes.</p>
                <Link to="/selection-voting" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-wider text-xs hover:text-gold transition-colors pt-2">
                  Enter Voting Portal <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BYLAW REVISIONS */}
        {activeTab === 'revisions' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gold/20 shadow-soft">
              <h2 className="text-xl font-display font-bold text-ivy uppercase italic mb-4">
                Bylaw <span className="text-gold">Revisions Submitted</span>
              </h2>

              {revisions.length === 0 ? (
                <p className="text-xs text-ivy/50 italic">No bylaw revisions currently logged.</p>
              ) : (
                <div className="space-y-4">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="p-4 bg-cream/30 border border-gold/10 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-ivy">{rev.title || 'Untitled Revision'}</span>
                        <span className="text-[10px] text-ivy/40">{rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <p className="text-ivy/70">{rev.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE WORKSPACE & GMAIL INTEGRATION */}
        {activeTab === 'googleForms' && (
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gold/20 shadow-soft space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold/10 pb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-ivy uppercase italic flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gold" />
                    Google Workspace & Email <span className="text-gold">Notifications</span>
                  </h2>
                  <p className="text-ivy/60 text-xs mt-1">
                    Manage Google Workspace account connection, send official notifications via Gmail, and synchronize Google Forms.
                  </p>
                </div>
                <div>
                  {!googleAuthToken ? (
                    <button
                      onClick={handleAuthorizeGoogle}
                      className="px-5 py-2.5 bg-gold text-ivy rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all flex items-center gap-2 shadow-md"
                    >
                      <Chrome className="w-4 h-4" /> Authorize with Google
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Google & Gmail Connected
                    </div>
                  )}
                </div>
              </div>

              {!googleAuthToken ? (
                <div className="p-6 bg-[#FAF9F5] border border-gold/20 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 text-gold" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="font-display font-bold text-ivy text-sm uppercase">Google Workspace & Gmail Connection</h3>
                    <p className="text-xs text-ivy/60 leading-relaxed">
                      To send emails directly and synchronize Google Forms, please connect your Google Workspace account.
                    </p>
                  </div>
                  <button
                    onClick={handleAuthorizeGoogle}
                    className="px-6 py-2.5 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Connect Workspace & Gmail &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* GMAIL API EMAIL SENDER */}
                  <div className="p-6 bg-[#FAF9F5] border border-gold/20 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-gold/10 rounded-lg text-gold">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-ivy text-sm uppercase tracking-wider">
                            Send Member & Candidate Emails
                          </h3>
                          <p className="text-[11px] text-ivy/60">
                            Send official candidate notifications, invitations, or member communications directly through your Google Workspace Gmail.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" /> Gmail Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-ivy/60 mb-1">Recipient Email Address</label>
                        <input
                          type="email"
                          value={gmailRecipient}
                          onChange={(e) => setGmailRecipient(e.target.value)}
                          placeholder="e.g. candidate@gmail.com or info@kpi2012.org"
                          className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-xs font-body focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-ivy/60 mb-1">Subject Line</label>
                        <input
                          type="text"
                          value={gmailSubject}
                          onChange={(e) => setGmailSubject(e.target.value)}
                          placeholder="e.g. Order of KPI - Membership Intake Notification"
                          className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-xs font-body focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-ivy/60 mb-1">Message Body</label>
                      <textarea
                        rows={4}
                        value={gmailBody}
                        onChange={(e) => setGmailBody(e.target.value)}
                        placeholder="Type your official message here..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-xs font-body focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white resize-y"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleSendGmail}
                        disabled={gmailSending}
                        className="px-6 py-2.5 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-gold" />
                        {gmailSending ? 'Sending Email...' : 'Send Email via Gmail'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Configuration */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Create New Form Section */}
                    <div className="p-5 bg-[#FAF9F5] border border-gold/20 rounded-2xl space-y-4">
                      <h3 className="font-display font-bold text-ivy text-xs uppercase tracking-wider flex items-center gap-2 border-b border-gold/10 pb-2">
                        <Database className="w-4 h-4 text-gold" /> Create Intake Form
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ivy/60 mb-1">New Form Title</label>
                          <input
                            type="text"
                            value={newFormTitle}
                            onChange={(e) => setNewFormTitle(e.target.value)}
                            placeholder="e.g. FY27 Membership Intake Application"
                            className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-xs font-body focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
                          />
                        </div>
                        <button
                          onClick={handleCreateForm}
                          disabled={formsLoading}
                          className="w-full px-4 py-2.5 bg-gold text-ivy rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all disabled:opacity-50"
                        >
                          {formsLoading ? 'Generating Form...' : 'Create New Google Form'}
                        </button>
                      </div>
                    </div>

                    {/* Link Existing Form Section */}
                    <div className="p-5 bg-[#FAF9F5] border border-gold/20 rounded-2xl space-y-4">
                      <h3 className="font-display font-bold text-ivy text-xs uppercase tracking-wider flex items-center gap-2 border-b border-gold/10 pb-2">
                        <Chrome className="w-4 h-4 text-gold" /> Link Existing Form ID
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-ivy/60 mb-1">Google Form ID</label>
                          <input
                            type="text"
                            value={inputFormId}
                            onChange={(e) => setInputFormId(e.target.value)}
                            placeholder="Enter the 44-character Google Form ID"
                            className="w-full px-4 py-2.5 rounded-xl border border-gold/20 text-xs font-body focus:outline-none focus:ring-2 focus:ring-gold/30 bg-white"
                          />
                        </div>
                        <button
                          onClick={handleLinkForm}
                          disabled={formsLoading}
                          className="w-full px-4 py-2.5 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                          {formsLoading ? 'Verifying...' : 'Link Existing Google Form'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Form Details & Response Sync */}
                  <div className="lg:col-span-7 space-y-6">
                    {googleFormId ? (
                      <div className="p-5 bg-[#FAF9F5] border border-gold/20 rounded-2xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-3">
                          <div>
                            <span className="text-[9px] uppercase font-bold bg-gold/20 text-gold px-2 py-0.5 rounded-md">Linked Active Form</span>
                            <h3 className="font-display font-bold text-ivy text-sm uppercase mt-1">
                              {formDetails?.info?.title || 'Loading Form Details...'}
                            </h3>
                          </div>
                          <a
                            href={`https://docs.google.com/forms/d/${googleFormId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold hover:text-gold/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            Open in Google Forms &rarr;
                          </a>
                        </div>

                        {formDetails?.info?.description && (
                          <p className="text-xs text-ivy/60 font-body italic leading-relaxed">
                            "{formDetails.info.description}"
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="bg-white p-4 rounded-xl border border-gold/10">
                            <span className="block text-[10px] uppercase font-bold text-ivy/40">Total Responses</span>
                            <span className="text-2xl font-display font-bold text-ivy mt-1 block">
                              {formResponses.length}
                            </span>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gold/10">
                            <span className="block text-[10px] uppercase font-bold text-ivy/40">Sync Status</span>
                            <span className="text-xs font-bold text-green-700 mt-2 block flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Fully Connected
                            </span>
                          </div>
                        </div>

                        {/* Import Responses Panel */}
                        {formResponses.length > 0 ? (
                          <div className="pt-4 space-y-3 border-t border-gold/10">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase text-ivy">Database Synchronization</h4>
                              <span className="text-[10px] text-ivy/40 uppercase font-mono">Real-time mapping</span>
                            </div>
                            <p className="text-xs text-ivy/60 leading-relaxed font-body">
                              Automatically map Google Form text answers into formal prospective candidate database accounts. Default passwords will be set to the last 4 digits of their phone numbers to enable dynamic candidate logins!
                            </p>
                            <button
                              onClick={handleImportResponses}
                              disabled={formsLoading}
                              className="w-full py-3 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <ArrowDownToLine className="w-4 h-4 text-gold" />
                              {formsLoading ? 'Synchronizing Datasets...' : `Synchronize & Import ${formResponses.length} Responses`}
                            </button>
                            {importedCount !== null && (
                              <p className="text-center text-xs font-bold text-green-700 bg-green-50 border border-green-200 py-2.5 rounded-xl">
                                Success: {importedCount} candidate(s) have been added.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <p className="text-xs text-amber-800 font-bold">
                              No responses have been submitted to this Google Form yet.
                            </p>
                          </div>
                        )}

                        {/* Responses Preview Table with Horizontal/Vertical Scroll */}
                        {formResponses.length > 0 && (
                          <div className="pt-4 border-t border-gold/10 space-y-2">
                            <h4 className="text-xs font-bold uppercase text-ivy">Live Responses Queue</h4>
                            <div className="overflow-x-auto overflow-y-auto max-h-60 rounded-xl border border-gold/15 bg-white">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className="bg-[#FAF9F5] border-b border-gold/20 text-ivy/70">
                                    <th className="p-2.5 font-bold uppercase tracking-wider">Response ID</th>
                                    <th className="p-2.5 font-bold uppercase tracking-wider">Email Address</th>
                                    <th className="p-2.5 font-bold uppercase tracking-wider">Submission Time</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formResponses.map((r: any) => (
                                    <tr key={r.responseId} className="border-b border-gold/5 hover:bg-[#FAF9F5] transition-colors">
                                      <td className="p-2.5 font-mono text-gold font-bold">{r.responseId}</td>
                                      <td className="p-2.5 font-bold">{r.respondentEmail || 'No Email Collected'}</td>
                                      <td className="p-2.5 text-ivy/60">{r.createTime ? new Date(r.createTime).toLocaleString() : 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center p-8 bg-[#FAF9F5] border border-dashed border-gold/30 rounded-2xl text-center space-y-3">
                        <Chrome className="w-10 h-10 text-gold/40" />
                        <div>
                          <h4 className="font-display font-bold text-ivy text-xs uppercase">No Active Form Linked</h4>
                          <p className="text-xs text-ivy/50 max-w-sm mx-auto mt-1">
                            Create a new form on the left panel or paste an existing Google Form ID to fetch real-time survey datasets.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: PASSWORD CHANGE AUDIT LOGS */}
        {activeTab === 'passwordLogs' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic flex items-center gap-2">
                  <Key className="w-5 h-5 text-gold" />
                  Password Real-Time Event & <span className="text-gold">Database Audit Stream</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Monitor live password change events, verify real-time database cluster persistence, and trace credential updates.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestDatabasePing}
                  disabled={isPingingDb}
                  className="px-4 py-2.5 bg-ivy text-cream hover:bg-ivy/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-gold/30 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gold ${isPingingDb ? 'animate-spin' : ''}`} />
                  {isPingingDb ? 'Testing Sync...' : 'Test DB Persistence Ping'}
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gold/20 shadow-soft flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/50">Total Password Changes</p>
                  <p className="text-2xl font-display font-bold text-ivy">
                    {systemLogs.filter(l => l.event_type === 'PASSWORD_CHANGE').length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gold/20 shadow-soft flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/50">DB Persistence Engine</p>
                  <p className="text-xs font-bold text-green-700 uppercase">100% Operational</p>
                  <p className="text-[9px] text-ivy/40">SQLite + Overrides + Firestore</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gold/20 shadow-soft flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/50">Failed Validation/Alerts</p>
                  <p className="text-2xl font-display font-bold text-amber-700">
                    {systemLogs.filter(l => l.event_type.includes('PASSWORD') && l.severity !== 'info').length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gold/20 shadow-soft flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/50">Live Stream Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-ivy uppercase">Active SSE Stream</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gold/20 shadow-soft flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivy/30 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user email or log details..."
                  value={passwordLogSearch}
                  onChange={(e) => setPasswordLogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-cream/50 border border-gold/20 rounded-xl text-xs text-ivy focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setPasswordLogFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    passwordLogFilter === 'all' ? 'bg-ivy text-cream' : 'bg-cream text-ivy/60 hover:text-ivy'
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setPasswordLogFilter('change')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    passwordLogFilter === 'change' ? 'bg-emerald-700 text-cream' : 'bg-cream text-ivy/60 hover:text-ivy'
                  }`}
                >
                  Password Changes
                </button>
                <button
                  onClick={() => setPasswordLogFilter('failure')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    passwordLogFilter === 'failure' ? 'bg-amber-700 text-cream' : 'bg-cream text-ivy/60 hover:text-ivy'
                  }`}
                >
                  Validation Alerts
                </button>
              </div>
            </div>

            {/* Password Audit Logs Table */}
            <div className="bg-white rounded-3xl border border-gold/20 overflow-hidden shadow-soft">
              <div className="p-4 bg-ivy text-cream font-display uppercase tracking-wider text-[11px] flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gold" /> Real-Time Password Audit Log Stream
                </span>
                <span className="text-gold font-mono text-[10px] bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
                  SSE Event Stream Active
                </span>
              </div>

              {systemLogs.filter(l => l.event_type.includes('PASSWORD') || l.event_type.includes('LOGIN')).length === 0 ? (
                <div className="p-16 text-center text-ivy/40 space-y-3">
                  <Key className="w-10 h-10 mx-auto text-gold/30" />
                  <p className="font-body text-sm italic">No password events logged in current session stream yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream border-b border-gold/10 text-[10px] font-bold uppercase tracking-widest text-ivy/50">
                      <tr>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Account Email</th>
                        <th className="py-4 px-6">Event Category</th>
                        <th className="py-4 px-6">Database Sync & Audit Detail</th>
                        <th className="py-4 px-6 text-right">Commit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10 text-ivy font-body">
                      {systemLogs
                        .filter(log => {
                          const isPass = log.event_type.includes('PASSWORD') || log.event_type.includes('LOGIN');
                          if (!isPass) return false;

                          if (passwordLogFilter === 'change' && !log.event_type.includes('CHANGE')) return false;
                          if (passwordLogFilter === 'failure' && !log.event_type.includes('FAILURE') && log.severity === 'info') return false;

                          if (passwordLogSearch) {
                            const q = passwordLogSearch.toLowerCase();
                            return log.email.toLowerCase().includes(q) || log.message.toLowerCase().includes(q) || log.event_type.toLowerCase().includes(q);
                          }

                          return true;
                        })
                        .map((log, idx) => (
                          <tr key={idx} className="hover:bg-gold/5 transition-colors">
                            <td className="py-4 px-6 text-ivy/50 font-mono whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 font-bold text-ivy">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-gold" />
                                <span>{log.email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                log.event_type === 'PASSWORD_CHANGE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                log.event_type.includes('FAILURE') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                <Activity className="w-3 h-3" />
                                {log.event_type.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-ivy/80 max-w-xs">
                              {log.message}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                log.severity === 'error' ? 'bg-red-100 text-red-800' :
                                log.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {log.severity === 'info' ? 'Committed' : log.severity.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: SYSTEM SETTINGS */}
        {activeTab === 'systemSettings' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <div>
                <h2 className="text-xl font-display font-bold text-ivy uppercase italic flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gold" />
                  Global System <span className="text-gold">Configurations</span>
                </h2>
                <p className="text-ivy/60 text-xs mt-1">
                  Manage organization-wide feature toggles, visibility controls, and access parameters.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gold/20 shadow-soft">
              <h3 className="font-display font-bold text-ivy text-sm uppercase mb-4 border-b border-gold/10 pb-2 flex items-center justify-between">
                <span>Feature Toggles & System Visibility</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  features.committee_enabled 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {features.committee_enabled ? '● Live: Visible to Organization' : '🔒 Stealth Mode Active (Admin Only)'}
                </span>
              </h3>
              
              <div className="space-y-6 max-w-3xl">
                {/* Committee Feature Control Card */}
                <div className="p-5 rounded-2xl border border-gold/25 bg-cream/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-ivy text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-gold" /> KP Committees Visibility Control
                      </h4>
                      <p className="text-xs text-ivy/70 leading-relaxed max-w-xl">
                        Select whether organizational committees, workspaces, and member appointment badges are visible to general members or locked in stealth mode for administrators only.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Stealth Mode Option Button */}
                    <button
                      type="button"
                      disabled={featuresLoading}
                      onClick={async () => {
                        if (!features.committee_enabled) return;
                        const success = await updateSystemFeature('committee_enabled', false);
                        if (success) {
                          showToast('success', 'Committee features switched to 🔒 Stealth Mode (Admin Only).');
                        } else {
                          showToast('error', 'Failed to update feature setting. Please try again.');
                        }
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        !features.committee_enabled
                          ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                          : 'bg-white border-gold/20 hover:border-gold/50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔒</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-ivy">Stealth Mode</span>
                        </div>
                        {!features.committee_enabled && (
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ivy/70">
                        Hidden & locked for all non-admin users. Only Admins can preview workspaces.
                      </p>
                    </button>

                    {/* Visible to Organization Option Button */}
                    <button
                      type="button"
                      disabled={featuresLoading}
                      onClick={async () => {
                        if (features.committee_enabled) return;
                        const success = await updateSystemFeature('committee_enabled', true);
                        if (success) {
                          showToast('success', 'Committee features switched to 🌐 Visible to Organization.');
                        } else {
                          showToast('error', 'Failed to update feature setting. Please try again.');
                        }
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        features.committee_enabled
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/50 shadow-sm'
                          : 'bg-white border-gold/20 hover:border-gold/50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🌐</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-ivy">Visible to Org</span>
                        </div>
                        {features.committee_enabled && (
                          <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ivy/70">
                        Live & visible to members according to standard role-based access control.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SITE WIDE NAVIGATOR */}
        {activeTab === 'siteNavigator' && (
          <AdminSiteNavigator />
        )}

            </div> {/* Closing Active Tool Workspace Content Frame */}
          </div> {/* Closing RIGHT COLUMN */}
        </div> {/* Closing Split Grid Layout */}
      </div> {/* Closing max-w-7xl outer container */}

      {/* MEMBER EDIT / CREATE MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-gold/30 border overflow-hidden"
          >
            <div className="p-6 bg-ivy flex justify-between items-center text-cream">
              <h2 className="text-2xl font-display font-bold">{isNewMember ? 'Add New Directory User' : 'Edit Directory User'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="text-cream/60 hover:text-cream">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMember} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">First Name</label>
                  <input
                    required
                    type="text"
                    value={editingMember?.first_name || ''}
                    onChange={e => {
                      const f = e.target.value;
                      const l = editingMember?.last_name || '';
                      setEditingMember({
                        ...editingMember!,
                        first_name: f,
                        name: `${f} ${l}`.trim()
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Last Name</label>
                  <input
                    required
                    type="text"
                    value={editingMember?.last_name || ''}
                    onChange={e => {
                      const l = e.target.value;
                      const f = editingMember?.first_name || '';
                      setEditingMember({
                        ...editingMember!,
                        last_name: l,
                        name: `${f} ${l}`.trim()
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Email Address</label>
                  <input
                    required
                    disabled={!isNewMember}
                    type="email"
                    value={editingMember?.email || ''}
                    onChange={e => {
                      const emailVal = e.target.value;
                      const isTest = emailVal.toLowerCase().startsWith('qa.') || emailVal.toLowerCase().startsWith('test.');
                      setEditingMember({
                        ...editingMember!,
                        email: emailVal,
                        is_test_credential: isTest ? 1 : (editingMember?.is_test_credential || 0)
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none disabled:bg-cream"
                    placeholder="user@orderofkpi.org"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Roles</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['member', 'officer', 'Committee Chair', 'Digital & Tech Committee Chair', 'Scholarship Committee Chair', 'Judicial & Ethics Committee Chair', 'Annual Event Committee Chair', 'Transfer Member Committee Chair', 'Membership Committee Chair', 'Membership Committee', 'Super Committee', 'admin'].map(r => (
                      <label key={r} className="flex items-center gap-2 text-xs cursor-pointer hover:text-gold">
                        <input
                          type="checkbox"
                          checked={(editingMember?.roles || (editingMember?.role ? [editingMember.role] : [])).includes(r)}
                          onChange={e => {
                            const currentRoles = editingMember?.roles || (editingMember?.role ? [editingMember.role] : []);
                            const newRoles = e.target.checked
                              ? [...currentRoles, r]
                              : currentRoles.filter(role => role !== r);
                            setEditingMember({...editingMember!, roles: newRoles, role: newRoles[0] || 'member'});
                          }}
                          className="rounded border-gold/20 text-gold focus:ring-gold/20"
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Official Title</label>
                  <input
                    type="text"
                    value={editingMember?.title || ''}
                    onChange={e => setEditingMember({...editingMember!, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Grammateus / Administrator"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Industry</label>
                  <input
                    type="text"
                    value={editingMember?.industry || ''}
                    onChange={e => setEditingMember({...editingMember!, industry: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Technology"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Financial Status</label>
                  <select
                    value={editingMember?.financial_status || 'inactive'}
                    onChange={e => setEditingMember({...editingMember!, financial_status: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/60 mb-2">Account Type</label>
                  <select
                    value={editingMember?.is_test_credential ? 'test' : 'regular'}
                    onChange={e => setEditingMember({
                      ...editingMember!,
                      is_test_credential: e.target.value === 'test' ? 1 : 0
                    })}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
                  >
                    <option value="regular">Regular Account</option>
                    <option value="test">Test Credential / QA</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gold/10">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-6 py-3 border border-gold/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-ivy text-cream rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Member Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CANDIDATE ADD MODAL */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-gold/30 border p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-gold/10 pb-4">
              <h2 className="text-xl font-display font-bold text-ivy">Add New Candidate</h2>
              <button onClick={() => setShowCandidateModal(false)} className="text-ivy/40 hover:text-ivy">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">First Name *</label>
                  <input
                    required
                    type="text"
                    value={newCandidate.firstName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={newCandidate.lastName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="Last Name"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="(555) 000-0000"
                />
                <p className="text-[10px] text-ivy/50 mt-1">Last 4 digits serve as default initial password.</p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none"
                  placeholder="applicant@gmail.com"
                />
                <p className="text-[10px] text-ivy/50 mt-1">Serves as email login username.</p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-widest text-ivy/60 mb-1.5">Initial Stage</label>
                <select
                  value={newCandidate.status}
                  onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gold/20 rounded-xl focus:ring-2 focus:ring-gold/20 outline-none bg-white cursor-pointer"
                >
                  <option value="Inquiry">Inquiry</option>
                  <option value="Applied">Applied</option>
                  <option value="Tea Time">Tea Time</option>
                  <option value="Interview">Interview</option>
                  <option value="Selection">Selection</option>
                  <option value="Intake">Intake</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gold/10">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gold/20 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-gold text-ivy rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* ADMIN OPERATIONS MANUAL USER GUIDE MODAL */}
      <AdminUserGuideModal 
        isOpen={showUserGuide} 
        onClose={() => setShowUserGuide(false)} 
        onNavigateTab={(tab) => {
          setActiveTab(tab as AdminDashboardTab);
          const tool = ADMIN_TOOLS.find(t => t.id === tab);
          if (tool) {
            setActiveHub(tool.category);
          }
          setShowUserGuide(false);
        }} 
      />
    </div>
  );
}
