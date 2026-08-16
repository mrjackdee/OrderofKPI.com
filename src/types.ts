
export type UserRole = 'admin' | 'officer' | 'member' | 'Membership Committee' | 'Membership Committee Chair' | 'prospective' | 'applicant';

export interface Member {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  title?: string;
  is_first_login: boolean;
  intake_class?: string;
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
