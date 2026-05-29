import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const MotionLink = motion(Link);

export default function Success() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-pure-black/80 border-silver-foil rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(192,192,192,0.1)]">
        {/* Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-silver/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center space-y-8 md:space-y-12">
          <div className="relative">
            <div className="absolute inset-0 bg-silver/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle className="w-24 h-24 md:w-48 md:h-48 text-silver relative z-10 drop-shadow-[0_0_15px_rgba(192,192,192,0.5)]" />
          </div>
          
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-8xl font-outline text-outline uppercase tracking-widest" style={{ transform: 'scaleY(1.2)' }}>
              Success!
            </h1>
            <p className="text-lg md:text-2xl text-silver font-light tracking-widest uppercase">
              Your request has been processed.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-silver/10 border border-silver-foil/30 p-6 rounded-2xl backdrop-blur-sm max-w-md mx-auto"
          >
            <p className="text-pure-white text-sm md:text-base font-medium tracking-wide leading-relaxed">
              Don't forget Registration opens on <span className="text-silver font-bold">Wednesday, April 1, 2026</span>. 
            </p>
            <div className="mt-3 h-px w-12 bg-silver/50 mx-auto" />
            <p className="text-silver/70 text-[10px] md:text-xs uppercase tracking-[0.2em] mt-2">
              Mark your calendars
            </p>
          </motion.div>

          <div className="pt-8">
            <MotionLink 
              whileHover={{ scale: 1.05, y: -5, boxShadow: '0 0 20px rgba(192,192,192,0.4)' }}
              whileTap={{ scale: 0.95 }}
              to="/" 
              className="btn-silver inline-block"
            >
              Return to Home
            </MotionLink>
          </div>
        </div>
      </div>
    </div>
  );
}
