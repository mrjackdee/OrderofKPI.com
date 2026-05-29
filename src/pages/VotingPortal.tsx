import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Key, 
  ChevronRight, 
  Check, 
  Vote as VoteIcon,
  Info,
  LogOut,
  Calendar,
  X,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Types ---
interface BallotData {
  name: string;
  hasVoted: boolean;
  votedAt?: any;
}

interface Nominee {
  id: string;
  name: string;
  position: string;
  bio?: string;
  statement?: string;
}

interface Position {
  id: string;
  title: string;
  nominees: Nominee[];
}

// --- Data (To be fetched from DB later, but seeding for now) ---
const AVAILABLE_POSITIONS: Position[] = [
  {
    id: "1st-anti-basileus",
    title: "1st Anti-Basileus",
    nominees: [
      { id: "1ab-aj", name: "Anthony Jones", position: "1st Anti-Basileus" }
    ]
  },
  {
    id: "2nd-anti-basileus",
    title: "2nd Anti-Basileus",
    nominees: [
      { id: "2ab-jh", name: "James “JR” Hayward", position: "2nd Anti-Basileus" }
    ]
  },
  {
    id: "grammateus",
    title: "Grammateus",
    nominees: [
      { id: "gram-bj", name: "Brian Johnson", position: "Grammateus" }
    ]
  },
  {
    id: "epistoleus",
    title: "Epistoleus",
    nominees: [
      { id: "epis-ec", name: "Edward Cook", position: "Epistoleus" }
    ]
  },
  {
    id: "historian",
    title: "Historian",
    nominees: [
      { id: "hist-bo", name: "Brandon Owens", position: "Historian" }
    ]
  },
  {
    id: "hodegos",
    title: "Hodegos",
    nominees: [
      { id: "hod-dj", name: "Darron Jenkins", position: "Hodegos" }
    ]
  },
  {
    id: "tamiouchos",
    title: "Tamiouchos",
    nominees: [
      { id: "tam-ia", name: "Ishmael Allensworth", position: "Tamiouchos" }
    ]
  }
];

// --- Error Handler ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo.error;
}

// --- Components ---

const LoginView = ({ onLogin }: { onLogin: (ballotId: string, name: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full bg-black border border-silver/10 p-8 md:p-12 rounded-3xl"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">Voting Portal Closed</h2>
        <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] mb-6">Credential authentication has been disabled</p>
        
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-8 text-center">
          <p className="text-primary text-xs uppercase tracking-wider font-semibold leading-relaxed">
            The voting period has officially ended and the ballot box is closed. No new votes can be submitted for the 2026 elections.
          </p>
        </div>

        <Link 
          to="/"
          className="inline-block w-full py-4 bg-silver text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all text-center text-sm"
        >
          Return Home
        </Link>
      </div>
    </motion.div>
  );
};

