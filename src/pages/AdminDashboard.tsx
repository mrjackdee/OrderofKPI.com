import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  RefreshCcw, 
  AlertCircle,
  FileText,
  Download,
  Trash2,
  Users,
  CalendarDays,
  UserPlus,
  Key,
  Activity,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  History,
  GraduationCap,
  ChevronRight,
  Database,
  ArrowRight,
  Settings,
  Edit2
} from 'lucide-react';
import { Member } from '../types';

interface SystemLog {
  id?: number;
  timestamp: string;
  email: string;
  event_type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'revisions' | 'users' | 'logs' | 'intake'>('users');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Member Edit Modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchMembers();
    
    // Bylaw Revisions
    const qRevisions = query(collection(db, 'revisions'));
    const unsubRevisions = onSnapshot(qRevisions, (snap) => {
      setRevisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Real-time Logs Stream
    const eventSource = new EventSource('/api/admin/logs/stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setSystemLogs(data.data);
      } else {
        setSystemLogs(prev => [data, ...prev].slice(0, 100));
      }
    };

    return () => {
      unsubRevisions();
      eventSource.close();
    };
  }, []);

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

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.email || !editingMember?.name || !editingMember?.role) return;

    setActionLoading(true);
    try {
      const url = isNewMember ? '/api/members' : `/api/members/${editingMember.email}`;
      const method = isNewMember ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': sessionStorage.getItem('userEmail') || 'admin'
        },
        body: JSON.stringify(editingMember),
      });

      if (response.ok) {
        setShowMemberModal(false);
        fetchMembers();
      }
    } catch (error) {
      console.error('Error saving member:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMember = async (email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the directory?`)) return;
    
    try {
      const response = await fetch(`/api/members/${email}`, {
        method: 'DELETE',
        headers: { 'x-user-email': sessionStorage.getItem('userEmail') || 'admin' }
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar / Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gold/20 shadow-soft overflow-hidden sticky top-8">
              <div className="p-6 bg-ivy">
                <h1 className="text-xl font-display text-cream flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  Admin Console
                </h1>
              </div>
              <div className="p-2 flex flex-col">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'users' ? 'bg-ivy text-cream' : 'text-ivy/60 hover:bg-cream hover:text-ivy'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Directory
                </button>
                <button
                  onClick={() => setActiveTab('intake')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'intake' ? 'bg-ivy text-cream' : 'text-ivy/60 hover:bg-cream hover:text-ivy'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Intake Ops
                </button>
                <button
                  onClick={() => setActiveTab('revisions')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'revisions' ? 'bg-ivy text-cream' : 'text-ivy/60 hover:bg-cream hover:text-ivy'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bylaw Revs
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'logs' ? 'bg-ivy text-cream' : 'text-ivy/60 hover:bg-cream hover:text-ivy'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  System Logs
                </button>
              </div>
            </div>

              <div className="mt-6 space-y-3">
                <Link to="/candidate-tracker" className="flex items-center justify-between p-4 bg-gold text-ivy rounded-lg font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shadow-lg">
                  Candidate Tracker <ArrowRight className="w-3 h-3" />
                </Link>
                <Link to="/review-applications" className="flex items-center justify-between p-4 bg-ivy text-cream border border-gold/30 rounded-lg font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shadow-lg">
                  Member Applications <ArrowRight className="w-3 h-3" />
                </Link>
                <Link to="/selection-voting" className="flex items-center justify-between p-4 bg-ivy text-cream rounded-lg font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shadow-lg">
                  Selection Voting <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display text-ivy">Member Directory Management</h2>
                  <button
                    onClick={() => {
                      setIsNewMember(true);
                      setEditingMember({ role: 'member', financial_status: 'inactive' });
                      setShowMemberModal(true);
                    }}
                    className="bg-ivy text-cream px-6 py-2 rounded-md font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Add Member
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-gold/20 shadow-soft overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-cream border-b border-gold/10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ivy/40">Member</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ivy/40">Role/Title</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ivy/40">Intake Class</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ivy/40">Financial</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-ivy/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream">
                      {members.map(member => (
                        <tr key={member.email} className="hover:bg-cream/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-ivy/5 flex items-center justify-center">
                                <Users className="w-4 h-4 text-gold" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-ivy">{member.name}</p>
                                <p className="text-[10px] text-ivy/40">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <p className="font-bold text-gold uppercase tracking-widest">{member.role}</p>
                            <p className="text-ivy/60">{member.title || '-'}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-ivy">
                            {member.intake_class || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                              member.financial_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {member.financial_status || 'inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setIsNewMember(false);
                                  setEditingMember(member);
                                  setShowMemberModal(true);
                                }}
                                className="p-2 text-ivy/40 hover:text-ivy transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMember(member.email)}
                                className="p-2 text-ivy/40 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'intake' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-lg border border-gold/20 shadow-soft">
                    <History className="w-10 h-10 text-gold mb-6" />
                    <h3 className="text-xl font-display text-ivy mb-2">Active Intake Pipeline</h3>
                    <p className="text-sm text-ivy/60 mb-6">Monitor candidates from inquiry through intake in real-time.</p>
                    <Link to="/candidate-tracker" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-widest text-xs hover:text-gold transition-colors">
                      Go to Pipeline <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="bg-white p-8 rounded-lg border border-gold/20 shadow-soft">
                    <ShieldCheck className="w-10 h-10 text-gold mb-6" />
                    <h3 className="text-xl font-display text-ivy mb-2">Selection Committee Portal</h3>
                    <p className="text-sm text-ivy/60 mb-6">Secure portal for financial members to review dossiers and cast selection votes.</p>
                    <Link to="/selection-voting" className="inline-flex items-center gap-2 text-ivy font-bold uppercase tracking-widest text-xs hover:text-gold transition-colors">
                      Enter Voting Portal <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-ivy p-8 rounded-lg shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-display text-cream mb-2">Financial Roster Sync</h3>
                    <p className="text-cream/70 text-sm mb-6 max-w-lg">Automate member financial status updates by syncing with the official Google Sheets roster.</p>
                    <button className="bg-gold text-ivy px-8 py-3 rounded-md font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" /> Sync Records Now
                    </button>
                  </div>
                  <Database className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-cream/5 rotate-12" />
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-white rounded-lg border border-gold/20 shadow-soft overflow-hidden">
                <div className="p-4 bg-cream border-b border-gold/10 flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-ivy">System Activity Logs</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-ivy/40 uppercase tracking-widest">Live Stream</span>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto divide-y divide-cream">
                  {systemLogs.map((log, idx) => (
                    <div key={idx} className="p-4 flex gap-4 items-start hover:bg-cream/30 transition-colors">
                      <div className="shrink-0 w-24">
                        <p className="text-[10px] font-mono text-ivy/40">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                            log.severity === 'error' ? 'bg-red-100 text-red-700' : 
                            log.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 
                            'bg-ivy/10 text-ivy'
                          }`}>
                            {log.event_type}
                          </span>
                          <span className="text-[10px] text-ivy/40">{log.email}</span>
                        </div>
                        <p className="text-xs text-ivy/80">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-ivy/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-lg shadow-2xl border-gold/30 border overflow-hidden"
          >
            <div className="p-6 bg-ivy flex justify-between items-center">
              <h2 className="text-2xl font-display text-cream">{isNewMember ? 'Add Member' : 'Edit Member'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="text-cream/60 hover:text-cream">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMember} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    value={editingMember?.name || ''}
                    onChange={e => setEditingMember({...editingMember!, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Email Address</label>
                  <input
                    required
                    disabled={!isNewMember}
                    type="email"
                    value={editingMember?.email || ''}
                    onChange={e => setEditingMember({...editingMember!, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none disabled:bg-cream"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Role</label>
                  <select
                    value={editingMember?.role || 'member'}
                    onChange={e => setEditingMember({...editingMember!, role: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none bg-white"
                  >
                    <option value="member">Member</option>
                    <option value="officer">Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Official Title</label>
                  <input
                    type="text"
                    value={editingMember?.title || ''}
                    onChange={e => setEditingMember({...editingMember!, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Grammateus"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Intake Class</label>
                  <input
                    type="text"
                    value={editingMember?.intake_class || ''}
                    onChange={e => setEditingMember({...editingMember!, intake_class: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Fall '24"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Financial Status</label>
                  <select
                    value={editingMember?.financial_status || 'inactive'}
                    onChange={e => setEditingMember({...editingMember!, financial_status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Big Member</label>
                  <input
                    type="text"
                    value={editingMember?.big_member || ''}
                    onChange={e => setEditingMember({...editingMember!, big_member: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Little Member</label>
                  <input
                    type="text"
                    value={editingMember?.little_member || ''}
                    onChange={e => setEditingMember({...editingMember!, little_member: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Industry</label>
                  <input
                    type="text"
                    value={editingMember?.industry || ''}
                    onChange={e => setEditingMember({...editingMember!, industry: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. Technology"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Graduation Year</label>
                  <input
                    type="text"
                    value={editingMember?.grad_year || ''}
                    onChange={e => setEditingMember({...editingMember!, grad_year: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="e.g. 2024"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ivy/40 mb-2">Profile Photo URL</label>
                  <input
                    type="text"
                    value={editingMember?.profile_photo || ''}
                    onChange={e => setEditingMember({...editingMember!, profile_photo: e.target.value})}
                    className="w-full px-4 py-2 border border-gold/20 rounded-md focus:ring-2 focus:ring-gold/20 outline-none"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 px-8 py-3 border border-gold/20 rounded-md font-bold uppercase tracking-widest text-xs hover:bg-cream transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-8 py-3 bg-ivy text-cream rounded-md font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Member Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
