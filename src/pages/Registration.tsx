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

      <motion.div variants={itemVariants} className="w-full max-w-md mb-12 text-center">
        <div className="bg-silver/5 border border-silver/20 p-6 rounded-2xl backdrop-blur-sm">
          <h3 className="text-primary text-lg font-bold uppercase tracking-widest mb-3">Registration Includes:</h3>
          <p className="text-silver/80 font-light tracking-wide">
            Conference Gift • 2 Meals • Conference Materials
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="w-full max-w-md mx-auto bg-pure-black/50 p-6 md:p-8 rounded-3xl border border-silver/20 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.3)]"
      >
        <motion.a
          href="https://square.link/u/iIdep8cA?src=sheet"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -5, scale: 1.02 }}
          className="flex flex-col items-center p-8 border border-silver-foil rounded-3xl bg-silver/10 glow-silver backdrop-blur-sm transition-all group"
        >
          <h3 className="text-xl font-display tracking-widest text-silver uppercase mb-2 group-hover:text-pure-white transition-colors">
            Registration
          </h3>
          <div className="text-5xl font-display text-pure-white mb-2">
            $65
          </div>
          <div className="mt-4 px-6 py-2 bg-silver text-black text-xs font-bold rounded-full uppercase tracking-widest group-hover:bg-white transition-colors">
            Pay Now
          </div>
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