const BallotView = ({ ballotId, memberName, onResult }: { ballotId: string, memberName: string, onResult: (success: boolean) => void }) => {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSelect = (positionId: string, nomineeId: string) => {
    setSelections(prev => ({
      ...prev,
      [positionId]: nomineeId
    }));
  };

  const isComplete = AVAILABLE_POSITIONS.every(pos => selections[pos.id]);

  const castVote = async () => {
    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const ballotRef = doc(db, 'ballots', ballotId);
        const voteRef = doc(db, 'votes', ballotId); // Use ballotId as vote ID for 1:1 constraint

        const ballotDoc = await transaction.get(ballotRef);
        if (!ballotDoc.exists() || ballotDoc.data().hasVoted) {
          throw new Error("Ballot already used or invalid.");
        }

        transaction.set(voteRef, {
          ballotNumber: ballotId,
          selections,
          timestamp: serverTimestamp()
        });

        transaction.update(ballotRef, {
          hasVoted: true,
          votedAt: serverTimestamp()
        });
      });
      onResult(true);
    } catch (err) {
      console.error(err);
      alert("Error casting vote. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl w-full px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-widest mb-2">Official Ballot</h1>
          <div className="flex flex-col gap-2">
            <p className="text-silver/40 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              Logged in as <span className="text-primary font-bold">{memberName}</span>
              <span className="w-1 h-1 rounded-full bg-silver/20" />
              Ballot: <span className="text-white/60">{ballotId}</span>
            </p>
            <div className="flex items-center gap-2 text-[10px] text-primary/60 uppercase tracking-widest font-bold">
              <ShieldCheck size={12} />
              Your identity is used for verification only. Your vote is recorded anonymously.
            </div>
          </div>
        </div>
        {!showConfirm && (
          <button 
            disabled={!isComplete}
            onClick={() => setShowConfirm(true)}
            className="px-8 py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:grayscale disabled:opacity-30"
          >
            Review Selections
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {AVAILABLE_POSITIONS.map((pos) => (
              <div key={pos.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest">
                    {pos.title}
                  </div>
                  <div className="h-px flex-1 bg-silver/10" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pos.nominees.map((nominee) => (
                    <button
                      key={nominee.id}
                      onClick={() => handleSelect(pos.id, nominee.id)}
                      className={`relative p-6 rounded-2xl border transition-all text-left group ${
                        selections[pos.id] === nominee.id 
                          ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(192,192,192,0.1)]' 
                          : 'bg-black border-silver/10 hover:border-silver/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-lg font-bold uppercase tracking-widest ${
                          selections[pos.id] === nominee.id ? 'text-primary' : 'text-white'
                        }`}>
                          {nominee.name}
                        </span>
                        {selections[pos.id] === nominee.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <p className="text-silver/40 text-[10px] font-medium uppercase tracking-widest">Directorate Nominee</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-8 border-t border-silver/10 flex flex-col items-center gap-6">
              <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] text-center max-w-md italic">
                Please ensure you have made a selection for all positions before submitting. Your vote is final and cannot be changed once cast.
              </p>
              <button 
                disabled={!isComplete}
                onClick={() => setShowConfirm(true)}
                className="w-full md:w-auto px-12 py-5 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50"
              >
                Review Selections
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-black border border-primary/20 p-8 md:p-12 rounded-3xl"
          >
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Info size={32} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest mb-2">Confirm Your Ballot</h2>
              <p className="text-silver/40 text-xs uppercase tracking-[0.2em]">Please verify your selections below</p>
            </div>

            <div className="space-y-4 mb-10">
              {AVAILABLE_POSITIONS.map(pos => (
                <div key={pos.id} className="flex items-center justify-between p-4 bg-silver/5 rounded-xl border border-silver/10">
                  <span className="text-[10px] font-bold text-silver/60 uppercase tracking-widest italic">{pos.title}</span>
                  <span className="text-sm font-bold text-white uppercase tracking-[0.1em]">
                    {pos.nominees.find(n => n.id === selections[pos.id])?.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 py-4 border border-silver/20 text-silver font-bold uppercase tracking-widest rounded-xl hover:bg-silver/10 transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={castVote}
                disabled={submitting}
                className="flex-1 py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Casting Vote...' : 'Finalize & Cast Vote'}
                {!submitting && <ChevronRight size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SuccessView = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-md w-full bg-black border border-primary/20 p-12 rounded-3xl text-center"
  >
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 animate-bounce">
      <CheckCircle2 size={48} />
    </div>
    <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest mb-4">Vote Cast Successfully</h2>
    <p className="text-silver/60 leading-relaxed font-light mb-10">
      Thank you for exercising your right to vote. Your ballot has been securely recorded and will be tabulated by the Nominating Committee.
    </p>
    <Link 
      to="/elections"
      className="inline-block w-full py-4 bg-silver text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all"
    >
      Return to Elections Portal
    </Link>
  </motion.div>
);

export default function VotingPortal() {
  const [step, setStep] = useState<'login' | 'ballot' | 'success'>('login');
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    // Test connection on mount
    const test = async () => {
      try {
        const { testConnection } = await import('../lib/firebase');
        await testConnection();
      } catch (err) {
        console.error("Firebase test failed", err);
      }
    };
    test();
  }, []);

  return (
    <div className="min-h-screen bg-pure-black flex items-center justify-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(192,192,192,0.05)_0%,transparent_50%)] -z-0" />
      
      <div className="relative z-10 w-full flex justify-center">
        {step === 'login' && <LoginView onLogin={(id, name) => {
          setCurrentUser({ id, name });
          setStep('ballot');
        }} />}
        
        {step === 'ballot' && currentUser && (
          <BallotView 
            ballotId={currentUser.id} 
            memberName={currentUser.name} 
            onResult={(success) => success && setStep('success')} 
          />
        )}
        
        {step === 'success' && <SuccessView />}
      </div>
      
      {/* Footer / Exit */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
        {step === 'login' && (
          <Link to="/elections" className="text-silver/40 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <X size={14} />
            Cancel & Exit
          </Link>
        )}
        {step === 'ballot' && (
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to log out? Your progress will be lost.")) {
                setStep('login');
                setCurrentUser(null);
              }
            }}
            className="text-silver/40 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <LogOut size={14} />
            Destroy Session
          </button>
        )}
      </div>
    </div>
  );
}
