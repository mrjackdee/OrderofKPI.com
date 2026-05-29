import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddToCalendarProps {
  className?: string;
  variant?: 'gold' | 'silver';
}

export default function AddToCalendar({ className = '', variant = 'gold' }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colors = {
    gold: {
      bg: 'bg-primary',
      text: 'text-primary',
      border: 'border-primary',
      hover: 'hover:bg-primary'
    },
    silver: {
      bg: 'bg-silver',
      text: 'text-silver',
      border: 'border-silver',
      hover: 'hover:bg-silver'
    }
  };

  const currentColors = colors[variant];

  const event = {
    title: 'The Order of KP Biennial Conference',
    description: 'Join us for the Biennial Conference in Charlotte, NC. Family Matters!',
    location: 'Charlotte, NC',
    startTime: '20260626T090000',
    endTime: '20260628T120000',
  };

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startTime}/${event.endTime}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${event.startTime}`,
    `DTEND:${event.endTime}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const downloadIcs = () => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'kpi-conference.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-6 py-3 ${currentColors.bg} text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors text-sm`}
      >
        <Calendar size={18} />
        Add to Calendar
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-black border ${currentColors.border} rounded-xl overflow-hidden z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}
            >
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-3 ${currentColors.text} ${currentColors.hover} hover:text-black transition-colors text-sm font-medium uppercase tracking-wider`}
                onClick={() => setIsOpen(false)}
              >
                Google Calendar
              </a>
              <button
                onClick={downloadIcs}
                className={`w-full flex items-center gap-3 px-4 py-3 ${currentColors.text} ${currentColors.hover} hover:text-black transition-colors text-sm font-medium uppercase tracking-wider border-t ${currentColors.border}/20`}
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
