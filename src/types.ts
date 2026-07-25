
export type UserRole = 'admin' | 'officer' | 'member';

export interface Member {
  email: string;
  name: string;
  first_name?: string;
  role: UserRole;
  title?: string;
  is_first_login: boolean;
  big_brother?: string;
  little_brother?: string;
  intake_class?: string;
  financial_status?: 'active' | 'inactive';
  profile_photo?: string;
  grad_year?: string;
  industry?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Inquiry' | 'Applied' | 'Tea Time' | 'Interview' | 'Selection' | 'Intake' | 'Rejected';
  application_date: string;
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
