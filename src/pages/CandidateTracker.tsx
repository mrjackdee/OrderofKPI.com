import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send
} from 'lucide-react';
import { Candidate } from '../types';

const STAGES: Candidate['status'][] = ['Inquiry', 'Applied', 'Tea Time', 'Interview', 'Selection', 'Intake'];

export default function CandidateTracker() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        setNewCandidate({ name: '', email: '', phone: '' });
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
    }
  };

  const updateCandidateStatus = async (id: string, newStatus: Candidate['status']) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;

    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...candidate, status: newStatus }),
      });
      if (response.ok) {
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error updating candidate:', error);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inquiry': return 'bg-blue-100 text-blue-800';
      case 'Applied': return 'bg-yellow-100 text-yellow-800';
      case 'Tea Time': return 'bg-purple-100 text-purple-800';
      case 'Interview': return 'bg-orange-100 text-orange-800';
      case 'Selection': return 'bg-green-100 text-green-800';
      case 'Intake': return 'bg-ivy text-cream';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-12">
      <div className="bg-ivy py-12 px-4 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-display text-cream mb-2">Candidate Tracker</h1>
            <p className="text-cream/70 font-body">Manage and monitor the FY27 Membership Intake Process.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gold text-ivy px-6 py-3 rounded-md font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            Add Candidate
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="mb-8 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ivy/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-ivy/10 rounded-lg shadow-soft focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none transition-all"
          />
        </div>

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
          {STAGES.map(stage => (
            <div key={stage} className="min-w-[320px] flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-ivy">{stage}</h2>
                  <span className="bg-ivy/10 text-ivy px-2 py-0.5 rounded-full text-xs font-bold">
                    {filteredCandidates.filter(c => c.status === stage).length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 min-h-[400px]">
                {filteredCandidates.filter(c => c.status === stage).map(candidate => (
                  <motion.div
                    key={candidate.id}
                    layoutId={candidate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-lg border border-gold/20 shadow-soft hover:border-gold transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-display text-lg text-ivy">{candidate.name}</h3>
                      <div className="relative group/menu">
                        <button className="text-ivy/20 hover:text-ivy transition-colors p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gold/20 rounded-md shadow-lg opacity-0 group-hover/menu:opacity-100 transition-opacity z-10 hidden group-hover/menu:block">
                          {STAGES.filter(s => s !== stage).map(s => (
                            <button
                              key={s}
                              onClick={() => updateCandidateStatus(candidate.id, s)}
                              className="w-full text-left px-4 py-2 text-xs text-ivy hover:bg-cream transition-colors first:rounded-t-md last:rounded-b-md"
                            >
                              Move to {s}
                            </button>
                          ))}
                          <button
                            onClick={() => updateCandidateStatus(candidate.id, 'Rejected')}
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Reject Candidate
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-ivy/60 text-xs">
                        <Mail className="w-3 h-3" />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ivy/60 text-xs">
                        <Phone className="w-3 h-3" />
                        <span>{candidate.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-ivy/60 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>Applied: {new Date(candidate.application_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-cream">
                      <div className="flex -space-x-2">
                        {/* Placeholder for reviewer avatars */}
                        <div className="w-6 h-6 rounded-full bg-ivy border-2 border-white flex items-center justify-center text-[10px] text-cream font-bold">JD</div>
                        <div className="w-6 h-6 rounded-full bg-gold border-2 border-white flex items-center justify-center text-[10px] text-ivy font-bold">BS</div>
                      </div>
                      <button className="text-xs font-bold text-ivy hover:text-gold transition-colors flex items-center gap-1">
                        View Dossier
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {filteredCandidates.filter(c => c.status === stage).length === 0 && (
                  <div className="border-2 border-dashed border-ivy/5 rounded-lg h-32 flex items-center justify-center">
                    <p className="text-ivy/20 text-xs font-bold uppercase tracking-widest">No candidates</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-lg shadow-2xl border-gold/30 border p-8"
          >
            <h2 className="text-2xl font-display text-ivy mb-6">Add New Candidate</h2>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Full Name</label>
                <input
                  required
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Email Address</label>
                <input
                  required
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                  placeholder="candidate@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ivy/60 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-ivy/10 rounded-md focus:ring-2 focus:ring-ivy/20 focus:border-ivy outline-none"
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-ivy/10 rounded-md font-bold uppercase tracking-widest text-ivy hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-ivy text-cream rounded-md font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Create Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
