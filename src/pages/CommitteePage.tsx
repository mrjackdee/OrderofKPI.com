import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  CalendarDays, 
  FolderGit2, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Link2, 
  FileText, 
  Award, 
  Sparkles, 
  Lock, 
  UserCheck, 
  UserPlus, 
  Share2, 
  Save, 
  X,
  Layers,
  ArrowRight,
  ClipboardList,
  ChevronRight,
  Video,
  MapPin
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import CommitteeAddToCalendar from '../components/CommitteeAddToCalendar';
import { CommitteeSlug, CommitteeRole, STANDING_COMMITTEES, Member } from '../types';
import { hasCommitteeAccess, isCommitteeChair, normalizeUserRBAC, defaultMembers, isEligibleFinancialMember } from '../lib/memberDb';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';
import { logPortalSectionAccess } from '../lib/auditLogger';
import { renderFormattedTextWithLinks } from '../lib/linkParser';

interface CommitteeResource {
  id: string;
  title: string;
  url: string;
  description?: string;
  type: 'drive' | 'folder' | 'doc' | 'sheet' | 'link';
  addedBy?: string;
  addedAt?: string;
}

interface CommitteeMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  meetLink?: string;
  agenda?: string;
}

interface CommitteeAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export const MEETING_TIME_OPTIONS = [
  '8:00 AM EST',
  '8:30 AM EST',
  '9:00 AM EST',
  '9:30 AM EST',
  '10:00 AM EST',
  '10:30 AM EST',
  '11:00 AM EST',
  '11:30 AM EST',
  '12:00 PM EST',
  '12:30 PM EST',
  '1:00 PM EST',
  '1:30 PM EST',
  '2:00 PM EST',
  '2:30 PM EST',
  '3:00 PM EST',
  '3:30 PM EST',
  '4:00 PM EST',
  '4:30 PM EST',
  '5:00 PM EST',
  '5:30 PM EST',
  '6:00 PM EST',
  '6:30 PM EST',
  '7:00 PM EST',
  '7:00 PM - 8:00 PM EST',
  '7:00 PM - 8:30 PM EST',
  '7:30 PM EST',
  '7:30 PM - 8:30 PM EST',
  '7:30 PM - 9:00 PM EST',
  '8:00 PM EST',
  '8:00 PM - 9:00 PM EST',
  '8:00 PM - 9:30 PM EST',
  '8:30 PM EST',
  '9:00 PM EST',
  '9:30 PM EST',
  '10:00 PM EST'
];

export function getMeetingTypeLabel(location?: string, meetLink?: string): string {
  if (meetLink) {
    const l = meetLink.toLowerCase();
    if (l.includes('zoom.us') || l.includes('zoom')) return 'Zoom';
    if (l.includes('meet.google.com') || l.includes('google.com') || l.includes('meet')) return 'Google Meet';
    if (l.includes('webex.com')) return 'Webex';
  }
  if (location) {
    const loc = location.toLowerCase();
    if (loc.includes('zoom')) return 'Zoom';
    if (loc.includes('google meet') || loc.includes('meet')) return 'Google Meet';
    if (loc.includes('in-person') || loc.includes('physical') || loc.includes('hall') || loc.includes('room') || loc.includes('st') || loc.includes('ave')) {
      return 'In-Person';
    }
  }
  return 'Zoom';
}

export function getMeetingSubheading(location?: string, meetLink?: string): string {
  const typeLabel = getMeetingTypeLabel(location, meetLink);
  if (location && location.trim()) {
    if (location.toLowerCase().includes('virtual')) {
      return location;
    }
    if (typeLabel === 'In-Person') {
      return location.startsWith('In-Person') ? location : `In-Person (${location})`;
    }
    return `Virtual / ${typeLabel}`;
  }
  return `Virtual / ${typeLabel}`;
}

