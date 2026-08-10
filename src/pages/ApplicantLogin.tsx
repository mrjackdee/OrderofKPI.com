import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, ShieldCheck, Loader2, FileText, CheckCircle, KeyRound, RefreshCw } from 'lucide-react';
import { performApplicantLogin, performApplicantRegister, requestApplicantPasswordReset } from '../lib/memberDb';
import { useToast } from '../components/ToastContext';

export default function ApplicantLogin() {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

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
        sessionStorage.setItem('userRole', user.role || 'applicant');
        sessionStorage.setItem('userIsFirstLogin', user.isFirstLogin ? 'true' : 'false');

        navigate('/applicant-portal', { replace: true });
      } else if (mode === 'reset') {
        const result = await requestApplicantPasswordReset(email);
        if (result.success) {
          setSuccessMsg(result.message);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (err: any) {
      const friendlyMsg = err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('network') || err.message?.includes('Failed to fetch')
        ? 'The request took longer than expected or the system is busy. Please try again or contact info@orderofkpi.org for support.'
        : (err.message || 'Unable to complete your sign in. Please check your credentials or contact info@orderofkpi.org.');
      setError(friendlyMsg);
      showToast(friendlyMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-6 relative bg-[#FAF9F5] w-full">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-gold/30 rounded-[28px] p-6 md:p-8 shadow-soft backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-gold/20 via-gold to-gold/20" />
          
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full mb-3">
              <ShieldCheck size={12} className="text-gold" />
              <span className="text-[9px] font-bold text-ivy uppercase tracking-[0.2em]">Official Candidate Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-ivy uppercase tracking-wider">
              {mode === 'reset' ? 'Password Reset' : 'Application Portal'}
            </h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-cream p-1 rounded-xl border border-gold/20 mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                mode === 'login' ? 'bg-ivy text-cream shadow-sm' : 'text-ivy/60 hover:text-ivy'
              }`}
            >
              Candidate Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                mode === 'reset' ? 'bg-ivy text-cream shadow-sm' : 'text-ivy/60 hover:text-ivy'
              }`}
            >
              Reset Password
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-body">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-body flex items-start gap-2.5">
              <CheckCircle size={18} className="shrink-0 text-green-600 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  placeholder="applicant@gmail.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] text-gold font-bold uppercase tracking-wider hover:underline"
                  >
                    Forgot Password?
                  </button>
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
              className="w-full flex items-center justify-center gap-2 bg-ivy text-cream py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all mt-2 disabled:opacity-50 shadow-soft"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-gold" /> Authenticating...
                </>
              ) : mode === 'reset' ? (
                <>
                  Send Password Reset Link <RefreshCw size={16} className="text-gold" />
                </>
              ) : (
                <>
                  Access Application Portal <ArrowRight size={16} className="text-gold" />
                </>
              )}
            </motion.button>

            {mode === 'reset' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-ivy/70 hover:text-ivy uppercase tracking-wider font-bold transition-colors"
                >
                  Return to Login
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center bg-white border border-gold/30 rounded-2xl p-4 shadow-soft">
          <p className="text-xs text-ivy/80 leading-relaxed font-body">
            Technical or Portal Issues? Contact Our Support Team at{' '}
            <a href="mailto:admin@orderofkpi.org" className="font-bold text-gold underline hover:text-ivy transition-colors">
              admin@orderofkpi.org
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
