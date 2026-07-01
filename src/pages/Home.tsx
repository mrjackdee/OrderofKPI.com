import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monitor, ArrowRight } from 'lucide-react';

const MotionLink = motion(Link);

export default function Home() {
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
          className="flex min-h-[420px] md:min-h-[500px] flex-col gap-6 md:gap-8 bg-cover bg-center bg-no-repeat items-center justify-center p-6 md:p-8 relative grayscale" 
          style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0EqJVJjaJxQiZB7JHdhGwO_BkCcaTpRL3BDSKPcap-6dQNxCF_PtQEn3QO1E2YTwL-GlbgHjnYmHSWkZjdcXA7q6xgE3rWRJEX4XJgVE7Sj9nhglcFYLpxMsQ9t8EYJKf4fbXIYS3vQtSbzjvmPh-XUa4rrvAwvyH9obEXBj_1nv_HhGKpL5RKQyCEUKPqMVjNPj62YQlK1hywaehIrHO5dqFI8e17cVg-a9manE6DyHfsJCJph2lprdTLBTZp4GG0rauBDZi0N0Q")' }}
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-2 md:mb-4 z-10 flex justify-center"
          >
            <img 
              src="https://assets.orderofkpi.org/images/logos/kpi_logo.png" 
              alt="The Order of KP Logo" 
              className="w-24 h-24 md:w-40 md:h-40 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="flex flex-col gap-3 md:gap-4 text-center max-w-4xl z-10">
            <motion.h1 
              variants={itemVariants}
              className="font-outline text-outline text-4xl md:text-8xl leading-tight tracking-widest uppercase mb-4" 
              style={{ transform: 'scaleY(1.2)' }}
            >
              The Order of KP
            </motion.h1>
            <motion.span variants={itemVariants} className="block text-primary text-sm md:text-xl font-light tracking-[0.1em] md:tracking-[0.15em] mt-2 md:mt-4 uppercase max-w-2xl mx-auto leading-relaxed">
              Congratulations for a successful biennial conference and installation of the new officers.
            </motion.span>
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-1 md:gap-2 mt-4 md:mt-6">
              <MotionLink
                to="/portal"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors text-sm shadow-lg shadow-primary/20"
              >
                <Monitor size={18} />
                Conference Portal
              </MotionLink>
            </motion.div>
          </div>
        </div>
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
        </div>
      </motion.section>

      {/* Button for Admin Dashboard */}
      <motion.section 
        variants={itemVariants}
        className="w-full max-w-5xl flex justify-center py-8"
      >
        <MotionLink
          to="/admin-dashboard"
          className="px-6 py-3 border border-primary/50 text-primary hover:bg-primary/10 rounded-full font-bold uppercase tracking-widest text-sm transition-colors"
        >
          Admin Dashboard
        </MotionLink>
      </motion.section>
    </motion.div>
  );
}
