import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, CalendarDays } from 'lucide-react';

const rosterData = [
  { id: 1, name: "Deshaun Safford", chapter: "National", status: "Active", email: "deshaun.safford@orderofkpi.org", role: "Member", paymentDate: "6/22/2025" },
  { id: 2, name: "Brian Johnson", chapter: "National", status: "Active", email: "brian.johnson@orderofkpi.org", role: "Member", paymentDate: "7/10/2025" },
  { id: 3, name: "Ishmeal Allensworth", chapter: "National", status: "Active", email: "ishmeal.allensworth@orderofkpi.org", role: "Member", paymentDate: "7/29/2025" },
  { id: 4, name: "Edward Cook", chapter: "National", status: "Active", email: "edward.cook@orderofkpi.org", role: "Member", paymentDate: "8/17/2025" },
  { id: 5, name: "Darron Jenkins", chapter: "National", status: "Active", email: "darron.jenkins@orderofkpi.org", role: "Member", paymentDate: "8/17/2025" },
  { id: 6, name: "James Haywood Jr", chapter: "National", status: "Active", email: "james.haywood@orderofkpi.org", role: "Member", paymentDate: "8/26/2025" },
  { id: 7, name: "Dameone Ferguson", chapter: "National", status: "Active", email: "dameone.ferguson@orderofkpi.org", role: "Member", paymentDate: "8/27/2025" },
  { id: 8, name: "Brian Goings", chapter: "National", status: "Active", email: "brian.goings@orderofkpi.org", role: "Member", paymentDate: "8/29/2025" },
  { id: 9, name: "Keith Woods", chapter: "National", status: "Active", email: "keith.woods@orderofkpi.org", role: "Member", paymentDate: "8/31/2025" },
  { id: 10, name: "Dominic Goodman", chapter: "National", status: "Active", email: "dominic.goodman@orderofkpi.org", role: "Member", paymentDate: "1/18/2026" },
  { id: 11, name: "Jason Pilar", chapter: "National", status: "Active", email: "jason.pilar@orderofkpi.org", role: "Member", paymentDate: "1/21/2026" },
  { id: 12, name: "Brandon Owens", chapter: "National", status: "Active", email: "brandon.owens@orderofkpi.org", role: "Member", paymentDate: "2/1/2026" },
  { id: 13, name: "Jack Dee", chapter: "National", status: "Active", email: "jack.dee@orderofkpi.org", role: "Member", paymentDate: "2/1/2026" },
  { id: 14, name: "Anthony Jones", chapter: "National", status: "Active", email: "anthony.jones@orderofkpi.org", role: "Member", paymentDate: "3/4/2026" },
  { id: 15, name: "Donald Mitchell", chapter: "National", status: "Active", email: "donald.mitchell@orderofkpi.org", role: "Member", paymentDate: "3/15/2026" },
  { id: 16, name: "Kameron Whitfield", chapter: "National", status: "Active", email: "kameron.whitfield@orderofkpi.org", role: "Member", paymentDate: "3/15/2026" },
  { id: 17, name: "Tobias Bordley", chapter: "National", status: "Active", email: "tobias.bordley@orderofkpi.org", role: "Member", paymentDate: "3/27/2026" },
  { id: 18, name: "Denzel Talley", chapter: "National", status: "Active", email: "denzel.talley@orderofkpi.org", role: "Member", paymentDate: "5/28/2026" },
];

export default function FinancialRoster() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lastName' | 'firstName' | 'paymentDate'>('lastName');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  const filteredRoster = rosterData.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.chapter.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'lastName') {
      const lastA = a.name.split(' ').pop() || '';
      const lastB = b.name.split(' ').pop() || '';
      return lastA.localeCompare(lastB);
    } else if (sortBy === 'firstName') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'paymentDate') {
      return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-20">
      
      {/* Member Navigation Tabs */}
      <div className="pt-24 px-6 md:px-12 flex justify-center md:justify-start gap-4">
        <Link to="/intake-calendar" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
          <CalendarDays size={14} /> Intake Calendar
        </Link>
        <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Users size={14} /> Financial Roster
        </div>
      </div>

      {/* Header Section */}
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
          <h1 className="text-4xl md:text-6xl font-serif text-[#1E3F20] tracking-wider mb-4 uppercase text-center max-w-4xl">
            Financial Roster
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            <p className="text-sm md:text-lg text-[#B8860B] font-medium tracking-[0.1em] md:tracking-[0.2em] uppercase">
              Official registry for 2025-2026
            </p>
            <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
          </div>
        </motion.div>
      </div>

      <div className="w-full max-w-2xl mx-auto mb-10 px-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 pl-0 flex items-center pointer-events-none">
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
          <option value="paymentDate">Sort by Payment Date</option>
        </select>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRoster.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-[#B8860B] rounded-xl p-5 shadow-[0_8px_20px_rgba(30,63,32,0.08)] relative hover:-translate-y-1 transition-transform duration-300"
            >
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FDFCF0] border border-[#B8860B]/30 flex items-center justify-center">
                  <Users size={20} className="text-[#1E3F20]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E3F20]/10 border border-[#1E3F20]/20 text-[9px] font-black uppercase tracking-widest text-[#1E3F20]">
                  <CheckCircle2 size={10} /> {member.status}
                </span>
              </div>

              <h3 className="text-[#1E3F20] font-bold text-lg mb-1">{member.name}</h3>
              <div className="flex items-center gap-2 text-[#B8860B] text-[10px] font-black uppercase tracking-widest mb-4">
                <span>{member.chapter} Chapter</span>
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
                  <span className="text-[11px] truncate text-[#B8860B] font-semibold">FY 26 Dues Paid: {member.paymentDate}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredRoster.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="text-[#1E3F20]/20 mx-auto mb-4" />
            <h3 className="text-[#1E3F20] text-lg font-bold mb-2">No members found</h3>
            <p className="text-[#1E3F20]/60 text-sm">Adjust your search criteria to find members.</p>
          </div>
        )}
      </div>
    </div>
  );
}
