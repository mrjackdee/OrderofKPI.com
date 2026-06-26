import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

type Phase = 'theme' | 'loading' | 'ready';

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [phase, setPhase] = useState<Phase>('theme');

  useEffect(() => {
    const themeTimer = setTimeout(() => setPhase('loading'), 2500);
    const loadingTimer = setTimeout(() => setPhase('ready'), 5000);

    return () => {
      clearTimeout(themeTimer);
      clearTimeout(loadingTimer);
    };
  }, []);

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
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-radial-gradient from-primary/10 to-transparent blur-[120px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-4xl">
        {/* Logo - only visible in ready phase */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-4"
            >
              <img 
                src="https://assets.orderofkpi.org/images/logos/kpi_logo.png" 
                alt="Logo" 
                className="w-24 h-24 md:w-32 md:h-32 object-contain opacity-80"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Theme Text - Stays constant but evolves */}
        <div className="flex flex-col items-center gap-4">
          <motion.h2 
            animate={{ 
              opacity: phase === 'theme' ? 0.4 : 0,
              y: phase === 'theme' ? 0 : -20
            }}
            className="text-silver/40 text-xs md:text-sm tracking-[0.8em] uppercase"
          >
            The Order of KP
          </motion.h2>

          <motion.div 
            animate={{ 
              scale: phase === 'theme' ? 1 : phase === 'loading' ? 0.6 : 0.5,
              opacity: phase === 'theme' ? 1 : phase === 'loading' ? 0.5 : 1,
              filter: phase === 'theme' ? 'blur(0px)' : 'blur(0px)',
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="px-4 flex flex-col items-center justify-center text-center"
          >
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-black text-primary uppercase tracking-[0.2em] drop-shadow-[0_0_30px_rgba(192,160,0,0.4)] mb-4 md:mb-6">
              FAMILY MATTERS
            </h1>
            <p className="text-sm md:text-xl lg:text-2xl font-display font-medium text-silver uppercase tracking-[0.15em]">
              Planted in Purpose. Climbing Together.
            </p>
          </motion.div>
        </div>

        {/* Loading Bar - only visible in loading phase */}
        <div className="h-20 flex items-center justify-center">
          <AnimatePresence>
            {phase === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-48 h-[1px] bg-silver/10 relative overflow-hidden">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 bg-silver"
                  />
                </div>
                <span className="text-[10px] tracking-[0.6em] text-silver/60 uppercase animate-pulse">
                  Loading...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enter Button - only visible in ready phase */}
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(192,192,192,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEnter}
                  className="group relative flex items-center justify-center px-16 py-6 bg-transparent border border-silver/40 rounded-full overflow-hidden transition-all hover:border-silver"
                >
                  <div className="absolute inset-0 bg-silver/5 group-hover:bg-silver/10 transition-colors" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10 text-pure-white text-xl font-bold uppercase tracking-[0.4em]">
                    Enter Site
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute bottom-12 text-[10px] tracking-[0.5em] text-silver uppercase"
      >
        Excellence Personified
      </motion.div>
    </motion.div>
  );
}
