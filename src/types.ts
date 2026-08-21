
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
    description: 'Oversees the planning and execution of the annual Founders Day event. Responsibilities include selecting the theme and venue, coordinating decorations, managing award presentations, securing entertainment, and overseeing beverage service.',
    purpose: 'Oversees the planning and execution of the annual Founders Day event. Responsibilities include selecting the theme and venue, coordinating decorations, managing award presentations, securing entertainment, and overseeing beverage service.',
    icon: 'CalendarDays',
    defaultRoute: '/committee/annual_event'
  },
  {
    slug: 'digital_technology',
    name: 'Digital & Technology Committee',
    shortName: 'Digital & Tech',
    description: "Manages and maintains the organization's digital infrastructure, including website administration, technology integration, database management, and digital communications strategies.",
    purpose: "Manages and maintains the organization's digital infrastructure, including website administration, technology integration, database management, and digital communications strategies.",
    icon: 'Laptop',
    defaultRoute: '/committee/digital_technology'
  },
  {
    slug: 'judicial_ethics',
    name: 'Judicial and Ethics Committee',
    shortName: 'Judicial & Ethics',
    description: 'Responsible for maintaining organizational integrity by investigating and addressing non-compliance, policy infractions, and unauthorized functions within Kappa Pi, The Order of KP, Inc., and the Membership Intake Process.',
    purpose: 'Responsible for maintaining organizational integrity by investigating and addressing non-compliance, policy infractions, and unauthorized functions within Kappa Pi, The Order of KP, Inc., and the Membership Intake Process.',
    icon: 'Scale',
    defaultRoute: '/committee/judicial_ethics'
  },
  {
    slug: 'membership_intake',
    name: 'Membership Intake Committee',
    shortName: 'Membership Intake',
    description: 'Manages and oversees the membership intake process, ensuring all activities align with the standards and policies of Kappa Pi.',
    purpose: 'Manages and oversees the membership intake process, ensuring all activities align with the standards and policies of Kappa Pi.',
    icon: 'Users',
    defaultRoute: '/chair-dashboard'
  },
  {
    slug: 'scholarship',
    name: 'Scholarship Committee',
    shortName: 'Scholarship',
    description: 'Governs and manages the scholarship foundation operating under The Order of KP, Inc.',
    purpose: 'Governs and manages the scholarship foundation operating under The Order of KP, Inc.',
    icon: 'GraduationCap',
    defaultRoute: '/committee/scholarship'
  },
  {
    slug: 'transfer_member',
    name: 'Transfer Member Committee',
    shortName: 'Transfer Member',
    description: 'Develops, maintains, and clarifies policy language regarding the transfer and onboarding of members into Kappa Pi.',
    purpose: 'Develops, maintains, and clarifies policy language regarding the transfer and onboarding of members into Kappa Pi.',
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
