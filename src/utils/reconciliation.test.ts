import { describe, it, expect } from 'vitest';
import { 
  calculateApproval, 
  reconcileNomineeCount, 
  determineVotingStatus,
  formatSyncTimestamp 
} from './reconciliation';

describe('Voting and Election Reconciliation Tests', () => {
  it('should handle zero ballots correctly', () => {
    const zeroRes = calculateApproval(0, 0);
    expect(zeroRes.totalVotesCast).toBe(0);
    expect(zeroRes.approvalPercentage).toBe(0);
    expect(zeroRes.passed).toBe(false);
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
