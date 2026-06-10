import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EventAddToCalendarProps {
  title: string;
  description?: string;
  facilitator?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export default function EventAddToCalendar({
  title,
  description = '',
  facilitator = '',
  startTime,
  endTime,
  location = 'Charlotte, NC'
}: EventAddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const eventTitle = `${title} - Order of KP Conference`;
  const eventDesc = [
    description,
    facilitator ? `Facilitator: ${facilitator}` : '',
    'Order of KP 2026 Biennial Conference in Charlotte, NC.'
  ].filter(Boolean).join('\n\n');

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(eventDesc)}&location=${encodeURIComponent(location)}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${eventTitle}`,
    `DESCRIPTION:${eventDesc.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const downloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `kp_event_${sanitizedTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-silver/5 hover:bg-silver/10 border border-silver/20 hover:border-silver/40 text-silver/80 hover:text-white text-[10px] font-semibold uppercase tracking-widest transition-all cursor-pointer shadow-sm"
      >
        <Calendar size={11} className="text-primary" />
        <span>+ Calendar</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }} 
            />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-1.5 w-40 bg-pure-black border border-silver/20 rounded-xl overflow-hidden z-50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            >
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-start gap-2.5 px-3 py-2 text-silver hover:text-black hover:bg-silver transition-colors text-[10px] font-bold uppercase tracking-wider text-left"
                onClick={() => setIsOpen(false)}
              >
                Google Calendar
              </a>
              <button
                onClick={downloadIcs}
                className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-silver hover:text-black hover:bg-silver transition-colors text-[10px] font-bold uppercase tracking-wider text-left border-t border-silver/10 cursor-pointer"
              >
                Apple / Outlook
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
