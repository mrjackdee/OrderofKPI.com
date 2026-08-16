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
import { syncApplicationsFromFirestore } from '../lib/memberDb';

export default function FinancialRoster() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'firstName'>('lastName');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role || role === 'applicant' || role === 'prospective') {
      navigate(role ? '/applicant-portal' : '/login', { replace: true });
      return;
    }
    syncApplicationsFromFirestore().catch(() => {}).finally(() => {
      fetchMembers();
    });
  }, [navigate]);

  const isOfficer = (member: Member): boolean => {
    if (!member) return false;
    const role = (member.role || '').toLowerCase();
    const title = (member.title || '').toLowerCase();
    if (role === 'officer' || role === 'membership committee' || role === 'membership committee chair') {
      return true;
    }
    if (title && title !== 'administrator' && title !== 'member' && title !== 'candidate') {
      return true;
    }
    return false;
  };

  const parseCSVLine = (line: string): string[] => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch directory members from backend API for metadata (role, title, profile_photo, intake_class)
      let dirMembers: Member[] = [];
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.success && Array.isArray(data.members)) {
          dirMembers = data.members.filter((m: Member) => {
            // Filter out non-members (applicants/candidates/test credentials) and removed members
            const email = (m.email || '').toLowerCase().trim();
            const role = (m.role || '').toLowerCase();
            const title = (m.title || '').toLowerCase();
            if (email === 'brandon.addison@orderofkpi.org') return false;
            if (role === 'applicant' || role === 'prospective' || role === 'candidate' || title === 'candidate') return false;
            return true;
          });
        }
      } catch (err) {
        console.warn('Could not fetch backend directory members:', err);
      }

      // 2. Fetch live Google Sheet CSV for financial status (Column D: FY27 Paid = TRUE)
      const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-IMvMUANALE3KC1UY46QwHpmdIeEM268ZXSCK_Amj3s/gviz/tq?tqx=out:csv';
      const sheetRes = await fetch(sheetUrl);
      if (!sheetRes.ok) {
        throw new Error('Failed to load roster data from Google Sheet.');
      }
      const csvText = await sheetRes.text();
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      const activeFinancialMembers: Member[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const firstName = cols[0] || '';
        const lastName = cols[1] || '';
        const fy27Paid = (cols[3] || '').trim().toUpperCase() === 'TRUE';
        const personalEmail = cols[5] || '';
        const kpiEmail = cols[7] || '';
        const email = (kpiEmail || personalEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@orderofkpi.org`).toLowerCase().trim();

        if (email === 'brandon.addison@orderofkpi.org') continue;

        if (fy27Paid && (firstName || lastName)) {
          const fullName = `${firstName} ${lastName}`.trim();

          // Match with local directory member if exists
          const matchedDirMember = dirMembers.find(m => 
            m.email.toLowerCase() === email || 
            m.name.toLowerCase() === fullName.toLowerCase()
          );

          activeFinancialMembers.push({
            name: fullName,
            first_name: firstName,
            email: email,
            role: matchedDirMember?.role || 'member',
            title: matchedDirMember?.title || '',
            is_first_login: false,
            intake_class: matchedDirMember?.intake_class || 'Member',
            financial_status: 'active',
            profile_photo: matchedDirMember?.profile_photo || '',
            industry: matchedDirMember?.industry || ''
          });
        }
      }

      // Also merge any active members from directory that might not be in the spreadsheet yet (e.g. newly provisioned active members)
      for (const dm of dirMembers) {
        if ((dm.financial_status || '').toLowerCase() === 'active') {
          const emailNorm = (dm.email || '').toLowerCase().trim();
          if (emailNorm === 'brandon.addison@orderofkpi.org') continue;
          if (!activeFinancialMembers.some(m => m.email.toLowerCase() === emailNorm)) {
            activeFinancialMembers.push(dm);
          }
        }
      }

      // Enforce strict syntax logic: Membership = "Member" and Financial Status = "Active"
      const finalRoster = activeFinancialMembers.filter(m => {
        const role = (m.role || '').toLowerCase();
        const title = (m.title || '').toLowerCase();
        const isMem = role !== 'applicant' && role !== 'prospective' && role !== 'candidate' && title !== 'candidate';
        const isFinActive = (m.financial_status || '').toLowerCase() === 'active';
        return isMem && isFinActive;
      });

      setMembers(finalRoster);
    } catch (err: any) {
      console.error('Error fetching financial members:', err);
      // Fallback to active financial members in API directory
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members.filter((m: Member) => {
            const role = (m.role || '').toLowerCase();
            const title = (m.title || '').toLowerCase();
            const isMem = role !== 'applicant' && role !== 'prospective' && role !== 'candidate' && title !== 'candidate';
            return isMem && (m.financial_status || '').toLowerCase() === 'active' && m.email.toLowerCase() !== 'brandon.addison@orderofkpi.org';
          }));
        }
      } catch (fallbackErr) {
        setError('Roster Data not yet available.');
      }
    } finally {
      setIsLoading(false);
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
              <Users size={14} /> Financial Membership Roster
            </div>
            <Link to="/gantt-chart" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <LayoutList size={14} /> Intake Plan
            </Link>
            <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
              <Users size={14} /> Access Directory
            </Link>
          </div>
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
          <h1 className="text-4xl md:text-6xl font-display text-[#1E3F20] tracking-wider uppercase text-center max-w-4xl">
            Financial Membership Roster
          </h1>
          <p className="text-[#1E3F20]/70 text-sm mt-3 max-w-xl font-medium">
            Active Members in good financial standing (Membership = &ldquo;Member&rdquo; &amp; Financial Status = &ldquo;Active&rdquo;).
          </p>
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
                <div className="flex flex-wrap gap-1.5 mb-4 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                    Member
                  </span>
                  {isOfficer(member) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/20 text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                      Officer
                    </span>
                  )}
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
