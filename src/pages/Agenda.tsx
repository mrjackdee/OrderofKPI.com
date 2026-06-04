import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Wifi, 
  User, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Utensils, 
  Award, 
  Compass, 
  Globe, 
  Heart, 
  Mic, 
  Gamepad2, 
  Dumbbell, 
  MessageSquare, 
  Flame,
  ArrowRight,
  Printer,
  Lock,
  Unlock,
  X,
  FileText,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';

const MotionLink = motion(Link);

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-silver/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.5
          }}
          animate={{
            y: [null, Math.random() * -100 + "%"],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default function Agenda() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeTab, setActiveTab] = useState(0);

  const agendaData = [
    {
      day: "Friday",
      date: "June 26",
      events: [
        {
          time: "4:30 – 6:30 PM ET",
          title: "Check-In & Registration",
          icon: CheckCircle2,
          type: "event" as const,
        },
        {
          time: "7:08 PM ET",
          title: "Opening Ceremony: Are You Okay…Really?",
          facilitator: "Brian Goings",
          virtual: true,
          icon: Mic,
          highlight: true,
          type: "event" as const,
        },
        {
          time: "8:08 PM ET",
          title: "Game Night / Fellowship Activity",
          icon: Gamepad2,
          type: "event" as const,
        }
      ]
    },
    {
      day: "Saturday",
      date: "June 27",
      events: [
        {
          title: "Morning Activities",
          type: "header" as const,
          icon: Sparkles,
        },
        {
          time: "8:00 AM ET",
          title: "Morning Workout / Wellness Activity",
          facilitator: "Tobias Bordley",
          virtual: true,
          icon: Dumbbell,
          type: "event" as const,
        },
        {
          time: "8:45 AM ET",
          title: "Breakfast",
          icon: Utensils,
          type: "event" as const,
        },
        {
          time: "9:00 AM ET",
          title: "Opening Remarks & Business",
          virtual: true,
          subitems: [
            "Welcome & Introductions",
            "Acceptance of Agenda (Motion to Adopt)"
          ],
          icon: MessageSquare,
          type: "event" as const,
        },
        {
          title: "Session 1: Our Organization in Action",
          type: "session" as const,
          virtual: true,
          icon: Compass,
        },
        {
          time: "9:30 – 9:40 AM ET",
          title: "State of the Organization",
          facilitator: "Edward J. Cook",
          icon: Globe,
          type: "event" as const,
        },
        {
          time: "9:40 – 9:50 AM ET",
          title: "1st Anti Report",
          facilitator: "Brian Goings",
          icon: User,
          type: "event" as const,
        },
        {
          time: "9:50 – 10:00 AM ET",
          title: "Treasurer’s Financial Report",
          facilitator: "Ishmeal Allensworth",
          icon: Award,
          type: "event" as const,
        },
        {
          title: "Session 2: Vision, Climate & Strategy",
          type: "session" as const,
          virtual: true,
          icon: Globe,
        },
        {
          time: "10:00 – 10:30 AM ET",
          title: "How Today’s Climate Impacts Our Families",
          description: "Guest Speaker: Alabama State Representative",
          icon: Mic,
          type: "event" as const,
        },
        {
          time: "10:45 – 11:00 AM ET",
          title: "Our Family, Our Future: The Vision Ahead",
          facilitator: "Jack Dee",
          icon: Flame,
          type: "event" as const,
        },
        {
          time: "11:00 – 12:00 PM ET",
          title: "Our Family, Our Programs: Planning with Purpose",
          facilitator: "Anthony Jones",
          icon: Compass,
          type: "event" as const,
        },
        {
          time: "12:00 – 1:00 PM ET",
          title: "Lunch",
          icon: Utensils,
          type: "event" as const,
        },
        {
          title: "Community Service",
          type: "session" as const,
          icon: Heart,
        },
        {
          time: "1:00 – 3:00 PM ET",
          title: "From Our Family to Yours: A Community Service Initiative",
          virtual: true,
          description: "Include virtual participation option for remote attendees",
          icon: Heart,
          highlight: true,
          type: "event" as const,
        },
        {
          title: "Session 3: Reflection, Growth & Leadership",
          type: "session" as const,
          virtual: true,
          icon: Sparkles,
        },
        {
          time: "3:15 – 3:45 PM ET",
          title: "Check-In: My Vision Is Blurred",
          description: "Mental Health & Wellness Discussion",
          facilitator: "Social Worker / Mental Health Professional (TBD)",
          icon: MessageSquare,
          type: "event" as const,
        },
        {
          time: "4:00 – 4:30 PM ET",
          title: "Membership Certification Training",
          facilitator: "James Hayward",
          icon: Award,
          type: "event" as const,
        },
        {
          time: "4:30 – 4:45 PM ET",
          title: "Directorate Installation Ceremony",
          icon: Award,
          type: "event" as const,
        },
        {
          time: "5:00 – 6:00 PM ET",
          title: "New Directorate Call to Action",
          subitems: [
            "Amendments & Addendums",
            "Strategic Direction & Commitments"
          ],
          icon: MessageSquare,
          type: "event" as const,
        },
        {
          time: "7:30 – 9:00 PM ET",
          title: "Dinner",
          icon: Utensils,
          highlight: true,
          type: "event" as const,
        },
        {
          time: "11:00 PM – Until ET",
          title: "Night on the Town",
          icon: Sparkles,
          highlight: true,
          type: "event" as const,
        }
      ]
    },
    {
      day: "Sunday",
      date: "June 28",
      events: [
        {
          time: "9:00 AM ET",
          title: "Rededication and Closing Reflection",
          virtual: true,
          icon: Award,
          highlight: true,
          type: "event" as const,
        }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center relative w-full"
    >
      <div className="print:hidden w-full flex flex-col items-center">
        <FloatingParticles />
        
        {/* Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-silver z-50 origin-left"
          style={{ scaleX }}
        />

        <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12 relative z-10">
          <h1 className="text-4xl md:text-8xl font-outline text-outline uppercase tracking-widest mb-4 md:mb-6" style={{ transform: 'scaleY(1.2)' }}>
            Details
          </h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-1 bg-silver mx-auto" 
          />
          <div className="flex flex-col items-center justify-center gap-1 md:gap-2 mt-4 md:mt-6">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <span className="h-px w-10 md:w-16 bg-silver"></span>
              <h2 className="text-silver text-sm md:text-lg font-medium tracking-widest uppercase">June 26-28, 2026</h2>
              <span className="h-px w-10 md:w-16 bg-silver"></span>
            </div>
            <h2 className="text-silver text-sm md:text-lg font-medium tracking-widest uppercase">Charlotte, NC</h2>
          </div>
        </motion.div>

        {/* Conference Materials Section */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-xl mx-auto mb-10 relative z-10 px-2"
        >
          <div className="bg-pure-black/60 border border-silver/10 p-5 md:p-6 rounded-2xl backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between gap-3 mb-4 border-b border-silver/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-silver text-sm md:text-base font-bold uppercase tracking-widest">
                  Conference Materials
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                id="unlock-revision-btn"
                to="/constitution"
                className="w-full flex items-center justify-between p-4 bg-silver/5 hover:bg-silver/10 border border-silver/10 hover:border-silver/30 rounded-xl transition-all duration-300 text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-silver/10 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-all text-silver">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-white group-hover:text-primary transition-colors">
                      Constitution & By-Laws Revisions
                    </h4>
                    <p className="text-[9px] text-silver/50 tracking-wide uppercase mt-0.5">
                      Open to Revisions & Proposals
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-silver/40 group-hover:text-primary/70 flex items-center gap-1">
                  View & Revise <ChevronRight size={12} />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Interactive Tabs Slider */}
        <motion.div variants={itemVariants} className="flex flex-row justify-center gap-2 md:gap-4 mb-6 relative z-10 w-full max-w-xl px-2">
          {agendaData.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 text-center ${
                activeTab === idx
                  ? 'bg-silver text-black border-silver font-bold shadow-[0_4px_20px_rgba(255,255,255,0.15)] scale-[1.03]'
                  : 'bg-pure-black text-silver/60 border-silver/20 hover:text-white hover:border-silver/40'
              }`}
            >
              <span className="block text-[8px] md:text-[10px] uppercase tracking-[0.2em] opacity-85 mb-0.5">Day {idx + 1}</span>
              <span className="block text-xs md:text-sm font-semibold tracking-wide">{day.day}</span>
            </button>
          ))}
        </motion.div>

        {/* Print Button below the Day cards */}
        <motion.div 
          variants={itemVariants} 
          className="flex justify-center mb-10 relative z-10 w-full"
        >
          <button
            id="print-agenda-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-silver/30 bg-pure-black hover:bg-silver hover:text-black font-semibold text-sm text-silver transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(192,192,192,0.3)] active:scale-95 cursor-pointer"
          >
            <Printer size={16} />
            <span>Print Conference Schedule</span>
          </button>
        </motion.div>

        {/* Timeline Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
          className="w-full relative z-10 space-y-6 md:space-y-8"
        >
          {agendaData[activeTab].events.map((event, j) => {
            const EventIcon = event.icon || Clock;

            if (event.type === "header") {
              return (
                <div key={j} className="pt-4 pb-2 border-b border-silver/10 flex items-center gap-3">
                  <EventIcon className="w-5 h-5 text-primary animate-pulse shrink-0" />
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">
                    {event.title}
                  </h3>
                </div>
              );
            }

            if (event.type === "session") {
              return (
                <div 
                  key={j} 
                  className="p-6 rounded-2xl bg-gradient-to-r from-silver/10 to-transparent border border-silver/20 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-silver/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <EventIcon className="w-6 h-6 text-silver" />
                      <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest text-white font-display">
                        {event.title}
                      </h3>
                    </div>
                    {event.virtual && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-silver/10 border border-silver/30 text-white text-[9px] font-bold uppercase tracking-widest shadow-sm">
                        <Wifi size={10} className="animate-pulse" /> Virtual Experience
                      </span>
                    )}
                  </div>
                  {event.notes && (
                    <p className="text-xs text-silver/60 italic font-mono bg-pure-black/30 p-2.5 rounded-lg border border-silver/5 mt-1">
                      {event.notes}
                    </p>
                  )}
                </div>
              );
            }

            // Default event timeline item
            return (
              <motion.div 
                key={j} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: j * 0.04 }}
                className={`relative p-5 md:p-6 rounded-2xl border transition-all duration-300 ${
                  event.highlight 
                    ? 'border-silver bg-silver/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
                    : 'border-silver/10 bg-pure-black hover:border-silver/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                      event.highlight ? 'bg-silver text-black border-silver' : 'bg-silver/5 text-silver/70 border-silver/10'
                    }`}>
                      <EventIcon className="w-4 h-4 md:w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                          event.highlight ? 'text-primary' : 'text-silver/50'
                        }`}>
                          {event.time}
                        </span>
                      </div>
                      
                      <h4 className="text-base md:text-xl font-bold uppercase tracking-wider text-white">
                        {event.title}
                      </h4>

                      {event.description && (
                        <p className="text-xs md:text-sm text-silver/70 leading-relaxed max-w-2xl font-light">
                          {event.description}
                        </p>
                      )}

                      {event.facilitator && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-silver/5 text-silver/60 border border-silver/10 text-[10px] font-medium tracking-wide">
                          <User size={10} />
                          <span>Facilitator: {event.facilitator}</span>
                        </div>
                      )}

                      {event.notes && (
                        <p className="text-xs text-silver/60 italic font-mono bg-pure-black/30 p-2.5 rounded-lg border border-silver/5 mt-1">
                          {event.notes}
                        </p>
                      )}

                      {event.subitems && (
                        <ul className="mt-3 space-y-1.5 list-disc pl-5">
                          {event.subitems.map((sub, sIdx) => (
                            <li key={sIdx} className="text-xs md:text-sm text-silver/80 font-light tracking-wide leading-relaxed">
                              {sub}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:self-start">
                    {event.virtual && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-silver/10 border border-silver/30 text-white text-[9px] font-bold uppercase tracking-widest shrink-0">
                        <Wifi size={9} className="animate-pulse" /> Virtual Experience
                      </span>
                    )}
                    {event.inPersonOnly && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pure-black border border-silver/20 text-silver/60 text-[9px] font-bold uppercase tracking-[0.1em] shrink-0">
                        <MapPin size={9} className="text-red-400 animate-bounce" /> In-person Only
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12 md:mt-16 w-full flex justify-center">
          <MotionLink 
            whileHover={{ 
              scale: 1.05, 
              y: -5, 
              boxShadow: '0 0 30px rgba(192,192,192,0.6)',
              transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.95 }}
            to="/" 
            className="btn-silver inline-flex items-center gap-2"
          >
            Return to Home <ArrowRight size={16} />
          </MotionLink>
        </motion.div>
      </div>

      {/* Printable version of the COMPLETE agenda - ONLY visible when printing */}
      <div id="printable-agenda" className="hidden print:block w-full text-black bg-white p-12 space-y-8 font-sans">
        <div className="text-center pb-6">
          <h1 id="printable-title" className="text-3xl font-black uppercase tracking-widest mb-1 text-black">
            Details
          </h1>
          <p className="text-xs font-semibold tracking-widest uppercase text-black/70">
            June 26-28, 2026 — Charlotte, NC
          </p>
        </div>

        {agendaData.map((day, dIdx) => (
          <div key={dIdx} className="space-y-4 break-inside-avoid">
            <h2 className="text-xl font-black uppercase tracking-widest mt-8 mb-4 text-black text-center">
              Day {dIdx + 1}: {day.day}, {day.date}
            </h2>

            <div className="space-y-4">
              {day.events.map((event, eIdx) => {
                if (event.type === "header") {
                  return (
                    <div key={eIdx} className="font-extrabold text-sm uppercase tracking-wider text-black/80 pt-4 break-inside-avoid">
                      {event.title}
                    </div>
                  );
                }

                if (event.type === "session") {
                  return (
                    <div key={eIdx} className="py-2.5 font-bold uppercase tracking-widest text-sm text-black flex justify-between items-center break-inside-avoid">
                      <span>{event.title}</span>
                      {event.virtual && (
                        <span className="text-[10px] lowercase tracking-normal bg-black/10 px-2 py-0.5 rounded font-normal shrink-0">
                          (virtual experience)
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={eIdx} className="grid grid-cols-[140px_1fr] gap-4 py-3 align-top break-inside-avoid">
                    <div className="font-bold text-xs uppercase tracking-wider text-black pt-0.5 font-mono">
                      {event.time}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-black uppercase tracking-wide">
                        {event.title}
                        {event.virtual && <span className="text-[10px] font-normal lowercase text-black/60 tracking-normal ml-1.5">(virtual)</span>}
                      </h4>
                      
                      {event.description && (
                        <p className="text-xs text-black/80 font-light leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      
                      {event.facilitator && (
                        <p className="text-[11px] text-black font-medium mt-1">
                          Facilitator: {event.facilitator}
                        </p>
                      )}

                      {event.subitems && (
                        <ul className="mt-1.5 space-y-1 list-disc pl-5">
                          {event.subitems.map((sub, sIdx) => (
                             <li key={sIdx} className="text-xs text-black/80 font-light">
                              {sub}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