export default function CommitteePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userRole = sessionStorage.getItem('userRole') || 'member';
  let userCommittees: CommitteeSlug[] = [];
  let userCommitteeRoles: Record<string, 'chair' | 'member'> = {};
  
  try {
    const rawCommittees = sessionStorage.getItem('userCommittees');
    if (rawCommittees) userCommittees = JSON.parse(rawCommittees);
    const rawRoles = sessionStorage.getItem('userCommitteeRoles');
    if (rawRoles) userCommitteeRoles = JSON.parse(rawRoles);
  } catch (e) {}

  const normUser = normalizeUserRBAC({
    email: userEmail,
    role: userRole,
    committees: userCommittees,
    committeeRoles: userCommitteeRoles
  });

  const committeeDef = STANDING_COMMITTEES.find(c => c.slug === slug);

  // Access validation
  const hasAccess = slug ? hasCommitteeAccess(slug as CommitteeSlug, normUser) : false;
  const isChair = slug ? isCommitteeChair(slug as CommitteeSlug, normUser) : false;
  const isAdmin = normUser.role === 'admin' || normUser.email === 'admin@orderofkpi.org' || normUser.email === 'qa.admin@orderofkpi.org' || normUser.email === 'info@kpi2012.org';
  const isOfficer = normUser.role === 'officer';
  const canEdit = isChair || isAdmin || isOfficer;

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<'calendar' | 'resources' | 'roster' | 'announcements'>('calendar');

  // Committee data states
  const [resources, setResources] = useState<CommitteeResource[]>([]);
  const [meetings, setMeetings] = useState<CommitteeMeeting[]>([]);
  const [announcements, setAnnouncements] = useState<CommitteeAnnouncement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allAvailableMembers, setAllAvailableMembers] = useState<Member[]>([]);
  const [financialEmails, setFinancialEmails] = useState<Set<string>>(new Set());
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [isEditingPurpose, setIsEditingPurpose] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState<string>('');

  // Modals & form states
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState<CommitteeResource | null>(null);
  const [newResource, setNewResource] = useState<{ title: string; url: string; description: string; type: CommitteeResource['type'] }>({
    title: '',
    url: '',
    description: '',
    type: 'drive'
  });

  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CommitteeMeeting | null>(null);
  const [newMeeting, setNewMeeting] = useState<{ title: string; date: string; time: string; location: string; meetLink: string; agenda: string }>({
    title: '',
    date: '',
    time: '',
    location: '',
    meetLink: '',
    agenda: ''
  });

  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<CommitteeAnnouncement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<{ title: string; content: string }>({
    title: '',
    content: ''
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMemberEmail, setSelectedMemberEmail] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<'chair' | 'member'>('member');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (committeeDef) {
      logPortalSectionAccess(`${committeeDef.name} Page`);
      loadCommitteeData(committeeDef.slug);
    }
  }, [slug]);

  if (!committeeDef) {
    return <Navigate to="/member-portal" replace />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full bg-white border border-gold/20 rounded-lg p-8 text-center shadow-soft space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold text-ivy uppercase tracking-wider">Restricted Committee</h2>
          <p className="text-ivy/70 text-sm font-body">
            You are not currently assigned to the <strong>{committeeDef.name}</strong>. Access is restricted to appointed committee members, committee chairs, officers, and administrators.
          </p>
          <Link
            to="/member-portal"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-ivy text-cream font-bold uppercase tracking-widest text-xs rounded hover:bg-ivy/90 transition-all"
          >
            <ChevronLeft size={16} /> Return to Member Portal
          </Link>
        </div>
      </div>
    );
  }

  const loadCommitteeData = (committeeSlug: CommitteeSlug) => {
    // 1. Resources from local storage fallback or default
    const savedResources = localStorage.getItem(`kpi_committee_resources_${committeeSlug}`);
    if (savedResources) {
      try {
        setResources(JSON.parse(savedResources));
      } catch (e) {
        setDefaultResources(committeeSlug);
      }
    } else {
      setDefaultResources(committeeSlug);
    }

    // 2. Meetings
    const savedMeetings = localStorage.getItem(`kpi_committee_meetings_${committeeSlug}`);
    if (savedMeetings) {
      try {
        const parsed: CommitteeMeeting[] = JSON.parse(savedMeetings);
        setMeetings(parsed);
      } catch (e) {
        setDefaultMeetings(committeeSlug);
      }
    } else {
      setDefaultMeetings(committeeSlug);
    }

    // 3. Announcements
    const savedAnnouncements = localStorage.getItem(`kpi_committee_announcements_${committeeSlug}`);
    if (savedAnnouncements) {
      try {
        setAnnouncements(JSON.parse(savedAnnouncements));
      } catch (e) {
        setDefaultAnnouncements(committeeSlug);
      }
    } else {
      setDefaultAnnouncements(committeeSlug);
    }

    // 4. Purpose Statement
    const savedPurpose = localStorage.getItem(`kpi_committee_purpose_${committeeSlug}`);
    if (savedPurpose) {
      setCustomPurpose(savedPurpose);
    } else {
      setCustomPurpose(committeeDef.purpose || committeeDef.description);
    }

    // 5. Fetch all members and live financial roster
    Promise.allSettled([
      fetch('/api/members').then(res => res.json()),
      getLiveGoogleSheetRoster().catch(() => null)
    ]).then(([membersRes, sheetRes]) => {
      const financialSet = new Set<string>();

      if (sheetRes.status === 'fulfilled' && sheetRes.value && Array.isArray(sheetRes.value.members)) {
        for (const sm of sheetRes.value.members) {
          if (sm.fy27Paid) {
            if (sm.kpiEmail) financialSet.add(sm.kpiEmail.toLowerCase().trim());
            if (sm.personalEmail) financialSet.add(sm.personalEmail.toLowerCase().trim());
          }
        }
      }
      setFinancialEmails(financialSet);

      if (membersRes.status === 'fulfilled' && membersRes.value?.success && Array.isArray(membersRes.value.members)) {
        setAllAvailableMembers(membersRes.value.members);
        filterMembersForCommittee(membersRes.value.members, committeeSlug);
      } else {
        fallbackMembers(committeeSlug);
      }
    }).catch(() => {
      fallbackMembers(committeeSlug);
    });
  };

  const fallbackMembers = (committeeSlug: CommitteeSlug) => {
    const list = defaultMembers.map(m => {
      const norm = normalizeUserRBAC(m);
      return {
        ...m,
        role: norm.role,
        title: norm.title,
        committees: norm.committees,
        committeeRoles: norm.committeeRoles,
        financial_status: 'active'
      } as Member;
    });
    setAllAvailableMembers(list);
    filterMembersForCommittee(list, committeeSlug);
  };

  const filterMembersForCommittee = (memberList: Member[], committeeSlug: CommitteeSlug) => {
    const assigned = memberList.filter(m => {
      const norm = normalizeUserRBAC(m);
      return norm.committees.includes(committeeSlug);
    });
    setMembers(assigned);
  };

  const setDefaultResources = (committeeSlug: CommitteeSlug) => {
    const defaults: Record<CommitteeSlug, CommitteeResource[]> = {
      annual_event: [
        {
          id: 'res-ae-1',
          title: 'Annual Gala & Event Master Planning Folder',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-annual-event',
          description: 'Official Google Shared Drive containing vendor contracts, run-of-show templates, and budgeting documents.',
          type: 'drive',
          addedBy: 'Committee Chair',
          addedAt: '2026-01-15'
        },
        {
          id: 'res-ae-2',
          title: 'FY26-FY27 Event Venue & Catering Matrix',
          url: 'https://docs.google.com/spreadsheets/d/kpi-event-catering-matrix',
          description: 'Collaborative spreadsheet mapping venue capacities, banquet rates, and audio/visual packages.',
          type: 'sheet',
          addedBy: 'Admin',
          addedAt: '2026-02-01'
        }
      ],
      scholarship: [
        {
          id: 'res-sch-1',
          title: 'Scholarship Application Vault & Evaluation Rubric',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-scholarships',
          description: 'Official Google Shared Drive containing high school & collegiate scholarship scoring rubrics and submission archives.',
          type: 'drive',
          addedBy: 'Scholarship Chair',
          addedAt: '2026-01-10'
        },
        {
          id: 'res-sch-2',
          title: 'Awardee Selection & Disbursement Log',
          url: 'https://docs.google.com/spreadsheets/d/kpi-scholarship-disbursements',
          description: 'Official disbursement accounting tracking awarded endowments and donor recognition letters.',
          type: 'sheet',
          addedBy: 'Admin',
          addedAt: '2026-02-10'
        }
      ],
      judicial_ethics: [
        {
          id: 'res-je-1',
          title: 'Judicial Committee Case Files & Precedents',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-judicial-ethics',
          description: 'Secure, encrypted Google Shared Drive for grievance documentation, ethics compliance reviews, and hearing dockets.',
          type: 'drive',
          addedBy: 'Committee Chair',
          addedAt: '2026-01-05'
        },
        {
          id: 'res-je-2',
          title: 'Standing Constitution & Bylaws (Amended 2026)',
          url: '/constitution',
          description: 'The fundamental governing articles and organizational canons of The Order of KPI, Inc.',
          type: 'doc',
          addedBy: 'Grammateus',
          addedAt: '2026-01-01'
        }
      ],
      digital_technology: [
        {
          id: 'res-dt-1',
          title: 'Digital Systems Architecture & Portal Repository',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-digital-tech',
          description: 'Google Shared Drive with website assets, UI style tokens, database schemas, and integration credentials.',
          type: 'drive',
          addedBy: 'Technology Chair',
          addedAt: '2026-01-20'
        },
        {
          id: 'res-dt-2',
          title: 'Infrastructure Maintenance & Feature Backlog',
          url: 'https://docs.google.com/spreadsheets/d/kpi-tech-backlog-2026',
          description: 'Sprint tracking for Member Portal enhancements, candidate voting systems, and automated email pipelines.',
          type: 'sheet',
          addedBy: 'Technology Chair',
          addedAt: '2026-02-14'
        }
      ],
      membership_intake: [
        {
          id: 'res-mi-1',
          title: 'FY27 Membership Intake Process Document Vault',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-intake-vault',
          description: 'Official Google Shared Drive containing candidate interview packets, scoring guides, and background check templates.',
          type: 'drive',
          addedBy: 'James Haywood Jr',
          addedAt: '2026-01-12'
        },
        {
          id: 'res-mi-2',
          title: 'FY27 Membership Intake Calendar & Schedule',
          url: '/intake-calendar',
          description: 'Official intake schedule, key dates, meetings, and Dean process timeline.',
          type: 'link',
          addedBy: 'Membership Committee Chair',
          addedAt: '2026-01-15'
        }
      ],
      transfer_member: [
        {
          id: 'res-tm-1',
          title: 'Transfer Member Integration & Verification Vault',
          url: 'https://drive.google.com/drive/folders/order-of-kpi-transfer-portal',
          description: 'Shared Drive housing chapter clearance verifications, financial good-standing validations, and orientation curricula.',
          type: 'drive',
          addedBy: 'Transfer Chair',
          addedAt: '2026-01-18'
        },
        {
          id: 'res-tm-2',
          title: 'Transfer Candidate Onboarding Checklist',
          url: 'https://docs.google.com/spreadsheets/d/kpi-transfer-onboarding-tracker',
          description: 'Master checklist verifying ritual knowledge recertification, dues alignment, and chapter assimilation.',
          type: 'sheet',
          addedBy: 'Admin',
          addedAt: '2026-02-05'
        }
      ]
    };

    const initial = defaults[committeeSlug] || [];
    setResources(initial);
    localStorage.setItem(`kpi_committee_resources_${committeeSlug}`, JSON.stringify(initial));
  };

  const setDefaultMeetings = (committeeSlug: CommitteeSlug) => {
    const defaultM: CommitteeMeeting[] = [
      {
        id: 'mtg-1',
        title: `${committeeDef.name} Monthly Working Session`,
        date: '2026-03-08',
        time: '7:00 PM - 8:30 PM EST',
        location: 'Virtual / Zoom',
        meetLink: 'https://zoom.us/j/kpicommittee',
        agenda: 'Review strategic milestones and quarterly deliverables.'
      }
    ];
    setMeetings(defaultM);
    localStorage.setItem(`kpi_committee_meetings_${committeeSlug}`, JSON.stringify(defaultM));
  };

  const setDefaultAnnouncements = (committeeSlug: CommitteeSlug) => {
    const defaultA: CommitteeAnnouncement[] = [
      {
        id: 'ann-1',
        title: `Welcome to the ${committeeDef.name} Workspace`,
        content: `This standardized committee workspace is equipped with Role-Based Access Control (RBAC). Committee Chairs have administrative privileges to manage Drive links, calendar schedules, and committee announcements.`,
        date: '2026-02-28',
        author: 'System Administrator'
      }
    ];
    setAnnouncements(defaultA);
    localStorage.setItem(`kpi_committee_announcements_${committeeSlug}`, JSON.stringify(defaultA));
  };

  // Add Resource Handler (Chair / Admin)
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url) return;

    const resourceObj: CommitteeResource = {
      id: 'res-' + Math.random().toString(36).substring(2, 9),
      title: newResource.title,
      url: newResource.url.startsWith('http') || newResource.url.startsWith('/') ? newResource.url : `https://${newResource.url}`,
      description: newResource.description,
      type: newResource.type,
      addedBy: userEmail,
      addedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [resourceObj, ...resources];
    setResources(updated);
    localStorage.setItem(`kpi_committee_resources_${committeeDef.slug}`, JSON.stringify(updated));
    setShowAddResourceModal(false);
    setNewResource({ title: '', url: '', description: '', type: 'drive' });
    setNotification({ type: 'success', message: 'Resource link added successfully to committee vault.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !editingResource.title || !editingResource.url) return;

    const formattedUrl = editingResource.url.startsWith('http') || editingResource.url.startsWith('/') 
      ? editingResource.url 
      : `https://${editingResource.url}`;

    const updated = resources.map(r => r.id === editingResource.id ? { ...editingResource, url: formattedUrl } : r);
    setResources(updated);
    localStorage.setItem(`kpi_committee_resources_${committeeDef.slug}`, JSON.stringify(updated));
    setEditingResource(null);
    setNotification({ type: 'success', message: 'Resource link updated successfully.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteResource = (id: string) => {
    if (!canEdit) return;
    const updated = resources.filter(r => r.id !== id);
    setResources(updated);
    localStorage.setItem(`kpi_committee_resources_${committeeDef.slug}`, JSON.stringify(updated));
    setNotification({ type: 'success', message: 'Resource link removed.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Meeting Handler (Chair / Admin)
  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.date) return;

    const meetingObj: CommitteeMeeting = {
      id: 'mtg-' + Math.random().toString(36).substring(2, 9),
      title: newMeeting.title,
      date: newMeeting.date,
      time: newMeeting.time || '7:00 PM EST',
      location: newMeeting.location || 'Virtual / Zoom',
      meetLink: newMeeting.meetLink,
      agenda: newMeeting.agenda
    };

    const updated = [...meetings, meetingObj].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMeetings(updated);
    localStorage.setItem(`kpi_committee_meetings_${committeeDef.slug}`, JSON.stringify(updated));
    setShowAddMeetingModal(false);
    setNewMeeting({ title: '', date: '', time: '', location: '', meetLink: '', agenda: '' });
    setNotification({ type: 'success', message: 'Committee meeting scheduled and added to calendar.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting || !editingMeeting.title || !editingMeeting.date) return;

    const updated = meetings.map(m => m.id === editingMeeting.id ? editingMeeting : m)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setMeetings(updated);
    localStorage.setItem(`kpi_committee_meetings_${committeeDef.slug}`, JSON.stringify(updated));
    setEditingMeeting(null);
    setNotification({ type: 'success', message: 'Meeting details updated successfully.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteMeeting = (id: string) => {
    if (!canEdit) return;
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    localStorage.setItem(`kpi_committee_meetings_${committeeDef.slug}`, JSON.stringify(updated));
    setNotification({ type: 'success', message: 'Meeting removed.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Announcement Handler (Chair / Admin)
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    const annObj: CommitteeAnnouncement = {
      id: 'ann-' + Math.random().toString(36).substring(2, 9),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: new Date().toISOString().split('T')[0],
      author: isChair ? 'Committee Chair' : 'Officer / Admin'
    };

    const updated = [annObj, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem(`kpi_committee_announcements_${committeeDef.slug}`, JSON.stringify(updated));
    setShowAddAnnouncementModal(false);
    setNewAnnouncement({ title: '', content: '' });
    setNotification({ type: 'success', message: 'Committee announcement posted.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !editingAnnouncement.title || !editingAnnouncement.content) return;

    const updated = announcements.map(a => a.id === editingAnnouncement.id ? editingAnnouncement : a);
    setAnnouncements(updated);
    localStorage.setItem(`kpi_committee_announcements_${committeeDef.slug}`, JSON.stringify(updated));
    setEditingAnnouncement(null);
    setNotification({ type: 'success', message: 'Announcement updated successfully.' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!canEdit) return;
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem(`kpi_committee_announcements_${committeeDef.slug}`, JSON.stringify(updated));
    setNotification({ type: 'success', message: 'Announcement deleted.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Member to Committee Handler (Chair / Admin)
  const handleAddMemberToCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberEmail) return;

    const memberToUpdate = allAvailableMembers.find(m => m.email.toLowerCase() === selectedMemberEmail.toLowerCase());
    if (!memberToUpdate) return;

    const norm = normalizeUserRBAC(memberToUpdate);
    const existingCommittees = [...norm.committees];
    if (!existingCommittees.includes(committeeDef.slug)) {
      existingCommittees.push(committeeDef.slug);
    }
    const existingRoles = { ...norm.committeeRoles, [committeeDef.slug]: selectedMemberRole };

    // Update in local state
    const updatedMemberList = allAvailableMembers.map(m => {
      if (m.email.toLowerCase() === selectedMemberEmail.toLowerCase()) {
        return {
          ...m,
          committees: existingCommittees,
          committeeRoles: existingRoles
        };
      }
      return m;
    });

    setAllAvailableMembers(updatedMemberList);
    filterMembersForCommittee(updatedMemberList, committeeDef.slug);

    // Call server API for committee assignment
    try {
      await fetch('/api/committee/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedMemberEmail,
          committeeSlug: committeeDef.slug,
          role: selectedMemberRole,
          chairEmail: userEmail
        })
      });
    } catch (err) {}

    setShowAddMemberModal(false);
    setSelectedMemberEmail('');
    setNotification({ type: 'success', message: `Added member to ${committeeDef.name} as ${selectedMemberRole}.` });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRemoveMemberFromCommittee = async (memberEmail: string) => {
    if (!canEdit) return;
    const normTarget = memberEmail.toLowerCase().trim();

    const updatedMemberList = allAvailableMembers.map(m => {
      if (m.email.toLowerCase() === normTarget) {
        const norm = normalizeUserRBAC(m);
        const filteredCommittees = norm.committees.filter(c => c !== committeeDef.slug);
        const filteredRoles = { ...norm.committeeRoles };
        delete filteredRoles[committeeDef.slug];
        return {
          ...m,
          committees: filteredCommittees,
          committeeRoles: filteredRoles
        };
      }
      return m;
    });

    setAllAvailableMembers(updatedMemberList);
    filterMembersForCommittee(updatedMemberList, committeeDef.slug);

    try {
      await fetch(`/api/committee/members/${encodeURIComponent(normTarget)}?slug=${committeeDef.slug}&chairEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });
    } catch (err) {}

    setNotification({ type: 'success', message: `Member removed from ${committeeDef.name}.` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleCommitteeRole = async (memberEmail: string, currentlyChair: boolean) => {
    if (!canEdit) return;
    const normTarget = memberEmail.toLowerCase().trim();
    const newRole = currentlyChair ? 'member' : 'chair';

    const updatedMemberList = allAvailableMembers.map(m => {
      if (m.email.toLowerCase() === normTarget) {
        const norm = normalizeUserRBAC(m);
        const existingCommittees = [...norm.committees];
        if (!existingCommittees.includes(committeeDef.slug)) {
          existingCommittees.push(committeeDef.slug);
        }
        const existingRoles = { ...norm.committeeRoles, [committeeDef.slug]: newRole };
        return {
          ...m,
          committees: existingCommittees,
          committeeRoles: existingRoles as Record<string, CommitteeRole>
        };
      }
      return m;
    });

    setAllAvailableMembers(updatedMemberList);
    filterMembersForCommittee(updatedMemberList, committeeDef.slug);

    try {
      await fetch('/api/committee/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: memberEmail,
          committeeSlug: committeeDef.slug,
          committeeRole: newRole,
          chairEmail: userEmail
        })
      });
    } catch (err) {}

    setNotification({ type: 'success', message: `Updated ${memberEmail} role to ${newRole === 'chair' ? 'Committee Chair' : 'Committee Member'}.` });
    setTimeout(() => setNotification(null), 3000);
  };

  // Update Purpose Statement Handler (Chair / Admin)
  const handleSavePurpose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canEdit) return;
    const finalPurpose = purposeDraft.trim() || committeeDef.purpose || committeeDef.description;
    setCustomPurpose(finalPurpose);
    localStorage.setItem(`kpi_committee_purpose_${committeeDef.slug}`, finalPurpose);
    setIsEditingPurpose(false);
    setNotification({ type: 'success', message: 'Committee purpose statement updated.' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-cream text-ivy font-body">
      <div className="w-full max-w-7xl mx-auto px-6 py-6 md:py-12 space-y-8">
        <MemberHeader />

        {/* Back Link */}
        <div>
          <Link
            to="/member-portal"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ivy/60 hover:text-gold transition-colors"
          >
            <ChevronLeft size={16} /> Back to Member Portal
          </Link>
        </div>

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg flex items-center justify-between border ${
                notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-xs font-bold uppercase tracking-wider">{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-current opacity-70 hover:opacity-100">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Committee Header Banner */}
        <div className="bg-white border border-gold/20 rounded-lg p-8 md:p-10 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivy text-cream text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                  <Layers size={12} className="text-gold" />
                  Standing Committee
                </div>
                {isChair && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold text-ivy text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-sm">
                    <Award size={12} />
                    Committee Chair
                  </div>
                )}
                {isAdmin && !isChair && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                    <ShieldCheck size={12} />
                    Administrator View
                  </div>
                )}
                {isOfficer && !isAdmin && !isChair && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ivy/80 text-cream text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                    <ShieldCheck size={12} />
                    Officer View
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-ivy">
                {committeeDef.name}
              </h1>

              {isEditingPurpose ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={2}
                    value={purposeDraft}
                    onChange={e => setPurposeDraft(e.target.value)}
                    placeholder="Enter short purpose statement..."
                    className="w-full px-3 py-2 bg-cream border border-gold/40 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSavePurpose()}
                      className="px-3 py-1.5 bg-ivy text-cream text-[10px] font-bold uppercase tracking-widest rounded hover:bg-ivy/90"
                    >
                      Save Purpose
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPurpose(false)}
                      className="px-3 py-1.5 text-xs text-ivy/60 hover:text-ivy font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative flex items-start gap-2">
                  <p className="text-ivy/70 text-sm max-w-3xl leading-relaxed">
                    {customPurpose}
                  </p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setPurposeDraft(customPurpose);
                        setIsEditingPurpose(true);
                      }}
                      className="text-ivy/40 hover:text-gold transition-colors p-1"
                      title="Edit Purpose Statement"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chair / Admin Affordance Status Pill */}
            {canEdit && (
              <div className="bg-cream/80 border border-gold/30 rounded-lg p-4 text-center md:text-right shrink-0">
                <div className="flex items-center justify-center md:justify-end gap-1.5 text-xs font-bold text-ivy uppercase tracking-wider">
                  <Edit3 size={14} className="text-gold" />
                  <span>Management Controls Active</span>
                </div>
                <p className="text-[10px] text-ivy/60 uppercase tracking-widest mt-1">
                  You have editor privileges on this committee
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Special Banner for Membership Intake Committee */}
        {committeeDef.slug === 'membership_intake' && (
          <div className="bg-ivy text-cream rounded-lg p-6 border border-gold/30 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
                <Award size={16} />
                <span>Active Intake Process Controls</span>
              </div>
              <h3 className="text-lg font-display uppercase tracking-wider text-cream font-bold">
                FY27 Membership Intake Pipeline
              </h3>
              <p className="text-cream/70 text-xs max-w-2xl">
                Quickly navigate to active applicant review dashboards, scoring trackers, and the strategic intake calendar.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/candidate-tracker"
                className="px-4 py-2 bg-gold text-ivy font-bold uppercase tracking-wider text-xs rounded hover:bg-gold/90 transition-all flex items-center gap-2"
              >
                <Users size={14} /> Candidate Tracker
              </Link>
              <Link
                to="/review-applications"
                className="px-4 py-2 bg-cream text-ivy font-bold uppercase tracking-wider text-xs rounded hover:bg-white transition-all flex items-center gap-2"
              >
                <ClipboardList size={14} /> Review Applications
              </Link>
              {canEdit && (
                <Link
                  to="/chair-dashboard"
                  className="px-4 py-2 bg-white/10 text-cream border border-gold/40 font-bold uppercase tracking-wider text-xs rounded hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={14} /> Chair Portal
                </Link>
              )}
            </div>
          </div>
        )}

        {/* PROMINENT TOP ANNOUNCEMENT: Critical Announcements */}
        {announcements.length > 0 && (
          <div className="bg-gradient-to-r from-cream via-white to-cream border-2 border-gold/40 rounded-xl p-5 md:p-6 shadow-soft relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gold/20 text-ivy rounded-lg border border-gold/30">
                  <FileText size={20} className="text-ivy" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-gold text-ivy">
                      Latest Notice
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/60">
                      Latest Announcements ({announcements.length})
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-display font-bold uppercase tracking-wider text-ivy mt-0.5">
                    {announcements[0].title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="px-4 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-ivy/90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>View all Announcements</span>
                  <ChevronRight size={14} className="text-gold" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => setShowAddAnnouncementModal(true)}
                    className="px-3.5 py-2 bg-gold/20 text-ivy border border-gold/40 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gold/30 transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Post Announcement</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white/80 border border-gold/15 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-ivy/80 text-xs leading-relaxed line-clamp-2 max-w-4xl">
                {renderFormattedTextWithLinks(announcements[0].content)}
              </p>
              <div className="flex items-center gap-4 text-[10px] text-ivy/50 shrink-0 uppercase tracking-widest font-semibold border-t md:border-t-0 md:border-l border-gold/20 pt-2 md:pt-0 md:pl-4">
                <span>By {announcements[0].author}</span>
                <span>•</span>
                <span>{announcements[0].date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-gold/20 overflow-x-auto gap-2">
          {[
            { id: 'calendar', label: 'Committee Calendar', icon: CalendarDays, count: meetings.length },
            { id: 'resources', label: 'Document Repository', icon: FolderGit2, count: resources.length },
            { id: 'roster', label: 'Committee Roster', icon: Users, count: members.length },
            { id: 'announcements', label: 'Announcements', icon: FileText, count: announcements.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-gold text-ivy bg-gold/5 font-black' 
                    : 'border-transparent text-ivy/60 hover:text-ivy hover:border-gold/30'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-gold' : 'text-ivy/40'} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-gold text-ivy font-bold' : 'bg-ivy/5 text-ivy/50'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DOCUMENT REPOSITORY */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-ivy">
                  Document Repository
                </h3>
                <p className="text-ivy/60 text-xs">
                  Centralized Google Drive folders, document templates, spreadsheets, and reference materials.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => setShowAddResourceModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all shadow-sm"
                >
                  <Plus size={16} className="text-gold" />
                  <span>Add Document / Link</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map(res => (
                <div 
                  key={res.id}
                  className="bg-white border border-gold/20 rounded-lg p-6 shadow-soft flex flex-col justify-between group hover:border-gold transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="p-3 bg-gold/10 text-ivy rounded-lg border border-gold/20 group-hover:bg-ivy group-hover:text-gold transition-colors">
                        <FolderGit2 size={24} />
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingResource(res)}
                            className="text-ivy/60 hover:text-ivy p-1.5 rounded hover:bg-gold/10 transition-colors"
                            title="Edit Resource Link & Details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Remove Resource"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-display font-bold uppercase tracking-wider text-ivy group-hover:text-gold transition-colors">
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-ivy/70 text-xs mt-1 leading-relaxed">
                          {res.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gold/10 mt-6 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-ivy/40 uppercase tracking-wider">
                      {res.addedAt ? `Added ${res.addedAt}` : 'Official Resource'}
                    </span>
                    <a
                      href={res.url}
                      target={res.url.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-gold hover:text-ivy transition-colors"
                    >
                      <span>Open Drive Link</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {resources.length === 0 && (
              <div className="bg-white border border-gold/20 rounded-lg p-12 text-center shadow-soft">
                <FolderGit2 size={40} className="mx-auto text-gold/40 mb-3" />
                <p className="text-ivy font-display font-bold uppercase tracking-wider text-sm">No Shared Drive Links Added Yet</p>
                <p className="text-ivy/50 text-xs mt-1">Committee Chairs can add official Google Shared Drive locations using the button above.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMMITTEE MEETINGS & CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-ivy">
                  Committee Calendar
                </h3>
                <p className="text-ivy/60 text-xs">
                  Working sessions, review meetings, and milestone deadlines for the {committeeDef.name}.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => setShowAddMeetingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all shadow-sm"
                >
                  <Plus size={16} className="text-gold" />
                  <span>Schedule Meeting</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {meetings.map(mtg => (
                <div
                  key={mtg.id}
                  className="bg-white border border-gold/20 rounded-lg p-6 shadow-soft flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-ivy text-gold rounded-lg border border-gold/20 shrink-0">
                          <Calendar size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">
                              {mtg.date}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/80 bg-ivy/5 border border-gold/20 px-2 py-0.5 rounded flex items-center gap-1">
                              {getMeetingTypeLabel(mtg.location, mtg.meetLink) === 'In-Person' ? (
                                <MapPin size={10} className="text-gold" />
                              ) : (
                                <Video size={10} className="text-gold" />
                              )}
                              {getMeetingTypeLabel(mtg.location, mtg.meetLink)}
                            </span>
                          </div>
                          <h4 className="text-base font-display font-bold uppercase tracking-wider text-ivy mt-1">
                            {mtg.title}
                          </h4>
                          <p className="text-xs font-semibold text-gold tracking-wide mt-0.5 flex items-center gap-1.5">
                            {getMeetingTypeLabel(mtg.location, mtg.meetLink) === 'In-Person' ? (
                              <MapPin size={12} className="text-gold shrink-0" />
                            ) : (
                              <Video size={12} className="text-gold shrink-0" />
                            )}
                            <span>{getMeetingSubheading(mtg.location, mtg.meetLink)}</span>
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingMeeting(mtg)}
                            className="text-ivy/60 hover:text-ivy p-1.5 rounded hover:bg-gold/10 transition-colors"
                            title="Edit Meeting Details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteMeeting(mtg.id)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Remove Meeting"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-ivy/70">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gold shrink-0" />
                        <span>{mtg.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMeetingTypeLabel(mtg.location, mtg.meetLink) === 'In-Person' ? (
                          <MapPin size={14} className="text-gold shrink-0" />
                        ) : (
                          <Layers size={14} className="text-gold shrink-0" />
                        )}
                        <span className="font-medium text-ivy/90">{getMeetingSubheading(mtg.location, mtg.meetLink)}</span>
                      </div>
                      {mtg.agenda && (
                        <div className="p-3 bg-cream rounded border border-gold/10 mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ivy/50 block mb-1">Agenda:</span>
                          <p className="text-xs text-ivy/80">{mtg.agenda}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gold/10 mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <CommitteeAddToCalendar
                      event={{
                        title: mtg.title,
                        description: mtg.agenda,
                        location: getMeetingSubheading(mtg.location, mtg.meetLink),
                        meetingLink: mtg.meetLink,
                        date: mtg.date,
                        time: mtg.time,
                        committeeName: committeeDef.name
                      }}
                      className="w-full sm:w-auto"
                    />

                    {mtg.meetLink ? (
                      <a
                        href={mtg.meetLink.startsWith('http') ? mtg.meetLink : `https://${mtg.meetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ivy text-cream font-bold uppercase tracking-widest text-xs rounded hover:bg-ivy/90 transition-all shadow-xs shrink-0"
                      >
                        <ExternalLink size={13} className="text-gold" />
                        <span>Join {getMeetingTypeLabel(mtg.location, mtg.meetLink)} Meeting</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-ivy/50 italic">Location: {getMeetingSubheading(mtg.location, mtg.meetLink)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {meetings.length === 0 && (
              <div className="bg-white border border-gold/20 rounded-lg p-12 text-center shadow-soft">
                <CalendarDays size={40} className="mx-auto text-gold/40 mb-3" />
                <p className="text-ivy font-display font-bold uppercase tracking-wider text-sm">No Upcoming Meetings Scheduled</p>
                <p className="text-ivy/50 text-xs mt-1">Committee Chairs can schedule upcoming working sessions or milestone deadlines.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMITTEE ROSTER */}
        {activeTab === 'roster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-ivy">
                  Committee Membership Roster
                </h3>
                <p className="text-ivy/60 text-xs">
                  Active members and chairs assigned to the {committeeDef.name}.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all shadow-sm"
                >
                  <UserPlus size={16} className="text-gold" />
                  <span>Assign Member</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map(member => {
                const norm = normalizeUserRBAC(member);
                const isMemberChair = norm.committeeRoles[committeeDef.slug] === 'chair' || norm.role === 'admin';
                return (
                  <div
                    key={member.email}
                    className="bg-white border border-gold/20 rounded-lg p-6 shadow-soft flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            isMemberChair ? 'bg-gold text-ivy' : 'bg-ivy/10 text-ivy'
                          }`}>
                            {isMemberChair ? 'Committee Chair' : 'Committee Member'}
                          </span>
                          <h4 className="text-base font-display font-bold uppercase tracking-wider text-ivy mt-2">
                            {member.name}
                          </h4>
                          {member.title && (
                            <p className="text-xs text-gold font-bold uppercase tracking-wider">
                              {member.title}
                            </p>
                          )}
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleCommitteeRole(member.email, isMemberChair)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                                isMemberChair 
                                  ? 'bg-ivy/10 text-ivy hover:bg-ivy/20' 
                                  : 'bg-gold text-ivy hover:bg-gold/90'
                              }`}
                              title={isMemberChair ? "Demote to Committee Member" : "Promote to Committee Chair"}
                            >
                              <Award size={13} />
                              {isMemberChair ? "Make Member" : "Make Chair"}
                            </button>
                            <button
                              onClick={() => handleRemoveMemberFromCommittee(member.email)}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remove from Committee"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-ivy/60 font-body">
                        {member.email}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gold/10 mt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-ivy/50">
                      <span>Status: Active</span>
                      <span className="font-bold text-ivy">{norm.role.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {members.length === 0 && (
              <div className="bg-white border border-gold/20 rounded-lg p-12 text-center shadow-soft">
                <Users size={40} className="mx-auto text-gold/40 mb-3" />
                <p className="text-ivy font-display font-bold uppercase tracking-wider text-sm">No Committee Members Assigned</p>
                <p className="text-ivy/50 text-xs mt-1">Chairs and Administrators can assign active members to this standing committee.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-display font-bold uppercase tracking-wider text-ivy">
                  Announcements
                </h3>
                <p className="text-ivy/60 text-xs">
                  Official communications and committee notices.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => setShowAddAnnouncementModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all shadow-sm"
                >
                  <Plus size={16} className="text-gold" />
                  <span>Post Announcement</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {announcements.map(ann => (
                <div
                  key={ann.id}
                  className="bg-white border border-gold/20 rounded-lg p-6 shadow-soft flex flex-col md:flex-row md:items-start justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 px-2.5 py-0.5 rounded">
                        {ann.date}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ivy/50">
                        Posted by {ann.author}
                      </span>
                    </div>

                    <h4 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                      {ann.title}
                    </h4>

                    <p className="text-ivy/80 text-sm leading-relaxed whitespace-pre-wrap">
                      {renderFormattedTextWithLinks(ann.content)}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 self-start">
                      <button
                        onClick={() => setEditingAnnouncement(ann)}
                        className="text-ivy/60 hover:text-ivy p-1.5 rounded hover:bg-gold/10 transition-colors"
                        title="Edit Announcement"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {announcements.length === 0 && (
              <div className="bg-white border border-gold/20 rounded-lg p-12 text-center shadow-soft">
                <FileText size={40} className="mx-auto text-gold/40 mb-3" />
                <p className="text-ivy font-display font-bold uppercase tracking-wider text-sm">No Announcements Posted</p>
                <p className="text-ivy/50 text-xs mt-1">Chairs can post committee announcements for members to review.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD RESOURCE */}
        {showAddResourceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Add Google Shared Drive / Resource Link
                </h3>
                <button onClick={() => setShowAddResourceModal(false)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResource.title}
                    onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="e.g. Master Committee Planning Drive"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Google Drive URL / Resource Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={newResource.url}
                    onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={newResource.type}
                    onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  >
                    <option value="drive">Google Shared Drive Folder</option>
                    <option value="doc">Google Doc / Word Document</option>
                    <option value="sheet">Google Sheet / Excel Spreadsheet</option>
                    <option value="link">General Portal Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newResource.description}
                    onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="Brief summary of what this drive or document contains..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setShowAddResourceModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Save Resource Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT RESOURCE */}
        {editingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Edit Shared Drive / Resource Link
                </h3>
                <button onClick={() => setEditingResource(null)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateResource} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingResource.title}
                    onChange={e => setEditingResource({ ...editingResource, title: e.target.value })}
                    placeholder="e.g. Master Committee Planning Drive"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Google Drive URL / Resource Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingResource.url}
                    onChange={e => setEditingResource({ ...editingResource, url: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={editingResource.type}
                    onChange={e => setEditingResource({ ...editingResource, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  >
                    <option value="drive">Google Shared Drive Folder</option>
                    <option value="doc">Google Doc / Word Document</option>
                    <option value="sheet">Google Sheet / Excel Spreadsheet</option>
                    <option value="link">General Portal Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={editingResource.description || ''}
                    onChange={e => setEditingResource({ ...editingResource, description: e.target.value })}
                    placeholder="Brief summary of what this drive or document contains..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setEditingResource(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Update Resource Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SCHEDULE MEETING */}
        {showAddMeetingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Schedule Committee Meeting
                </h3>
                <button onClick={() => setShowAddMeetingModal(false)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddMeeting} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMeeting.title}
                    onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="e.g. Q1 Working Session"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newMeeting.date}
                      onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                      Time *
                    </label>
                    <select
                      required
                      value={newMeeting.time || '7:00 PM - 8:30 PM EST'}
                      onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })}
                      className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                    >
                      {MEETING_TIME_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Location / Platform *
                  </label>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setNewMeeting({ ...newMeeting, location: 'Virtual / Zoom', meetLink: newMeeting.meetLink && !newMeeting.meetLink.includes('meet.google.com') ? newMeeting.meetLink : 'https://zoom.us/j/kpicommittee' })}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors border ${newMeeting.location === 'Virtual / Zoom' || (!newMeeting.location && (!newMeeting.meetLink || newMeeting.meetLink.includes('zoom'))) ? 'bg-ivy text-gold border-gold/40 shadow-xs' : 'bg-cream text-ivy/70 border-gold/20 hover:bg-gold/10'}`}
                    >
                      Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMeeting({ ...newMeeting, location: 'Virtual / Google Meet', meetLink: newMeeting.meetLink && !newMeeting.meetLink.includes('zoom.us') ? newMeeting.meetLink : 'https://meet.google.com/kpi-comm-meet' })}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors border ${newMeeting.location === 'Virtual / Google Meet' || newMeeting.meetLink?.includes('meet.google.com') ? 'bg-ivy text-gold border-gold/40 shadow-xs' : 'bg-cream text-ivy/70 border-gold/20 hover:bg-gold/10'}`}
                    >
                      Google Meet
                    </button>
                  </div>
                  <select
                    value={newMeeting.location || 'Virtual / Zoom'}
                    onChange={e => {
                      const loc = e.target.value;
                      const isGMeet = loc.includes('Google Meet');
                      const isZoom = loc.includes('Zoom');
                      setNewMeeting({
                        ...newMeeting,
                        location: loc,
                        meetLink: isGMeet ? 'https://meet.google.com/kpi-comm-meet' : isZoom ? 'https://zoom.us/j/kpicommittee' : newMeeting.meetLink
                      });
                    }}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  >
                    <option value="Virtual / Zoom">Virtual / Zoom</option>
                    <option value="Virtual / Google Meet">Virtual / Google Meet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Link / Video URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMeeting.meetLink}
                    onChange={e => setNewMeeting({ ...newMeeting, meetLink: e.target.value })}
                    placeholder={newMeeting.location?.includes('Google Meet') ? 'https://meet.google.com/...' : 'https://zoom.us/j/...'}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Agenda
                  </label>
                  <textarea
                    rows={3}
                    value={newMeeting.agenda}
                    onChange={e => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    placeholder="Key discussion items and objectives..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setShowAddMeetingModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT MEETING */}
        {editingMeeting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Edit Committee Meeting
                </h3>
                <button onClick={() => setEditingMeeting(null)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateMeeting} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMeeting.title}
                    onChange={e => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                    placeholder="e.g. Q1 Working Session"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingMeeting.date}
                      onChange={e => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                      className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                      Time *
                    </label>
                    <select
                      required
                      value={editingMeeting.time}
                      onChange={e => setEditingMeeting({ ...editingMeeting, time: e.target.value })}
                      className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                    >
                      {editingMeeting.time && !MEETING_TIME_OPTIONS.includes(editingMeeting.time) && (
                        <option value={editingMeeting.time}>{editingMeeting.time}</option>
                      )}
                      {MEETING_TIME_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Location / Platform *
                  </label>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditingMeeting({ ...editingMeeting, location: 'Virtual / Zoom', meetLink: editingMeeting.meetLink && !editingMeeting.meetLink.includes('meet.google.com') ? editingMeeting.meetLink : 'https://zoom.us/j/kpicommittee' })}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors border ${editingMeeting.location === 'Virtual / Zoom' || (!editingMeeting.location && (!editingMeeting.meetLink || editingMeeting.meetLink.includes('zoom'))) ? 'bg-ivy text-gold border-gold/40 shadow-xs' : 'bg-cream text-ivy/70 border-gold/20 hover:bg-gold/10'}`}
                    >
                      Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMeeting({ ...editingMeeting, location: 'Virtual / Google Meet', meetLink: editingMeeting.meetLink && !editingMeeting.meetLink.includes('zoom.us') ? editingMeeting.meetLink : 'https://meet.google.com/kpi-comm-meet' })}
                      className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors border ${editingMeeting.location === 'Virtual / Google Meet' || editingMeeting.meetLink?.includes('meet.google.com') ? 'bg-ivy text-gold border-gold/40 shadow-xs' : 'bg-cream text-ivy/70 border-gold/20 hover:bg-gold/10'}`}
                    >
                      Google Meet
                    </button>
                  </div>
                  <select
                    value={editingMeeting.location || 'Virtual / Zoom'}
                    onChange={e => {
                      const loc = e.target.value;
                      const isGMeet = loc.includes('Google Meet');
                      const isZoom = loc.includes('Zoom');
                      setEditingMeeting({
                        ...editingMeeting,
                        location: loc,
                        meetLink: isGMeet ? (editingMeeting.meetLink?.includes('meet.google.com') ? editingMeeting.meetLink : 'https://meet.google.com/kpi-comm-meet') : isZoom ? (editingMeeting.meetLink?.includes('zoom.us') ? editingMeeting.meetLink : 'https://zoom.us/j/kpicommittee') : editingMeeting.meetLink
                      });
                    }}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  >
                    <option value="Virtual / Zoom">Virtual / Zoom</option>
                    <option value="Virtual / Google Meet">Virtual / Google Meet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Link / Video URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMeeting.meetLink || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, meetLink: e.target.value })}
                    placeholder={editingMeeting.location?.includes('Google Meet') ? 'https://meet.google.com/...' : 'https://zoom.us/j/...'}
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Meeting Agenda
                  </label>
                  <textarea
                    rows={3}
                    value={editingMeeting.agenda || ''}
                    onChange={e => setEditingMeeting({ ...editingMeeting, agenda: e.target.value })}
                    placeholder="Key discussion items and objectives..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setEditingMeeting(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: POST ANNOUNCEMENT */}
        {showAddAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Post Committee Announcement
                </h3>
                <button onClick={() => setShowAddAnnouncementModal(false)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="e.g. Q1 Review Deadline Approaching"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="Write detailed committee instructions or announcements..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setShowAddAnnouncementModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Post Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT ANNOUNCEMENT */}
        {editingAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                  Edit Committee Announcement
                </h3>
                <button onClick={() => setEditingAnnouncement(null)} className="text-ivy/60 hover:text-ivy">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAnnouncement.title}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                    placeholder="e.g. Q1 Review Deadline Approaching"
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={editingAnnouncement.content}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                    placeholder="Write detailed committee instructions or announcements..."
                    className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                  <button
                    type="button"
                    onClick={() => setEditingAnnouncement(null)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 transition-all"
                  >
                    Update Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN MEMBER */}
        {showAddMemberModal && (() => {
          const eligibleFinancialMembers = allAvailableMembers
            .filter(m => {
              if (!isEligibleFinancialMember(m, financialEmails)) return false;
              return !members.some(em => em.email.toLowerCase() === m.email.toLowerCase());
            })
            .sort((a, b) => {
              const nameA = (a.first_name || a.name || '').trim().toLowerCase();
              const nameB = (b.first_name || b.name || '').trim().toLowerCase();
              return nameA.localeCompare(nameB);
            });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white border border-gold/30 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gold/10 pb-4">
                  <div>
                    <h3 className="text-lg font-display font-bold uppercase tracking-wider text-ivy">
                      Assign Member to {committeeDef.name}
                    </h3>
                    <p className="text-[11px] text-ivy/60 mt-0.5">
                      Per organizational constitution, only active financial members in good standing are eligible for committee appointment.
                    </p>
                  </div>
                  <button onClick={() => setShowAddMemberModal(false)} className="text-ivy/60 hover:text-ivy shrink-0 ml-3">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddMemberToCommittee} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70">
                        Select Member *
                      </label>
                      <span className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={11} className="text-gold" />
                        Financial Members Only
                      </span>
                    </div>

                    {eligibleFinancialMembers.length > 0 ? (
                      <select
                        required
                        value={selectedMemberEmail}
                        onChange={e => setSelectedMemberEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                      >
                        <option value="">-- Choose Member ({eligibleFinancialMembers.length} Available) --</option>
                        {eligibleFinancialMembers.map(m => {
                          const displayName = (m.first_name && m.last_name) ? `${m.first_name} ${m.last_name}` : m.name;
                          return (
                            <option key={m.email} value={m.email}>
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="p-3 bg-gold/10 border border-gold/20 rounded text-xs text-ivy/80 flex items-start gap-2.5">
                        <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-ivy">No Unassigned Members Available</p>
                          <p className="text-[11px] text-ivy/60 mt-0.5">
                            All eligible members are currently assigned to this committee, or unassigned records are aspirants/candidates restricted from committee service.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-ivy/70 mb-1">
                      Committee Role *
                    </label>
                    <select
                      value={selectedMemberRole}
                      onChange={e => setSelectedMemberRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-cream border border-gold/20 rounded text-sm text-ivy focus:outline-none focus:border-gold"
                    >
                      <option value="member">General Committee Member</option>
                      <option value="chair">Committee Chair (With Edit & Management Affordance)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-ivy/70 hover:text-ivy"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedMemberEmail || eligibleFinancialMembers.length === 0}
                      className="px-5 py-2 bg-ivy text-cream text-xs font-bold uppercase tracking-widest rounded hover:bg-ivy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
