import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import AddToCalendar from '../components/AddToCalendar';

const MotionLink = motion(Link);

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-06-26T09:00:00-04:00').getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1200px] flex flex-col items-center px-4 py-8 gap-12"
    >
      <motion.div variants={itemVariants} className="w-full relative rounded-xl overflow-hidden @container border border-primary">
        <div 
          className="flex min-h-[500px] md:min-h-[600px] flex-col gap-6 md:gap-8 bg-cover bg-center bg-no-repeat items-center justify-center p-6 md:p-8 relative grayscale" 
          style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0EqJVJjaJxQiZB7JHdhGwO_BkCcaTpRL3BDSKPcap-6dQNxCF_PtQEn3QO1E2YTwL-GlbgHjnYmHSWkZjdcXA7q6xgE3rWRJEX4XJgVE7Sj9nhglcFYLpxMsQ9t8EYJKf4fbXIYS3vQtSbzjvmPh-XUa4rrvAwvyH9obEXBj_1nv_HhGKpL5RKQyCEUKPqMVjNPj62YQlK1hywaehIrHO5dqFI8e17cVg-a9manE6DyHfsJCJph2lprdTLBTZp4GG0rauBDZi0N0Q")' }}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-2 md:mb-4 z-10 flex justify-center"
          >
            <img 
              src="https://orderofkpi.com/kpi_logo.jpg" 
              alt="The Order of KP Logo" 
              className="w-24 h-24 md:w-40 md:h-40 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="flex flex-col gap-3 md:gap-4 text-center max-w-4xl z-10">
            <motion.h1 
              variants={itemVariants}
              className="font-outline text-outline text-4xl md:text-8xl leading-tight tracking-widest uppercase" 
              style={{ transform: 'scaleY(1.2)' }}
            >
              The Order of KP
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-primary text-2xl md:text-5xl font-bold tracking-[0.3em] uppercase mt-2"
            >
              FAMILY MATTERS
            </motion.p>
            <motion.span variants={itemVariants} className="block text-primary text-lg md:text-3xl font-light tracking-[0.2em] md:tracking-[0.3em] mt-4 md:mt-8 uppercase">Biennial Conference</motion.span>
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-1 md:gap-2 mt-4 md:mt-6">
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="h-px w-10 md:w-16 bg-primary"></span>
                <h2 className="text-primary text-sm md:text-lg font-medium tracking-widest uppercase">June 26-28, 2026</h2>
                <span className="h-px w-10 md:w-16 bg-primary"></span>
              </div>
              <h2 className="text-primary text-sm md:text-lg font-medium tracking-widest uppercase">Charlotte, NC</h2>
              <AddToCalendar className="mt-6" />
            </motion.div>
          </div>
          <div className="flex flex-col items-center gap-4 z-10">
            <MotionLink
              to="/registration"
              variants={itemVariants}
              animate={{ 
                scale: [1, 1.03, 1],
                opacity: 1,
                y: 0,
                boxShadow: [
                  "0 0 15px rgba(192, 192, 192, 0.2)",
                  "0 0 30px rgba(192, 192, 192, 0.5)",
                  "0 0 15px rgba(192, 192, 192, 0.2)"
                ]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="mt-4 bg-silver/20 border-2 border-silver rounded-xl backdrop-blur-md px-10 py-5 group text-center transition-all hover:bg-silver/30"
            >
              <p className="text-pure-white text-base md:text-xl font-black tracking-[0.3em] uppercase group-hover:text-primary transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                Registration is NOW OPEN
              </p>
            </MotionLink>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-4">
        {Object.entries(timeLeft).map(([label, value]) => (
          <motion.div 
            key={label}
            whileHover={{ y: -5, borderColor: '#ffffff' }}
            className="flex flex-col items-center gap-2 md:gap-4 border border-primary p-4 md:p-6 bg-black relative transition-colors group"
          >
            <p className="text-primary text-3xl md:text-5xl font-black tracking-tight font-outline text-outline group-hover:text-white transition-colors" style={{ transform: 'scaleY(1.1)', WebkitTextStroke: '1px md:1.5px rgb(192, 192, 192)' }}>{formatNumber(value as number)}</p>
            <p className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.section 
        variants={itemVariants}
        className="w-full max-w-5xl flex flex-col items-start py-8 md:py-12 gap-6 md:gap-8 text-left border-t border-primary" 
        id="about"
      >
        <h2 className="text-primary font-outline text-outline text-2xl md:text-4xl uppercase tracking-widest relative pb-4 text-left" style={{ transform: 'scaleY(1.1)' }}>
          About The Order of KP, Inc.
          <motion.span 
            initial={{ width: 0 }}
            whileInView={{ width: 48 }}
            className="absolute bottom-0 left-0 h-1 bg-primary"
          />
        </h2>
        <div className="flex flex-col gap-6 max-w-4xl mt-2 md:mt-4">
          <p className="text-primary text-base md:text-lg font-light leading-relaxed">
            Headquartered in Atlanta, GA, <strong>The Order of KP, Inc.</strong> is a community non-profit organization. We are steadfast in our commitment to empowering communities, fostering leadership, and driving sustainable philanthropic impact. Through strategic networking, educational empowerment, and dedicated community service, we strive to set the standard for excellence and civic responsibility.
          </p>
          <p className="text-primary/80 text-sm md:text-base font-light leading-relaxed">
            Join us in Charlotte for our biennial conference! Experience a weekend of excellence, service, and networking. This is a time to reflect on our achievements, forge new alliances, and set the standard for the years to come in an atmosphere of unparalleled sophistication.
          </p>
        </div>
      </motion.section>

      <motion.section 
        variants={itemVariants}
        className="w-full max-w-5xl flex flex-col items-start py-8 md:py-12 gap-8 md:gap-12 border-t border-primary" 
        id="info"
      >
        <h2 className="text-primary font-outline text-outline text-2xl md:text-4xl uppercase tracking-widest relative pb-4 text-left" style={{ transform: 'scaleY(1.1)' }}>
          CONFERENCE INFORMATION
          <motion.span 
            initial={{ width: 0 }}
            whileInView={{ width: 48 }}
            className="absolute bottom-0 left-0 h-1 bg-primary"
          />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-2 md:mt-4 text-left">
          <div className="space-y-4 border border-primary/30 p-6 rounded-xl bg-black/40">
            <h3 className="text-primary text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined">checkroom</span>
              Business Attire
            </h3>
            <p className="text-primary/80 font-light leading-relaxed">
              Black suit, White Shirt, and the conference gift tie.
            </p>
          </div>
          <div className="space-y-4 border border-primary/30 p-6 rounded-xl bg-black/40">
            <h3 className="text-primary text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined">hotel</span>
              Lodging Options
            </h3>
            <p className="text-primary/80 font-light leading-relaxed">
              We recommend Airbnb for Organization House or individual stays. Nearby hotels are also available for preferred lodging.
            </p>
          </div>
          <div className="space-y-4 border border-primary/30 p-6 rounded-xl bg-black/40">
            <h3 className="text-primary text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined">devices_off</span>
              Attendance
            </h3>
            <p className="text-primary/80 font-light leading-relaxed">
              Please note that there is <strong>no virtual option</strong> for this conference. We look forward to seeing everyone in person!
            </p>
          </div>
          <div className="space-y-4 border border-primary/30 p-6 rounded-xl bg-black/40">
            <h3 className="text-primary text-xl font-bold uppercase tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined">volunteer_activism</span>
              Community Service
            </h3>
            <p className="text-primary/80 font-light leading-relaxed">
              Join us for an activity as we give back to the Charlotte community.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section 
        variants={itemVariants}
        className="w-full max-w-5xl flex flex-col items-start py-8 md:py-12 gap-8 md:gap-12 border-t border-primary" 
        id="highlights"
      >
        <h2 className="text-primary font-outline text-outline text-2xl md:text-4xl uppercase tracking-widest relative pb-4 text-left" style={{ transform: 'scaleY(1.1)' }}>
          CONFERENCE themes
          <motion.span 
            initial={{ width: 0 }}
            whileInView={{ width: 48 }}
            className="absolute bottom-0 left-0 h-1 bg-primary"
          />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mt-2 md:mt-4">
          {[
            { icon: 'groups', title: 'BONDING', desc: 'Forge and rekindle connections with members from across the country during the weekend.' },
            { icon: 'emoji_events', title: 'SERVICE', desc: 'Participate in community service as we give back to a deserving organization while in Charlotte.' },
            { icon: 'lightbulb', title: 'Innovation', desc: 'Attend sessions where we will discuss and participate in topics related to The Order of KP, growth, wellness and empowerment.' }
          ].map((theme, idx) => (
            <motion.div 
              key={theme.title}
              whileHover={{ y: -10, borderColor: '#ffffff' }}
              className="bg-black p-6 md:p-8 border border-primary flex flex-col items-start text-left gap-4 transition-all group"
            >
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary font-light group-hover:scale-110 transition-transform">{theme.icon}</span>
              <h3 className="text-primary text-lg md:text-xl font-bold uppercase tracking-wide group-hover:text-white transition-colors">{theme.title}</h3>
              <p className="text-primary font-light text-sm leading-relaxed group-hover:text-white/80 transition-colors">{theme.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
