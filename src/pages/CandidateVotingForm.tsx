import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Send, Check, X, Clock } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { 
  firebaseSaveCandidateVote, 
  syncCandidateVotesFromFirestore 
} from '../lib/firebase';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';
import { getCandidateVotingStatus, CANDIDATE_VOTING_WINDOW_TEXT } from '../lib/votingWindow';

export default function CandidateVotingForm() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const normEmail = userEmail.toLowerCase().trim();
  const isAdmin = userRole === 'admin' || normEmail === 'admin@orderofkpi.org' || normEmail === 'qa.admin@orderofkpi.org';

  const votingStatus = getCandidateVotingStatus(userEmail, userRole);

  const [eligibleVoters, setEligibleVoters] = useState<string[]>([]);
  const [isEligible, setIsEligible] = useState<boolean>(isAdmin);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [votesMap, setVotesMap] = useState<Record<string, string>>({}); // candidateId -> 'yes' | 'no'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch live roster for eligibility
    getLiveGoogleSheetRoster()
      .then(res => {
        const eligibleSet = new Set<string>();
        if (res && Array.isArray(res.eligibleVoters)) {
          res.eligibleVoters.forEach((e: string) => eligibleSet.add(e.toLowerCase().trim()));
        }
        if (res && Array.isArray(res.members)) {
          res.members.forEach((m: any) => {
            if (m.fy27MipEligible) {
              if (m.kpiEmail) eligibleSet.add(m.kpiEmail.toLowerCase().trim());
              if (m.personalEmail) eligibleSet.add(m.personalEmail.toLowerCase().trim());
            }
          });
        }
        const list = Array.from(eligibleSet);
        setEligibleVoters(list);
        if (isAdmin || normEmail === 'candidate@gmail.com' || normEmail === 'qa.admin@orderofkpi.org' || normEmail === 'info@kpi2012.org' || list.includes(normEmail)) {
          setIsEligible(true);
        } else {
          setIsEligible(false);
        }
      })
      .catch(err => console.warn('Roster fetch error:', err));

    // 2. Fetch candidates & user votes
    Promise.all([
      fetch('/api/candidates').then(res => res.json()).catch(() => ({ success: false })),
      fetch(`/api/candidate-votes/user?email=${encodeURIComponent(userEmail)}`).then(res => res.json()).catch(() => ({ success: false }))
    ]).then(([candRes, voteRes]) => {
      if (candRes.success && Array.isArray(candRes.candidates)) {
        // Filter candidates where status = selection
        const activeCandidates = candRes.candidates.filter((c: any) => 
          c.status && c.status.toLowerCase() === 'selection'
        );
        setCandidates(activeCandidates);
      } else {
        setCandidates([]);
      }

      if (voteRes.success && Array.isArray(voteRes.votes)) {
        const map: Record<string, string> = {};
        voteRes.votes.forEach((v: any) => {
          map[v.candidate_id] = v.decision;
        });
        setVotesMap(map);
      }
    }).finally(() => {
      setLoading(false);
    });

    syncCandidateVotesFromFirestore().catch(() => {});
  }, [userEmail]);

  const handleSelectVote = (candidateId: string, decision: 'yes' | 'no') => {
    if (!isEligible) {
      setError("You are not authorized or eligible (requires YES in FY27 MIP Eligible column) to cast candidate votes.");
      return;
    }
    setError('');
    setSuccessMessage('');
    setVotesMap(prev => ({ ...prev, [candidateId]: decision }));
  };

  const handleSubmittingBallot = async () => {
    if (!isEligible) {
      setError("You are not authorized or eligible (requires YES in FY27 MIP Eligible column) to cast candidate votes.");
      return;
    }

    // Check if every candidate has a selection
    for (const cand of candidates) {
      const candId = cand.id || cand.name;
      if (!votesMap[candId]) {
        setError(`Please make a selection (For or Against) for candidate "${cand.name || cand.fullName || candId}" before submitting your ballot.`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const promises = candidates.map(async (cand) => {
        const candidateId = cand.id || cand.name;
        const candidateName = cand.name || cand.fullName || 'Candidate';
        const decision = (votesMap[candidateId] || 'yes') as 'yes' | 'no';

        const res = await fetch('/api/candidate-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voter_email: userEmail,
            candidate_id: candidateId,
            candidate_name: candidateName,
            decision
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to record vote');

        await firebaseSaveCandidateVote(userEmail, candidateId, candidateName, decision);
      });

      await Promise.all(promises);
      setSuccessMessage('Ballot submitted successfully! Thank you for participating in the FY27 candidate selection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit ballot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!votingStatus.isOpen) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
        <MemberHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Member Portal
          </Link>
          <div className="bg-white rounded-xl border border-stone-200 p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">FY27 Candidate Voting Restricted</h1>
            <p className="text-stone-600 max-w-lg mx-auto mb-4 text-sm leading-relaxed">
              Voting is not open yet. Voting will open Wed, Aug 26, 2026 at 5:00 PM ET and close on Fri August 28, 2026 at 8:00 AM ET.
            </p>
            <p className="text-stone-600 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
              If you have any questions, please reach out to{' '}
              <a href="mailto:james.haywood@orderofkpi.org" className="text-amber-700 underline font-semibold hover:text-amber-800">
                JR Haywood
              </a>.
            </p>
            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-4 max-w-md mx-auto text-amber-900 text-xs font-semibold mb-6">
              {votingStatus.message}
            </div>
            <Link
              to="/member-portal"
              className="inline-flex items-center px-5 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors"
            >
              Return to Member Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!loading && !isEligible) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
        <MemberHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Member Portal
          </Link>
          <div className="bg-white rounded-xl border border-stone-200 p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-red-100 text-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">FY27 Candidate Voting Restricted</h1>
            <p className="text-stone-600 max-w-lg mx-auto mb-4 text-sm leading-relaxed">
              Candidate voting is restricted to members with FY27 MIP Eligibility confirmed on the master roster.
            </p>
            <p className="text-stone-600 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
              If you have any questions, please reach out to{' '}
              <a href="mailto:james.haywood@orderofkpi.org" className="text-amber-700 underline font-semibold hover:text-amber-800">
                JR Haywood
              </a>.
            </p>
            <Link
              to="/member-portal"
              className="inline-flex items-center px-5 py-2.5 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-900 transition-colors"
            >
              Return to Member Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <MemberHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/member-portal" 
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Member Portal
          </Link>
          <div className="text-xs uppercase tracking-wider font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
            FY27 MIP Official Ballot
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900">FY27 Candidate Voting</h1>
              <p className="text-sm text-stone-600">Please review the candidate slate and select a decision for every candidate before submitting your official ballot.</p>
            </div>
          </div>

          {!isEligible && !loading && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Eligibility Requirement Notice</h3>
                <p className="text-xs mt-1">
                  Official candidate voting is restricted to members marked as <span className="font-bold">YES</span> in the <span className="font-bold">FY27 MIP Eligible</span> column of the roster. Your account ({userEmail || 'Guest'}) does not currently reflect active eligibility in the master roster.
                </p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="border-t border-stone-100 pt-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Candidate Slate ({candidates.length})</h2>
            
            {loading ? (
              <div className="text-center py-12 text-stone-500">Loading candidate ballot...</div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                <p className="text-stone-600 text-sm">No active candidates currently scheduled for voting.</p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {candidates.map((candidate: any) => {
                  const candId = candidate.id || candidate.name;
                  const currentVote = votesMap[candId];

                  return (
                    <div 
                      key={candId} 
                      className={`p-5 rounded-lg border transition-all ${
                        currentVote ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200 bg-stone-50/50'
                      } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-stone-900 text-base">{candidate.name || candidate.fullName}</h3>
                          {candidate.industry && (
                            <span className="text-xs px-2.5 py-0.5 bg-stone-200 text-stone-700 rounded-full font-medium">
                              {candidate.industry}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          Status: <span className="font-medium text-stone-700">{candidate.status || 'Selection'}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          disabled={!isEligible}
                          onClick={() => handleSelectVote(candId, 'yes')}
                          className={`flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            currentVote === 'yes'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-2'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                          } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Check className="w-4 h-4 mr-1.5" /> For / Accept
                        </button>

                        <button
                          type="button"
                          disabled={!isEligible}
                          onClick={() => handleSelectVote(candId, 'no')}
                          className={`flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            currentVote === 'no'
                              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-2'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                          } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <X className="w-4 h-4 mr-1.5" /> Against / Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {candidates.length > 0 && isEligible && (
              <div className="flex items-center justify-end pt-4 border-t border-stone-200">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmittingBallot}
                  className="inline-flex items-center px-6 py-3 bg-amber-700 text-white rounded-xl text-sm font-semibold hover:bg-amber-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" /> {isSubmitting ? 'Submitting Ballot...' : 'Submit Official Ballot'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

