import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, RefreshCw, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';
import { performHybridLogin } from '../lib/memberDb';
import { useToast } from '../components/ToastContext';
import { getFriendlyError } from '../lib/utils';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const locationFrom = (location.state as any)?.from?.pathname;

  useEffect(() => {
    const isAuthenticated = !!sessionStorage.getItem('userEmail');
    if (isAuthenticated) {
      const role = sessionStorage.getItem('userRole');
      const defaultPath = (role === 'applicant' || role === 'prospective') ? '/membership-application' : '/member-portal';
      navigate(locationFrom || defaultPath, { replace: true });
    }
  }, [navigate, locationFrom]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('kpi_saved_email');
    const savedPassword = localStorage.getItem('kpi_saved_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const finalEmail = email.includes('@') ? email : `${email}@orderofkpi.org`;
    
    if (mode === 'login') {
      if (rememberMe) {
        localStorage.setItem('kpi_saved_email', email);
        localStorage.setItem('kpi_saved_password', password);
      } else {
        localStorage.removeItem('kpi_saved_email');
        localStorage.removeItem('kpi_saved_password');
      }

      try {
        const result = await performHybridLogin(finalEmail, password);
        
        if (!result.success || !result.user) {
          throw new Error(result.message);
        }

        const user = result.user as any;
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userFirstName', user.firstName);
        sessionStorage.setItem('userRole', user.role);
        sessionStorage.setItem('userRoles', JSON.stringify(user.roles || [user.role]));
        sessionStorage.setItem('userCommittees', JSON.stringify(user.committees || []));
        sessionStorage.setItem('userCommitteeRoles', JSON.stringify(user.committeeRoles || {}));
        if (user.title) {
          sessionStorage.setItem('userTitle', user.title);
        } else {
          sessionStorage.removeItem('userTitle');
        }
        sessionStorage.setItem('isFirstLogin', user.isFirstLogin ? 'true' : 'false');

        const isApplicant = user.role === 'applicant' || user.role === 'prospective';
        const defaultPath = isApplicant ? '/membership-application' : '/member-portal';
        navigate(locationFrom || defaultPath, { replace: true });
      } catch (err: any) {
        const friendlyMsg = getFriendlyError(err, 'Unable to sign in. Please check your credentials or contact admin@orderofkpi.org.');
        setError(friendlyMsg);
        showToast(friendlyMsg, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-3 sm:px-6 py-8 sm:py-12 relative overflow-y-auto overflow-x-hidden w-full max-w-full">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md min-w-0"
      >
        <div className="bg-pure-black/90 border border-primary/30 rounded-3xl p-5 sm:p-8 shadow-[0_10px_40px_rgba(212,175,55,0.08)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              {mode === 'reset' ? (
                <HelpCircle size={32} className="text-primary" />
              ) : (
                <Lock size={32} className="text-primary" />
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2">
              {mode === 'reset' ? 'Password Reset' : 'Member Portal'}
            </h1>
            {mode === 'reset' && (
              <p className="text-xs text-silver/80 leading-relaxed max-w-xs mx-auto">
                Need credential assistance or a password reset? Follow the instructions below.
              </p>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 font-medium">
              {error}
            </div>
          )}

          {mode === 'reset' ? (
            <div className="space-y-5">
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-5 text-center space-y-3">
                <p className="text-sm text-white font-medium leading-relaxed">
                  Automated email password reset is temporarily offline.
                </p>
                <p className="text-xs text-silver/80 leading-relaxed">
                  To reset your password or receive new credentials, please email the administrator directly at:
                </p>
                <div className="py-2">
                  <a
                    href={`mailto:admin@orderofkpi.org?subject=Password%20Reset%20Request%20-%20KPI%20Member%20Portal&body=Hello%20Administrator%2C%0A%0APlease%20reset%20the%20password%20for%20my%20account%3A%20${encodeURIComponent(email || '')}%0A%0AThank%20you.`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-white text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-md w-full"
                  >
                    <Mail size={16} /> Email admin@orderofkpi.org
                  </a>
                </div>
                <p className="text-[11px] text-silver/60">
                  Admins can manually configure your password immediately upon request.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-primary hover:text-white uppercase tracking-wider font-bold transition-colors inline-flex items-center gap-1"
                >
                  Return to Member Login &rarr;
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); }}
                    className="text-[10px] text-primary hover:text-white uppercase tracking-widest font-bold transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-white text-black py-3.5 px-6 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          )}

          <div className="mt-6 text-center bg-black/40 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs text-primary/90 leading-relaxed font-body">
              Technical or Portal Issues? Contact Our Support Team at{' '}
              <a href="mailto:admin@orderofkpi.org" className="font-bold text-gold underline hover:text-white transition-colors">
                admin@orderofkpi.org
              </a>
            </p>
          </div>

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
