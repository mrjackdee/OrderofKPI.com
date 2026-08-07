import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  X, 
  Minus, 
  Users, 
  ShieldCheck, 
  Info,
  Clock,
  AlertTriangle,
  ChevronRight,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Candidate, Vote } from '../types';
import { syncApplicationsFromFirestore } from '../lib/memberDb';
import { syncMemberVote, fetchMemberVotes } from '../lib/portalSync';

export default function SelectionVoting() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email);
    }
    syncApplicationsFromFirestore().catch(() => {}).finally(() => {
      fetchData(email || undefined);
    });
  }, []);

  const fetchData = async (currentEmail?: string) => {
    try {
      const candRes = await fetch('/api/candidates');
      const candData = await candRes.json();
      
      if (candData.success) {
        setCandidates(candData.candidates.filter((c: Candidate) => c.status === 'Selection'));
      }
      const fetchedVotes = await fetchMemberVotes(currentEmail || userEmail);
      setVotes(fetchedVotes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (candidateId: string, decision: 'yes' | 'no' | 'abstain') => {
    setSubmitting(candidateId);
    try {
      await syncMemberVote(userEmail, candidateId, decision);
      await fetchData(userEmail);
    } catch (error) {
      console.error('Error casting vote:', error);
    } finally {
      setSubmitting(null);
    }
  };

  const getUserVote = (candidateId: string) => {
    return votes.find(v => v.voter_email === userEmail && v.candidate_id === candidateId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-ivy py-16 px-4 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck className="w-4 h-4" />
            Secure Voting Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-cream mb-4">Selection Committee</h1>
          <p className="text-cream/70 font-body max-w-2xl mx-auto">
            Review candidate dossiers and cast your secure, anonymous vote for the FY27 Intake Class.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {candidates.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-gold/20 text-center shadow-soft">
            <Clock className="w-16 h-16 text-gold/20 mx-auto mb-6" />
            <h2 className="text-2xl font-display text-ivy mb-2">No Candidates in Selection</h2>
            <p className="text-ivy/60">There are currently no candidates ready for voting. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {candidates.map((candidate) => {
              const myVote = getUserVote(candidate.id);
              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gold/20 shadow-soft overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div>
                        <h2 className="text-2xl font-display text-ivy mb-1">{candidate.name}</h2>
                        <div className="flex items-center gap-4 text-ivy/40 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Applied: {new Date(candidate.application_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Dossier Complete
                          </span>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-ivy border-2 border-ivy px-6 py-2 rounded-md font-bold uppercase tracking-widest text-xs hover:bg-ivy hover:text-cream transition-all">
                        View Full Dossier
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-cream p-4 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-1">Application Score</p>
                        <p className="text-xl font-display text-ivy">{candidate.scores?.application || 'Pending'}/100</p>
                      </div>
                      <div className="bg-cream p-4 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-1">Interview Score</p>
                        <p className="text-xl font-display text-ivy">{candidate.scores?.interview || 'Pending'}/100</p>
                      </div>
                      <div className="bg-cream p-4 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-1">Status</p>
                        <p className="text-xl font-display text-ivy">{candidate.status}</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-cream">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-ivy/60">
                          {myVote ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-ivy/5 rounded-md">
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-bold uppercase tracking-widest text-ivy">Your Vote: {myVote.decision}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gold">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-sm font-bold uppercase tracking-widest">Awaiting Your Vote</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                          <button
                            disabled={submitting === candidate.id}
                            onClick={() => castVote(candidate.id, 'yes')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-md font-bold uppercase tracking-widest text-sm transition-all ${
                              myVote?.decision === 'yes'
                                ? 'bg-green-600 text-white'
                                : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            Yes
                          </button>
                          <button
                            disabled={submitting === candidate.id}
                            onClick={() => castVote(candidate.id, 'no')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-md font-bold uppercase tracking-widest text-sm transition-all ${
                              myVote?.decision === 'no'
                                ? 'bg-red-600 text-white'
                                : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            No
                          </button>
                          <button
                            disabled={submitting === candidate.id}
                            onClick={() => castVote(candidate.id, 'abstain')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-md font-bold uppercase tracking-widest text-sm transition-all ${
                              myVote?.decision === 'abstain'
                                ? 'bg-gray-600 text-white'
                                : 'bg-white border-2 border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white'
                            }`}
                          >
                            <Minus className="w-4 h-4" />
                            Abstain
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-6 bg-white border border-ivy/10 rounded-lg flex items-start gap-4 shadow-soft">
          <Info className="w-6 h-6 text-gold shrink-0" />
          <div className="text-sm text-ivy/60">
            <p className="font-bold text-ivy mb-1">Voting Privacy Notice</p>
            <p>
              Your votes are cast securely. While the system tracks participation to ensure one vote per member, individual selections are aggregated for anonymity before being shared with the Membership Chair.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
