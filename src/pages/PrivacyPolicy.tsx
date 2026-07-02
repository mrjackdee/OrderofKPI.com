import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, Scale } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <Shield className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight text-white">
          Privacy <span className="text-primary">Policy</span>
        </h1>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 space-y-8 text-silver/80 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Eye size={20} className="text-primary" /> 1. Introduction
          </h2>
          <p>
            The Order of KP, Inc. ("we," "us," or "our"), a Georgia non-profit corporation, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our member portal.
          </p>
          <p>
            This website is provided in partnership with <strong>DonOra Global</strong>. We and our technology partners are dedicated to maintaining the highest standards of data integrity and security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Lock size={20} className="text-primary" /> 2. Information Collection
          </h2>
          <p>
            We collect information that you voluntarily provide to us, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Personal identifiers (name, email address, mailing address).</li>
            <li>Member credentials for portal access.</li>
            <li>Registration details for conferences and events.</li>
            <li>Payment information (processed securely through third-party processors).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <FileText size={20} className="text-primary" /> 3. How We Use Your Information
          </h2>
          <p>
            Your information is used to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Administer your membership and portal access.</li>
            <li>Process registrations and financial contributions.</li>
            <li>Communicate organizational updates and event information.</li>
            <li>Ensure the security and integrity of our digital platforms.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield size={20} className="text-primary" /> 4. Data Protection & DonOra Global
          </h2>
          <p>
            Data security is a shared priority. Our technology partner, <strong>DonOra Global</strong>, provides the infrastructure and security protocols required to protect organizational data. We implement reasonable administrative, technical, and physical safeguards to protect against unauthorized access, use, or disclosure of personal data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Scale size={20} className="text-primary" /> 5. Legal Compliance (Georgia)
          </h2>
          <p>
            This policy is governed by the laws of the State of Georgia. We comply with all applicable state and federal regulations regarding data privacy and non-profit transparency.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-white text-xl font-bold uppercase tracking-widest">6. Contact Us</h2>
          <p>
            If you have questions about this policy, please contact us at info@orderofkpi.org.
          </p>
        </section>

        <div className="pt-8 border-t border-white/10 text-[10px] uppercase tracking-[0.2em] text-silver/40">
          Last Updated: July 2, 2026
        </div>
      </motion.div>
    </motion.div>
  );
}
