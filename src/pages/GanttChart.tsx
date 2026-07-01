import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, LayoutList } from 'lucide-react';

const events = [
  { step: 1, title: 'Inquire Within', date: 'Jul 3, 2026', start: '2026-07-03', end: '2026-07-03' },
  { step: 2, title: 'Interest Meeting', date: 'Jul 19, 2026', start: '2026-07-19', end: '2026-07-19' },
  { step: 3, title: 'Tea Time', date: 'Jul 26–Aug 1, 2026', start: '2026-07-26', end: '2026-08-01' },
  { step: 4, title: 'Provide the Application', date: 'Aug 2, 2026', start: '2026-08-02', end: '2026-08-02' },
  { step: 5, title: 'Application Due', date: 'Aug 7, 2026', start: '2026-08-07', end: '2026-08-07' },
  { step: 6, title: 'Interview Emails Sent', date: 'Aug 9, 2026', start: '2026-08-09', end: '2026-08-09' },
  { step: 7, title: 'Interviews', date: 'Aug 12–15, 2026', start: '2026-08-12', end: '2026-08-15' },
  { step: 8, title: 'Video Reviews', date: 'Aug 16–20, 2026', start: '2026-08-16', end: '2026-08-20' },
  { step: 9, title: 'Financial Chapter Members Voting', date: 'Aug 21, 2026', start: '2026-08-21', end: '2026-08-21' },
  { step: 10, title: 'Intake Notified of Selection', date: 'Aug 27, 2026', start: '2026-08-27', end: '2026-08-27' },
  { step: 11, title: 'No Contact Period Starts', date: 'Aug 27, 2026', start: '2026-08-27', end: '2026-08-27' },
  { step: 12, title: '1st Payment', date: 'Sep 11, 2026', start: '2026-09-11', end: '2026-09-11' },
  { step: 13, title: 'A Splendid Affair', date: 'Sep 16, 2026', start: '2026-09-16', end: '2026-09-16' },
  { step: 14, title: 'Start Intake', date: 'Sep 17, 2026', start: '2026-09-17', end: '2026-09-17' },
  { step: 15, title: '2nd Payment', date: 'Oct 11, 2026', start: '2026-10-11', end: '2026-10-11' },
  { step: 16, title: 'Sisterhood Weekend', date: 'Oct 16–18, 2026', start: '2026-10-16', end: '2026-10-18' },
  { step: 17, title: '3rd Payment', date: 'Nov 11, 2026', start: '2026-11-11', end: '2026-11-11' },
  { step: 18, title: 'Ivy Weekend', date: 'Nov 13–15, 2026', start: '2026-11-13', end: '2026-11-15' },
  { step: 19, title: '4th Payment (Final)', date: 'Dec 11, 2026', start: '2026-12-11', end: '2026-12-11' },
  { step: 20, title: 'Sisterhood Weekend', date: 'Dec 11–13, 2026', start: '2026-12-11', end: '2026-12-13' },
  { step: 21, title: 'Initiation Weekend', date: 'Jan 15–17, 2027', start: '2027-01-15', end: '2027-01-17' },
];

const START_DATE = new Date('2026-07-01').getTime();
const END_DATE = new Date('2027-01-31').getTime();
const TOTAL_DURATION = END_DATE - START_DATE;

const months = [
  { name: 'Jul', year: '26', days: 31 },
  { name: 'Aug', year: '26', days: 31 },
  { name: 'Sep', year: '26', days: 30 },
  { name: 'Oct', year: '26', days: 31 },
  { name: 'Nov', year: '26', days: 30 },
  { name: 'Dec', year: '26', days: 31 },
  { name: 'Jan', year: '27', days: 31 },
];

