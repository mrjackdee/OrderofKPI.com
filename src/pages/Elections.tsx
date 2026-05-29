import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useForm, ValidationError } from '@formspree/react';
import { 
  CheckCircle2, 
  Send, 
  X, 
  Info, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  HelpCircle,
  ChevronRight,
  AlertCircle,
  Lock,
  Check,
  Vote as VoteIcon,
  Users
} from 'lucide-react';

// --- Types ---
interface Position {
  title: string;
  summary: string;
  description: string[];
  expectations?: string;
}

interface TimelineStep {
  label: string;
  date: string;
  status: 'past' | 'current' | 'future' | 'done';
  description?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// --- Data ---
const nominees = [
  { position: "1st Anti-Basileus", names: ["Anthony Jones"] },
  { position: "2nd Anti-Basileus", names: ["James “JR” Hayward"] },
  { position: "Grammateus", names: ["Brian Johnson"] },
  { position: "Epistoleus", names: ["Edward Cook"] },
  { position: "Historian", names: ["Brandon Owens"] },
  { position: "Hodegos", names: ["Darron Jenkins"] },
  { position: "Tamiouchos", names: ["Ishmael Allensworth"] },
];

const positions: Position[] = [
  {
    title: "Basileus",
    summary: "Presides over meetings and serves as the official representative of the organization.",
    description: [
      "Preside at each meeting, prepare agenda, and give structure and direction",
      "Adhere to parliamentary procedure",
      "Serve as an ex-officio member of all committees except Nominating",
      "Recommend members for appointed positions",
      "Approve, implement, and delegate all business of the organization",
      "Must be knowledgeable of parliamentary procedures, 'The Mother', and 'The Light'"
    ]
  },
  {
    title: "1st Anti-Basileus",
    summary: "Assumes the duties of the Basileus during their absence.",
    description: [
      "Assume the duties of the Basileus during their absence",
      "Represent the Basileus upon their request or absence",
      "Receive reports from all committees in relation to official work and report to the directorate"
    ]
  },
  {
    title: "2nd Anti-Basileus",
    summary: "Assumes duties if Basileus and 1st Anti-Basileus are absent. Must be a neophyte.",
    description: [
      "Assume the duties of the Basileus if the 1st Anti-Basileus and Basileus are absent",
      "Represent the Basileus upon their request or absence",
      "Must be a neophyte member and/or the last membership pledge class"
    ]
  },
  {
    title: "Grammateus",
    summary: "Maintains accurate records of all organizational proceedings.",
    description: [
      "Maintain accurate records of all organizational proceedings and roster of active members",
      "Call roll at each meeting and whenever requested",
      "Read previous recorded minutes and/or provide copies",
      "Report committees' recommendations and record business in bound volumes",
      "Assist the Basileus in preparing the agenda and establishing quorum",
      "Seal and preserve ballots and tallies for elections"
    ]
  },
  {
    title: "Pecunious Grammateus",
    summary: "Records all monies and manages receipts for the organization.",
    description: [
      "Record all monies and give receipts for all income received",
      "Maintain duplicates of all receipts in the Receipt Book",
      "Maintain the cash receipts journal and current alphabetical list of financial members",
      "Maintain record of funds submitted to the Tamiouchos",
      "Keep record of all payments made by each member",
      "Serve on the Budget and Finance Committee"
    ]
  },
  {
    title: "Tamiouchos",
    summary: "Guardian of all organization funds and financial reporting.",
    description: [
      "Guardian of all organization funds and maintains the organizational Cash Ledger",
      "Reconcile monthly bank statements and provide monthly reports of income and expenditures",
      "Prepare the annual financial report and annual budget",
      "Secure approval for spending non-budgeted monies through the contingency fund",
      "May chair the Budget and Finance Committee"
    ]
  },
  {
    title: "Epistoleus",
    summary: "Manages all organization correspondence and meeting notifications.",
    description: [
      "Notify members of meetings and check organization email regularly",
      "Send out correspondence as directed by the Basileus",
      "Maintain correspondence files and read correspondence at meetings"
    ]
  },
  {
    title: "Hodegos",
    summary: "Receives visitors and manages organization courtesies and ceremonies.",
    description: [
      "Receive and introduce all visitors",
      "Take care of all courtesies the organization should extend",
      "Member of the Social, Hospitality, and Protocol Committee",
      "Assist the Basileus with all Ceremonies",
      "Assist the Membership Intake chairmen with functions and receptions"
    ]
  },
  {
    title: "Historian",
    summary: "Preserves the organization's history and archives activities.",
    description: [
      "Maintain accurate historical records and prepare narrative archives",
      "Keep pictures, newspaper articles, and other media related to activities",
      "Chair the Archives and Awards Committee",
      "Responsible for making the organization scrapbook (yearly/biannually)"
    ]
  }
];

const timeline: TimelineStep[] = [
  { label: "Nominations Open", date: "April 13, 2026", status: 'done' },
  { label: "Nominations Close", date: "April 27, 2026", status: 'done' },
  { label: "Preliminary Ballot Review", date: "May 10, 2026", status: 'done' },
  { label: "Election Meeting", date: "May 17, 2026", status: 'done' },
  { label: "Acceptance Form Opens", date: "May 18, 2026", status: 'current', description: "Forms sent to nominees" },
  { 
    label: "Acceptance Deadline", 
    date: "May 20, 2026", 
    status: 'future',
    description: "Failure to respond is taken as non-acceptance"
  },
  { label: "Official Ballot Opens", date: "May 22, 2026", status: 'future', description: "Voting begins" },
  { label: "Ballot Closes", date: "May 27, 2026", status: 'future' },
  { label: "Installation", date: "June 2026", status: 'future' }
];

const faqs: FAQItem[] = [
  {
    question: "Who is eligible to nominate?",
    answer: "All financial members in good standing are eligible. Nominees must be part of the organization for at least a year, except for the 2nd Anti-Basileus (Neophyte)."
  },
  {
    question: "How does the voting process work?",
    answer: "Voting requires two-thirds of financial members to participate. Proxy votes are allowed if requested in writing to the Nominating Committee before the first day of voting."
  },
  {
    question: "What is the quorum for voting?",
    answer: "A quorum consists of a simple majority (51%) of financial members present at an announced meeting."
  },
  {
    question: "What is the term of office?",
    answer: "The term for each officer is two years, running from July 1st to June 30th."
  }
];

// --- Components ---
const SectionDivider = () => (
  <div className="w-full flex items-center justify-center py-4 opacity-20">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-silver to-transparent" />
    <div className="mx-4">
      <div className="w-2 h-2 rotate-45 border border-silver" />
    </div>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-silver to-transparent" />
  </div>
);

const PolishedSeparator = () => (
  <div className="w-full max-w-4xl mx-auto py-8 flex items-center gap-6">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
      <div className="w-2 h-2 rotate-45 border-2 border-primary/50" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
    </div>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
  </div>
);

const PasswordGate = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  return (
    <div className="min-h-screen bg-pure-black flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black border border-silver/10 p-8 md:p-12 rounded-3xl text-center shadow-[0_0_50px_rgba(192,192,192,0.05)]"
      >
        <div className="w-16 h-16 rounded-full bg-silver/5 flex items-center justify-center text-primary mx-auto mb-8 border border-silver/10">
          <Lock size={24} />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-2">
          Elections Closed
        </h1>
        <p className="text-silver/40 text-[10px] uppercase tracking-[0.3em] mb-8">
          Elections & Nominations 2026
        </p>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-8 text-center">
          <p className="text-primary text-xs uppercase tracking-wider font-semibold leading-relaxed">
            The 2026 elections process is now complete and login access has been disabled. Thank you for your participation.
          </p>
        </div>

        <Link 
          to="/"
          className="inline-block w-full py-4 bg-silver text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all text-center"
        >
          Return Home
        </Link>

        <p className="mt-8 text-silver/20 text-[9px] uppercase tracking-[0.2em] leading-relaxed">
          This portal is restricted to authorized members of The Order of KP, Inc.
        </p>
      </motion.div>
    </div>
  );
};

