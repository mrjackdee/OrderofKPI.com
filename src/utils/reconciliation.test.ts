import { describe, it, expect } from 'vitest';
import { 
  calculateApproval, 
  reconcileNomineeCount, 
  determineVotingStatus,
  formatSyncTimestamp,
  aggregateCandidateVotes 
} from './reconciliation';

describe('Voting and Election Reconciliation Tests', () => {
  it('should handle zero ballots correctly', () => {
    const zeroRes = calculateApproval(0, 0);
    expect(zeroRes.totalVotesCast).toBe(0);
    expect(zeroRes.approvalPercentage).toBe(0);
    expect(zeroRes.passed).toBe(false);
  });

  it('should aggregate votes per candidate without duplicate rows', () => {
    const candidates = [
      { id: '1', name: 'Avery Torrence', status: 'Selection' },
      { id: '2', name: 'Steven Burnette', status: 'Selection' }
    ];

    const votes = [
      { voter_email: 'voter1@kpi.org', candidate_id: '1', candidate_name: 'Avery Torrence', decision: 'yes' },
      { voter_email: 'voter1@kpi.org', candidate_id: '2', candidate_name: 'Steven Burnette', decision: 'yes' },
      { voter_email: 'voter2@kpi.org', candidate_id: 'cand_avery', candidate_name: 'Avery Torrence', decision: 'yes' },
      { voter_email: 'voter2@kpi.org', candidate_id: 'cand_steven', candidate_name: 'Steven Burnette', decision: 'no' }
    ];

    const aggregated = aggregateCandidateVotes(candidates, votes);

    // Must produce exactly 2 unique rows for the 2 candidates
    expect(aggregated.length).toBe(2);

    const avery = aggregated.find(c => c.candidateName === 'Avery Torrence');
    expect(avery).toBeDefined();
    expect(avery?.yesVotes).toBe(2);
    expect(avery?.noVotes).toBe(0);
    expect(avery?.totalVotesCast).toBe(2);
    expect(avery?.approvalPercentage).toBe(100.0);
    expect(avery?.passed).toBe(true);

    const steven = aggregated.find(c => c.candidateName === 'Steven Burnette');
    expect(steven).toBeDefined();
    expect(steven?.yesVotes).toBe(1);
    expect(steven?.noVotes).toBe(1);
    expect(steven?.totalVotesCast).toBe(2);
    expect(steven?.approvalPercentage).toBe(50.0);
    expect(steven?.passed).toBe(false);
  });

  it('should enforce the 50.1% threshold rule (50.0% fails, 50.1% passes)', () => {
    const fiftyPercent = calculateApproval(5, 5);
    expect(fiftyPercent.approvalPercentage).toBe(50.0);
    expect(fiftyPercent.passed).toBe(false);

    const passRes = calculateApproval(501, 499);
    expect(passRes.approvalPercentage).toBe(50.1);
    expect(passRes.passed).toBe(true);
  });

  it('should handle ties as failing 50.1% majority', () => {
    const tieRes = calculateApproval(10, 10);
    expect(tieRes.approvalPercentage).toBe(50.0);
    expect(tieRes.passed).toBe(false);
  });

  it('should round percentages to one decimal place correctly', () => {
    const roundRes = calculateApproval(2, 1);
    expect(roundRes.approvalPercentage).toBe(66.7);
    expect(roundRes.passed).toBe(true);
  });

  it('should reconcile nominee slate counts with vote tallies', () => {
    const nomCount1 = reconcileNomineeCount(0, 2);
    expect(nomCount1).toBe(2);

    const nomCount2 = reconcileNomineeCount(5, 2);
    expect(nomCount2).toBe(5);

    const nomCount3 = reconcileNomineeCount(0, 0, 3);
    expect(nomCount3).toBe(3);
  });

  it('should determine accurate voting status states', () => {
    expect(determineVotingStatus(true, 5, 10, false)).toBe('DATA_UNAVAILABLE');
    expect(determineVotingStatus(false, 5, 10, true)).toBe('FINALIZED');
    expect(determineVotingStatus(false, 5, 0, false, true)).toBe('NO_BALLOTS');
    expect(determineVotingStatus(false, 0, 0, false, false)).toBe('NOT_STARTED');
    expect(determineVotingStatus(false, 5, 12, false, true)).toBe('OPEN');
  });

  it('should format sync timestamps properly', () => {
    const timeStr = formatSyncTimestamp(new Date());
    expect(typeof timeStr).toBe('string');
    expect(timeStr.length).toBeGreaterThan(5);
  });
});