export default function GanttChart() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  const getPositionStyles = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    // Add one day to end date to make it inclusive visually
    const end = new Date(endStr).getTime() + (24 * 60 * 60 * 1000); 
    
    let leftPercent = ((start - START_DATE) / TOTAL_DURATION) * 100;
    let widthPercent = ((end - start) / TOTAL_DURATION) * 100;
    
    // Ensure minimum width for single day events
    if (widthPercent < 1.5) widthPercent = 1.5;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-20 relative overflow-hidden">
      {/* Draft Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-10">
        <h1 className="text-[15rem] md:text-[25rem] font-black uppercase text-[#1E3F20] -rotate-45 select-none whitespace-nowrap">
          Draft
        </h1>
      </div>

      <div className="relative z-10">
        {/* Member Navigation Tabs */}
        <div className="pt-24 px-4 md:px-12 flex flex-wrap justify-center md:justify-start gap-3">
          <Link to="/intake-calendar" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <CalendarDays size={14} /> Intake Calendar
          </Link>
          <Link to="/financial-roster" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Financial Roster
          </Link>
          <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md">
            <LayoutList size={14} /> Intake Timeline
          </div>
        </div>

        {/* Header Section */}
        <div className="pt-8 pb-12 px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-[#B8860B]" />
              <LayoutList className="text-[#1E3F20]" size={24} />
              <div className="h-px w-16 bg-[#B8860B]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#1E3F20] tracking-wider mb-4 uppercase text-center max-w-4xl">
              Intake Timeline
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <p className="text-sm md:text-lg text-[#B8860B] font-medium tracking-[0.2em] uppercase">
                Gantt Schedule Overview
              </p>
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            </div>
          </motion.div>
        </div>

        {/* Gantt Chart Container */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 overflow-x-auto pb-10">
          <div className="min-w-[800px] bg-white border-2 border-[#B8860B]/30 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Timeline Header (Months) */}
            <div className="flex border-b-2 border-[#B8860B]/20 bg-[#FDFCF0]">
              <div className="w-48 shrink-0 border-r-2 border-[#B8860B]/20 p-4 flex items-center font-bold text-[#1E3F20] uppercase tracking-wider text-xs">
                Deliverable
              </div>
              <div className="flex-1 flex relative">
                {months.map((month, idx) => (
                  <div 
                    key={month.name} 
                    className="flex-1 border-r border-[#B8860B]/10 p-3 text-center last:border-r-0"
                  >
                    <div className="font-bold text-[#1E3F20] text-sm">{month.name}</div>
                    <div className="text-[#B8860B] text-[10px] font-black uppercase tracking-widest">{month.year}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body (Events) */}
            <div className="relative">
              {/* Vertical Grid Lines */}
              <div className="absolute top-0 bottom-0 left-48 right-0 flex pointer-events-none">
                {months.map((month, idx) => (
                  <div key={idx} className="flex-1 border-r border-[#B8860B]/5 last:border-r-0" />
                ))}
              </div>

              {/* Event Rows */}
              <div className="flex flex-col py-2">
                {events.map((event, idx) => (
                  <div key={event.step} className="flex group hover:bg-[#1E3F20]/5 transition-colors relative">
                    <div className="w-48 shrink-0 p-3 pl-4 border-r-2 border-[#B8860B]/10 flex flex-col justify-center bg-white group-hover:bg-transparent transition-colors z-10">
                      <div className="text-xs font-bold text-[#1E3F20] leading-tight flex items-start gap-2">
                        <span className="text-[#B8860B] font-black text-[10px] pt-[2px]">{event.step}.</span>
                        {event.title}
                      </div>
                      <div className="text-[10px] text-[#1E3F20]/60 mt-1 pl-4">
                        {event.date}
                      </div>
                    </div>
                    
                    <div className="flex-1 relative h-14 flex items-center">
                      <motion.div 
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="absolute h-6 rounded-full bg-[#1E3F20] border border-[#1E3F20] shadow-sm flex items-center overflow-hidden origin-left group-hover:bg-[#B8860B] group-hover:border-[#B8860B] transition-colors"
                        style={getPositionStyles(event.start, event.end)}
                        title={`${event.title}: ${event.date}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
