import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Users, Coffee, Edit3, ClipboardCheck, Mail, Video, 
  ThumbsUp, Star, Hand, Wallet, Shield, UserCheck, 
  Leaf, Download, CalendarDays, LayoutList, Calendar,
  AlertTriangle, CheckCircle2, Check, RefreshCw, LogOut, Plus, Flag
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { initAuth, googleSignIn, getAccessToken, logout as googleLogout } from '../lib/googleAuth';

export interface EventItem {
  step: number;
  title: string;
  date: string;
  time: string;
  category?: string;
  icon: any;
}

const events: EventItem[] = [
  { step: 1, title: 'Interest Meeting #1', date: '8/2/2026', time: '1:00 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 2, title: 'Interest Meeting #2', date: '8/3/2026', time: '9:08 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 3, title: 'Applications Distributed', date: 'After each interest meeting', time: 'Distributed to attendees', category: 'Applications & Scoring', icon: Mail },
  { step: 4, title: 'Applications Due', date: '8/7/2026', time: '12:00 PM (noon) ET', category: 'Applications & Scoring', icon: ClipboardCheck },
  { step: 5, title: 'Application Scoring', date: '8/7/2026 - 8/9/2026', time: 'Scoring period', category: 'Applications & Scoring', icon: Edit3 },
  { step: 6, title: 'Candidate Notifications & Tea Time Invites', date: '8/10/2026', time: 'Scoring removals & Tea Time invites', category: 'Applications & Scoring', icon: Star },
  { step: 7, title: 'Tea Time Period', date: '8/12/2026 - 8/16/2026', time: 'Tea Time period', category: 'Tea Time', icon: Coffee },
  { step: 8, title: 'Group Opens in Facebook', date: '8/12/2026 - 8/16/2026', time: 'Opens Aug 12 at 7:00 PM ET', category: 'Tea Time', icon: Users },
  { step: 9, title: 'Tea Time Zoom Call', date: '8/13/2026', time: '8:00 PM – 9:30 PM ET', category: 'Tea Time', icon: Video },
  { step: 10, title: 'Candidate Interviews', date: '8/19/2026 - 8/20/2026', time: 'Candidate interviews, 20 minutes each (times TBD)', category: 'Interviews & Review', icon: UserCheck },
  { step: 11, title: 'Makeup Interviews', date: '8/24/2026', time: 'Makeup interviews, if needed', category: 'Interviews & Review', icon: UserCheck },
  { step: 12, title: 'Interview Video Review', date: '8/21/2026 - 8/26/2026', time: 'Interview video review by active members (Fri, Aug 21 – 5:00 PM Wed, Aug 26)', category: 'Interviews & Review', icon: Video },
  { step: 13, title: 'MIP Voting Period', date: '8/26/2026 - 8/28/2026', time: 'MIP voting period', category: 'Voting & Next Steps', icon: ThumbsUp },
  { step: 14, title: 'Candidate Notifications', date: '8/28/2026', time: 'Candidate notifications', category: 'Voting & Next Steps', icon: Star },
  { step: 15, title: 'No Contact Period Begins', date: '8/31/2026', time: 'No contact period begins / hand off to Dean', category: 'Voting & Next Steps', icon: Hand },
  { step: 16, title: 'First Initiation Payment Due', date: '9/11/2026', time: 'First initiation payment due from candidates for membership', category: 'Voting & Next Steps', icon: Wallet },
];

const deanEvents: EventItem[] = [
  { step: 1, title: 'Chapter Notification & Nominations Open', date: '8/7/2026', time: 'Chapter notification of Dean process and opening of nomination submissions', icon: Mail },
  { step: 2, title: 'Dean Nominations Accepted', date: '8/10/2026 - 8/12/2026', time: 'Closes 9:08 PM ET on August 12', icon: Edit3 },
  { step: 3, title: 'Special Meeting', date: '8/16/2026', time: '7:00 PM ET', icon: Users },
  { step: 4, title: 'Dean Team Voting', date: '8/17/2026 - 8/19/2026', time: 'Dean team voting', icon: ThumbsUp },
  { step: 5, title: 'Announcement of Dean', date: '8/20/2026', time: 'Announcement of Dean', icon: Star },
  { step: 6, title: 'Dean Selects Assistant Dean & Team', date: '8/24/2026 - 8/26/2026', time: 'Dean selects Assistant Dean of Pledges and Dean team', icon: UserCheck },
  { step: 7, title: 'Dean Team Announcement', date: '8/28/2026', time: 'Dean team announcement', icon: Shield },
  { step: 8, title: 'Dean Process Begins', date: '8/31/2026', time: 'Dean process begins', icon: Flag },
];

export interface EventStatus {
  isPassed: boolean;
  isToday: boolean;
  isUpcoming: boolean;
  statusLabel: 'Completed' | 'Today' | 'Upcoming';
}

export const getEventDateRange = (dateStr: string): { startDate: Date; endDate: Date } => {
  if (dateStr.toLowerCase().includes('after each interest meeting')) {
    // Interest meetings conclude Aug 3, 2026
    const start = new Date(2026, 7, 3, 0, 0, 0, 0);
    const end = new Date(2026, 7, 3, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  const parts = dateStr.split('-').map(s => s.trim());
  
  const parseSingleDate = (str: string, isEndOfDay: boolean): Date => {
    const match = str.match(/(\d+)\/(\d+)\/(\d+)/);
    if (match) {
      const m = parseInt(match[1], 10) - 1;
      const d = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (isEndOfDay) {
        return new Date(y, m, d, 23, 59, 59, 999);
      }
      return new Date(y, m, d, 0, 0, 0, 0);
    }
    return new Date();
  };

  const startDate = parseSingleDate(parts[0], false);
  const endDate = parts.length > 1 ? parseSingleDate(parts[1], true) : parseSingleDate(parts[0], true);

  return { startDate, endDate };
};

export const getEventStatus = (dateStr: string, customNow = new Date()): EventStatus => {
  const { startDate, endDate } = getEventDateRange(dateStr);
  const nowTime = customNow.getTime();
  
  // If the end date/time has passed
  if (nowTime > endDate.getTime()) {
    return { isPassed: true, isToday: false, isUpcoming: false, statusLabel: 'Completed' };
  }

  // If currently active today (between start 00:00 and end 23:59)
  if (nowTime >= startDate.getTime() && nowTime <= endDate.getTime()) {
    return { isPassed: false, isToday: true, isUpcoming: false, statusLabel: 'Today' };
  }

  return { isPassed: false, isToday: false, isUpcoming: true, statusLabel: 'Upcoming' };
};

export default function IntakeCalendar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setSyncStatus({
          type: 'success',
          text: `Successfully connected to Google Account (${result.user.email || 'Workspace'}) and saved authentication session!`
        });
        setTimeout(() => setSyncStatus(null), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        text: 'We were unable to establish a secure connection with your Google account. Please verify your permissions and try again.'
      });
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleToken(null);
      setSyncStatus({
        type: 'success',
        text: 'Successfully disconnected your Google account and cleared your authenticated session.'
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err) {
      setSyncStatus({
        type: 'error',
        text: 'We encountered an error while disconnecting. Please try again.'
      });
    }
  };

  // Safe Date-Time Parser for Google Calendar Event Creation
  const parseEventToGoogleCalendarSchema = (event: { title: string; date: string; time: string }) => {
    // Extract first date from range if applicable: "8/12/2026 - 8/16/2026" -> "8/12/2026"
    const datePart = event.date.split('-')[0].trim();
    const dateMatch = datePart.match(/(\d+)\/(\d+)\/(\d+)/);
    if (!dateMatch) {
      // Return a standard placeholder date matching the August intake period if unparseable
      return {
        summary: `KPI MIP: ${event.title}`,
        description: `MIP Schedule Event Details: ${event.time}`,
        start: { date: '2026-08-04' },
        end: { date: '2026-08-05' }
      };
    }
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    
    // Parse time: e.g. "1:00 PM ET", "9:08 PM ET", "8:00 PM – 9:30 PM ET"
    const timePart = event.time.split('–')[0].split('-')[0].trim();
    const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2];
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const hourStr = hour.toString().padStart(2, '0');
      
      // Eastern Time is UTC-4 in August/September
      const dateTimeStr = `${year}-${month}-${day}T${hourStr}:${minute}:00-04:00`;
      const endHourStr = ((hour + 1) % 24).toString().padStart(2, '0');
      const endDateTimeStr = `${year}-${month}-${day}T${endHourStr}:${minute}:00-04:00`;
      
      return {
        summary: `KPI MIP: ${event.title}`,
        description: `Official event on the Membership Intake Process schedule. Details: ${event.time}`,
        start: { dateTime: dateTimeStr, timeZone: 'America/New_York' },
        end: { dateTime: endDateTimeStr, timeZone: 'America/New_York' }
      };
    } else {
      // Return all-day event
      const isoDate = `${year}-${month}-${day}`;
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      const nextDayStr = `${nextDay.getFullYear()}-${(nextDay.getMonth() + 1).toString().padStart(2, '0')}-${nextDay.getDate().toString().padStart(2, '0')}`;
      return {
        summary: `KPI MIP: ${event.title}`,
        description: `Official event on the Membership Intake Process schedule: ${event.time}`,
        start: { date: isoDate },
        end: { date: nextDayStr }
      };
    }
  };

  const addSingleEventToGoogleCalendar = async (ev: { title: string; date: string; time: string }) => {
    if (!googleToken) {
      setSyncStatus({
        type: 'error',
        text: 'Please connect to your Google account first to add events to your calendar.'
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to add "${ev.title}" on ${ev.date} to your Google Calendar?`);
    if (!confirmed) return;

    try {
      const gEvent = parseEventToGoogleCalendarSchema(ev);
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gEvent)
      });

      if (res.ok) {
        setSyncStatus({
          type: 'success',
          text: `Successfully added "${ev.title}" to your Google Calendar and confirmed with Google servers!`
        });
        setTimeout(() => setSyncStatus(null), 5000);
      } else {
        const errorData = await res.json();
        console.error(errorData);
        setSyncStatus({
          type: 'error',
          text: 'We encountered an issue adding the event to Google Calendar. Please verify your connection permissions.'
        });
      }
    } catch (err) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        text: 'We had trouble communicating with Google Calendar. Please check your internet connection.'
      });
    }
  };

  const syncAllEventsToCalendar = async (targetEvents: any[], label: string) => {
    if (!googleToken) {
      setSyncStatus({
        type: 'error',
        text: 'Please connect to your Google account first to sync events.'
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to bulk import all ${targetEvents.length} events from the "${label}" timeline directly into your Google Calendar?`);
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncStatus(null);
    let successCount = 0;

    try {
      for (const ev of targetEvents) {
        const gEvent = parseEventToGoogleCalendarSchema(ev);
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gEvent)
        });

        if (res.ok) {
          successCount++;
        }
      }

      if (successCount > 0) {
        setSyncStatus({
          type: 'success',
          text: `Successfully added ${successCount} out of ${targetEvents.length} events to your Google Calendar and committed them to your schedule!`
        });
      } else {
        setSyncStatus({
          type: 'error',
          text: 'We were unable to add the events to your Google Calendar. Please check your account permissions.'
        });
      }
    } catch (err) {
      console.error(err);
      setSyncStatus({
        type: 'error',
        text: 'We ran into a connection issue while syncing with Google Calendar. Please try again.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const email = sessionStorage.getItem('userEmail');
    if (!role) {
      navigate('/login');
    } else {
      setUserRole(role);
      setUserEmail(email);
    }
  }, [navigate]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header background / styling
    doc.setFillColor(30, 63, 32); // #1E3F20 Ivy
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(253, 252, 240); // #FDFCF0 Cream
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MEMBERSHIP INTAKE CALENDAR', 105, 18, { align: 'center' });

    let y = 36;
    const sections = [
      {
        title: 'I. Interest Meetings',
        events: events.filter(e => e.category === 'Interest Meetings')
      },
      {
        title: 'II. Candidate Applications and Scoring',
        events: events.filter(e => e.category === 'Applications & Scoring')
      },
      {
        title: 'III. Tea Time',
        events: events.filter(e => e.category === 'Tea Time')
      },
      {
        title: 'IV. Candidate Interviews and Review',
        events: events.filter(e => e.category === 'Interviews & Review')
      },
      {
        title: 'V. Voting, Notifications, and Next Steps',
        events: events.filter(e => e.category === 'Voting & Next Steps')
      }
    ];

    doc.setFont('Helvetica', 'normal');

    sections.forEach((sec) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Section title banner
      doc.setFillColor(245, 243, 230);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 63, 32);
      doc.text(sec.title, 16, y);
      y += 8;

      sec.events.forEach((ev) => {
        const evStatus = getEventStatus(ev.date);
        const statusPrefix = evStatus.isPassed ? '[✓ COMPLETED] ' : evStatus.isToday ? '[TODAY] ' : '';
        // Prepare left side text and right side text
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        if (evStatus.isPassed) {
          doc.setTextColor(30, 100, 45);
        } else {
          doc.setTextColor(30, 63, 32);
        }
        const leftLines = doc.splitTextToSize(`• #${ev.step} - ${statusPrefix}${ev.title}`, 98);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const rightLines = doc.splitTextToSize(`${ev.date} | ${ev.time}`, 74);

        const maxLines = Math.max(leftLines.length, rightLines.length);
        const rowHeight = maxLines * 4.5 + 2.5;

        if (y + rowHeight > 275) {
          doc.addPage();
          y = 20;
        }

        // Render left lines
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        if (evStatus.isPassed) {
          doc.setTextColor(30, 100, 45);
        } else {
          doc.setTextColor(30, 63, 32);
        }
        leftLines.forEach((line: string, index: number) => {
          doc.text(line, 18, y + (index * 4.5));
        });

        // Render right lines
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        rightLines.forEach((line: string, index: number) => {
          doc.text(line, 120, y + (index * 4.5));
        });

        y += rowHeight;
      });
      y += 4;
    });

    // Dean Process Timeline in PDF
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(245, 243, 230);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 63, 32);
    doc.text('Dean Process Timeline', 16, y);
    y += 8;

    deanEvents.forEach((ev) => {
      const evStatus = getEventStatus(ev.date);
      const statusPrefix = evStatus.isPassed ? '[✓ COMPLETED] ' : evStatus.isToday ? '[TODAY] ' : '';
      // Prepare left side text and right side text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      if (evStatus.isPassed) {
        doc.setTextColor(30, 100, 45);
      } else {
        doc.setTextColor(30, 63, 32);
      }
      const leftLines = doc.splitTextToSize(`• #${ev.step} - ${statusPrefix}${ev.title}`, 98);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const rightLines = doc.splitTextToSize(`${ev.date} | ${ev.time}`, 74);

      const maxLines = Math.max(leftLines.length, rightLines.length);
      const rowHeight = maxLines * 4.5 + 2.5;

      if (y + rowHeight > 275) {
        doc.addPage();
        y = 20;
      }

      // Render left lines
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      if (evStatus.isPassed) {
        doc.setTextColor(30, 100, 45);
      } else {
        doc.setTextColor(30, 63, 32);
      }
      leftLines.forEach((line: string, index: number) => {
        doc.text(line, 18, y + (index * 4.5));
      });

      // Render right lines
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      rightLines.forEach((line: string, index: number) => {
        doc.text(line, 120, y + (index * 4.5));
      });

      y += rowHeight;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Official Membership Intake Calendar — Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save('Membership_Intake_Calendar_2026.pdf');
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFCF0] font-sans pb-20 relative overflow-hidden">
      <div className="relative z-10">
        <div className="pt-24">
          <MemberHeader />
        </div>

        {/* Member Navigation Tabs */}
        <div className="pt-8 px-4 md:px-12 flex flex-wrap justify-center md:justify-start gap-3">
          <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
            <CalendarDays size={14} /> Intake Calendar
          </div>
          <Link to="/financial-roster" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Membership Dues & Status
          </Link>
          <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Member Directory
          </Link>
        </div>

        {/* Header Section */}
        <div className="pt-4 pb-2 px-6 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
            }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="h-px w-16 bg-[#B8860B]" />
              <Leaf className="text-[#1E3F20]" size={24} />
              <div className="h-px w-16 bg-[#B8860B]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#1E3F20] tracking-wider mb-2 uppercase text-center max-w-4xl">
              Membership Intake Calendar
            </h1>
          </motion.div>
        </div>

        {/* PDF Export & Google Calendar Sign-In */}
        <div className="flex flex-col items-center justify-center gap-4 mb-4 px-4">
          <button
            onClick={exportToPDF}
            className="bg-[#B8860B] hover:bg-[#1E3F20] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <Download size={14} /> Export to PDF
          </button>
        </div>

        {/* Progress & Completion Overview Banner */}
        {(() => {
          const completedEventsCount = events.filter(e => getEventStatus(e.date).isPassed).length;
          const completedDeanCount = deanEvents.filter(e => getEventStatus(e.date).isPassed).length;
          const totalTasks = events.length + deanEvents.length;
          const totalCompleted = completedEventsCount + completedDeanCount;
          const progressPercent = Math.round((totalCompleted / totalTasks) * 100);

          return (
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 mb-8">
              <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 size={24} className="text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm md:text-base font-bold text-[#1E3F20] uppercase tracking-wider">
                        Intake Timeline Progress
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {totalCompleted} of {totalTasks} Tasks Passed ({progressPercent}%)
                      </span>
                    </div>
                    <p className="text-xs text-ivy/60 mt-0.5">
                      Milestones that have passed the current date are automatically checked off and marked as completed.
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-72 flex flex-col items-end gap-1.5">
                  <div className="flex justify-between w-full text-[10px] font-bold uppercase tracking-wider text-ivy/60">
                    <span>Overall Completion</span>
                    <span className="text-emerald-700 font-extrabold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-emerald-50 rounded-full h-3.5 overflow-hidden border border-emerald-200">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Interactive Grid & Section Breakdown Layout */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-12">
            
            {/* Section Breakdown Cards */}
            <div className="space-y-8">
              {[
                {
                  sectionTitle: 'I. Interest Meetings',
                  events: events.filter(e => e.category === 'Interest Meetings')
                },
                {
                  sectionTitle: 'II. Candidate Applications and Scoring',
                  events: events.filter(e => e.category === 'Applications & Scoring')
                },
                {
                  sectionTitle: 'III. Tea Time',
                  events: events.filter(e => e.category === 'Tea Time')
                },
                {
                  sectionTitle: 'IV. Candidate Interviews and Review',
                  events: events.filter(e => e.category === 'Interviews & Review')
                },
                {
                  sectionTitle: 'V. Voting, Notifications, and Next Steps',
                  events: events.filter(e => e.category === 'Voting & Next Steps')
                }
              ].map((section, secIdx) => (
                <div key={secIdx} className="bg-[#FFFFFF] border border-[#B8860B]/30 rounded-2xl p-6 md:p-8 shadow-[0_6px_24px_rgba(30,63,32,0.05)]">
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E3F20] font-bold tracking-wide mb-6 border-b border-[#B8860B]/20 pb-3 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#B8860B]" />
                    {section.sectionTitle}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.events.map((event) => {
                      const status = getEventStatus(event.date);
                      return (
                        <div 
                          key={event.step}
                          className={`border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative group shadow-sm hover:shadow-md ${
                            status.isPassed 
                              ? 'bg-[#F6FBF7] border-emerald-300/90 hover:border-emerald-600' 
                              : status.isToday
                              ? 'bg-[#FFFDF5] border-amber-400 ring-2 ring-amber-400/20 hover:border-amber-500'
                              : 'bg-[#FDFCF0] border-[#B8860B]/30 hover:border-[#1E3F20]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  status.isPassed 
                                    ? 'bg-emerald-800 text-white' 
                                    : status.isToday
                                    ? 'bg-[#B8860B] text-white'
                                    : 'bg-[#1E3F20] text-white'
                                }`}>
                                  Step #{event.step}
                                </span>

                                {status.isPassed && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                    <CheckCircle2 size={11} className="text-emerald-700" /> Completed
                                  </span>
                                )}
                                {status.isToday && (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Today
                                  </span>
                                )}
                                {status.isUpcoming && (
                                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Upcoming
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <div
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                    status.isPassed
                                      ? 'bg-emerald-600 border border-emerald-700 text-white shadow-xs'
                                      : status.isToday
                                      ? 'bg-amber-100 border border-amber-400 text-amber-700'
                                      : 'bg-white border border-gray-300 text-transparent'
                                  }`}
                                  title={status.isPassed ? "Task Completed" : status.isToday ? "Task Active Today" : "Upcoming Task"}
                                >
                                  {status.isPassed ? (
                                    <Check size={14} strokeWidth={3} />
                                  ) : status.isToday ? (
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  ) : null}
                                </div>
                                <event.icon size={20} className={`${status.isPassed ? 'text-emerald-700' : 'text-[#B8860B]'} group-hover:scale-110 transition-transform`} />
                              </div>
                            </div>
                            
                            <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                              {event.title}
                            </h3>
                          </div>

                          <div className={`mt-4 pt-3 border-t flex items-end justify-between gap-2 ${status.isPassed ? 'border-emerald-200/80' : 'border-[#B8860B]/20'}`}>
                            <div>
                              <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                                {event.date}
                              </p>
                              <p className={`${status.isPassed ? 'text-emerald-700 font-semibold' : 'text-[#B8860B] font-semibold'} text-xs mt-0.5`}>
                                {event.time}
                              </p>
                            </div>
                            {googleToken && (
                              <button
                                onClick={() => addSingleEventToGoogleCalendar(event)}
                                title="Add to Google Calendar"
                                className="bg-[#1E3F20] hover:bg-[#B8860B] text-white p-2 rounded-xl transition-all cursor-pointer hover:scale-105 shadow-sm shrink-0 flex items-center justify-center"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Dean Process Timeline Section */}
            <div className="bg-[#FFFFFF] border border-[#B8860B]/30 rounded-2xl p-6 md:p-8 shadow-[0_6px_24px_rgba(30,63,32,0.05)] mt-12">
              <h2 className="text-xl md:text-2xl font-serif text-[#1E3F20] font-bold tracking-wide mb-6 border-b border-[#B8860B]/20 pb-3 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#1E3F20]" />
                Dean Process Timeline
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deanEvents.map((event) => {
                  const status = getEventStatus(event.date);
                  return (
                    <div 
                      key={event.step}
                      className={`border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative group shadow-sm hover:shadow-md ${
                        status.isPassed 
                          ? 'bg-[#F6FBF7] border-emerald-300/90 hover:border-emerald-600' 
                          : status.isToday
                          ? 'bg-[#FFFDF5] border-amber-400 ring-2 ring-amber-400/20 hover:border-amber-500'
                          : 'bg-[#FDFCF0] border-[#B8860B]/30 hover:border-[#1E3F20]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              status.isPassed 
                                ? 'bg-emerald-800 text-white' 
                                : status.isToday
                                ? 'bg-[#B8860B] text-white'
                                : 'bg-[#1E3F20] text-white'
                            }`}>
                              Dean Step #{event.step}
                            </span>

                            {status.isPassed && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                <CheckCircle2 size={11} className="text-emerald-700" /> Completed
                              </span>
                            )}
                            {status.isToday && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Today
                              </span>
                            )}
                            {status.isUpcoming && (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Upcoming
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                status.isPassed
                                  ? 'bg-emerald-600 border border-emerald-700 text-white shadow-xs'
                                  : status.isToday
                                  ? 'bg-amber-100 border border-amber-400 text-amber-700'
                                  : 'bg-white border border-gray-300 text-transparent'
                              }`}
                              title={status.isPassed ? "Task Completed" : status.isToday ? "Task Active Today" : "Upcoming Task"}
                            >
                              {status.isPassed ? (
                                <Check size={14} strokeWidth={3} />
                              ) : status.isToday ? (
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                              ) : null}
                            </div>
                            <event.icon size={20} className={`${status.isPassed ? 'text-emerald-700' : 'text-[#B8860B]'} group-hover:scale-110 transition-transform`} />
                          </div>
                        </div>
                        
                        <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                          {event.title}
                        </h3>
                      </div>

                      <div className={`mt-4 pt-3 border-t flex items-end justify-between gap-2 ${status.isPassed ? 'border-emerald-200/80' : 'border-[#B8860B]/20'}`}>
                        <div>
                          <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                            {event.date}
                          </p>
                          <p className={`${status.isPassed ? 'text-emerald-700 font-semibold' : 'text-[#B8860B] font-semibold'} text-xs mt-0.5`}>
                            {event.time}
                          </p>
                        </div>
                        {googleToken && (
                          <button
                            onClick={() => addSingleEventToGoogleCalendar(event)}
                            title="Add to Google Calendar"
                            className="bg-[#1E3F20] hover:bg-[#B8860B] text-white p-2 rounded-xl transition-all cursor-pointer hover:scale-105 shadow-sm shrink-0 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        
        {/* Footer Leaf Accents */}
        <div className="flex justify-between items-end mt-20 px-8 opacity-40 pointer-events-none">
          <Leaf size={64} className="text-[#1E3F20] transform -scale-x-100" />
          <Leaf size={64} className="text-[#1E3F20]" />
        </div>
      </div>
    </div>
  );
}
