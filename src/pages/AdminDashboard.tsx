import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Users, 
  Ticket, 
  BarChart3, 
  ShieldCheck, 
  Save, 
  RefreshCcw, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// --- Data ---
const FINANCIAL_MEMBERS = [
  "Anthony Jones", "Brandon Owens", "Brian Goings", "Brian Johnson",
  "Dameone Ferguson", "Darron Jenkins", "Deshaun Stafford", "Dominic Goodman",
  "Donald Mitchell", "Edward Cook", "Ishmeal Allensworth", "Jack Dee",
  "James Haywood Jr", "Jason Pilar", "Kameron Whitfield", "Keith Woods", "Tobias Bordley",
  "Test User A", "Test User B"
];

const NOMINEES = [
  { id: "1ab-aj", name: "Anthony Jones", position: "1st Anti-Basileus" },
  { id: "2ab-jh", name: "James “JR” Hayward", position: "2nd Anti-Basileus" },
  { id: "gram-bj", name: "Brian Johnson", position: "Grammateus" },
  { id: "epis-ec", name: "Edward Cook", position: "Epistoleus" },
  { id: "hist-bo", name: "Brandon Owens", position: "Historian" },
  { id: "hod-dj", name: "Darron Jenkins", position: "Hodegos" },
  { id: "tam-ia", name: "Ishmael Allensworth", position: "Tamiouchos" }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'ballots' | 'results'>('results');
  const [ballots, setBallots] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toUpperCase() === 'ATLANTA') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const qBallots = query(collection(db, 'ballots'));
    const unsubBallots = onSnapshot(qBallots, (snap) => {
      setBallots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Auto-seed if empty
      if (snap.empty && !actionLoading) {
        console.log("Seeding ballots...");
        generateBallots(true); // silent seed
      }
    });

    const qVotes = query(collection(db, 'votes'));
    const unsubVotes = onSnapshot(qVotes, (snap) => {
      setVotes(snap.docs.map(d => d.data()));
      setLoading(false);
    });

    return () => {
      unsubBallots();
      unsubVotes();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-pure-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-3xl text-center"
        >
          <ShieldCheck className="text-primary mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-2">Committee Access</h2>
          <p className="text-silver/40 text-[10px] uppercase tracking-[0.2em] mb-8">Authorization Required</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Enter Administrative Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-white focus:border-primary outline-none transition-all placeholder:text-[10px] placeholder:uppercase placeholder:tracking-widest"
              autoFocus
            />
            {loginError && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Invalid credentials</p>
            )}
            <button 
              type="submit"
              className="w-full py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-xl shadow-primary/10"
            >
              Verify Identity
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const generateBallots = async (silent = false) => {
    if (!silent && !confirm("Are you sure? This will overwrite or create ballots for all KPI members.")) return;
    setActionLoading(true);
    try {
      const batch = writeBatch(db);
      
      FINANCIAL_MEMBERS.forEach((name, index) => {
        const id = `KPI-2026-${(index + 1).toString().padStart(4, '0')}`;
        const ref = doc(db, 'ballots', id);
        batch.set(ref, {
          name,
          hasVoted: false,
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      if (!silent) alert("Successfully generated ballots for all KPI members.");
    } catch (err) {
      console.error(err);
      if (!silent) alert("Error generating ballots.");
    } finally {
      setActionLoading(false);
    }
  };

  const getResults = () => {
    const results: Record<string, Record<string, number>> = {};
    
    // Group nominees by position
    NOMINEES.forEach(n => {
      if (!results[n.position]) results[n.position] = {};
      results[n.position][n.name] = 0;
    });

    // Count votes
    votes.forEach(v => {
      Object.entries(v.selections).forEach(([posId, nomineeId]: [any, any]) => {
        const nominee = NOMINEES.find(n => n.id === nomineeId);
        if (nominee) {
          results[nominee.position][nominee.name]++;
        }
      });
    });

    return results;
  };

  return (
    <div className="min-h-screen bg-pure-black text-white p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-widest mb-2 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-silver/40 text-xs uppercase tracking-[0.3em]">Election Management & Live Tabulation</p>
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'results' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <BarChart3 className="inline-block mr-2" size={14} />
              Live Results
            </button>
            <button 
              onClick={() => setActiveTab('ballots')}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'ballots' ? 'bg-primary text-black' : 'text-silver/60 hover:text-white'
              }`}
            >
              <Ticket className="inline-block mr-2" size={14} />
              Ballot Management
            </button>
          </div>
        </header>

        {activeTab === 'results' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Total Ballots</p>
                <p className="text-3xl font-bold text-white">{ballots.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Votes Cast</p>
                <p className="text-3xl font-bold text-primary">{votes.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-silver/40 text-[10px] uppercase tracking-widest mb-1">Turnout</p>
                <p className="text-3xl font-bold text-white">
                  {ballots.length ? `${Math.round((votes.length / ballots.length) * 100)}%` : '0%'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(getResults()).map(([position, candidates]) => (
                <motion.div 
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black border border-white/10 p-8 rounded-3xl"
                >
                  <h3 className="text-lg font-bold uppercase tracking-widest mb-6 text-primary flex items-center justify-between">
                    {position}
                    <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-silver/40">Official Slate</span>
                  </h3>
                  <div className="space-y-6">
                    {Object.entries(candidates).map(([name, count]) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between text-sm uppercase tracking-wider">
                          <span className="text-white">{name}</span>
                          <span className="text-primary font-bold">{count} Votes</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: votes.length > 0 ? `${(count / votes.length) * 100}%` : '0%' }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-widest">KPI Member Registry</h2>
              <button 
                onClick={generateBallots}
                disabled={actionLoading}
                className="px-6 py-3 bg-primary text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center gap-2"
              >
                <RefreshCcw size={14} className={actionLoading ? 'animate-spin' : ''} />
                Generate Master Ballot List
              </button>
            </div>

            <div className="overflow-hidden border border-white/10 rounded-2xl bg-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-silver/60">Member Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-silver/60">Secure Ballot ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-silver/60">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-silver/60">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ballots.sort((a,b) => a.name.localeCompare(b.name)).map((ballot) => (
                    <tr key={ballot.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {ballot.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider">{ballot.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-primary font-mono bg-primary/5 px-2 py-1 rounded">
                          {ballot.id}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        {ballot.hasVoted ? (
                          <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 size={12} />
                            Vote Cast
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-silver/40 text-[10px] font-bold uppercase tracking-widest">
                            <AlertCircle size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`Name: ${ballot.name}\nBallot: ${ballot.id}`);
                            alert(`Copied credentials for ${ballot.name}`);
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-silver/40 hover:text-white transition-colors"
                        >
                          Copy Credentials
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ballots.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-silver/40 italic">
                        No ballots generated yet. Click "Generate Master Ballot List" to initialize.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
