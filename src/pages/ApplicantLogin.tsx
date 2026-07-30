import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Loader2, FileText, CheckCircle, KeyRound, RefreshCw } from 'lucide-react';
import { performApplicantLogin, performApplicantRegister, requestApplicantPasswordReset } from '../lib/memberDb';

export default function ApplicantLogin() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/applicant-portal';

  useEffect(() => {
    const isAuthenticated = !!sessionStorage.getItem('userEmail');
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await performApplicantLogin(email, password);
        if (!result.success || !result.user) {
          throw new Error(result.message);
        }

        const user = result.user as any;
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userFirstName', user.firstName || user.name.split(' ')[0]);
        sessionStorage.setItem('userRole', user.role || 'prospective');

        navigate('/applicant-portal', { replace: true });
      } else if (mode === 'register') {
        const result = await performApplicantRegister(name, email, password);
        if (!result.success || !result.user) {
          throw new Error(result.message);
        }

        const user = result.user as any;
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userFirstName', user.firstName || name.split(' ')[0]);
        sessionStorage.setItem('userRole', 'prospective');

        setSuccessMsg('Account saved in Firebase Database! Redirecting to Applicant Portal...');
        setTimeout(() => {
          navigate('/applicant-portal', { replace: true });
        }, 1200);
      } else if (mode === 'reset') {
        const result = await requestApplicantPasswordReset(email);
        if (result.success) {
          setSuccessMsg(result.message);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please verify your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative bg-[#FAF9F5] w-full">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-gold/30 rounded-[32px] p-8 md:p-10 shadow-soft backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-gold/20 via-gold to-gold/20" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-ivy">
              {mode === 'reset' ? <KeyRound size={32} className="text-ivy" /> : <FileText size={32} className="text-ivy" />}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full mb-3">
              <ShieldCheck size={12} className="text-gold" />
              <span className="text-[9px] font-bold text-ivy uppercase tracking-[0.2em]">Firebase Database Secured</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ivy uppercase tracking-wider mb-2">
              {mode === 'reset' ? 'Password ' : 'Prospective '}
              <span className="text-gold">{mode === 'reset' ? 'Reset' : 'Applicant Portal'}</span>
            </h1>
            <p className="text-ivy/60 text-xs font-body leading-relaxed max-w-xs mx-auto">
              {mode === 'reset' 
                ? 'Enter your candidate email address to receive a self-service password reset link powered by Firebase.'
                : 'Separate portal for prospective members to submit and manage their Kappa Pi application.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-cream p-1.5 rounded-2xl border border-gold/20 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                mode === 'login' ? 'bg-ivy text-cream shadow-md' : 'text-ivy/60 hover:text-ivy'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                mode === 'register' ? 'bg-ivy text-cream shadow-md' : 'text-ivy/60 hover:text-ivy'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                mode === 'reset' ? 'bg-ivy text-cream shadow-md' : 'text-ivy/60 hover:text-ivy'
              }`}
            >
              Reset Pass
            </button>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-body">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 font-body flex items-start gap-2.5">
              <CheckCircle size={18} className="shrink-0 text-green-600 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={16} className="text-gold" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 pl-11 pr-4 text-ivy text-sm focus:outline-none focus:border-ivy focus:bg-white transition-all placeholder:text-ivy/30"
                    placeholder="Candidate Full Name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Applicant Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gold" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 pl-11 pr-4 text-ivy text-sm focus:outline-none focus:border-ivy focus:bg-white transition-all placeholder:text-ivy/30"
                  placeholder="candidate@orderofkpi.org"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                      className="text-[10px] text-gold font-bold uppercase tracking-wider hover:underline"
                    >
                      Self-Service Reset?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gold" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-cream/40 border border-gold/20 rounded-xl py-3 pl-11 pr-4 text-ivy text-sm focus:outline-none focus:border-ivy focus:bg-white transition-all placeholder:text-ivy/30"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ivy text-cream py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all mt-3 disabled:opacity-50 shadow-soft"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-gold" /> Processing...
                </>
              ) : mode === 'reset' ? (
                <>
                  Send Firebase Password Reset Link <RefreshCw size={16} className="text-gold" />
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Applicant Login' : 'Create Candidate Firebase Account'} <ArrowRight size={16} className="text-gold" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-gold/10 text-center space-y-4">
            <p className="text-[10px] text-ivy/60 uppercase tracking-wider font-bold">
              Are you an Active Financial Member or Officer?
            </p>
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold/30 bg-cream text-ivy text-xs font-bold uppercase tracking-wider hover:bg-gold/10 transition-all"
            >
              Go to Financial Member Portal Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
