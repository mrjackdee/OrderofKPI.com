import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import { motion } from 'motion/react';

export default function Party() {
  const navigate = useNavigate();

  const handlePurchase = () => {
    navigate('/success');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
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
      className="min-h-[80vh] flex flex-col items-center justify-center relative px-4 pt-20 md:pt-24 pb-12 overflow-hidden"
    >
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(192,192,192,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-8 md:space-y-12">
        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
          <h1 className="text-4xl md:text-8xl lg:text-[100px] leading-tight md:leading-none font-outline text-outline uppercase" style={{ transform: 'scaleY(1.2)' }}>
            Greater Heights
            <br />
            <span className="text-silver text-outline-none">and</span>
            <br />
            Charlotte Nights
          </h1>
          <p className="text-xl md:text-3xl text-pure-white font-display tracking-[0.2em] md:tracking-[0.3em] uppercase mt-4 md:mt-8">
            THE SUMMER EDITION
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 text-silver/80 font-light tracking-widest uppercase text-xs md:text-base"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-silver" />
            <span>Saturday, June 27, 2026</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-silver" />
            <span>9:30 PM - Until</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <MapPin className="w-5 h-5 md:w-6 md:h-6 text-silver" />
            <span>TBD Location</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-md mx-auto w-full px-2">
          <motion.div 
            whileHover={{ y: -10, boxShadow: '0 0 50px rgba(192,192,192,0.2)' }}
            className="border border-silver/20 p-8 md:p-12 rounded-3xl bg-pure-black/80 backdrop-blur-xl relative overflow-hidden group transition-all duration-500"
          >
            <div className="absolute -top-10 -right-10 text-silver/5 group-hover:text-silver/10 transition-colors duration-500">
              <Ticket className="w-32 h-32 md:w-48 md:h-48 transform rotate-12" />
            </div>
            
            <div className="relative z-10 space-y-6 md:space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-display tracking-widest text-silver uppercase">
                  General Admission
                </h3>
                <div className="text-5xl md:text-7xl font-display text-pure-white">
                  $50
                </div>
              </div>
              
              <div className="space-y-4 text-left border-y border-silver/20 py-6">
                {[
                  'Entry to THE SUMMER EDITION',
                  'Premium Entertainment',
                  'Cash Bar Available'
                ].map((feature) => (
                  <p key={feature} className="text-silver/80 font-light flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-silver" />
                    {feature}
                  </p>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.05, y: -5, boxShadow: '0 0 20px rgba(192,192,192,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePurchase} 
                className="btn-silver w-full text-lg py-4 uppercase font-bold tracking-widest"
              >
                Purchase Party Ticket
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
