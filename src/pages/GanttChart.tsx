import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Users, 
  LayoutList, 
  SlidersHorizontal, 
  Calculator, 
  Layers, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ChevronRight, 
  HelpCircle,
  RefreshCw,
  Award,
  Edit2,
  Calendar,
  X,
  Check,
  Play
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

// Define the PMI Task structure
interface PMITask {
  wbs: string;
  title: string;
  phase: 'Initiation' | 'Planning' | 'Execution' | 'Monitoring & Controlling' | 'Closing';
  offsetFromFinish: number; // Offset in days from the finish date (2027-01-15)
  duration: number; // in days
  owner: string;
  predecessor: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  progress: number; // 0 to 100
  pmiRationale: string; // PMI methodology description
}

const initialPmiTasks: PMITask[] = [
  // Phase 1: Initiation
  { 
    wbs: '1.1', 
    title: 'Inquire Within Campaign', 
    phase: 'Initiation', 
    offsetFromFinish: -196, 
    duration: 1, 
    owner: 'Membership Chair', 
    predecessor: 'None', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Initiation Phase: Identifies stakeholders and aligns expectations. The initial solicitation of interest gauges the general candidate pool capacity.'
  },
  { 
    wbs: '1.2', 
    title: 'Interest Meeting (Public)', 
    phase: 'Initiation', 
    offsetFromFinish: -180, 
    duration: 1, 
    owner: 'Basileus', 
    predecessor: '1.1', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Initiation Phase: Formulates initial project scope with key external stakeholders, outlining basic requirements and mutual expectations.'
  },
  
  // Phase 2: Planning
  { 
    wbs: '2.1', 
    title: 'Tea Time Informational Period', 
    phase: 'Planning', 
    offsetFromFinish: -173, 
    duration: 7, 
    owner: 'Membership Chair', 
    predecessor: '1.2', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Planning Phase: Represents progressive elaboration. Detail-gathering sessions clarify objectives, timelines, and legal covenants.'
  },
  { 
    wbs: '2.2', 
    title: 'Provide Application Materials', 
    phase: 'Planning', 
    offsetFromFinish: -166, 
    duration: 1, 
    owner: 'Grammateus', 
    predecessor: '2.1', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Planning Phase: Finalizes formal procurement/submission documents. Establishes the structural evaluation framework.'
  },
  { 
    wbs: '2.3', 
    title: 'Formal Application Due Date', 
    phase: 'Planning', 
    offsetFromFinish: -161, 
    duration: 1, 
    owner: 'Pecunious Grammateus', 
    predecessor: '2.2', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Planning Phase: Key constraint milestone. Verifies compliance and financial eligibility gates before advancing to implementation.'
  },
  
  // Phase 3: Execution
  { 
    wbs: '3.1', 
    title: 'Send Interview Invitation Emails', 
    phase: 'Execution', 
    offsetFromFinish: -159, 
    duration: 1, 
    owner: 'Epistoleus', 
    predecessor: '2.3', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Execution Phase: Coordinates communication plan delivery, alerting candidates and scheduling panel evaluators.'
  },
  { 
    wbs: '3.2', 
    title: 'Conduct Candidate Interviews', 
    phase: 'Execution', 
    offsetFromFinish: -156, 
    duration: 4, 
    owner: 'Membership Committee', 
    predecessor: '3.1', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Execution Phase: Performs core stakeholder analysis. Gathers qualitative evaluations against standardized scoring metrics.'
  },
  { 
    wbs: '3.3', 
    title: 'Interview Video Reviews', 
    phase: 'Execution', 
    offsetFromFinish: -152, 
    duration: 5, 
    owner: 'Directorate', 
    predecessor: '3.2', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Execution Phase: Collaborative review loop. Ensures alignment with high ethical, leadership, and professional benchmarks.'
  },
  { 
    wbs: '3.4', 
    title: 'Financial Chapter Voting', 
    phase: 'Execution', 
    offsetFromFinish: -147, 
    duration: 1, 
    owner: 'Tamiouchos', 
    predecessor: '3.3', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Execution Phase: Formal stakeholder approval mechanism. Solidifies selected roster through corporate democratic consensus.'
  },
  { 
    wbs: '3.5', 
    title: 'Selection Notification Sent', 
    phase: 'Execution', 
    offsetFromFinish: -141, 
    duration: 1, 
    owner: 'Basileus', 
    predecessor: '3.4', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Execution Phase: Communicates scope decisions to candidates, onboarding selected resources into the final phase.'
  },
  { 
    wbs: '3.6', 
    title: 'Start Intake Training Program', 
    phase: 'Execution', 
    offsetFromFinish: -120, 
    duration: 1, 
    owner: 'Membership Chair', 
    predecessor: '3.5', 
    status: 'In Progress', 
    progress: 65,
    pmiRationale: 'Execution Phase: Resource onboarding and capability training. Activates the core instructional path to final delivery.'
  },

  // Phase 4: Monitoring & Controlling
  { 
    wbs: '4.1', 
    title: 'Initiate No Contact Period', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -141, 
    duration: 21, 
    owner: 'Hodegos', 
    predecessor: '3.5', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Monitoring & Controlling Phase: Risk mitigation strategy. Establishes a strict communication firewall to maintain integrity and prevent bias.'
  },
  { 
    wbs: '4.2', 
    title: 'First Chapter Payment Milestone', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -126, 
    duration: 1, 
    owner: 'Tamiouchos', 
    predecessor: '3.5', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Monitoring & Controlling Phase: Financial performance check. Validates budget constraints and processes raw funding receipts.'
  },
  { 
    wbs: '4.3', 
    title: 'A Splendid Affair Event', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -121, 
    duration: 1, 
    owner: 'Basileus', 
    predecessor: '4.2', 
    status: 'Completed', 
    progress: 100,
    pmiRationale: 'Monitoring & Controlling Phase: Quality assurance milestone. Reviews candidates’ civic acumen and social synergy in structured groups.'
  },
  { 
    wbs: '4.4', 
    title: 'Second Chapter Payment Milestone', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -96, 
    duration: 1, 
    owner: 'Tamiouchos', 
    predecessor: '3.6', 
    status: 'In Progress', 
    progress: 45,
    pmiRationale: 'Monitoring & Controlling Phase: Financial checkpoint. Assesses payment collection velocity to ensure overall project solvency.'
  },
  { 
    wbs: '4.5', 
    title: 'Sisterhood Development Weekend I', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -91, 
    duration: 3, 
    owner: 'Directorate', 
    predecessor: '4.4', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Monitoring & Controlling Phase: Team alignment and cohort cohesion quality audit. Reinforces structural culture guidelines.'
  },
  { 
    wbs: '4.6', 
    title: 'Third Chapter Payment Milestone', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -65, 
    duration: 1, 
    owner: 'Tamiouchos', 
    predecessor: '4.4', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Monitoring & Controlling Phase: Periodic compliance control. Verifies intermediate capital collection against planned cash flow.'
  },
  { 
    wbs: '4.7', 
    title: 'Ivy Heritage Weekend Celebration', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -63, 
    duration: 3, 
    owner: 'Membership Committee', 
    predecessor: '4.6', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Monitoring & Controlling Phase: Milestone audit. Evaluates candidate organizational heritage retention and academic mastery.'
  },
  { 
    wbs: '4.8', 
    title: 'Fourth & Final Payment Milestone', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -35, 
    duration: 1, 
    owner: 'Tamiouchos', 
    predecessor: '4.6', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Monitoring & Controlling Phase: Budget finalization. Confirms that all financial obligations are closed out and cleared.'
  },
  { 
    wbs: '4.9', 
    title: 'Sisterhood Development Weekend II', 
    phase: 'Monitoring & Controlling', 
    offsetFromFinish: -35, 
    duration: 3, 
    owner: 'Directorate', 
    predecessor: '4.8', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Monitoring & Controlling Phase: Pre-initiation safety and readiness evaluation. Confirms alignment with constitutional mandates.'
  },

  // Phase 5: Closing
  { 
    wbs: '5.1', 
    title: 'Chapter Initiation Weekend Ceremony', 
    phase: 'Closing', 
    offsetFromFinish: 0, 
    duration: 3, 
    owner: 'Grand Chapter / Basileus', 
    predecessor: '4.9', 
    status: 'Not Started', 
    progress: 0,
    pmiRationale: 'Closing Phase: Project handover and celebratory closure. Formally transitions qualified candidates into full chapter status.'
  }
];

