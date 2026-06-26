import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  ExternalLink, 
  Clock, 
  Calendar, 
  MapPin, 
  Mic, 
  Dumbbell, 
  Utensils, 
  MessageSquare, 
  Compass, 
  Globe, 
  User, 
  Award, 
  Flame, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Download, 
  Info, 
  Monitor, 
  Users,
  ShieldCheck,
  ChevronRight,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EventAddToCalendar from '../components/EventAddToCalendar';

const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.4
          }}
          animate={{
            y: [null, Math.random() * -100 + "%"],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: Math.random() * 12 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default function ConferencePortal() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [virtualOnly, setVirtualOnly] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('conference_portal_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Countdown to Friday, June 26, 2026, 7:00 PM ET (Opening Ceremony)
  const targetDate = new Date(Date.UTC(2026, 5, 26, 23, 0, 0));
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const agendaData: any[] = [
    {
      day: "Friday",
      date: "June 26",
      events: [
        {
          time: "4:30 – 6:30 PM ET",
          title: "Check-In & Registration",
          icon: CheckCircle2,
          type: "event" as const,
          startTime: "20260626T203000Z",
          endTime: "20260626T223000Z",
          virtual: false,
          isPast: true
        },
        {
          time: "6:30 – 7:30 PM ET",
          title: "Technology Check",
          icon: Monitor,
          type: "event" as const,
          startTime: "20260626T223000Z",
          endTime: "20260626T233000Z",
          virtual: true,
          isPast: true
        },
        {
          time: "8:30 – 9:30 PM ET",
          title: "Are You Really Okay?",
          virtual: true,
          icon: Mic,
          highlight: true,
          type: "event" as const,
          startTime: "20260627T003000Z",
          endTime: "20260627T013000Z"
        },
        {
          time: "9:30 PM – Until ET",
          title: "Game Night",
          description: "Pink Out",
          icon: Gamepad2Icon,
          highlight: true,
          type: "event" as const,
          startTime: "20260627T013000Z",
          endTime: "20260627T033000Z",
          virtual: false
        }
      ]
    },
    {
      day: "Saturday",
      date: "June 27",
      events: [
        {
          title: "Morning",
          type: "header" as const,
          icon: Sparkles,
        },
        {
          time: "7:00 – 8:00 AM ET",
          title: "Tobias Takes Us Through It",
          icon: Dumbbell,
          type: "event" as const,
          startTime: "20260627T110000Z",
          endTime: "20260627T120000Z",
          virtual: false
        },
        {
          time: "8:00 – 8:30 AM ET",
          title: "Breakfast",
          icon: Utensils,
          type: "event" as const,
          startTime: "20260627T120000Z",
          endTime: "20260627T123000Z",
          virtual: false
        },
        {
          time: "8:30 – 9:30 AM ET",
          title: "Refresh & Travel Prep",
          icon: Clock,
          type: "event" as const,
          startTime: "20260627T123000Z",
          endTime: "20260627T133000Z",
          virtual: false
        },
        {
          time: "9:30 – 9:45 AM ET",
          title: "Travel to Conference Venue (15 min)",
          icon: MapPin,
          type: "event" as const,
          startTime: "20260627T133000Z",
          endTime: "20260627T134500Z",
          virtual: false
        },
        {
          time: "9:45 – 10:00 AM ET",
          title: "Arrival & Setup",
          icon: MapPin,
          type: "event" as const,
          startTime: "20260627T134500Z",
          endTime: "20260627T140000Z",
          virtual: false
        },
        {
          time: "10:00 – 10:10 AM ET",
          title: "Opening Business",
          icon: MessageSquare,
          type: "event" as const,
          startTime: "20260627T140000Z",
          endTime: "20260627T141000Z",
          virtual: true
        },
        {
          title: "Session I: Our Organization in Action",
          type: "session" as const,
          virtual: true,
          icon: Compass,
        },
        {
          time: "10:10 – 10:15 AM ET",
          title: "Basileus Address",
          icon: Globe,
          type: "event" as const,
          startTime: "20260627T141000Z",
          endTime: "20260627T141500Z",
          virtual: true
        },
        {
          time: "10:15 – 10:20 AM ET",
          title: "1st Anti Report",
          icon: User,
          type: "event" as const,
          startTime: "20260627T141500Z",
          endTime: "20260627T142000Z",
          virtual: true
        },
        {
          time: "10:20 – 10:30 AM ET",
          title: "Financial Report",
          icon: Award,
          type: "event" as const,
          startTime: "20260627T142000Z",
          endTime: "20260627T143000Z",
          virtual: true
        },
        {
          title: "Session II: Vision, Climate & Strategy",
          type: "session" as const,
          virtual: true,
          icon: Globe,
        },
        {
          time: "10:30 – 11:00 AM ET",
          title: "Mental Health & LGBTQIA+",
          icon: Mic,
          type: "event" as const,
          startTime: "20260627T143000Z",
          endTime: "20260627T150000Z",
          virtual: true
        },
        {
          time: "11:00 – 11:30 AM ET",
          title: "Building the Digital Legacy",
          icon: Flame,
          type: "event" as const,
          startTime: "20260627T150000Z",
          endTime: "20260627T153000Z",
          virtual: true
        },
        {
          time: "11:30 AM – 12:15 PM ET",
          title: "Planning with Purpose",
          icon: Compass,
          type: "event" as const,
          startTime: "20260627T153000Z",
          endTime: "20260627T161500Z",
          virtual: true
        },
        {
          time: "12:15 – 1:30 PM ET",
          title: "Lunch & Constitution Review",
          icon: Utensils,
          type: "event" as const,
          startTime: "20260627T161500Z",
          endTime: "20260627T173000Z",
          virtual: true
        },
        {
          time: "1:30 – 3:00 PM ET",
          title: "Community Service Project",
          icon: Heart,
          highlight: true,
          type: "event" as const,
          startTime: "20260627T173000Z",
          endTime: "20260627T190000Z",
          virtual: true
        },
        {
          title: "Session III: Reflection, Growth & Leadership",
          type: "session" as const,
          virtual: true,
          icon: Sparkles,
        },
        {
          time: "3:00 – 4:00 PM ET",
          title: "MIP Certification",
          icon: Award,
          type: "event" as const,
          startTime: "20260627T190000Z",
          endTime: "20260627T200000Z",
          virtual: true
        },
        {
          time: "4:00 – 4:45 PM ET",
          title: "Directorate Installation",
          icon: Award,
          type: "event" as const,
          startTime: "20260627T200000Z",
          endTime: "20260627T204500Z",
          virtual: true
        },
        {
          time: "4:45 – 5:15 PM ET",
          title: "Call to Action",
          icon: MessageSquare,
          type: "event" as const,
          startTime: "20260627T204500Z",
          endTime: "20260627T211500Z",
          virtual: true
        },
        {
          time: "7:00 – 9:00 PM ET",
          title: "Dinner",
          icon: Utensils,
          highlight: true,
          type: "event" as const,
          startTime: "20260627T230000Z",
          endTime: "20260628T010000Z",
          virtual: false
        },
        {
          time: "11:00 PM – Until ET",
          title: "Night on the Town",
          icon: Sparkles,
          highlight: true,
          type: "event" as const,
          startTime: "20260628T030000Z",
          endTime: "20260628T050000Z",
          virtual: false
        }
      ]
    },
    {
      day: "Sunday",
      date: "June 28",
      events: [
        {
          time: "9:00 – 9:30 AM ET",
          title: "Family Matters: True to Our Core Again Reflection",
          virtual: true,
          icon: Award,
          highlight: true,
          type: "event" as const,
          startTime: "20260628T130000Z",
          endTime: "20260628T133000Z"
        },
        {
          time: "9:30 – 9:45 AM ET",
          title: "Closing Remarks",
          icon: MessageSquare,
          type: "event" as const,
          startTime: "20260628T133000Z",
          endTime: "20260628T134500Z",
          virtual: true
        },
        {
          time: "11:00 AM ET",
          title: "Check-Out & Departure",
          icon: CheckCircle2,
          type: "event" as const,
          startTime: "20260628T150000Z",
          endTime: "20260628T160000Z",
          virtual: false
        }
      ]
    }
  ];

  const zoomRegisterLink = "https://us06web.zoom.us/j/83618798524?pwd=0AVyq61ziNMb3ui5lM2wfNMoIdrpnG.1";

  const activeDayData = agendaData[activeTab];

  // Filtering events based on search and virtual toggle
  const filteredEvents = activeDayData.events.filter(event => {
    if (event.type === "header" || event.type === "session") {
      return true; // Keep headers/sections for layout
    }
    const matchesSearch = 
      (event.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.facilitator || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVirtual = !virtualOnly || event.virtual;
    
    return matchesSearch && matchesVirtual;
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2012') {
      setIsAuthenticated(true);
      setAuthError(false);
      localStorage.setItem('conference_portal_authenticated', 'true');
    } else {
      setAuthError(true);
      setPassword('');
    }
  };

  const attendees = [
    "Anthony Jones",
    "Brandon Owens",
    "Brian Johnson",
    "Darron Jenkins",
    "Demetrist Thomas",
    "Denzel Talley",
    "Deshaun Safford",
    "Edward Cook",
    "Ishmeal Allensworth",
    "Jack Dee",
    "James Haywood",
    "Jason Pilar",
    "Keith Woods",
    "Tobias Bordley"
  ];

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen w-full bg-[#030303] text-silver overflow-hidden flex flex-col items-center justify-center p-4">
        <FloatingParticles />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pure-black/90 border border-primary/20 rounded-3xl p-8 md:p-12 max-w-md w-full backdrop-blur-md relative z-10 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-2">Secure Portal</h1>
            <p className="text-silver/60 text-sm font-light tracking-wider">Please enter the conference password to access the portal.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError(false);
                }}
                placeholder="Enter password..."
                className={`w-full bg-black/60 border ${authError ? 'border-red-500/50 focus:border-red-500' : 'border-silver/10 focus:border-primary/50'} text-white rounded-xl px-4 py-4 focus:outline-none transition-all text-center tracking-widest`}
              />
              {authError && <p className="text-red-400 text-xs text-center mt-2 tracking-wider">Incorrect password. Please try again.</p>}
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-primary hover:bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter Portal <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-silver overflow-hidden">
      <FloatingParticles />

      {/* Decorative backdrop glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
      
      {/* Welcome Banner Marquee */}
      <div className="relative z-20 mt-20 md:mt-24 text-center px-4 mb-4">
        <h2 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-[0.15em]">
          Welcome to our registered members
        </h2>
      </div>
      <div className="w-full bg-primary text-black py-3 overflow-hidden flex whitespace-nowrap relative z-20 shadow-[0_0_20px_rgba(212,175,55,0.15)] border-y border-primary/50">
        <div className="animate-marquee flex items-center gap-8 min-w-max">
          {[...attendees, ...attendees, ...attendees, ...attendees].map((name, i) => (
            <span key={i} className="text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-8">
              <span>{name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-black/60 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        
        {/* Portal Header */}
        <header className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-4">
            <MapPin size={11} className="text-primary" />
            CHARLOTTE, NC
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-display">
            The Biennial <span className="text-primary">Conference Portal</span>
          </h1>
          <p className="text-silver/60 text-xs md:text-sm tracking-widest uppercase font-medium mt-3 max-w-xl mx-auto">
            The centralized access center, scheduling matrix, and digital artifact source for the Order of KPI for the 2026 Biennial Conference.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* LEFT PANEL: Zoom Registration & Timer Card (4cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ZOOM REGISTRATION MAIN CARD */}
            <div className="bg-pure-black/90 border border-primary/35 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-[0_10px_35px_rgba(212,175,55,0.08)]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Video size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white text-sm font-black uppercase tracking-wider">Virtual Presence</h2>
                    <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Zoom Access Hub</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black uppercase tracking-widest text-red-400 animate-pulse">
                  Required
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-silver/80 text-[11px] leading-relaxed uppercase tracking-wider font-semibold text-center md:text-left">
                  ALL virtual participants are strictly required to pre-register on Zoom to generate secure session access credentials.
                </p>
                
                <div className="p-3.5 bg-silver/5 border border-silver/10 rounded-2xl flex items-start gap-3">
                  <ShieldCheck size={16} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-silver/60 uppercase tracking-wide leading-relaxed font-semibold">
                    Once you register, Zoom will send your custom link and calendar updates straight to your inbox.
                  </p>
                </div>
              </div>

              {/* Registration Action */}
              <motion.a
                href={zoomRegisterLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit mx-auto py-4 px-6 bg-primary hover:bg-white text-black font-black uppercase tracking-[0.18em] rounded-2xl transition-all text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-primary/10 cursor-pointer mb-5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Video size={15} />
                <span>Register For Zoom</span>
                <ExternalLink size={13} className="opacity-80" />
              </motion.a>

              {/* Countdown or Status */}
              <div className="border-t border-silver/10 pt-5 text-center">
                <span className="text-[9px] uppercase tracking-[0.2em] text-silver/40 font-bold block mb-3">
                  {timeLeft.isExpired ? "Conference Has Begun" : "Countdown to Opening Ceremony"}
                </span>

                {timeLeft.isExpired ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles size={11} className="animate-spin" /> Live in Session
                  </div>
                ) : (
                  <div className="flex justify-center items-center gap-3">
                    <div className="text-center min-w-[40px]">
                      <span className="font-mono text-xl font-extrabold text-white block">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-silver/40 font-black block mt-0.5">Days</span>
                    </div>
                    <div className="text-primary/30 font-mono text-md font-bold">:</div>
                    <div className="text-center min-w-[40px]">
                      <span className="font-mono text-xl font-extrabold text-white block">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-silver/40 font-black block mt-0.5">Hrs</span>
                    </div>
                    <div className="text-primary/30 font-mono text-md font-bold">:</div>
                    <div className="text-center min-w-[40px]">
                      <span className="font-mono text-xl font-extrabold text-white block">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-silver/40 font-black block mt-0.5">Mins</span>
                    </div>
                    <div className="text-primary/30 font-mono text-md font-bold">:</div>
                    <div className="text-center min-w-[40px]">
                      <span className="font-mono text-xl font-extrabold text-white block">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[7px] uppercase tracking-widest text-silver/40 font-black block mt-0.5">Secs</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KP MEMBER PORTAL PROTOTYPE */}
            <div className="bg-pure-black/95 border border-primary/25 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <h2 className="text-white text-sm font-black uppercase tracking-wider">KP Member Portal</h2>
                  <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">Prototype Access</span>
                </div>
              </div>
              <p className="text-silver/60 text-[10px] leading-relaxed uppercase tracking-wide font-semibold mb-5">
                Preview the upcoming KP Member Portal features and design.
              </p>
              <a
                href="https://stitch.withgoogle.com/preview/5137630539613338453?node-id=279e48f3474342659d3a7000c1896cfa&raw=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit mx-auto py-3.5 px-6 bg-primary/5 hover:bg-primary border border-primary text-primary hover:text-black font-black uppercase tracking-[0.15em] rounded-2xl transition-all text-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>View Prototype</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* DETAILED AGENDA PORTAL CARD */}
            <div className="bg-pure-black/95 border border-primary/25 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-lg hover:border-primary/50 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-white text-sm font-black uppercase tracking-wider">Conference Details</h2>
                  <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">Full Interactive Agenda</span>
                </div>
              </div>
              <p className="text-silver/60 text-[10px] leading-relaxed uppercase tracking-wide font-semibold mb-5">
                Explore the session schedule and resources.
              </p>
              <Link
                to="/agenda"
                className="w-fit mx-auto py-3.5 px-6 bg-primary/5 hover:bg-primary border border-primary text-primary hover:text-black font-black uppercase tracking-[0.15em] rounded-2xl transition-all text-xs flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>View Full Details & Guide</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* QUICK INFORMATION & GENERAL POLICIES */}
            <div className="bg-pure-black border border-silver/10 rounded-3xl p-5 backdrop-blur-md space-y-4">
              <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Info size={13} className="text-primary" /> Conference Protocols
              </h3>
              
              <ul className="space-y-3">
                <li className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-[10px] text-silver/60 uppercase tracking-wide leading-relaxed font-semibold">
                    <strong className="text-white">Credentials Required:</strong> You must log into the Zoom meeting using the same email address that registered for verification.
                  </p>
                </li>
                <li className="flex gap-2.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-[10px] text-silver/60 uppercase tracking-wide leading-relaxed font-semibold">
                    <strong className="text-white">Professional Dress:</strong> Friday Pink Out theme, Saturday formal attire, Sunday organizational black & silver coordinates.
                  </p>
                </li>
              </ul>
            </div>

          </div>

          {/* RIGHT PANEL: Detailed Schedule Matrix (7cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-pure-black border border-silver/10 rounded-3xl p-5 md:p-6 backdrop-blur-md">
              
              {/* Header inside Schedule */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-silver/10 pb-5 mb-6">
                <div>
                  <h2 className="text-white text-sm font-black uppercase tracking-wider">Conference Schedule</h2>
                  <span className="text-[9px] text-silver/40 font-bold uppercase tracking-widest">Active Matrix Feed</span>
                </div>
                
                {/* Virtual Only Toggle Filter */}
                <button
                  onClick={() => setVirtualOnly(!virtualOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                    virtualOnly 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'bg-silver/5 border-silver/15 text-silver/60 hover:border-silver/30'
                  }`}
                >
                  <Monitor size={10} />
                  <span>Virtual-Friendly Only</span>
                </button>
              </div>

              {/* Day Selection Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {agendaData.map((dayObj, idx) => (
                  <button
                    key={dayObj.day}
                    onClick={() => setActiveTab(idx)}
                    className={`py-3 rounded-2xl flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                      activeTab === idx
                        ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5'
                        : 'bg-[#060606] border-silver/10 text-silver hover:border-silver/20 hover:text-white'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]">{dayObj.day}</span>
                    <span className="text-[8px] uppercase tracking-widest opacity-60 font-semibold">{dayObj.date}</span>
                  </button>
                ))}
              </div>

              {/* Live Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver/40" size={13} />
                <input
                  type="text"
                  placeholder="SEARCH SESSIONS, KEYNOTES, OR FACILITATORS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/60 border border-silver/10 focus:border-primary/50 text-white rounded-2xl pl-10 pr-4 py-3 text-[10px] focus:outline-none transition-all font-semibold uppercase tracking-wider shadow-inner"
                />
              </div>

              {/* Events Loop */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-10"
                    >
                      <p className="text-silver/40 text-[10px] uppercase font-bold tracking-widest">
                        No matching conference events discovered.
                      </p>
                    </motion.div>
                  ) : (
                    filteredEvents.map((event, index) => {
                      const IconComponent = event.icon || Sparkles;

                      if (event.type === 'header') {
                        return (
                          <motion.div
                            key={`header-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pt-4 pb-2 border-b border-silver/5"
                          >
                            <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                              <Sparkles size={11} /> {event.title}
                            </h3>
                          </motion.div>
                        );
                      }

                      if (event.type === 'session') {
                        return (
                          <motion.div
                            key={`session-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-silver/5 border border-silver/10 rounded-2xl p-4 my-2 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-silver/10 rounded-lg text-primary">
                                <IconComponent size={14} />
                              </div>
                              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                                {event.title}
                              </h4>
                            </div>
                            {event.virtual && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary">
                                <Monitor size={9} /> Virtual
                              </span>
                            )}
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={`event-${index}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`group/item border rounded-2xl p-4 transition-all relative overflow-hidden bg-pure-black hover:border-silver/30 ${
                            event.highlight 
                              ? 'border-primary/30 shadow-[0_4px_15px_rgba(212,175,55,0.05)]' 
                              : 'border-silver/10'
                          } ${event.isPast ? 'opacity-40 grayscale' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
                            
                            {/* Event Main Content */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase font-bold tracking-widest">
                                <span className="text-primary flex items-center gap-1 font-extrabold">
                                  <Clock size={10} /> {event.time}
                                </span>
                                {event.virtual ? (
                                  <span className="text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-extrabold">
                                    <Monitor size={8} /> Virtual Friendly
                                  </span>
                                ) : (
                                  <span className="text-silver/40 bg-silver/5 px-2 py-0.5 rounded-full border border-silver/10 flex items-center gap-1">
                                    <MapPin size={8} /> Charlotte ONLY
                                  </span>
                                )}
                              </div>

                              <h4 className="text-white group-hover/item:text-primary transition-colors text-xs font-bold uppercase tracking-wide leading-relaxed">
                                {event.title}
                              </h4>

                              {event.facilitator && (
                                <p className="text-[10px] text-silver/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                  <User size={10} className="text-silver/30" /> Facilitator: <span className="text-silver/80">{event.facilitator}</span>
                                </p>
                              )}

                              {event.description && (
                                <p className="text-[10px] text-silver/40 uppercase tracking-wide leading-relaxed font-semibold">
                                  {event.description}
                                </p>
                              )}

                              {(event as any).subitems && (
                                <ul className="pl-4 border-l border-primary/20 space-y-1 mt-2">
                                  {(event as any).subitems.map((sub: string, sIdx: number) => (
                                    <li key={sIdx} className="text-[9px] text-silver/50 uppercase font-semibold tracking-wide flex items-center gap-1.5">
                                      <ChevronRight size={10} className="text-primary/40 shrink-0" />
                                      {sub}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Calendar Export & Action Button */}
                            {event.startTime && event.endTime && (
                              <div className="shrink-0 self-start md:self-center">
                                <EventAddToCalendar
                                  title={event.title}
                                  description={event.description}
                                  facilitator={event.facilitator}
                                  startTime={event.startTime}
                                  endTime={event.endTime}
                                />
                              </div>
                            )}

                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// Fallback Gamepad2Icon to prevent resolution errors on build
function Gamepad2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="6" x2="10" y1="12" y2="12" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="15" x2="15.01" y1="13" y2="13" />
      <line x1="18" x2="18.01" y1="11" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="3" />
    </svg>
  );
}
