import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Users, Coffee, Edit3, ClipboardCheck, Mail, Video, 
  ThumbsUp, Star, Hand, Wallet, Shield, UserCheck, 
  Leaf, Download, CalendarDays, LayoutList
} from 'lucide-react';
import MemberHeader from '../components/MemberHeader';

const events = [
  { step: 1, title: 'Interest Meeting #1', date: '8/2/2026', time: '1:00 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 2, title: 'Interest Meeting #2', date: '8/3/2026', time: '9:08 PM ET', category: 'Interest Meetings', icon: Users },
  { step: 3, title: 'Applications Distributed', date: 'After each interest meeting', time: 'Distributed to attendees', category: 'Applications & Scoring', icon: Mail },
  { step: 4, title: 'Applications Due', date: '8/7/2026', time: '12:00 PM (noon) ET', category: 'Applications & Scoring', icon: ClipboardCheck },
  { step: 5, title: 'Application Scoring', date: '8/7/2026 - 8/9/2026', time: 'Scoring period', category: 'Applications & Scoring', icon: Edit3 },
  { step: 6, title: 'Candidate Notifications & Tea Time Invites', date: '8/10/2026', time: 'Scoring removals & Tea Time invites', category: 'Applications & Scoring', icon: Star },
  { step: 7, title: 'Tea Time Period', date: '8/12/2026 - 8/16/2026', time: 'Tea Time period', category: 'Tea Time', icon: Coffee },
  { step: 8, title: 'Facebook Group Opens', date: '8/12/2026 - 8/16/2026', time: 'Opens Aug 12 at 7:00 PM ET', category: 'Tea Time', icon: Users },
  { step: 9, title: 'Tea Time Zoom Call', date: '8/13/2026', time: '8:00 PM – 9:30 PM ET', category: 'Tea Time', icon: Video },
  { step: 10, title: 'Candidate Interviews', date: '8/19/2026 - 8/21/2026', time: '20 minutes each (times TBD)', category: 'Interviews & Review', icon: UserCheck },
  { step: 11, title: 'Makeup Interviews', date: '8/24/2026', time: 'If needed', category: 'Interviews & Review', icon: UserCheck },
  { step: 12, title: 'Interview Video Review', date: '8/25/2026 - 8/28/2026', time: 'Review by active members', category: 'Interviews & Review', icon: Video },
  { step: 13, title: 'MIP Voting Period', date: '8/31/2026 - 9/2/2026', time: 'MIP voting period', category: 'Voting & Next Steps', icon: ThumbsUp },
  { step: 14, title: 'Candidate Notifications', date: '9/4/2026', time: 'Candidate notifications', category: 'Voting & Next Steps', icon: Star },
  { step: 15, title: 'No Contact Period Begins', date: '9/7/2026', time: 'No contact period begins', category: 'Voting & Next Steps', icon: Hand },
  { step: 16, title: 'First Initiation Payment Due', date: '9/11/2026', time: 'Due from candidates for membership', category: 'Voting & Next Steps', icon: Wallet },
];

const deanEvents = [
  { step: 1, title: 'Chapter Notification & Nominations Open', date: '8/7/2026', time: 'Chapter notification of Dean process and opening of nomination submissions', icon: Mail },
  { step: 2, title: 'Dean Nominations Accepted', date: '8/10/2026 - 8/12/2026', time: 'Closes 9:08 PM ET on August 12', icon: Edit3 },
  { step: 3, title: 'Special Meeting', date: '8/16/2026', time: '7:00 PM ET', icon: Users },
  { step: 4, title: 'Dean Team Voting', date: '8/17/2026 - 8/19/2026', time: 'Dean team voting', icon: ThumbsUp },
  { step: 5, title: 'Announcement of Dean', date: '8/21/2026', time: 'Announcement of Dean', icon: Star },
  { step: 6, title: 'Dean Selects Assistant Dean & Team', date: '8/24/2026 - 8/28/2026', time: 'Assistant Dean of Pledges and Dean team', icon: UserCheck },
  { step: 7, title: 'Drop Date for Dean Team', date: '8/28/2026', time: 'Drop date for Dean team', icon: Shield },
];

export default function IntakeCalendar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(253, 252, 240); // #FDFCF0 Cream
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MEMBERSHIP INTAKE CALENDAR', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(184, 134, 11); // Gold #B8860B
    doc.text('August 2026 – September 2026', 105, 25, { align: 'center' });

    let y = 48;
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
        // Prepare left side text and right side text
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 63, 32);
        const leftLines = doc.splitTextToSize(`• #${ev.step} - ${ev.title}`, 98);

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
        doc.setTextColor(30, 63, 32);
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
      // Prepare left side text and right side text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 63, 32);
      const leftLines = doc.splitTextToSize(`• #${ev.step} - ${ev.title}`, 98);

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
      doc.setTextColor(30, 63, 32);
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
            <Users size={14} /> Financial Roster
          </Link>
          <Link to="/gantt-chart" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <LayoutList size={14} /> Intake Plan
          </Link>
          <Link to="/member-directory" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
            <Users size={14} /> Member Directory
          </Link>
        </div>

        {/* Header Section */}
        <div className="pt-8 pb-6 px-6 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
            }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-[#B8860B]" />
              <Leaf className="text-[#1E3F20]" size={24} />
              <div className="h-px w-16 bg-[#B8860B]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-[#1E3F20] tracking-wider mb-4 uppercase text-center max-w-4xl">
              Membership Intake Calendar
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <p className="text-lg md:text-2xl text-[#B8860B] font-medium tracking-[0.2em] uppercase">
                August 2026 – September 2026
              </p>
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
            </div>
          </motion.div>
        </div>

        {/* PDF Export */}
        <div className="flex justify-center mb-10 px-4">
          <button
            onClick={exportToPDF}
            className="bg-[#B8860B] hover:bg-[#1E3F20] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Download size={14} /> Export to PDF
          </button>
        </div>

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
                    {section.events.map((event) => (
                      <div 
                        key={event.step}
                        className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl p-5 flex flex-col justify-between hover:border-[#1E3F20] transition-all duration-300 relative group shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="bg-[#1E3F20] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                              Step #{event.step}
                            </span>
                            <event.icon size={22} className="text-[#B8860B] group-hover:scale-110 transition-transform" />
                          </div>
                          
                          <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                            {event.title}
                          </h3>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#B8860B]/20">
                          <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                            {event.date}
                          </p>
                          <p className="text-[#B8860B] text-xs font-semibold mt-0.5">
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
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
                {deanEvents.map((event) => (
                  <div 
                    key={event.step}
                    className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl p-5 flex flex-col justify-between hover:border-[#1E3F20] transition-all duration-300 relative group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-[#1E3F20] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Dean Step #{event.step}
                        </span>
                        <event.icon size={22} className="text-[#B8860B] group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <h3 className="text-[#1E3F20] font-bold text-base mb-2 leading-snug">
                        {event.title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#B8860B]/20">
                      <p className="text-[#1E3F20] font-bold text-xs uppercase tracking-wider">
                        {event.date}
                      </p>
                      <p className="text-[#B8860B] text-xs font-semibold mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </div>
                ))}
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
