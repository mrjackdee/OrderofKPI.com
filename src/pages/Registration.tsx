import { motion } from 'motion/react';

export default function Registration() {
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

  const REGULAR_EXPIRY = new Date('2026-05-31T04:01:00Z'); // May 31, 2026, 12:01 AM EDT
  const LATE_START = new Date('2026-06-01T04:02:00Z'); // June 1, 2026, 12:02 AM EDT
  
  const now = new Date();
  const isRegularClosed = now > REGULAR_EXPIRY;
  const isLateOpen = now > LATE_START;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center"
    >
      <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-8xl font-outline text-outline uppercase tracking-widest mb-4 md:mb-6" style={{ transform: 'scaleY(1.2)' }}>
          Conference Registration
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

      <motion.div variants={itemVariants} className="w-full max-w-3xl mb-12 text-center">
        <div className="bg-silver/5 border border-silver/20 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-primary text-lg font-bold uppercase tracking-widest mb-3">Registration Includes:</h3>
          <p className="text-silver/80 font-light tracking-wide">
            Conference Gift • 2 Meals • Conference Materials
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="w-full max-w-3xl mx-auto space-y-8 md:space-y-12 bg-pure-black/50 p-6 md:p-12 rounded-3xl border border-silver/20 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.3)]"
      >
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-display tracking-widest text-silver uppercase border-b border-silver/20 pb-4">
            Registration Options
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {isRegularClosed ? (
              <div className="flex flex-col items-center p-8 border border-silver/10 rounded-3xl bg-pure-black/40 backdrop-blur-sm opacity-50 grayscale">
                <h3 className="text-xl font-display tracking-widest text-silver uppercase mb-2">
                  Standard Registration
                </h3>
                <div className="text-5xl font-display text-pure-white mb-2">
                  $125
                </div>
                <p className="text-xs font-bold tracking-widest text-silver/60 uppercase">
                  Registration Closed
                </p>
                <div className="mt-4 px-6 py-2 border border-silver/30 text-silver/40 text-xs font-bold rounded-full uppercase tracking-widest">
                  Closed
                </div>
              </div>
            ) : (
              <motion.a
                href="https://square.link/u/0c8I0Ueg?src=sheet"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -5, scale: 1.02 }}
                className="flex flex-col items-center p-8 border border-silver-foil rounded-3xl bg-silver/10 glow-silver backdrop-blur-sm transition-all group"
              >
                <h3 className="text-xl font-display tracking-widest text-silver uppercase mb-2 group-hover:text-pure-white transition-colors">
                  Standard Registration
                </h3>
                <div className="text-5xl font-display text-pure-white mb-2">
                  $125
                </div>
                <p className="text-xs font-bold tracking-widest text-silver/60 uppercase">
                  April 3 to May 31, 2026
                </p>
                <div className="mt-4 px-6 py-2 bg-silver text-black text-xs font-bold rounded-full uppercase tracking-widest group-hover:bg-white transition-colors">
                  Pay Now
                </div>
              </motion.a>
            )}

            {isLateOpen ? (
              <motion.a
                href="https://square.link/u/iIdep8cA?src=sheet"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -5, scale: 1.02 }}
                className="flex flex-col items-center p-8 border border-silver-foil rounded-3xl bg-silver/10 glow-silver backdrop-blur-sm transition-all group"
              >
                <h3 className="text-xl font-display tracking-widest text-silver uppercase mb-2 group-hover:text-pure-white transition-colors">
                  Late Registration
                </h3>
                <div className="text-5xl font-display text-pure-white mb-2">
                  $150
                </div>
                <p className="text-xs font-bold tracking-widest text-silver/60 uppercase">
                  June 1 to June 12, 2026
                </p>
                <div className="mt-4 px-6 py-2 bg-silver text-black text-xs font-bold rounded-full uppercase tracking-widest group-hover:bg-white transition-colors">
                  Pay Now
                </div>
              </motion.a>
            ) : (
              <div className="flex flex-col items-center p-8 border border-silver/20 rounded-3xl bg-pure-black/40 backdrop-blur-sm">
                <h3 className="text-xl font-display tracking-widest text-silver uppercase mb-2">
                  Late Registration
                </h3>
                <div className="text-5xl font-display text-pure-white mb-2">
                  $150
                </div>
                <p className="text-xs font-bold tracking-widest text-silver/60 uppercase">
                  June 1 to June 12, 2026
                </p>
                <div className="mt-4 px-6 py-2 border border-silver/30 text-silver/40 text-xs font-bold rounded-full uppercase tracking-widest">
                  Coming Soon
                </div>
              </div>
            )}
          </div>
          <p className="text-silver/60 text-xs italic text-center tracking-widest uppercase">
            * No new registrations after June 12, 2026
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
