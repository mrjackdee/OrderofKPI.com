import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical,
  ChevronRight,
  GraduationCap,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Camera,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Member } from '../types';
import { syncApplicationsFromFirestore } from '../lib/memberDb';

export default function MemberDirectory() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
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

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members');
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const name = member.name || '';
    const email = member.email || '';
    const title = member.title || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesClass = selectedClass === 'all' || member.intake_class === selectedClass;

    return matchesSearch && matchesRole && matchesClass;
  });

  const intakeClasses = Array.from(new Set(members.map(m => m.intake_class).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-cream pb-12 w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="bg-ivy py-16 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display text-cream mb-4"
          >
            Access Directory
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-cream/80 max-w-2xl mx-auto font-body"
          >
            List of All users with Login access.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-soft border-gold/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-ivy/10 rounded-md bg-white text-ivy outline-none"
              >
                <option value="all">All Roles</option>
                <option value="officer">Officers</option>
                <option value="admin">Admins</option>
                <option value="member">Members</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.email}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border-gold/30 border shadow-soft overflow-hidden group hover:border-gold transition-all"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-cream border border-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                    {member.profile_photo ? (
                      <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-display text-ivy truncate mb-1">
                      {member.name}
                    </h3>
                    <p className="text-gold font-semibold text-sm uppercase tracking-wider mb-2">
                      {member.title || (member.role === 'admin' ? 'Administrator' : member.role)}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[9px] font-black uppercase tracking-widest text-green-700">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Member
                      </span>
                      {isOfficer(member) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] font-black uppercase tracking-widest text-[#B8860B]">
                          Officer
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-ivy/60 text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-cream grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivy/40 font-bold mb-1">Membership</p>
                    <div className="flex items-center gap-1 text-ivy">
                      <History className="w-3 h-3 text-gold" />
                      <span className="text-sm font-medium">Member</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-ivy/40 font-bold mb-1">Financial Status</p>
                    <div className="flex items-center gap-1">
                      {member.financial_status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-sm font-medium text-red-500">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && !loading && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gold/20 mx-auto mb-4" />
            <h3 className="text-xl font-display text-ivy">No members found</h3>
            <p className="text-ivy/60">Try adjusting your search or filter settings.</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
          </div>
        )}
      </div>
    </div>
  );
}