export default function GanttChart() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<PMITask[]>(initialPmiTasks);
  const [scheduleMode, setScheduleMode] = useState<'standard' | 'workback'>('workback');
  const [targetFinishDate, setTargetFinishDate] = useState<string>('2027-01-15');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('All');
  const [selectedTask, setSelectedTask] = useState<PMITask | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Editing form states
  const [editOwner, setEditOwner] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(1);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'Completed' | 'In Progress' | 'Not Started'>('Not Started');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle Preset Targets for Workback scheduling
  const applyPresetTarget = (dateStr: string) => {
    setTargetFinishDate(dateStr);
    setScheduleMode('workback');
  };

  // PMI Recalculation Engine
  const calculatedTasks = useMemo(() => {
    return tasks.map(task => {
      let startDate: Date;
      let endDate: Date;
      
      const baselineDateStr = scheduleMode === 'workback' ? targetFinishDate : '2027-01-15';
      const baseFinishDate = new Date(baselineDateStr);
      
      // Calculate Task End Date by shifting offset from the baseline date
      const taskEndDate = new Date(baseFinishDate);
      taskEndDate.setDate(taskEndDate.getDate() + task.offsetFromFinish + (task.duration - 1));
      
      // Calculate Task Start Date by working backwards by task duration
      const taskStartDate = new Date(taskEndDate);
      taskStartDate.setDate(taskStartDate.getDate() - task.duration + 1);
      
      startDate = taskStartDate;
      endDate = taskEndDate;
      
      return {
        ...task,
        calculatedStart: startDate,
        calculatedEnd: endDate
      };
    });
  }, [tasks, targetFinishDate, scheduleMode]);

  // Overall Statistics for PMI Status Dashboard
  const stats = useMemo(() => {
    const total = calculatedTasks.length;
    const completed = calculatedTasks.filter(t => t.status === 'Completed').length;
    const inProgress = calculatedTasks.filter(t => t.status === 'In Progress').length;
    const notStarted = calculatedTasks.filter(t => t.status === 'Not Started').length;
    
    // Average weighted progress
    const sumProgress = calculatedTasks.reduce((acc, t) => acc + t.progress, 0);
    const avgProgress = total > 0 ? Math.round(sumProgress / total) : 0;

    return { total, completed, inProgress, notStarted, avgProgress };
  }, [calculatedTasks]);

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return calculatedTasks.filter(task => {
      const matchesPhase = selectedPhaseFilter === 'All' || task.phase === selectedPhaseFilter;
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            task.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.wbs.includes(searchTerm);
      return matchesPhase && matchesSearch;
    });
  }, [calculatedTasks, selectedPhaseFilter, searchTerm]);

  // Dynamic Gantt Chart limits and coordinates
  const timelineBounds = useMemo(() => {
    if (calculatedTasks.length === 0) return { start: 0, end: 0, duration: 0 };
    
    // Find min start and max end across all calculated tasks
    const startTimes = calculatedTasks.map(t => t.calculatedStart.getTime());
    const endTimes = calculatedTasks.map(t => t.calculatedEnd.getTime());
    
    const minStart = Math.min(...startTimes) - (3 * 24 * 60 * 60 * 1000); // 3 days buffer
    const maxEnd = Math.max(...endTimes) + (3 * 24 * 60 * 60 * 1000); // 3 days buffer
    
    return {
      start: minStart,
      end: maxEnd,
      duration: maxEnd - minStart
    };
  }, [calculatedTasks]);

  const getPositionStyles = (start: Date, end: Date) => {
    const { start: timelineStart, duration } = timelineBounds;
    if (duration === 0) return { left: '0%', width: '0%' };
    
    const startTime = start.getTime();
    const endTime = end.getTime() + (24 * 60 * 60 * 1000); // inclusive
    
    let leftPercent = ((startTime - timelineStart) / duration) * 100;
    let widthPercent = ((endTime - startTime) / duration) * 100;
    
    // Cap limits
    if (leftPercent < 0) leftPercent = 0;
    if (widthPercent < 1.5) widthPercent = 1.5;
    if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  // Generate monthly interval labels for the Gantt timeline header
  const timelineMonths = useMemo(() => {
    const { start, end } = timelineBounds;
    if (start === 0 || end === 0) return [];
    
    const monthsList: { name: string; year: string; leftPercent: number }[] = [];
    const current = new Date(start);
    const endLimit = new Date(end);
    
    while (current <= endLimit) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const leftPercent = ((monthStart.getTime() - start) / (end - start)) * 100;
      
      if (leftPercent >= 0 && leftPercent <= 100) {
        monthsList.push({
          name: current.toLocaleDateString('en-US', { month: 'short' }),
          year: current.toLocaleDateString('en-US', { year: '2-digit' }),
          leftPercent
        });
      }
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return monthsList;
  }, [timelineBounds]);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle opening the details/edit modal
  const openEditModal = (task: PMITask) => {
    setSelectedTask(task);
    setEditOwner(task.owner);
    setEditDuration(task.duration);
    setEditProgress(task.progress);
    setEditStatus(task.status);
    setIsEditModalOpen(true);
  };

  // Save changes from the interactive editor
  const handleSaveTaskChanges = () => {
    if (!selectedTask) return;
    
    setTasks(prev => prev.map(t => {
      if (t.wbs === selectedTask.wbs) {
        return {
          ...t,
          owner: editOwner,
          duration: editDuration,
          progress: editProgress,
          status: editStatus
        };
      }
      return t;
    }));
    
    setIsEditModalOpen(false);
    setSelectedTask(null);
  };

  // Helper colors for PMI phases
  const getPhaseTheme = (phase: string) => {
    switch (phase) {
      case 'Initiation': 
        return { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', badge: 'bg-indigo-600', hoverBg: 'hover:bg-indigo-50/50' };
      case 'Planning': 
        return { bg: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-500', hoverBg: 'hover:bg-amber-50/50' };
      case 'Execution': 
        return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-[#1E3F20]', hoverBg: 'hover:bg-emerald-50/50' };
      case 'Monitoring & Controlling': 
        return { bg: 'bg-teal-50 border-teal-200 text-teal-700', badge: 'bg-teal-600', hoverBg: 'hover:bg-teal-50/50' };
      case 'Closing': 
        return { bg: 'bg-rose-50 border-rose-200 text-rose-700', badge: 'bg-[#D4AF37]', hoverBg: 'hover:bg-rose-50/50' };
      default: 
        return { bg: 'bg-gray-50 border-gray-200 text-gray-700', badge: 'bg-gray-600', hoverBg: 'hover:bg-gray-50/50' };
    }
  };

  return (
    <div id="pmi-planner-root" className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-24 relative overflow-hidden">
      {/* Draft Background Watermark */}
      <div id="watermark-container" className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.07]">
        <h1 className="text-[15rem] md:text-[25rem] font-black uppercase text-[#1E3F20] -rotate-45 select-none whitespace-nowrap">
          PMI Plan
        </h1>
      </div>

      <div id="main-content-scroller" className="relative z-10 w-full">
        <div className="pt-24">
          <MemberHeader />
        </div>

        {/* Member Navigation Tabs */}
        <div id="navigation-bar" className="pt-8 px-4 md:px-12 flex flex-wrap justify-center md:justify-start gap-3">
          <Link to="/intake-calendar" id="btn-nav-calendar" className="px-5 py-2.5 rounded-full border border-[#B8860B]/40 text-[#1E3F20] text-xs font-bold uppercase tracking-widest bg-white/40 hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2 shadow-sm">
            <CalendarDays size={14} /> Intake Calendar
          </Link>
          <Link to="/financial-roster" id="btn-nav-roster" className="px-5 py-2.5 rounded-full border border-[#B8860B]/40 text-[#1E3F20] text-xs font-bold uppercase tracking-widest bg-white/40 hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2 shadow-sm">
            <Users size={14} /> Financial Roster
          </Link>
          <div id="btn-nav-timeline" className="px-5 py-2.5 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md border-2 border-[#D4AF37]">
            <LayoutList size={14} /> Project Plan & Workback
          </div>
        </div>

        {/* Header Section */}
        <div id="header-text-block" className="pt-8 pb-4 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Briefcase className="text-[#1E3F20]" size={20} />
              <div className="h-0.5 w-12 bg-[#B8860B]" />
              <Award className="text-[#B8860B]" size={20} />
              <div className="h-0.5 w-12 bg-[#B8860B]" />
              <LayoutList className="text-[#1E3F20]" size={20} />
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-[#1E3F20] font-black tracking-wider uppercase">
              PMI Intake Project Plan
            </h1>
            <p className="text-xs md:text-sm text-[#B8860B] font-bold tracking-[0.25em] uppercase mt-2 max-w-2xl">
              Dynamic Workback & Retrograde Schedule Modeler
            </p>
          </motion.div>
        </div>

        {/* PMI Interactive Modeler Dashboard */}
        <div id="pmi-dashboard" className="max-w-[1240px] mx-auto px-4 md:px-8 mt-6">
          <div className="bg-[#122c14] border-2 border-[#D4AF37] rounded-3xl p-6 shadow-2xl text-white">
            <h2 className="text-lg font-serif font-bold tracking-widest uppercase mb-4 text-[#FFDF79] flex items-center gap-2">
              <SlidersHorizontal size={18} /> PMI Schedule Control Panel
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Selector to set Workback target or baseline */}
              <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#FFDF79] flex items-center gap-1.5">
                  <Calculator size={14} /> Schedule Planning Mode
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => setScheduleMode('standard')}
                    className={`py-2 px-3 text-2xs md:text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${
                      scheduleMode === 'standard' 
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-[#122c14] font-black' 
                        : 'bg-transparent border-white/20 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    Standard Base
                  </button>
                  <button
                    onClick={() => setScheduleMode('workback')}
                    className={`py-2 px-3 text-2xs md:text-xs font-black uppercase tracking-wider rounded-xl border-2 transition-all ${
                      scheduleMode === 'workback' 
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-[#122c14] font-black' 
                        : 'bg-transparent border-white/20 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    Workback Schedule
                  </button>
                </div>
                <div className="text-[10px] text-white/60 leading-normal mt-1">
                  {scheduleMode === 'workback' 
                    ? '✔ Backward schedule mode enabled: Changing the target completion date recalculates every predecessor milestone date retrogradely.' 
                    : '✔ Standard forward baseline active: Anchored on the statutory Jan 15, 2027 initiation weekend.'}
                </div>
              </div>

              {/* Date Input for Retrograde Workback */}
              <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#FFDF79] flex items-center gap-1.5">
                  <Calendar size={14} /> Go-Live Target Date (Ceremony)
                </label>
                <input
                  type="date"
                  value={targetFinishDate}
                  onChange={(e) => {
                    setTargetFinishDate(e.target.value);
                    setScheduleMode('workback');
                  }}
                  className="w-full bg-[#122c14] border-2 border-[#D4AF37]/50 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <div className="flex gap-2 justify-between mt-1">
                  <button 
                    onClick={() => applyPresetTarget('2027-01-15')}
                    className="text-[10px] font-bold text-[#FFDF79] hover:underline"
                  >
                    Winter '27 (Jan 15)
                  </button>
                  <button 
                    onClick={() => applyPresetTarget('2027-05-07')}
                    className="text-[10px] font-bold text-[#FFDF79] hover:underline"
                  >
                    Spring '27 (May 7)
                  </button>
                  <button 
                    onClick={() => applyPresetTarget('2027-10-15')}
                    className="text-[10px] font-bold text-[#FFDF79] hover:underline"
                  >
                    Fall '27 (Oct 15)
                  </button>
                </div>
              </div>

              {/* PMI Metrics/Stats summary row */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFDF79] flex items-center justify-center gap-1">
                    <TrendingUp size={11} /> PMI Complete
                  </div>
                  <div className="text-2xl font-serif font-black text-white mt-1">
                    {stats.avgProgress}%
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#D4AF37] h-full" style={{ width: `${stats.avgProgress}%` }} />
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFDF79] flex items-center justify-center gap-1">
                    <CheckCircle size={11} /> Milestone Status
                  </div>
                  <div className="text-2xl font-serif font-black text-[#D4AF37] mt-1">
                    {stats.completed}/{stats.total}
                  </div>
                  <div className="text-[9px] text-white/50 mt-2 uppercase tracking-wider font-semibold">
                    {stats.inProgress} Active, {stats.notStarted} Idle
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters, search and layout switcher */}
        <div id="controls-section" className="max-w-[1240px] mx-auto px-4 md:px-8 mt-6">
          <div className="bg-white border-2 border-[#B8860B]/30 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="w-full md:w-1/3 relative">
              <input
                type="text"
                placeholder="Search WBS deliverable, owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl py-2 pl-4 pr-10 text-xs font-semibold text-[#1E3F20] focus:border-[#B8860B] focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-[#B8860B]">
                🔍
              </span>
            </div>

            {/* PMI Process Group Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['All', 'Initiation', 'Planning', 'Execution', 'Monitoring & Controlling', 'Closing'].map((phase) => (
                <button
                  key={phase}
                  onClick={() => setSelectedPhaseFilter(phase)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedPhaseFilter === phase
                      ? 'bg-[#1E3F20] text-white border-2 border-[#1E3F20]'
                      : 'bg-[#FDFCF0] border border-[#B8860B]/30 text-[#1E3F20] hover:bg-[#B8860B]/10'
                  }`}
                >
                  {phase === 'Monitoring & Controlling' ? 'Monitoring' : phase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt Interactive Chart Display */}
        <div id="timeline-chart-section" className="max-w-[1240px] mx-auto px-4 md:px-8 mt-6">
          <div className="bg-white border-2 border-[#B8860B]/30 rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-[#122c14] border-b-2 border-[#D4AF37] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-md md:text-lg font-serif font-bold text-[#FFDF79] uppercase tracking-widest flex items-center gap-2">
                  <LayoutList size={16} /> Interactive Workback Timeline
                </h3>
                <p className="text-[10px] md:text-xs text-white/70">
                  Select any WBS task block to modify progress, adjust duration, or view its detailed PMI rationale.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-white/10 text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/20">
                {scheduleMode === 'workback' ? 'RECALCULATED RETROGRADE' : 'PLANNED STANDARD'}
              </span>
            </div>

            {/* Gantt Horizontal Render Window */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px] p-6">
                <div className="relative border border-[#B8860B]/20 rounded-2xl overflow-hidden bg-[#FDFCF0]/50 shadow-inner">
                  
                  {/* Gantt Header with Months & Grid Lines */}
                  <div className="flex border-b border-[#B8860B]/20 bg-[#FDFCF0] h-11 relative">
                    <div className="w-64 shrink-0 border-r border-[#B8860B]/20 p-3 font-black text-[#1E3F20] uppercase tracking-widest text-[10px] flex items-center">
                      WBS Deliverable
                    </div>
                    
                    <div className="flex-1 relative">
                      {/* Dynamic grid vertical lines inside header */}
                      {timelineMonths.map((m, idx) => (
                        <div 
                          key={idx} 
                          className="absolute top-0 bottom-0 border-l border-[#B8860B]/15 pl-2 pt-1.5"
                          style={{ left: `${m.leftPercent}%` }}
                        >
                          <span className="font-bold text-[#1E3F20] text-[10px] block leading-none">{m.name}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-[#B8860B] mt-0.5 block">{m.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gantt Task Rows */}
                  <div className="divide-y divide-[#B8860B]/10 relative">
                    {/* Vertical Grid lines spanning through rows */}
                    <div className="absolute inset-0 pl-64 pointer-events-none">
                      {timelineMonths.map((m, idx) => (
                        <div 
                          key={idx} 
                          className="absolute top-0 bottom-0 border-l border-[#B8860B]/5"
                          style={{ left: `${m.leftPercent}%` }}
                        />
                      ))}
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className="p-12 text-center text-[#1E3F20]/50 text-xs font-bold uppercase tracking-wider">
                        No tasks match your search or filter requirements.
                      </div>
                    ) : (
                      filteredTasks.map((task, idx) => {
                        const phaseTheme = getPhaseTheme(task.phase);
                        const pos = getPositionStyles(task.calculatedStart, task.calculatedEnd);
                        
                        return (
                          <div 
                            key={task.wbs} 
                            onClick={() => openEditModal(task)}
                            className="flex group hover:bg-[#1E3F20]/5 transition-colors cursor-pointer relative"
                          >
                            {/* Deliverable Metadata block */}
                            <div className="w-64 shrink-0 p-3 pl-4 border-r border-[#B8860B]/20 bg-white group-hover:bg-[#FDFCF0]/70 transition-colors z-10 flex flex-col justify-center">
                              <div className="text-2xs font-mono font-bold text-[#B8860B] uppercase tracking-wider flex items-center gap-1">
                                <span>{task.wbs}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${phaseTheme.badge}`} />
                                <span className="opacity-70">{task.phase}</span>
                              </div>
                              <div className="text-[11px] font-bold text-[#1E3F20] leading-tight mt-1 group-hover:text-[#B8860B] transition-colors flex items-center gap-1">
                                {task.title}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-white/20 text-[#1E3F20]/60 border border-[#B8860B]/20 truncate max-w-[120px]">
                                  👤 {task.owner}
                                </span>
                                <span className="text-[8px] font-mono text-[#1E3F20]/50">
                                  {task.duration} {task.duration === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            </div>

                            {/* Gantt visual bars container */}
                            <div className="flex-1 relative h-16 flex items-center px-2">
                              {/* Background gray guide bar */}
                              <div className="absolute inset-x-0 h-4 bg-gray-100/50 rounded-full pointer-events-none" />
                              
                              <motion.div
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.5, delay: idx * 0.03 }}
                                className={`absolute h-7 rounded-lg ${phaseTheme.badge} text-white shadow-md flex items-center justify-between px-3 overflow-hidden origin-left hover:brightness-110 border border-white/20`}
                                style={pos}
                                title={`${task.title} (${task.wbs}): ${formatDate(task.calculatedStart)} - ${formatDate(task.calculatedEnd)}`}
                              >
                                {/* Inner progress highlight */}
                                <div 
                                  className="absolute inset-y-0 left-0 bg-white/25 border-r border-white/10" 
                                  style={{ width: `${task.progress}%` }}
                                />
                                
                                <span className="text-[9px] font-black uppercase tracking-wider z-10 truncate drop-shadow-sm">
                                  {task.progress}%
                                </span>
                                <span className="text-[8px] font-mono z-10 opacity-90 hidden sm:inline-block">
                                  {formatDate(task.calculatedStart)}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Detailed List of Deliverables & PMI PMBOK Rationale */}
        <div id="pmi-task-details-list" className="max-w-[1240px] mx-auto px-4 md:px-8 mt-8">
          <div className="bg-white border-2 border-[#B8860B]/30 rounded-3xl p-6 shadow-md">
            <h2 className="text-xl font-serif font-bold text-[#1E3F20] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Layers className="text-[#B8860B]" size={20} /> PMI Work Breakdown Structure (WBS) Directory
            </h2>

            <div className="space-y-6">
              {['Initiation', 'Planning', 'Execution', 'Monitoring & Controlling', 'Closing'].map((phase) => {
                const phaseTasks = calculatedTasks.filter(t => t.phase === phase);
                if (phaseTasks.length === 0) return null;
                const theme = getPhaseTheme(phase);

                return (
                  <div key={phase} className="border border-[#B8860B]/20 rounded-2xl overflow-hidden shadow-sm">
                    {/* WBS Phase Header */}
                    <div className="bg-[#122c14]/5 border-b border-[#B8860B]/20 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${theme.badge}`} />
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-[#1E3F20]">
                          PMBOK Phase {phase}
                        </h3>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#1E3F20] text-white">
                        {phaseTasks.length} Deliverables
                      </span>
                    </div>

                    {/* WBS Task Rows inside phase */}
                    <div className="divide-y divide-gray-100">
                      {phaseTasks.map((task) => (
                        <div key={task.wbs} className="p-4 md:p-5 hover:bg-[#FDFCF0]/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-[#B8860B]">{task.wbs}</span>
                              <h4 className="font-bold text-[#1E3F20] text-xs md:text-sm">{task.title}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                task.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <p className="text-2xs text-[#1E3F20]/75 mt-1 leading-relaxed">
                              {task.pmiRationale}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-medium text-[#1E3F20]/60">
                              <span>👤 Owner: <strong className="text-[#1E3F20]">{task.owner}</strong></span>
                              <span>🔗 Predecessor: <strong className="text-[#1E3F20]">{task.predecessor}</strong></span>
                              <span>⏱ Duration: <strong className="text-[#1E3F20]">{task.duration} {task.duration === 1 ? 'day' : 'days'}</strong></span>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#B8860B] block">Computed Window</span>
                              <span className="text-xs font-mono font-bold text-[#1E3F20] block mt-0.5">
                                {formatDate(task.calculatedStart)} - {formatDate(task.calculatedEnd)}
                              </span>
                            </div>

                            <button
                              onClick={() => openEditModal(task)}
                              className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-transparent hover:bg-[#1E3F20] text-[#1E3F20] hover:text-white border border-[#1E3F20]/30 rounded-lg transition-all flex items-center gap-1"
                            >
                              <Edit2 size={10} /> Edit / Model
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Interactive PMI Modeling Modal (Drawer style dialog) */}
      <AnimatePresence>
        {isEditModalOpen && selectedTask && (
          <div id="pmi-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FDFCF0] border-2 border-[#D4AF37] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#122c14] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#D4AF37]">
                <div>
                  <span className="font-mono text-xs font-black text-[#FFDF79] tracking-widest uppercase">
                    WBS {selectedTask.wbs} • PMI Model Form
                  </span>
                  <h4 className="text-lg font-serif font-black uppercase tracking-wider mt-0.5">{selectedTask.title}</h4>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Rationale explanation */}
                <div className="bg-[#122c14]/5 border-l-4 border-[#D4AF37] p-3 rounded-r-xl">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#B8860B] block">PMBOK PMI Methodology Rationale</span>
                  <p className="text-[11px] text-[#1E3F20] mt-1 leading-relaxed">
                    {selectedTask.pmiRationale}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3F20] flex items-center gap-1">
                      👤 Role / Deliverable Owner
                    </label>
                    <select
                      value={editOwner}
                      onChange={(e) => setEditOwner(e.target.value)}
                      className="bg-white border-2 border-[#B8860B]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#1E3F20] focus:border-[#B8860B] focus:outline-none"
                    >
                      <option value="Basileus">Basileus (President)</option>
                      <option value="Membership Chair">Membership Chairman</option>
                      <option value="Membership Committee">Membership Committee</option>
                      <option value="Grammateus">Grammateus (Secretary)</option>
                      <option value="Pecunious Grammateus">Pecunious Grammateus</option>
                      <option value="Tamiouchos">Tamiouchos (Treasurer)</option>
                      <option value="Epistoleus">Epistoleus</option>
                      <option value="Hodegos">Hodegos</option>
                      <option value="Directorate">The Directorate</option>
                      <option value="Grand Chapter / Basileus">Grand Chapter / Basileus</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3F20] flex items-center gap-1">
                      ⏱ Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editDuration}
                      onChange={(e) => setEditDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-white border-2 border-[#B8860B]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#1E3F20] focus:border-[#B8860B] focus:outline-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3F20] flex items-center gap-1">
                      📋 Progress Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => {
                        const statusVal = e.target.value as any;
                        setEditStatus(statusVal);
                        if (statusVal === 'Completed') setEditProgress(100);
                        if (statusVal === 'Not Started') setEditProgress(0);
                      }}
                      className="bg-white border-2 border-[#B8860B]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#1E3F20] focus:border-[#B8860B] focus:outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Progress % */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3F20] flex items-center gap-1">
                        📈 Task Percent Complete
                      </label>
                      <span className="text-xs font-mono font-bold text-[#B8860B]">{editProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editProgress}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditProgress(val);
                        if (val === 100) setEditStatus('Completed');
                        else if (val === 0) setEditStatus('Not Started');
                        else setEditStatus('In Progress');
                      }}
                      className="w-full accent-[#1E3F20] cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Computational preview block */}
                <div className="bg-[#122c14] text-white p-4 rounded-2xl flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#FFDF79] block">Recalculated Calendar window</span>
                    <span className="text-sm font-mono font-bold mt-1 block">
                      {formatDate(new Date(new Date(targetFinishDate).setDate(new Date(targetFinishDate).getDate() + selectedTask.offsetFromFinish)))} - 
                      {formatDate(new Date(new Date(targetFinishDate).setDate(new Date(targetFinishDate).getDate() + selectedTask.offsetFromFinish + (editDuration - 1))))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#FFDF79] block">Total Duration</span>
                    <span className="text-sm font-mono font-bold mt-1 block">
                      {editDuration} {editDuration === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1E3F20] hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTaskChanges}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-widest bg-[#1E3F20] text-white hover:bg-[#122c14] rounded-xl transition-all shadow-md flex items-center gap-1"
                >
                  <Check size={14} /> Update Schedule
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
