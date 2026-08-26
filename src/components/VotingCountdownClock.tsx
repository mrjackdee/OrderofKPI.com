import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, Vote, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  phase: 'before' | 'active' | 'ended';
}

const START_DATE = new Date('2026-08-26T17:00:00-04:00'); // Wed Aug 26, 2026 5:00 PM ET
const END_DATE = new Date('2026-08-28T08:00:00-04:00');   // Fri Aug 28, 2026 8:00 AM ET

export const VotingCountdownClock: React.FC<{ isEligible?: boolean }> = ({ isEligible = true }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date();

    if (now < START_DATE) {
      const diff = START_DATE.getTime() - now.getTime();
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        phase: 'before'
      };
    } else if (now < END_DATE) {
      const diff = END_DATE.getTime() - now.getTime();
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        phase: 'active'
      };
    } else {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        phase: 'ended'
      };
    }
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full bg-gradient-to-br from-[#1E3F20] via-[#142B16] to-[#0A160B] border border-gold/35 rounded-2xl p-5 sm:p-7 text-cream shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden my-6">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        
        {/* Left Status Header */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {timeLeft.phase === 'before' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-gold border border-gold/40">
                <Clock className="w-3.5 h-3.5 text-gold animate-pulse" />
                Voting Window Opens Soon
              </span>
            )}
            {timeLeft.phase === 'active' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Voting Is Live Now
              </span>
            )}
            {timeLeft.phase === 'ended' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-stone-700/50 text-stone-300 border border-stone-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                Voting Period Concluded
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-sans font-bold text-cream tracking-tight">
            {timeLeft.phase === 'before' && "FY27 Voting"}
            {timeLeft.phase === 'active' && "Time Remaining To Cast Your Ballot"}
            {timeLeft.phase === 'ended' && "FY27 Candidate Selection Voting Closed"}
          </h3>

          <p className="text-xs sm:text-sm text-cream/75 leading-relaxed font-sans max-w-xl">
            {timeLeft.phase === 'before' && (
              <>Opens <strong>Wed, Aug 26, 2026 at 5:00 PM ET</strong> and closes <strong>Fri, Aug 28, 2026 at 8:00 AM ET</strong>.</>
            )}
            {timeLeft.phase === 'active' && (
              <>Voting is officially in progress! Submissions close on <strong>Fri, Aug 28, 2026 at 8:00 AM ET</strong>.</>
            )}
            {timeLeft.phase === 'ended' && (
              <>Voting closed on <strong>Fri, Aug 28, 2026 at 8:00 AM ET</strong>. All recorded ballots have been submitted for official audit.</>
            )}
          </p>
        </div>

        {/* Center Countdown Display */}
        {timeLeft.phase !== 'ended' ? (
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-2 md:my-0">
            <div className="flex flex-col items-center">
              <div className="bg-pure-black/70 border border-gold/30 rounded-xl p-2.5 sm:p-3 min-w-[54px] sm:min-w-[64px] text-center shadow-inner">
                <span className="text-xl sm:text-3xl font-mono font-bold text-gold tracking-wider">
                  {formatNumber(timeLeft.days)}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cream/60 mt-1">Days</span>
            </div>

            <span className="text-lg sm:text-2xl font-mono font-bold text-gold/60 -mt-4">:</span>

            <div className="flex flex-col items-center">
              <div className="bg-pure-black/70 border border-gold/30 rounded-xl p-2.5 sm:p-3 min-w-[54px] sm:min-w-[64px] text-center shadow-inner">
                <span className="text-xl sm:text-3xl font-mono font-bold text-gold tracking-wider">
                  {formatNumber(timeLeft.hours)}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cream/60 mt-1">Hours</span>
            </div>

            <span className="text-lg sm:text-2xl font-mono font-bold text-gold/60 -mt-4">:</span>

            <div className="flex flex-col items-center">
              <div className="bg-pure-black/70 border border-gold/30 rounded-xl p-2.5 sm:p-3 min-w-[54px] sm:min-w-[64px] text-center shadow-inner">
                <span className="text-xl sm:text-3xl font-mono font-bold text-gold tracking-wider">
                  {formatNumber(timeLeft.minutes)}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cream/60 mt-1">Mins</span>
            </div>

            <span className="text-lg sm:text-2xl font-mono font-bold text-gold/60 -mt-4">:</span>

            <div className="flex flex-col items-center">
              <div className="bg-pure-black/70 border border-gold/30 rounded-xl p-2.5 sm:p-3 min-w-[54px] sm:min-w-[64px] text-center shadow-inner">
                <span className="text-xl sm:text-3xl font-mono font-bold text-amber-400 tracking-wider">
                  {formatNumber(timeLeft.seconds)}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cream/60 mt-1">Secs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 bg-pure-black/40 border border-gold/20 rounded-xl">
            <div className="text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-gold mx-auto" />
              <span className="block text-xs font-bold uppercase tracking-widest text-gold">Ballots Locked</span>
            </div>
          </div>
        )}

        {/* Right Action Button */}
        {isEligible && (
          <div className="flex items-center justify-end shrink-0">
            <Link
              to="/candidate-voting"
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                timeLeft.phase === 'active'
                  ? 'bg-gold hover:bg-white text-ivy'
                  : 'bg-pure-black/60 hover:bg-pure-black border border-gold/40 text-gold'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>{timeLeft.phase === 'active' ? 'Cast Ballot Now' : 'Candidate Ballot'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};
