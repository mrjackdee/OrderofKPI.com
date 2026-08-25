export interface ElectionSummaryInput {
  votes: Array<{ candidate_id?: string; nominee_name?: string; decision?: string }>;
  nominations: Array<{ nominee_first_name?: string; nominee_last_name?: string }>;
  eligibleVotersCount?: number;
}

export interface CandidateVoteRollup {
  candidateId: string;
  candidateName: string;
  yesVotes: number;
  noVotes: number;
  totalVotesCast: number;
  approvalPercentage: number;
  passed: boolean;
}

export type VotingStatusState = 
  | 'NOT_STARTED'
  | 'OPEN'
  | 'NO_BALLOTS'
  | 'DATA_UNAVAILABLE'
  | 'FINALIZED';

/**
 * Calculates approval percentage and 50.1% threshold status.
 */
export function calculateApproval(yesVotes: number, noVotes: number): {
  totalVotesCast: number;
  approvalPercentage: number;
  passed: boolean;
} {
  const totalVotesCast = Math.max(0, yesVotes) + Math.max(0, noVotes);
  if (totalVotesCast === 0) {
    return { totalVotesCast: 0, approvalPercentage: 0, passed: false };
  }
  // Compute percentage rounded to 1 decimal place or kept precise for threshold
  const rawPercentage = (yesVotes / totalVotesCast) * 100;
  const approvalPercentage = Math.round(rawPercentage * 10) / 10;
  // Threshold rule: strictly >= 50.1%
  const passed = approvalPercentage >= 50.1;
  return { totalVotesCast, approvalPercentage, passed };
}

/**
 * Reconciles nominee count across nomination records and vote tallies.
 */
export function reconcileNomineeCount(
  nominationsCount: number, 
  voteTallyCandidatesCount: number, 
  uniqueNomineeNamesCount?: number
): number {
  if (typeof uniqueNomineeNamesCount === 'number' && uniqueNomineeNamesCount > 0) {
    return uniqueNomineeNamesCount;
  }
  return Math.max(nominationsCount, voteTallyCandidatesCount);
}

/**
 * Determines voting status state based on data availability, ballot counts, and session state.
 */
export function determineVotingStatus(
  hasError: boolean,
  candidatesCount: number,
  totalBallotsCount: number,
  isFinalized: boolean,
  isSessionActive: boolean = true
): VotingStatusState {
  if (hasError) return 'DATA_UNAVAILABLE';
  if (isFinalized) return 'FINALIZED';
  if (!isSessionActive) return 'NOT_STARTED';
  if (candidatesCount === 0 && totalBallotsCount === 0) return 'NOT_STARTED';
  if (totalBallotsCount === 0) return 'NO_BALLOTS';
  return 'OPEN';
}

/**
 * Formats a timestamp into a human-readable string.
 */
export function formatSyncTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' on ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
