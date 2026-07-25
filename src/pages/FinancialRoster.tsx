import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  CalendarDays, 
  LayoutList,
  RefreshCw,
  AlertCircle,
  XCircle
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { Member } from '../types';

export default function FinancialRoster() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'firstName' | 'paymentDate'>('lastName');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
      return;
    }
    fetchMembers();
  }, [navigate]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (err) {
      setError('Failed to load roster data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError('');
    try {
      const response = await fetch('/api/financials/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: 'OFFICIAL_ROSTER_ID' })
      });
      const data = await response.json();
      if (data.success) {
        await fetchMembers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed. Ensure Google Sheets integration is configured.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredRoster = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'lastName') {
      const lastA = a.name.split(' ').pop() || '';
      const lastB = b.name.split(' ').pop() || '';
      return lastA.localeCompare(lastB);
    } else if (sortBy === 'firstName') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'paymentDate') {
      return (a.grad_year || '').localeCompare(b.grad_year || '');
    }
    return 0;
  });

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-20 relative overflow-hidden">
      {/* Draft Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
        <h1 className="text-[15rem] md:text-[25rem] font-black uppercase text-[#1E3F20] -rotate-45 select-none whitespace-nowrap">
          Official
        </h1>
      </div>

      <div className="relative z-10">
        <div className="pt-24">
          <MemberHeader />
        </div>

        <div className="pt-8 px-4 md:px-12 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <Link to="/intake-calendar" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <CalendarDays size={14} /> Intake Calendar
            </Link>
            <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
              <Users size={14} /> Financial Roster
            </div>
            <Link to="/gantt-chart" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <LayoutList size={14} /> Intake Plan
            </Link>
            <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <Users size={14} /> Member Directory
            </Link>
          </div>

          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="px-6 py-2 bg-gold text-ivy rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Google Sheets'}
          </button>
        </div>

      <div className="pt-8 pb-8 px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-[#B8860B]" />
            <ShieldCheck className="text-[#1E3F20]" size={24} />
            <div className="h-px w-16 bg-[#B8860B]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display text-[#1E3F20] tracking-wider mb-4 uppercase text-center max-w-4xl">
            Financial Roster
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            <p className="text-sm md:text-lg text-[#B8860B] font-medium tracking-[0.1em] md:tracking-[0.2em] uppercase">
              Live Google Sheets Synchronization
            </p>
            <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-2xl mx-auto mb-10 px-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={16} className="text-[#1E3F20]/60" />
          </div>
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-[#B8860B]/30 rounded-xl py-3 pl-12 pr-4 text-[#1E3F20] text-sm focus:outline-none focus:border-[#B8860B] transition-all placeholder:text-[#1E3F20]/40 shadow-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white border-2 border-[#B8860B]/30 rounded-xl py-3 px-4 text-[#1E3F20] text-sm focus:outline-none focus:border-[#B8860B] transition-all shadow-sm outline-none cursor-pointer"
        >
          <option value="lastName">Sort by Last Name</option>
          <option value="firstName">Sort by First Name</option>
          <option value="paymentDate">Sort by Grad Year</option>
        </select>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-12 h-12 text-gold animate-spin opacity-20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRoster.map((member, index) => (
              <motion.div
                key={member.email}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border-2 border-[#B8860B] rounded-xl p-5 shadow-[0_8px_20px_rgba(30,63,32,0.08)] relative hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#FDFCF0] border border-[#B8860B]/30 flex items-center justify-center overflow-hidden">
                    {member.profile_photo ? (
                      <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={20} className="text-[#1E3F20]" />
                    )}
                  </div>
                  {member.financial_status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[9px] font-black uppercase tracking-widest text-red-700">
                      <XCircle size={10} /> Inactive
                    </span>
                  )}
                </div>

                <h3 className="text-[#1E3F20] font-bold text-lg mb-1">{member.name}</h3>
                {member.title && (
                  <div className="text-[#B8860B] text-xs font-body italic font-bold mb-2 uppercase tracking-wide">
                    {member.title}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#B8860B] text-[10px] font-black uppercase tracking-widest mb-4">
                  <span>{member.intake_class || 'Member'}</span>
                  <span className="w-1 h-1 rounded-full bg-[#B8860B]/50" />
                  <span>{member.role}</span>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-[#B8860B]/20">
                  <div className="flex items-center gap-2.5 text-[#1E3F20]/70">
                    <Mail size={12} />
                    <span className="text-[11px] truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#1E3F20]/70">
                    <CalendarDays size={12} />
                    <span className="text-[11px] truncate text-[#B8860B] font-semibold">Status: {member.financial_status === 'active' ? 'Paid' : 'Pending'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredRoster.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="text-[#1E3F20]/20 mx-auto mb-4" />
            <h3 className="text-[#1E3F20] text-lg font-bold mb-2">No members found</h3>
            <p className="text-[#1E3F20]/60 text-sm">Adjust your search criteria to find members.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
