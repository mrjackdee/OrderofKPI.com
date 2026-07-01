import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { performHybridLogin } from '../lib/memberDb';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('kpi_saved_email');
    const savedPassword = localStorage.getItem('kpi_saved_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (rememberMe) {
      localStorage.setItem('kpi_saved_email', email);
      localStorage.setItem('kpi_saved_password', password);
    } else {
      localStorage.removeItem('kpi_saved_email');
      localStorage.removeItem('kpi_saved_password');
    }

    try {
      const result = await performHybridLogin(email, password);
      
      if (!result.success || !result.user) {
        throw new Error(result.message);
      }

      sessionStorage.setItem('userEmail', result.user.email);
      sessionStorage.setItem('userName', result.user.name);
      sessionStorage.setItem('userFirstName', result.user.firstName);
      sessionStorage.setItem('userRole', result.user.role);
      sessionStorage.setItem('isFirstLogin', result.user.isFirstLogin ? 'true' : 'false');

      navigate('/intake-calendar');
    } catch (err: any) {
      const isTechnical = err.message.includes('JSON') || err.message.includes('token') || err.message.includes('fetch');
      setError(isTechnical 
        ? 'The authentication service is temporarily unavailable or undergoing maintenance. Please check your internet connection or try again later.'
        : err.message || 'Login failed. Please verify your credentials and try again.'
      );
    } finally {
      setLoading(false);
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
            <p className="text-silver/60 text-xs uppercase tracking-wider font-semibold whitespace-pre-line">
              Secure Access for Financial Members{"\n\n"}Access for Financial Members
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 font-medium">
              {error}
            </div>
          )}

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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold">Password</label>
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm border-primary/40 bg-white/5 text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="text-[10px] text-silver/80 uppercase tracking-widest font-bold cursor-pointer">
                Remember Me
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-white text-black py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Secure Login <ArrowRight size={16} />
                </>
              )}
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
