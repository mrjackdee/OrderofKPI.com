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

/**
 * Aggregates candidate vote records by unique candidate, preventing duplicates.
 */
export function aggregateCandidateVotes(
  candidatesList: any[],
  votes: any[]
): CandidateVoteRollup[] {
  const targetCandidates = (candidatesList || []).filter((c: any) => {
    const s = String(c?.status || c?.stage || '').toLowerCase().trim();
    return s === 'selection';
  });
  const candidatesToUse = targetCandidates.length > 0 ? targetCandidates : (candidatesList || []);

  const normMap = new Map<string, {
    candidateId: string;
    candidateName: string;
    yesVotes: number;
    noVotes: number;
  }>();

  const idToNormName = new Map<string, string>();
  const nameToNormName = new Map<string, string>();
  const emailToNormName = new Map<string, string>();

  candidatesToUse.forEach((c: any) => {
    const cName = String(c.name || c.displayName || c.fullName || c.applicantName || c.id || 'Candidate').trim();
    const cId = String(c.id || cName).trim();
    const cEmail = String(c.email || '').trim().toLowerCase();
    const normName = cName.toLowerCase();

    if (!normMap.has(normName)) {
      normMap.set(normName, {
        candidateId: cId,
        candidateName: cName,
        yesVotes: 0,
        noVotes: 0
      });
    }

    if (cId) idToNormName.set(cId.toLowerCase(), normName);
    if (cName) nameToNormName.set(normName, normName);
    if (cEmail) emailToNormName.set(cEmail, normName);
  });

  const dedupedVotesMap = new Map<string, any>();
  (votes || []).forEach((v: any) => {
    if (!v) return;
    const voter = String(v.voter_email || '').toLowerCase().trim();
    const rawCandId = String(v.candidate_id || v.candidate_name || '').toLowerCase().trim();
    const voteKey = voter ? `${voter}_${rawCandId}` : (v.id || Math.random().toString());
    dedupedVotesMap.set(voteKey, v);
  });

  dedupedVotesMap.forEach((v: any) => {
    const rawId = String(v.candidate_id || '').trim().toLowerCase();
    const rawName = String(v.candidate_name || '').trim().toLowerCase();

    let matchedNormName = 
      idToNormName.get(rawId) || 
      nameToNormName.get(rawName) || 
      nameToNormName.get(rawId) || 
      idToNormName.get(rawName) ||
      (rawId ? emailToNormName.get(rawId) : undefined);

    if (!matchedNormName) {
      if (rawName) matchedNormName = rawName;
      else if (rawId) matchedNormName = rawId;
    }

    if (!matchedNormName) return;

    if (!normMap.has(matchedNormName)) {
      const displayCandidateName = String(v.candidate_name || v.candidate_id || 'Candidate').trim();
      normMap.set(matchedNormName, {
        candidateId: v.candidate_id || matchedNormName,
        candidateName: displayCandidateName,
        yesVotes: 0,
        noVotes: 0
      });
    }

    const candidateEntry = normMap.get(matchedNormName)!;
    const decision = String(v.decision || '').toLowerCase().trim();
    if (decision === 'yes' || decision === 'for' || decision === 'approve') {
      candidateEntry.yesVotes += 1;
    } else if (decision === 'no' || decision === 'against' || decision === 'reject') {
      candidateEntry.noVotes += 1;
    }
  });

  const results: CandidateVoteRollup[] = [];
  normMap.forEach((entry) => {
    const { totalVotesCast, approvalPercentage, passed } = calculateApproval(entry.yesVotes, entry.noVotes);
    results.push({
      candidateId: entry.candidateId,
      candidateName: entry.candidateName,
      yesVotes: entry.yesVotes,
      noVotes: entry.noVotes,
      totalVotesCast,
      approvalPercentage,
      passed
    });
  });

  return results;
}
