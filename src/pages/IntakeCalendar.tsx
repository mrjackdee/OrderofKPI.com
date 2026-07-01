import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Coffee, Edit3, ClipboardCheck, Mail, Video, 
  ThumbsUp, Star, Hand, Wallet, Sparkles, Shield, UserCheck, 
  CalendarDays, Leaf, GraduationCap, Clock
} from 'lucide-react';

const events = [
  { step: 1, title: 'Inquire Within', date: 'Jul 3, 2026', icon: Heart },
  { step: 2, title: 'Interest Meeting', date: 'Jul 19, 2026', icon: Users },
  { step: 3, title: 'Tea Time', date: 'Jul 26–Aug 1, 2026', icon: Coffee },
  { step: 4, title: 'Provide the Application', date: 'Aug 2, 2026', icon: Edit3 },
  { step: 5, title: 'Application Due', date: 'Aug 7, 2026', icon: ClipboardCheck },
  { step: 6, title: 'Interview Emails Sent', date: 'Aug 9, 2026', icon: Mail },
  { step: 7, title: 'Interviews', date: 'Aug 12, 14, 15, 2026', icon: Video },
  { step: 8, title: 'Video Reviews', date: 'Aug 16–20, 2026', icon: Video },
  { step: 9, title: 'Financial Chapter Members Voting', date: 'Aug 21, 2026', icon: ThumbsUp },
  { step: 10, title: 'Intake Notified of Selection', date: 'Aug 27, 2026', icon: Star },
  { step: 11, title: 'No Contact Period Starts', date: 'Aug 27, 2026', icon: Hand },
  { step: 12, title: '1st Payment', date: 'Sep 11, 2026', icon: Wallet },
  { step: 13, title: 'A Splendid Affair', date: 'Sep 16, 2026', icon: Sparkles },
  { step: 14, title: 'Start Intake', date: 'Sep 17, 2026', icon: Shield },
  { step: 15, title: '2nd Payment', date: 'Oct 11, 2026', icon: Wallet },
  { step: 16, title: 'Sisterhood Weekend', date: 'Oct 16–18, 2026', icon: Leaf },
  { step: 17, title: '3rd Payment', date: 'Nov 11, 2026', icon: Wallet },
  { step: 18, title: 'Ivy Weekend', date: 'Nov 13–15, 2026', icon: Leaf },
  { step: 19, title: '4th Payment (Final)', date: 'Dec 11, 2026', icon: Wallet },
  { step: 20, title: 'Sisterhood Weekend', date: 'Dec 11–13, 2026', icon: Leaf },
  { step: 21, title: 'Initiation Weekend', date: 'Jan 15–17, 2027', icon: GraduationCap },
];

export default function IntakeCalendar() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-20">
      
      {/* Member Navigation Tabs */}
      <div className="pt-24 px-6 md:px-12 flex justify-center md:justify-start gap-4">
        <div className="px-5 py-2 rounded-full bg-[#1E3F20] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <CalendarDays size={14} /> Intake Calendar
        </div>
        <Link to="/financial-roster" className="px-5 py-2 rounded-full border border-[#B8860B]/30 text-[#1E3F20] text-xs font-bold uppercase tracking-widest hover:bg-[#B8860B]/10 transition-colors flex items-center gap-2">
          <Users size={14} /> Financial Roster
        </Link>
      </div>

      {/* Header Section */}
      <div className="pt-8 pb-12 px-6 text-center">
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
              July 2026 – January 2027
            </p>
            <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
          </div>
        </motion.div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 md:gap-8 relative pt-4">
          
          {events.map((event, index) => (
            <motion.div
              key={event.step}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white border-2 border-[#B8860B] rounded-xl p-4 w-full h-full flex flex-col items-center text-center shadow-[0_8px_20px_rgba(30,63,32,0.08)] relative hover:-translate-y-1 transition-transform duration-300">
                
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1E3F20] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-[#FDFCF0] shadow-md z-10">
                  {event.step}
                </div>

                <div className="mt-4 mb-3">
                  <event.icon size={36} strokeWidth={1.5} className="text-[#1E3F20]" />
                </div>
                
                <h3 className="text-[#1E3F20] font-bold text-sm leading-tight mb-3 flex-grow">
                  {event.title}
                </h3>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#B8860B]/50 to-transparent my-2" />
                
                <p className="text-[#B8860B] text-xs font-semibold tracking-wider uppercase mt-1">
                  {event.date}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Footer Leaf Accents */}
      <div className="flex justify-between items-end mt-20 px-8 opacity-40 pointer-events-none">
        <Leaf size={64} className="text-[#1E3F20] transform -scale-x-100" />
        <Leaf size={64} className="text-[#1E3F20]" />
      </div>
    </div>
  );
}