interface ElectionsHeroProps {
  onTimelineClick: () => void;
  onPreliminaryClick: () => void;
}

const ElectionsHero: React.FC<ElectionsHeroProps> = ({ onTimelineClick, onPreliminaryClick }) => (
  <section className="w-full py-10 md:py-16 px-6 flex flex-col items-start max-w-6xl mx-auto relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-silver/5 to-transparent -z-10 blur-3xl" />
    
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-silver/10 border border-silver/20 mb-6"
    >
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Preliminary Ballot Review</span>
    </motion.div>

    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-8xl font-outline text-outline uppercase tracking-widest leading-tight mb-4"
      style={{ transform: 'scaleY(1.1)' }}
    >
      Elections &<br />Nominations
    </motion.h1>

    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-silver/80 text-lg md:text-xl font-light max-w-2xl mb-8 leading-relaxed"
    >
      Shape the future of our organization. The nomination period for the 2026-2028 Directorate has concluded. Review the preliminary ballot and upcoming dates .
    </motion.p>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-4"
    >
      <button 
        onClick={onTimelineClick}
        className="px-8 py-4 border border-silver/30 text-silver font-bold uppercase tracking-widest rounded-xl hover:bg-silver/10 transition-all"
      >
        View Election Timeline
      </button>
        <button 
        onClick={onPreliminaryClick}
        className="px-8 py-4 bg-primary/10 border border-primary/30 text-primary font-bold uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all"
      >
        Ballot
      </button>
      <Link 
        to="/constitution"
        className="px-8 py-4 border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
      >
        <ShieldCheck size={18} />
        Constitution Details
      </Link>
    </motion.div>
  </section>
);

