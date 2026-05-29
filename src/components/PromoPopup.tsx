import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the popup in this session
    const hasSeen = sessionStorage.getItem('boule_promo_seen');
    
    if (!hasSeen) {
      // Show popup after 3.5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('boule_promo_seen', 'true');
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-black border border-primary p-8 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center flex flex-col items-center gap-6"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-primary/60 hover:text-primary transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            
            <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center bg-primary/10 mb-2">
              <span className="material-symbols-outlined text-3xl text-primary">event_available</span>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-display font-bold text-primary uppercase tracking-widest leading-tight">
                Boule Conference 2026
              </h3>
              <p className="text-primary/80 font-light leading-relaxed text-sm">
                Don't miss out on our biennial gathering in Charlotte, NC! Secure your spot today and join us for a weekend of excellence, service, and networking.
              </p>
            </div>

            <Link 
              to="/registration"
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-primary text-black text-sm font-bold uppercase tracking-widest rounded-full hover:bg-white hover:scale-105 transition-all mt-2 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            >
              Register Now
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
