import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CalendarEventDetails {
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  date: string; // YYYY-MM-DD or readable string
  time?: string; // e.g. "7:00 PM EST" or "7:00 PM - 8:30 PM EST"
  committeeName?: string;
}

interface CommitteeAddToCalendarProps {
  event: CalendarEventDetails;
  className?: string;
}

/**
 * Parses date ("YYYY-MM-DD") and time strings ("7:00 PM - 8:30 PM EST" or "7:00 PM EST")
 * into iCal / ISO format strings: YYYYMMDDTHHMMSS
 */
function parseEventTimes(dateStr: string, timeStr?: string): { startIso: string; endIso: string } {
  const cleanDate = dateStr.replace(/[^0-9-]/g, '').trim();
  let baseDate = new Date();
  
  if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = cleanDate.split('-').map(Number);
    baseDate = new Date(Date.UTC(y, m - 1, d, 19, 0, 0)); // default 7 PM UTC
  } else if (!isNaN(Date.parse(dateStr))) {
    baseDate = new Date(dateStr);
  }

  // Attempt to parse start and end hours from time string (e.g., "7:00 PM - 8:30 PM EST")
  let startHour = 19;
  let startMin = 0;
  let endHour = 20;
  let endMin = 0;

  if (timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const isPm = timeMatch[3] ? timeMatch[3].toUpperCase() === 'PM' : h < 8; // assumption
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      startHour = h;
      startMin = m;
      endHour = (startHour + 1) % 24;
      endMin = startMin;
    }

    // Check for explicit end time range
    const rangeMatch = timeStr.match(/-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
    if (rangeMatch) {
      let eh = parseInt(rangeMatch[1], 10);
      const em = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
      const isEpm = rangeMatch[3] ? rangeMatch[3].toUpperCase() === 'PM' : (eh < 12 && startHour >= 12);
      if (isEpm && eh < 12) eh += 12;
      if (!isEpm && eh === 12) eh = 0;
      endHour = eh;
      endMin = em;
    }
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = baseDate.getUTCFullYear();
  const mm = pad(baseDate.getUTCMonth() + 1);
  const dd = pad(baseDate.getUTCDate());

  const startIso = `${yyyy}${mm}${dd}T${pad(startHour)}${pad(startMin)}00Z`;
  const endIso = `${yyyy}${mm}${dd}T${pad(endHour)}${pad(endMin)}00Z`;

  return { startIso, endIso };
}

export default function CommitteeAddToCalendar({ event, className = '' }: CommitteeAddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { startIso, endIso } = parseEventTimes(event.date, event.time);

  const fullDescription = [
    event.committeeName ? `[${event.committeeName}]` : '',
    event.description || '',
    event.meetingLink ? `Meeting Link: ${event.meetingLink}` : '',
    event.location ? `Location: ${event.location}` : '',
    event.time ? `Scheduled Time: ${event.time}` : '',
    'The Order of KPI, Inc.'
  ].filter(Boolean).join('\n\n');

  const locationDetails = event.meetingLink 
    ? (event.location ? `${event.location} | Link: ${event.meetingLink}` : event.meetingLink)
    : (event.location || 'Virtual / Zoom');

  // 1. Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
    fullDescription
  )}&location=${encodeURIComponent(locationDetails)}`;

  // 2. Outlook Web URL
  const outlookWebUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    event.title
  )}&body=${encodeURIComponent(fullDescription)}&location=${encodeURIComponent(
    locationDetails
  )}&startdt=${startIso}&enddt=${endIso}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent`;

  // 3. Office 365 URL
  const office365Url = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    event.title
  )}&body=${encodeURIComponent(fullDescription)}&location=${encodeURIComponent(
    locationDetails
  )}&startdt=${startIso}&enddt=${endIso}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent`;

  // 4. Yahoo Calendar URL
  const yahooCalendarUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(
    event.title
  )}&st=${startIso}&et=${endIso}&desc=${encodeURIComponent(
    fullDescription
  )}&in_loc=${encodeURIComponent(locationDetails)}`;

  // 5. ICS File (Apple Calendar, Outlook Desktop, Android native)
  const generateIcsContent = () => {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Order of KPI//Standing Committee Workspace//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${Math.random().toString(36).substring(2)}@orderofkpi.org`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${fullDescription.replace(/\n/g, '\\n')}`,
      `LOCATION:${locationDetails.replace(/\n/g, ' ')}`,
      ...(event.meetingLink ? [`URL:${event.meetingLink}`] : []),
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const icsData = generateIcsContent();
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const sanitizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `kpi_${sanitizedTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cream hover:bg-gold/15 border border-gold/30 hover:border-gold text-ivy text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs"
        title="Add to Google, Outlook, Apple Calendar, etc."
      >
        <Calendar size={13} className="text-gold shrink-0" />
        <span>Add to Calendar</span>
        <ChevronDown
          size={12}
          className={`text-ivy/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-gold/30 rounded-lg shadow-xl overflow-hidden z-50 py-1 divide-y divide-gold/10"
            >
              <div className="px-3 py-1.5 bg-cream/60">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ivy/60 block">
                  Select Calendar Service
                </span>
              </div>

              <div className="py-1">
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Google Calendar
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">Web</span>
                </a>

                <a
                  href={outlookWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    Outlook.com
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">Web</span>
                </a>

                <a
                  href={office365Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-700" />
                    Microsoft 365
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">Work</span>
                </a>

                <a
                  href={yahooCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    Yahoo Calendar
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">Web</span>
                </a>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Apple Calendar / iCal
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">.ics</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-ivy hover:bg-gold/10 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                    Outlook Desktop
                  </span>
                  <span className="text-[10px] text-ivy/40 uppercase font-mono">.ics</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