interface ElectionTimelineProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
}

const ElectionTimeline: React.FC<ElectionTimelineProps> = ({ timelineRef }) => (
  <section ref={timelineRef} className="w-full py-10 px-6 bg-silver/5 border-y border-silver/10">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-widest mb-10 text-center">
        Election Timeline
      </h2>
      
      <div className="relative pt-4">
        {/* Horizontal Connecting Line (Desktop) */}
        <div className="hidden lg:block absolute top-[28px] left-[calc(100%/18)] right-[calc(100%/18)] h-px bg-gradient-to-r from-primary/50 via-primary/20 to-silver/5 -z-0" />
        
        {/* Vertical Connecting Line (Mobile/Tablet) */}
        <div className="lg:hidden absolute left-1/2 top-4 bottom-12 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent -translate-x-1/2 -z-0" />

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-12 lg:gap-4 relative">
          {timeline.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center group relative bg-pure-black/40 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-silver/5 lg:border-none"
            >
              <div className={`w-6 h-6 rounded-full border-2 mb-4 z-10 transition-all duration-500 flex items-center justify-center shrink-0 ${
                step.status === 'current' ? 'bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(192,192,192,0.5)]' : 
                step.status === 'past' || step.status === 'done' ? 'bg-primary border-primary text-black' : 'bg-black border-silver/40'
              }`}>
                {(step.status === 'past' || step.status === 'done') && <Check size={12} strokeWidth={4} />}
              </div>
              <h3 className={`text-[10px] lg:text-[11px] font-bold uppercase tracking-widest mb-1 ${
                step.status === 'current' ? 'text-primary' : 'text-silver/60'
              }`}>
                {step.label}
              </h3>
              <p className="text-[9px] text-silver/40 uppercase tracking-widest mb-2 font-medium">{step.date}</p>
              {step.description && (
                <p className="text-[8px] text-silver/30 uppercase tracking-[0.1em] leading-tight max-w-[120px] mx-auto italic">
                  {step.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

interface PositionCardProps {
  position: Position;
  onDetailsClick: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onDetailsClick }) => (
  <motion.div 
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    whileHover={{ y: -4 }}
    className="bg-black border border-silver/20 p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-primary/50 transition-all group"
  >
    <h3 className="text-xl font-bold text-primary uppercase tracking-widest group-hover:text-white transition-colors">
      {position.title}
    </h3>
    <p className="text-silver/60 text-sm font-light leading-relaxed">
      {position.summary}
    </p>
    <ul className="space-y-2 mt-2">
      {position.description.slice(0, 2).map((point, i) => (
        <li key={i} className="flex gap-3 text-[11px] text-silver/40 uppercase tracking-wider leading-tight">
          <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onDetailsClick}
      className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:text-white transition-colors"
    >
      <Info size={14} />
      View Details
    </button>
  </motion.div>
);

interface PositionModalProps {
  position: Position;
  onClose: () => void;
}

const PositionModal: React.FC<PositionModalProps> = ({ position, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    
    // Trap focus
    const focusableElements = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/90 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div 
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative w-full max-w-2xl bg-black border border-primary/30 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(192,192,192,0.1)] max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-silver/40 hover:text-primary transition-colors p-2 focus-visible:ring-2 focus-visible:ring-primary rounded-full outline-none"
          aria-label="Close Modal"
        >
          <X size={24} />
        </button>

        <div className="space-y-8">
          <div className="border-b border-silver/10 pb-6">
            <h3 id="modal-title" className="text-3xl font-display font-bold text-primary uppercase tracking-widest leading-tight">
              {position.title}
            </h3>
            <p className="text-silver/40 text-[10px] uppercase tracking-[0.3em] mt-2">Directorate Position Details</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                Key Responsibilities
              </h4>
              <ul className="space-y-4">
                {position.description.map((point, i) => (
                  <li key={i} className="flex gap-4 text-silver/80 text-sm leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {position.expectations && (
              <div className="bg-silver/5 p-6 rounded-2xl border border-silver/10">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <UserCheck size={16} className="text-primary" />
                  Expectations
                </h4>
                <p className="text-silver/60 text-sm leading-relaxed italic">
                  {position.expectations}
                </p>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all mt-4"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FAQSection = () => (
  <section className="w-full py-12 px-6 border-t border-silver/10">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-widest mb-4">
          Process & FAQ
        </h2>
        <div className="w-12 h-1 bg-primary mx-auto" />
      </div>

      <div className="grid gap-6">
        {faqs.map((faq, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="bg-silver/5 border border-silver/10 p-6 md:p-8 rounded-2xl group hover:border-primary/30 transition-all"
          >
            <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-3 flex items-center gap-3">
              <HelpCircle size={18} className="text-primary" />
              {faq.question}
            </h3>
            <p className="text-silver/60 text-sm leading-relaxed font-light">
              {faq.answer}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-3xl text-center">
        <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">Need further assistance?</p>
        <a 
          href="mailto:elections@orderofkpi.com" 
          className="text-white hover:text-primary transition-colors text-lg font-light tracking-widest"
        >
          elections@orderofkpi.com
        </a>
      </div>
    </div>
  </section>
);

// --- Main Page ---

export default function Elections() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const preliminaryRef = useRef<HTMLDivElement>(null);

  // Elections are now concluded and closed, login is disabled.
  // We keep isAuthenticated as false to always show the PasswordGate (Closed Gate).

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full bg-pure-black min-h-screen relative">
        
        <ElectionsHero 
          onTimelineClick={() => scrollTo(timelineRef)}
          onPreliminaryClick={() => scrollTo(preliminaryRef)}
        />

        <SectionDivider />

        <ElectionTimeline timelineRef={timelineRef} />

        <SectionDivider />

        {/* Ballot Section */}
        <section ref={preliminaryRef} className="w-full py-12 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 mb-4">
              <Users size={12} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Ballot</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-widest mb-6">
              2026-2028 Directorate Nominees
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {nominees.map((office) => (
              <motion.div 
                key={office.position}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/30 transition-all hover:bg-white/[0.07]"
              >
                <div className="space-y-1">
                  <p className="text-primary text-[10px] font-bold uppercase tracking-[0.3em]">Office of</p>
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">{office.position}</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-silver/20 text-[9px] font-bold uppercase tracking-widest border-b border-white/5 pb-2">Current Nominees</p>
                  <div className="space-y-3">
                    {office.names.map((name, i) => (
                      <div key={i} className="flex items-center gap-4 group/item">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-black transition-all border border-white/10">
                          <UserCheck size={14} />
                        </div>
                        <span className="text-silver/80 text-sm font-medium uppercase tracking-widest group-hover/item:text-white transition-colors">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10 max-w-xl mx-auto border-t border-white/5 pt-10">
            <p className="text-silver/40 text-[10px] md:text-xs uppercase tracking-[0.3em] font-medium mb-6">
              For questions, reach out to the Elections Committee
            </p>
            <div className="flex flex-col items-center justify-center gap-3">
              <a href="mailto:jackdee@att.net" className="group flex items-center gap-3">
                <span className="text-silver/20 group-hover:text-primary transition-colors">-</span>
                <span className="text-white group-hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">Jack Dee</span>
              </a>
              <a href="mailto:dmitchell02@gmail.com" className="group flex items-center gap-3">
                <span className="text-silver/20 group-hover:text-primary transition-colors">-</span>
                <span className="text-white group-hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold">Donald Mitchell</span>
              </a>
            </div>
          </div>
        </section>

        <PolishedSeparator />

        <section className="w-full py-12 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-widest mb-4">
              Available Positions
            </h2>
            <p className="text-silver/40 text-sm uppercase tracking-[0.2em]">2026-2028 Directorate Vacancies</p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {positions.filter(p => p.title !== "Basileus").map((pos) => (
              <PositionCard 
                key={pos.title} 
                position={pos} 
                onDetailsClick={() => setSelectedPosition(pos)} 
              />
            ))}
          </motion.div>
        </section>

        <SectionDivider />

        <FAQSection />

        <footer className="w-full py-12 px-6 bg-white/5 border-t border-white/10 mt-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-10">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-display font-bold uppercase tracking-widest text-white">Cast Your Vote</h3>
              <p className="text-silver/40 text-xs uppercase tracking-[0.2em]">Authorized secure ballot access for financial members</p>
              <div className="pt-6">
                <Link 
                  to="/voting-portal"
                  className="inline-flex items-center gap-3 px-12 py-5 bg-primary text-black font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-white transition-all shadow-2xl shadow-primary/30 group"
                >
                  <VoteIcon size={20} className="group-hover:rotate-12 transition-transform" />
                  Member Voting Portal
                </Link>
              </div>
            </div>

            <div className="w-full flex items-center justify-center pt-12 border-t border-white/5">
              <Link 
                to="/admin-dashboard" 
                className="text-[10px] uppercase tracking-[0.5em] text-silver/10 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Lock size={12} />
                Committee Access
              </Link>
            </div>
          </div>
        </footer>

        <AnimatePresence>
          {selectedPosition && (
            <PositionModal 
              position={selectedPosition} 
              onClose={() => setSelectedPosition(null)} 
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
