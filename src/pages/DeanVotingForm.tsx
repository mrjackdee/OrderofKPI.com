import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Award, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Send, Check, Clock } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { 
  firebaseSaveDeanVote, 
  firebaseFetchDeanVote, 
  firebaseFetchAllDeanNominations, 
  syncDeanDataFromFirestore 
} from '../lib/firebase';
import { getFriendlyError } from '../lib/utils';
import { getLiveGoogleSheetRoster } from '../lib/googleSheetRoster';

// Define the approved candidate slate once formal acceptances are received.
// Currently empty pending confirmation and formal acceptances of nomination.
const APPROVED_DEAN_CANDIDATES: string[] = [
  "Brandon Owens",
  "Kameron Whitfield"
];

const DEFAULT_ELIGIBLE_DEAN_VOTERS = [
  "anthony.jones@orderofkpi.org",
  "brandon.owens@orderofkpi.org",
  "brian.johnson@orderofkpi.org",
  "brian.goings@orderofkpi.org",
  "darron.jenkins@orderofkpi.org",
  "denzel.talley@orderofkpi.org",
  "deshaun.safford@orderofkpi.org",
  "dominic.goodman@orderofkpi.org",
  "donald.mitchell@orderofkpi.org",
  "edward.cook@orderofkpi.org",
  "ishmeal.allensworth@orderofkpi.org",
  "jack.dee@orderofkpi.org",
  "james.haywood@orderofkpi.org",
  "jason.pilar@orderofkpi.org",
  "kameron.whitfield@orderofkpi.org",
  "keith.woods@orderofkpi.org",
  "tobias.bordley@orderofkpi.org",
  "candidate@gmail.com",
  "admin@orderofkpi.org"
];

