import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegistrationPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('kpi_registration_popup_seen');
    if (!hasSeenPopup) {
      // Delay slightly for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('kpi_registration_popup_seen', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-pure-black border border-primary/50 shadow-[0_0_50px_rgba(192,192,192,0.2)] rounded-2xl overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-white to-primary"></div>
            
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-silver/50 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>

            <div className="p-8 md:p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                <UserPlus size={40} className="text-primary animate-pulse" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-widest text-white mb-4">
                Conference <br />
                <span className="text-primary">Registration</span>
              </h2>
              
              <p className="text-silver/70 text-sm md:text-base leading-relaxed mb-8 max-w-sm">
                Join us in Charlotte, NC for a weekend of excellence, service, and leadership. Secure your spot at the Order of KP 2026 Biennial Conference.
              </p>
              
              <div className="flex flex-col w-full gap-4">
                <Link
                  to="/registration"
                  onClick={handleClose}
                  className="w-full bg-primary hover:bg-white text-black font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Register Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <button
                  onClick={handleClose}
                  className="text-silver/40 hover:text-silver text-[10px] uppercase font-bold tracking-[0.3em] py-2 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Decorative corner accents */}
            <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none opacity-20">
              <div className="absolute bottom-4 left-4 w-8 h-px bg-primary"></div>
              <div className="absolute bottom-4 left-4 w-px h-8 bg-primary"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none opacity-20">
              <div className="absolute bottom-4 right-4 w-8 h-px bg-primary"></div>
              <div className="absolute bottom-4 right-4 w-px h-8 bg-primary"></div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
