import React from 'react';
import { motion } from 'motion/react';
import { Gavel, Scale, ShieldAlert, FileCheck, Landmark } from 'lucide-react';

export default function TermsOfService() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-4xl px-6 py-12 md:py-24"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Gavel className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-white">
          Terms of <span className="text-primary">Service</span>
        </h1>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8 text-silver/80 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Landmark size={20} className="text-primary" /> 1. Agreement to Terms
          </h2>
          <p>
            By accessing the website of The Order of KP, Inc. ("Organization") and the portal services provided in partnership with <strong>DonOra Global</strong>, you agree to be bound by these Terms of Service and all applicable laws and regulations of the State of Georgia.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Scale size={20} className="text-primary" /> 2. Use License
          </h2>
          <p>
            Permission is granted to members of the Organization to access the member portal for personal, non-commercial organizational use. This is a grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modify or copy organizational materials without express written consent.</li>
            <li>Use the materials for any commercial purpose.</li>
            <li>Attempt to decompile or reverse engineer any software contained on the website.</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Landmark size={20} className="text-primary" /> 3. Intellectual Property
          </h2>
          <p>
            All content, including logos, text, graphics, and code, is the intellectual property of <strong>The Order of KP, Inc.</strong> and its technology partner <strong>DonOra Global</strong>. Unauthorized use of any brand assets is strictly prohibited.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={20} className="text-primary" /> 4. Disclaimer & Liability
          </h2>
          <p>
            The materials on this website are provided on an 'as is' basis. <strong>The Order of KP, Inc.</strong> and <strong>DonOra Global</strong> make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose.
          </p>
          <p>
            In no event shall the Organization or its partners be liable for any damages arising out of the use or inability to use the materials on this website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <FileCheck size={20} className="text-primary" /> 5. Governing Law
          </h2>
          <p>
            Any claim relating to the Organization's website shall be governed by the laws of the State of Georgia without regard to its conflict of law provisions.
          </p>
        </section>

        <div className="pt-8 border-t border-white/10 text-[10px] uppercase tracking-[0.2em] text-silver/40">
          Last Updated: July 2, 2026
        </div>
      </motion.div>
    </motion.div>
  );
}
