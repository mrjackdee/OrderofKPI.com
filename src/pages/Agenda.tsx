import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import AddToCalendar from '../components/AddToCalendar';

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

  const agendaData = [
    {
      day: "Day 1",
      date: "Friday, June 26",
      events: [
        { time: "5:00 PM - 7:00 PM", title: "Check-in" },
        { time: "7:30 PM", title: "Opening Ceremony" },
        { time: "8:30 PM", title: "The Pink Out: Game and Karaoke", highlight: true }
      ]
    },
    {
      day: "Day 2",
      date: "Saturday, June 27",
      events: [
        { time: "Early Morning", title: "Morning Workout" },
        { time: "8:30 AM - 9:00 AM", title: "Continental Breakfast" },
        { time: "9:00 AM - 9:05 AM", title: "Intro" },
        { time: "9:05 AM - 9:20 AM", title: "State of the Organization" },
        { time: "9:20 AM - 9:25 AM", title: "Accepting of Conference Agenda" },
        { time: "9:30 AM - 9:40 AM", title: "1st Anti Report" },
        { time: "9:40 AM - 9:50 AM", title: "2nd Anti Report" },
        { time: "10:00 AM - 10:20 AM", title: "Treasurer: Financial & The Order of KP Report" },
        { time: "10:20 AM - 10:30 AM", title: "Break" },
        { time: "10:30 AM - 11:00 AM", title: "Forging a Way" },
        { time: "11:00 AM - 11:30 AM", title: "Signature Programs: Review, Impact & Strategic Vision" },
        { time: "11:30 AM - 12:30 PM", title: "Lunch" },
        { time: "12:00 PM - 12:30 PM", title: "Membership Certification" },
        { time: "12:30 PM - 1:00 PM", title: "Directorate Installation" },
        { time: "1:00 PM - 1:20 PM", title: "New Directorate's Action Call" },
        { time: "1:20 PM - 1:30 PM", title: "Closing Remarks" },
        { time: "2:00 PM - 3:30 PM", title: "Community Service", highlight: true },
        { time: "6:00 PM - 8:00 PM", title: "Organization Dinner: Dress to Impress", highlight: true },
        { time: "11:00 PM - Until", title: "Evening Activity / Night on the Town", highlight: true }
      ]
    },
    {
      day: "Day 3",
      date: "Sunday, June 28",
      events: [
        { time: "9:00 AM", title: "Rededication Ceremony", highlight: true },
        { time: "Following", title: "Brunch and \"Sunday Funday\"", highlight: true }
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
      className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center relative"
    >
      <FloatingParticles />
      
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-silver z-50 origin-left"
        style={{ scaleX }}
      />

      <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12 relative z-10">
        <h1 className="text-4xl md:text-8xl font-outline text-outline uppercase tracking-widest mb-4 md:mb-6" style={{ transform: 'scaleY(1.2)' }}>
          Conference Agenda
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
          <AddToCalendar className="mt-6" variant="silver" />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full mb-12 md:mb-16 relative z-10">
        {agendaData.map((day, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="flex flex-col h-full border border-silver/20 rounded-3xl bg-pure-black/50 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          >
            <div className="bg-silver/10 p-6 md:p-8 text-center border-b border-silver/20">
              <h2 className="text-3xl md:text-4xl text-pure-white font-display tracking-widest uppercase mb-2">
                {day.day}
              </h2>
              <p className="text-silver tracking-[0.2em] uppercase text-xs md:text-sm font-semibold">
                {day.date}
              </p>
            </div>
            
            <div className="p-6 md:p-8 flex-grow space-y-6 md:space-y-8">
              {day.events.map((event, j) => (
                <motion.div 
                  key={j} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: j * 0.05 }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.3)' }}
                  className={`relative p-6 rounded-2xl transition-all duration-300 ${
                    event.highlight 
                      ? 'glow-silver border-silver-foil bg-silver/5' 
                      : 'border border-silver/10 bg-pure-black'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Clock className={`w-5 h-5 mt-1 flex-shrink-0 ${event.highlight ? 'text-pure-white' : 'text-silver/60'}`} />
                    <div>
                      <p className={`text-sm font-semibold tracking-widest mb-2 ${event.highlight ? 'text-silver' : 'text-silver/60'}`}>
                        {event.time}
                      </p>
                      <h3 className={`text-xl font-display tracking-wider uppercase ${event.highlight ? 'text-pure-white text-2xl' : 'text-pure-white'}`}>
                        {event.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="relative z-10">
        <MotionLink 
          whileHover={{ 
            scale: 1.05, 
            y: -5, 
            boxShadow: '0 0 30px rgba(192,192,192,0.6)',
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          whileTap={{ scale: 0.95 }}
          to="/" 
          className="btn-silver inline-block"
        >
          Return to Home
        </MotionLink>
      </motion.div>
    </motion.div>
  );
}
