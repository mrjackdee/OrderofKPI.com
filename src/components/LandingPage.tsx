import React from 'react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-pure-black overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-radial-gradient from-primary/15 to-transparent blur-[120px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 px-6 text-center max-w-4xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="flex justify-center"
        >
          <img 
            src="https://assets.orderofkpi.org/images/logos/kpi_logo.png" 
            alt="The Order of KP Logo" 
            className="w-32 h-32 md:w-52 md:h-52 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Enter Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(192,160,0,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="group relative flex items-center justify-center px-16 py-6 bg-transparent border border-primary/40 rounded-full overflow-hidden transition-all hover:border-primary"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <span className="relative z-10 text-primary text-xl font-bold uppercase tracking-[0.4em] group-hover:text-white transition-colors">
              Enter Site
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Footer Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.8, duration: 1.5 }}
        className="absolute bottom-12 text-[10px] tracking-[0.5em] text-silver uppercase font-semibold"
      >
        Excellence Personified
      </motion.div>
    </motion.div>
  );
}
