
export type CommitteeSlug =
  | 'annual_event'
  | 'scholarship'
  | 'judicial_ethics'
  | 'digital_technology'
  | 'membership_intake'
  | 'transfer_member';

export type CommitteeRole = 'chair' | 'member';

export interface CommitteeDefinition {
  slug: CommitteeSlug;
  name: string;
  shortName: string;
  description: string;
  purpose: string;
  icon: string;
  defaultRoute: string;
  meetingSchedule?: string;
}

export const STANDING_COMMITTEES: CommitteeDefinition[] = [
  {
    slug: 'annual_event',
    name: 'Annual Event Committee',
    shortName: 'Annual Event',
    description: 'Planning, organizing, and executing annual organizational galas, celebrations, and gatherings.',
    purpose: 'Oversees logistics, venue coordination, registrations, and celebratory programming for the organization’s annual events.',
    icon: 'CalendarDays',
    defaultRoute: '/committee/annual_event'
  },
  {
    slug: 'scholarship',
    name: 'Scholarship Committee',
    shortName: 'Scholarship',
    description: 'Academic excellence endowments, award distribution, and scholarship candidate review.',
    purpose: 'Administers scholarship endowments, evaluates academic grant applicants, and manages academic mentorship.',
    icon: 'GraduationCap',
    defaultRoute: '/committee/scholarship'
  },
  {
    slug: 'judicial_ethics',
    name: 'Judicial and Ethics Committee',
    shortName: 'Judicial & Ethics',
    description: 'Organizational constitution integrity, by-laws governance, and ethical standards oversight.',
    purpose: 'Ensures compliance with organizational bylaws, handles constitutional amendments, and upholds ethical conduct.',
    icon: 'Scale',
    defaultRoute: '/committee/judicial_ethics'
  },
  {
    slug: 'digital_technology',
    name: 'Digital & Technology Committee',
    shortName: 'Digital & Tech',
    description: 'Member portals, cloud infrastructure, systems security, and digital innovation initiatives.',
    purpose: 'Engineers portal enhancements, manages digital infrastructure, identity systems, and technological assets.',
    icon: 'Laptop',
    defaultRoute: '/committee/digital_technology'
  },
  {
    slug: 'membership_intake',
    name: 'Membership Intake Committee',
    shortName: 'Membership Intake',
    description: 'Prospective candidate tracking, application reviews, interviews, and Dean onboarding.',
    purpose: 'Directs the official Membership Intake Process (MIP), candidate reviews, timeline milestones, and evaluations.',
    icon: 'Users',
    defaultRoute: '/chair-dashboard'
  },
  {
    slug: 'transfer_member',
    name: 'Transfer Member Committee',
    shortName: 'Transfer Member',
    description: 'Cross-chapter transitions, verification of credentials, and active roster reintegration.',
    purpose: 'Facilitates seamless chapter transitions, credential verifications, and onboarding for transfer members.',
    icon: 'ArrowRightLeft',
    defaultRoute: '/committee/transfer_member'
  }
];

export type UserRole = 'admin' | 'officer' | 'member' | 'Membership Committee' | 'Membership Committee Chair' | 'prospective' | 'applicant';

export interface Member {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  title?: string;
  committees?: CommitteeSlug[];
  committeeRoles?: Record<string, CommitteeRole>;
  is_first_login: boolean;
  financial_status?: 'active' | 'inactive';
  profile_photo?: string;
  industry?: string;
  is_test_credential?: boolean | number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Inquiry' | 'Applied' | 'Tea Time' | 'Interview' | 'Selection' | 'Intake' | 'Rejected';
  application_date?: string;
  scores?: {
    application?: number;
    interview?: number;
  };
  notes?: string;
  document_vault?: string[]; // URLs to submitted docs
}

export interface Vote {
  id: string;
  voter_email: string;
  candidate_id: string;
  decision: 'yes' | 'no' | 'abstain';
  timestamp: string;
}
