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
  Send,
  X,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { Candidate } from '../types';
import { fetchAllApplications } from '../lib/memberDb';
import { generateApplicationPDF } from '../utils/pdfGenerator';
import { logPortalSectionAccess } from '../lib/auditLogger';

const STAGES: Candidate['status'][] = ['Inquiry', 'Applied', 'Tea Time', 'Interview', 'Selection', 'Intake'];

export default function CandidateTracker() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApplicationForView, setSelectedApplicationForView] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    logPortalSectionAccess('Candidate Tracker');
    fetchCandidates();
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetchAllApplications();
      if (res.success) {
        setApplications(res.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

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

  const currentUserEmail = sessionStorage.getItem('userEmail') || 'committee_chair@orderofkpi.org';

  const handleRemoveCandidate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove candidate "${name}" from the tracker?`)) return;

    try {
      const res = await fetch(`/api/candidates/${id}?chairEmail=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCandidates();
      }
    } catch (err) {
      console.error('Error removing candidate:', err);
    }
  };

  const updateCandidateStatus = async (id: string, newStatus: Candidate['status']) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;

    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...candidate, status: newStatus, reviewerEmail: currentUserEmail }),
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
                {filteredCandidates.filter(c => c.status === stage).map(candidate => {
                  const matchingApp = applications.find(a => a.email.toLowerCase() === candidate.email.toLowerCase());
                  const isSubmitted = matchingApp && matchingApp.status === 'submitted';
                  const isDraft = matchingApp && matchingApp.status === 'draft';

                  return (
                    <motion.div
                      key={candidate.id}
                      layoutId={candidate.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-5 rounded-lg border border-gold/20 shadow-soft hover:border-gold transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        {isSubmitted ? (
                          <button
                            onClick={() => setSelectedApplicationForView(matchingApp)}
                            className="font-display text-lg text-gold hover:text-ivy underline text-left cursor-pointer transition-colors"
                          >
                            {candidate.name}
                          </button>
                        ) : (
                          <h3 className="font-display text-lg text-ivy">{candidate.name}</h3>
                        )}
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
                              className="w-full text-left px-4 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              Mark as Rejected
                            </button>
                            <button
                              onClick={() => handleRemoveCandidate(candidate.id, candidate.name)}
                              className="w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50 font-bold transition-colors border-t border-gold/10 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Remove Candidate
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Application Status Badge */}
                      <div className="mb-3">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200/50 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Submitted
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3 text-amber-500" /> Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200/50 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3 text-gray-400" /> Not Started
                          </span>
                        )}
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
                          <span>
                            {(() => {
                              const submittedDate = matchingApp?.submitted_at || (isSubmitted ? candidate.application_date : (candidate.status !== 'Inquiry' ? candidate.application_date : null));
                              if (submittedDate) {
                                return `Applied: ${new Date(submittedDate).toLocaleDateString()}`;
                              }
                              return 'Applied: Pending Submission';
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-cream">
                        <div className="flex -space-x-2">
                          {/* Placeholder for reviewer avatars */}
                          <div className="w-6 h-6 rounded-full bg-ivy border-2 border-white flex items-center justify-center text-[10px] text-cream font-bold">JD</div>
                          <div className="w-6 h-6 rounded-full bg-gold border-2 border-white flex items-center justify-center text-[10px] text-ivy font-bold">BS</div>
                        </div>
                        {matchingApp ? (
                          <button 
                            onClick={() => setSelectedApplicationForView(matchingApp)}
                            className="text-[10px] font-bold text-ivy hover:text-gold transition-colors flex items-center gap-1 bg-gold/10 hover:bg-gold/20 px-2.5 py-1.5 rounded-lg border border-gold/20"
                          >
                            <FileText className="w-3.5 h-3.5 text-gold" />
                            View Application
                          </button>
                        ) : (
                          <button className="text-[10px] font-bold text-ivy/30 cursor-not-allowed flex items-center gap-1" disabled>
                            No Application
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
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

      {/* View Application Modal */}
      {selectedApplicationForView && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-cream w-full max-w-5xl rounded-2xl shadow-2xl border-gold/30 border overflow-hidden my-8 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-ivy p-6 md:p-8 flex justify-between items-center border-b border-gold/30">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-gold/15 border border-gold/30 rounded-full">
                  <ShieldCheck size={11} className="text-gold" />
                  <span className="text-[9px] font-bold text-cream uppercase tracking-widest">Membership Candidate Review</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-display text-cream">
                  {selectedApplicationForView.data.firstName} <span className="text-gold">{selectedApplicationForView.data.lastName}</span>
                </h2>
                <p className="text-cream/60 text-xs font-body">Submitted: {selectedApplicationForView.submitted_at ? new Date(selectedApplicationForView.submitted_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <button 
                onClick={() => setSelectedApplicationForView(null)}
                className="text-cream/60 hover:text-cream transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white px-8 py-4 border-b border-gold/10 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-ivy/60 uppercase tracking-wider">
                Status: 
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${
                  selectedApplicationForView.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedApplicationForView.status}
                </span>
              </div>
              <button
                onClick={() => generateApplicationPDF(selectedApplicationForView.data, selectedApplicationForView.email)}
                className="flex items-center gap-2 bg-gold text-ivy px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:brightness-110 active:scale-95 transition-all shadow cursor-pointer"
              >
                <FileText size={14} />
                Download Application PDF
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-8 space-y-8 overflow-y-auto font-body text-sm text-ivy/80">
              {/* Profile Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal & Employment Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Candidate Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">First Name</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.firstName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Last Name</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.lastName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Date of Birth</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Phone Number</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Email Address</span>
                      <span className="font-semibold text-ivy break-all">{selectedApplicationForView.email}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Address</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.address}</span>
                    </div>
                  </div>
                </div>

                {/* Professional & Academic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Professional & Academic</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Place of Employment</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.employment || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Title / Position</span>
                      <span className="font-semibold text-ivy">{selectedApplicationForView.data.position || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Degree(s) Conferred</span>
                      <span className="font-semibold text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.degrees || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Honors & Achievements</span>
                      <span className="font-semibold text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.honors || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Involvements & Disclosures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gold/10">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Community Involvement</h3>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ivy/40 block">Organization Involvement</span>
                    <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.organizations || 'None'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-ivy/40 block">Prior Knowledge of Kappa Pi</span>
                    <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.priorKnowledge || 'None'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Disclosures</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Fraternity Member?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.isFraternityMember}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Sorority AKA Family?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.hasAkaFamily}</span>
                    </div>
                    {selectedApplicationForView.data.isFraternityMember === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">Fraternity Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.fraternityDetails}</span>
                      </div>
                    )}
                    {selectedApplicationForView.data.hasAkaFamily === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">AKA Sorority Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.akaFamilyDetails}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-ivy/40 block">Previously Applied?</span>
                      <span className="font-semibold text-ivy capitalize">{selectedApplicationForView.data.previousApplied}</span>
                    </div>
                    {selectedApplicationForView.data.previousApplied === 'yes' && (
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-ivy/40 block">Previous Application Details</span>
                        <span className="text-ivy">{selectedApplicationForView.data.previousAppliedDetails}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-4 border-t border-gold/10">
                <span className="text-[10px] uppercase font-bold text-ivy/40 block">Social Media & Websites</span>
                <span className="text-ivy whitespace-pre-wrap">{selectedApplicationForView.data.socialUrls || 'None'}</span>
              </div>

              {/* Essay Questions Responses */}
              <div className="space-y-6 pt-6 border-t border-gold/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ivy pb-2 border-b border-gold/20">Written Essay Answers</h3>
                
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 1: Purpose of Kappa Pi</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay1 || 'Not provided'}</p>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 2: Community Role Model</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay2 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 3: Service Projects</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay3 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 4: Encouraging Self-Esteem & Involvement for Queer/Trans*</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay4 || 'Not provided'}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-gold/10 space-y-2">
                    <p className="text-xs font-bold text-ivy/70">Question 5: Talent Contributions</p>
                    <p className="text-ivy leading-relaxed whitespace-pre-wrap">{selectedApplicationForView.data.essay5 || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer buttons */}
            <div className="bg-white p-6 border-t border-gold/20 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedApplicationForView(null)}
                className="px-6 py-2.5 border border-ivy/20 rounded-xl font-semibold uppercase tracking-wider text-[11px] text-ivy hover:bg-cream transition-colors cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
