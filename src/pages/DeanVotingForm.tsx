import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Award, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Send, Check } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

interface NomineeItem {
  fullName: string;
  count: number;
  statements: string[];
}

export default function DeanVotingForm() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || '';

  const [nominees, setNominees] = useState<NomineeItem[]>([]);
  const [selectedNominee, setSelectedNominee] = useState('');
  const [existingVote, setExistingVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNomineesAndVote();
  }, [userEmail]);

  const fetchNomineesAndVote = async () => {
    try {
      const nomRes = await fetch('/api/dean-nominations');
      const nomData = await nomRes.json();
      if (nomData.success && Array.isArray(nomData.nominations)) {
        const summaryMap: Record<string, { count: number; statements: string[] }> = {};
        nomData.nominations.forEach((nom: any) => {
          const fullName = `${nom.nominee_first_name || ''} ${nom.nominee_last_name || ''}`.trim();
          if (!fullName) return;
          if (!summaryMap[fullName]) {
            summaryMap[fullName] = { count: 0, statements: [] };
          }
          summaryMap[fullName].count += 1;
          if (nom.statement) {
            summaryMap[fullName].statements.push(nom.statement);
          }
        });

        const list = Object.keys(summaryMap).map((fullName) => ({
          fullName,
          count: summaryMap[fullName].count,
          statements: summaryMap[fullName].statements
        })).sort((a, b) => b.count - a.count);

        setNominees(list);
      }

      if (userEmail) {
        const voteRes = await fetch(`/api/dean-votes/user?email=${encodeURIComponent(userEmail)}`);
        const voteData = await voteRes.json();
        if (voteData.success && voteData.vote) {
          setExistingVote(voteData.vote);
          setSelectedNominee(voteData.vote.nominee_name || '');
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

    if (!selectedNominee) {
      setError('Please select a candidate for Intake Dean.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/dean-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_email: userEmail,
          nominee_name: selectedNominee
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Your vote for the Intake Dean has been successfully recorded. You may update your vote while the voting window is active.');
        fetchNomineesAndVote();
      } else {
        setError(data.message || 'Failed to submit vote.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
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
            Cast your official ballot for the Intake Dean position from the verified nominee roster. Each financial member is restricted to a single active vote.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-2xl p-5 space-y-2 mt-4 text-xs text-[#1E3F20]">
            <p className="font-bold uppercase tracking-wider text-[#B8860B]">Voting Period & Timeline</p>
            <p><strong>Period:</strong> Monday, August 17, 2026 to Wednesday, August 19, 2026.</p>
            <p><strong>Guidelines:</strong> Members can cast a single vote for their preferred candidate. Ballots may be updated while voting is open.</p>
            <p className="pt-2 border-t border-[#B8860B]/20 text-gray-600">
              For questions regarding the voting process, please reach out to <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a> (Membership Intake Chair).
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {existingVote && (
          <div className="bg-[#1E3F20]/5 border border-[#1E3F20]/20 rounded-2xl p-6 flex items-start gap-4">
            <CheckCircle2 size={24} className="text-[#1E3F20] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#1E3F20] text-sm uppercase tracking-wider">Active Vote Recorded</h3>
              <p className="text-xs text-gray-600 mt-1">
                You currently have an active ballot cast for <span className="font-bold text-[#1E3F20]">{existingVote.nominee_name}</span>. You may select a different nominee below to update your ballot.
              </p>
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
            <div className="py-12 text-center text-gray-500 text-xs">Loading nominees roster...</div>
          ) : nominees.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">No nominees are currently available for voting.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F20] mb-4">
                  Select Your Preferred Candidate <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  {nominees.map((nom) => {
                    const isSelected = selectedNominee === nom.fullName;
                    return (
                      <div
                        key={nom.fullName}
                        onClick={() => setSelectedNominee(nom.fullName)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#1E3F20]/5 border-[#1E3F20] shadow-sm' 
                            : 'bg-[#FDFCF0] border-[#B8860B]/30 hover:border-[#1E3F20]/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-serif font-bold text-base text-[#1E3F20]">{nom.fullName}</h4>
                          <p className="text-xs text-gray-500">Endorsements: {nom.count} nomination(s)</p>
                          {nom.statements.length > 0 && (
                            <p className="text-xs text-gray-700 italic mt-2">"{nom.statements[0]}"</p>
                          )}
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
