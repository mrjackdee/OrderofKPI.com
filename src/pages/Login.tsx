import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and redirect to the intake calendar / roster dashboard
    // In a real application, Firebase Auth would be used here
    if (email.toLowerCase() === 'admin@orderofkpi.org') {
      sessionStorage.setItem('userRole', 'admin');
      navigate('/intake-calendar');
    } else {
      sessionStorage.setItem('userRole', 'member');
      navigate('/intake-calendar');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-pure-black/90 border border-primary/30 rounded-3xl p-8 shadow-[0_10px_40px_rgba(212,175,55,0.08)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ShieldCheck size={32} className="text-primary" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2">
              Member Portal
            </h1>
            <p className="text-silver/60 text-xs uppercase tracking-wider font-semibold">
              Secure Access for Financial Members
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-primary/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all placeholder:text-silver/30"
                  placeholder="member@orderofkpi.org"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold">Password</label>
                <a href="#" className="text-[10px] text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} className="text-primary/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all placeholder:text-silver/30"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-white text-black py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2"
            >
              Secure Login <ArrowRight size={16} />
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-silver/10 text-center">
            <p className="text-[10px] text-silver/40 uppercase tracking-wider leading-relaxed">
              Access is restricted to active members of The Order of KP. 
              <br/>Contact administration for credential assistance.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
