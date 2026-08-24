export const isDevEnvironment = () => {
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname === '127.0.0.1'
    );
  }
  return false;
};

export const CANDIDATE_VOTING_WINDOW_TEXT = "Voting will open Wed, Aug 26, 2026 at 5:00 PM ET and close on Fri August 28, 2026 at 8:00 AM ET.";

export function getCandidateVotingStatus(userEmail: string, userRole: string): {
  isOpen: boolean;
  isDev: boolean;
  isAdmin: boolean;
  message: string;
} {
  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = userRole === 'admin' || normEmail === 'admin@orderofkpi.org' || normEmail === 'qa.admin@orderofkpi.org';
  const isDev = isDevEnvironment();

  // In local/dev environment, date restrictions do not apply
  if (isDev) {
    return {
      isOpen: true,
      isDev: true,
      isAdmin,
      message: 'Local/Dev Environment — Voting window unrestricted'
    };
  }

  // Admin Role can always access this page in production
  if (isAdmin) {
    return {
      isOpen: true,
      isDev: false,
      isAdmin: true,
      message: 'Admin Access — Voting window unrestricted'
    };
  }

  // Production check for eligible non-admin voters:
  // Voting period: 5:00 PM ET Wed, Aug 26, 2026 to 8:00 AM ET Fri, Aug 28, 2026
  const now = new Date();
  const startDate = new Date('2026-08-26T17:00:00-04:00'); // 5:00 PM ET
  const endDate = new Date('2026-08-28T08:00:00-04:00');   // 8:00 AM ET

  if (now < startDate) {
    return {
      isOpen: false,
      isDev: false,
      isAdmin: false,
      message: CANDIDATE_VOTING_WINDOW_TEXT
    };
  }

  if (now > endDate) {
    return {
      isOpen: false,
      isDev: false,
      isAdmin: false,
      message: 'Voting has concluded.'
    };
  }

  return {
    isOpen: true,
    isDev: false,
    isAdmin: false,
    message: 'Voting is currently open.'
  };
}
