import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, RefreshCw, HelpCircle } from 'lucide-react';
import { performApplicantLogin } from '../lib/memberDb';
import { useToast } from '../components/ToastContext';
import { getFriendlyError } from '../lib/utils';

export default function ApplicantLogin() {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    setLoading(true);

    const finalEmail = email.includes('@') ? email : `${email}@orderofkpi.org`;

    try {
      if (mode === 'login') {
        const result = await performApplicantLogin(finalEmail, password);
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
      }
    } catch (err: any) {
      const friendlyMsg = getFriendlyError(err, 'Unable to complete your sign in. Please check your credentials or contact admin@orderofkpi.org.');
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
              {mode === 'reset' ? 'Password Assistance' : 'Application Portal'}
            </h1>
            {mode === 'reset' && (
              <p className="text-xs text-ivy/70 leading-relaxed max-w-xs mx-auto mt-1">
                Candidate credential support and password assistance
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-body">
              {error}
            </div>
          )}

          {mode === 'reset' ? (
            <div className="space-y-5">
              <div className="bg-cream/70 border border-gold/30 rounded-2xl p-5 text-center space-y-3">
                <p className="text-sm font-bold text-ivy leading-relaxed">
                  Automated email password reset is temporarily offline.
                </p>
                <p className="text-xs text-ivy/75 leading-relaxed">
                  If you have forgotten your candidate password or need assistance logging into your application, please email our administrative team directly at:
                </p>
                <div className="py-2">
                  <a
                    href={`mailto:admin@orderofkpi.org?subject=Candidate%20Password%20Reset%20Request&body=Hello%20Administrator%2C%0A%0APlease%20assist%20with%20a%20password%20reset%20for%20my%20candidate%20account%3A%20${encodeURIComponent(email || '')}%0A%0AThank%20you.`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-ivy text-cream hover:bg-ivy/90 font-bold text-xs uppercase tracking-wider transition-colors shadow-md w-full"
                  >
                    <Mail size={16} className="text-gold" /> Email admin@orderofkpi.org
                  </a>
                </div>
                <p className="text-[11px] text-ivy/60">
                  Default initial password for candidates is the last 4 digits of your phone number.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-ivy font-bold uppercase tracking-wider hover:text-gold transition-colors inline-flex items-center gap-1"
                >
                  Return to Candidate Login &rarr;
                </button>
              </div>
            </div>
          ) : (
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-ivy/70 uppercase tracking-widest font-bold ml-1">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); }}
                    className="text-[10px] text-gold font-bold uppercase tracking-wider hover:underline cursor-pointer"
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

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-fit mx-auto flex items-center justify-center gap-2 bg-ivy text-cream py-3.5 px-8 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-ivy/90 transition-all mt-2 disabled:opacity-50 shadow-soft cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-gold" /> Authenticating...
                  </>
                ) : (
                  <>
                    Access Application Portal <ArrowRight size={16} className="text-gold" />
                  </>
                )}
              </motion.button>
            </form>
          )}
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