export default function DeanVotingForm() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || '';
  const userRole = sessionStorage.getItem('userRole') || '';
  const isAdmin = userRole === 'admin' || userEmail === 'admin@orderofkpi.org';
  const normEmail = userEmail.toLowerCase().trim();

  const [eligibleVoters, setEligibleVoters] = useState<string[]>(DEFAULT_ELIGIBLE_DEAN_VOTERS);
  const isEligibleVoter = isAdmin || eligibleVoters.includes(normEmail);

  const [candidates, setCandidates] = useState<string[]>(APPROVED_DEAN_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [existingVote, setExistingVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    // Poll live Google Sheet roster
    getLiveGoogleSheetRoster()
      .then(res => {
        if (res && Array.isArray(res.eligibleVoters) && res.eligibleVoters.length > 0) {
          setEligibleVoters(res.eligibleVoters);
        }
      })
      .catch(err => console.warn('Live Google Sheet fetch notice:', err));

    const deadline = new Date("2026-08-19T23:59:00-04:00").getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = deadline - now;
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Perform background sync on mount
    syncDeanDataFromFirestore()
      .catch((err) => console.warn('[DeanVotingForm] Background sync error:', err))
      .finally(() => {
        fetchUserVote();
      });
  }, [userEmail]);

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const fetchUserVote = async () => {
    try {
      if (userEmail) {
        let userVote = null;
        // 1. Fetch User Vote (Try Server first)
        try {
          const voteRes = await fetchWithTimeout(`/api/dean-votes/user?email=${encodeURIComponent(userEmail)}`, {}, 4000);
          if (voteRes.ok) {
            const contentType = voteRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const voteData = await voteRes.json();
              if (voteData.success && voteData.vote) {
                userVote = voteData.vote;
              }
            }
          }
        } catch (err) {
          console.warn('[DeanVotingForm] Server user vote fetch failed, using Firestore:', err);
        }

        // Fallback to Firestore for User Vote
        if (!userVote) {
          console.log('[DeanVotingForm] Loading user vote from Firestore...');
          const fsVoteRes = await firebaseFetchDeanVote(userEmail);
          if (fsVoteRes.success && fsVoteRes.vote) {
            userVote = fsVoteRes.vote;
          }
        }

        if (userVote) {
          setExistingVote(userVote);
          setSelectedCandidate(userVote.nominee_name || '');
        }
      }
    } catch (err) {
      console.error('Error fetching voting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isEligibleVoter) {
      setError('Voting in the Intake Dean election is restricted to active financial members who meet the MIP criteria on the official roster.');
      return;
    }

    if (candidates.length === 0) {
      setError('Voting is not currently active. The approved candidate slate has not yet been published.');
      return;
    }

    if (!selectedCandidate) {
      setError('Please select a candidate for Intake Dean.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('[DeanVotingForm] Submitting vote concurrently to Server API and Cloud Firestore...');

      const serverTask = fetchWithTimeout('/api/dean-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_email: userEmail,
          nominee_name: selectedCandidate
        })
      }, 4000).then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
          throw new Error(data.message || 'Server rejected ballot');
        }
        throw new Error('Server response was not JSON');
      });

      const fsTask = firebaseSaveDeanVote(userEmail, selectedCandidate);

      const [serverResult, fsResult] = await Promise.allSettled([serverTask, fsTask]);

      const serverSuccess = serverResult.status === 'fulfilled';
      const fsSuccess = fsResult.status === 'fulfilled' && fsResult.value?.success;

      console.log('[DeanVotingForm] Write results:', { serverSuccess, fsSuccess });

      if (serverSuccess || fsSuccess) {
        setSuccessMessage('Your vote has been successfully submitted and saved');
        
        if (!serverSuccess && fsSuccess) {
          console.log('[DeanVotingForm] Triggering background sync because server write failed...');
          syncDeanDataFromFirestore().catch(() => {});
        }

        try {
          await fetchUserVote();
        } catch (fetchErr) {
          console.warn('[DeanVotingForm] Post-submit fetch error ignored:', fetchErr);
        }
      } else {
        const serverError = serverResult.status === 'rejected' ? serverResult.reason?.message : 'Server write failed';
        const fsError = fsResult.status === 'rejected' ? fsResult.reason?.message : fsResult.value?.message;
        throw new Error(serverError || fsError || 'Failed to submit vote. Please check your network connection.');
      }
    } catch (err: any) {
      setError(getFriendlyError(err, 'Failed to submit vote. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-24">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <MemberHeader />

        <div>
          <Link 
            to="/member-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E3F20] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Portal
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1E3F20]">
            Intake Dean Team Voting
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            Cast your official ballot for the Intake Dean position. Each financial member is restricted to a single active vote.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/40 rounded-2xl p-6 space-y-4 mt-6 text-[#1E3F20] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#B8860B]/10 rounded-xl text-[#B8860B]">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-base md:text-lg font-bold uppercase tracking-wider text-[#1E3F20]">Intake Team Dean Voting Window</p>
                <p className="text-sm md:text-base font-bold text-[#1E3F20] mt-0.5">August 17 – August 19, 2026</p>
                <p className="text-xs text-gray-500 mt-1">Deadline: August 19, 2026 at 11:59 PM ET</p>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="pt-3 border-t border-[#B8860B]/20 flex flex-wrap items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">Time Remaining:</span>
              {timeLeft.expired ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">Voting Period Closed</span>
              ) : (
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1E3F20]">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#B8860B]/30 shadow-2xs">
                    <span className="text-sm font-bold">{timeLeft.days}</span> <span className="text-[10px] text-gray-500 font-normal">days</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#B8860B]/30 shadow-2xs">
                    <span className="text-sm font-bold">{String(timeLeft.hours).padStart(2, '0')}</span> <span className="text-[10px] text-gray-500 font-normal">hrs</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#B8860B]/30 shadow-2xs">
                    <span className="text-sm font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span> <span className="text-[10px] text-gray-500 font-normal">mins</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#B8860B]/30 shadow-2xs">
                    <span className="text-sm font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span> <span className="text-[10px] text-gray-500 font-normal">secs</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 pt-1">
              For questions regarding the voting process, please reach out to <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a> (Membership Intake Chair).
            </p>
          </div>
        </div>

        {/* Ineligible Banner */}
        {!isEligibleVoter && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-2">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle size={22} className="flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Voting Eligibility Notice</h3>
                <p className="text-xs text-amber-900 mt-1">
                  Voting in the Intake Dean election is restricted to active financial members who meet the MIP criteria on the official roster. If you believe this is an error, please contact the Membership Intake Chair.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {existingVote && (
          <div className="bg-[#1E3F20]/5 border border-[#1E3F20]/20 rounded-2xl p-6 space-y-3">
            <div className="flex items-start gap-4">
              <CheckCircle2 size={24} className="text-[#1E3F20] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-[#1E3F20] text-sm uppercase tracking-wider">Active Vote Recorded</h3>
                <p className="text-xs text-gray-600 mt-1">
                  You currently have an active ballot cast for <span className="font-bold text-[#1E3F20]">{existingVote.nominee_name}</span>.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E3F20]/10 text-xs text-[#1E3F20] font-medium flex items-center justify-between">
              <span>You may modify your vote at any time up until the voting deadline on August 19, 2026 at 11:59 PM ET.</span>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 text-xs">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">Loading voting portal...</div>
          ) : candidates.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-[#B8860B]/10 text-[#B8860B] mb-2">
                <Award size={36} />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#1E3F20]">Candidate Slate Pending Formal Acceptance</h3>
              <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
                The Dean nomination period has formally concluded. Nominees are currently being contacted to confirm formal acceptance of their nomination. 
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                The official approved candidate ballot will go live once candidate acceptances are confirmed and certified by the Membership Committee.
              </p>
              <div className="pt-4">
                <span className="inline-block bg-[#FDFCF0] border border-[#B8860B]/30 px-4 py-2 rounded-full text-[11px] font-bold text-[#1E3F20] uppercase tracking-wider">
                  Voting Window: August 17 – August 19, 2026
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F20] mb-4">
                  Select Your Preferred Candidate <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {candidates.map((candidateName) => {
                    const isSelected = selectedCandidate === candidateName;
                    return (
                      <div
                        key={candidateName}
                        onClick={() => setSelectedCandidate(candidateName)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#1E3F20]/5 border-[#1E3F20] shadow-sm' 
                            : 'bg-[#FDFCF0] border-[#B8860B]/30 hover:border-[#1E3F20]/50'
                        }`}
                      >
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#1E3F20]">{candidateName}</h4>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-[#1E3F20] border-[#1E3F20] text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-[#B8860B]/20">
                <span className="text-xs text-gray-500 font-medium">
                  Voting as: <strong className="text-[#1E3F20]">{userName || userEmail}</strong> (Strictly Anonymous)
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1E3F20] hover:bg-[#B8860B] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} /> {submitting ? 'Submitting Ballot...' : 'Submit Official Ballot'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
