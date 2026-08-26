import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Lock, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Sparkles, Check } from 'lucide-react';
import { performTokenPasswordReset, requestApplicantPasswordReset } from '../lib/memberDb';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';
  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devResetLink, setDevResetLink] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [firebaseEmail, setFirebaseEmail] = useState<string | null>(null);

  // If Firebase oobCode is present in URL, verify it
  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setFirebaseEmail(userEmail);
          if (!emailParam) setEmail(userEmail);
        })
        .catch((err) => {
          console.warn('Firebase reset code verification warning:', err);
          setError('The password reset link is invalid or has expired. Please request a new link below.');
        });
    }
  }, [oobCode, emailParam]);

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isFormValid = hasMinLength && hasNumber && hasUppercase && passwordsMatch;

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isFormValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    setLoading(true);

    try {
      if (oobCode) {
        // Firebase Auth reset flow
        await confirmPasswordReset(auth, oobCode, newPassword);
        // Also sync local server / Firestore database
        const targetEmail = firebaseEmail || email;
        if (targetEmail) {
          await performTokenPasswordReset(targetEmail, 'firebase_oob', newPassword).catch(() => {});
        }
        setSuccess('Your password has been reset successfully! You can now log in with your new password.');
      } else if (token && email) {
        // Server Token reset flow
        const result = await performTokenPasswordReset(email, token, newPassword);
        if (result.success) {
          setSuccess(result.message);
        } else {
          setError(result.message);
        }
      } else {
        setError('Missing password reset verification token. Please request a new link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete password reset. Please try requesting a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your assigned @orderofkpi.org email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      setDevResetLink('');
      const result = await requestApplicantPasswordReset(email);
      if (result.success) {
        setSuccess(result.message);
        if (result.resetLink) {
          setDevResetLink(result.resetLink);
        }
        setRequestSent(true);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to process reset link request.');
    } finally {
      setLoading(false);
    }
  };

  const isResetMode = Boolean(token || oobCode);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 relative overflow-hidden bg-cream/30 w-full max-w-full">
      {/* Background radial decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 min-w-0"
      >
        <div className="bg-ivy text-cream border-2 border-gold/40 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden relative">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-14 h-14 bg-gold/15 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto text-gold shadow-md">
              <Key size={26} />
            </div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-wider text-cream">
              {isResetMode ? 'Set New Password' : 'Reset Your Password'}
            </h1>
            <p className="text-xs text-cream/75 max-w-xs mx-auto leading-relaxed">
              {isResetMode
                ? `Enter your new secure account password for ${email || 'your account'}.`
                : 'Enter your assigned @orderofkpi.org email address to receive a secure password change link.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 mb-6 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-3"
            >
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 mb-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-300">Password Action Completed</p>
                  <p className="leading-relaxed">{success}</p>
                </div>
              </div>

              {devResetLink && (
                <div className="pt-3 border-t border-emerald-500/30 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} /> Direct Reset Access Link:
                  </span>
                  <a
                    href={devResetLink}
                    className="w-full text-center py-2.5 bg-gold hover:bg-gold-light text-ivy font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    Click Here to Reset Password Now
                  </a>
                </div>
              )}

              {isResetMode && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3 bg-gold hover:bg-gold-light text-ivy font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Proceed to Login
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Form when resetting password with valid token */}
          {isResetMode && !success && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cream/70 mb-1.5 ml-1">
                  Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={Boolean(emailParam || firebaseEmail)}
                  className="w-full px-4 py-3 bg-stone-900/60 border border-gold/30 rounded-xl text-cream text-xs outline-none focus:border-gold disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cream/70 mb-1.5 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-stone-900/60 border border-gold/30 rounded-xl text-cream text-xs outline-none focus:border-gold pr-10"
                    required
                  />
                  <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cream/70 mb-1.5 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-stone-900/60 border border-gold/30 rounded-xl text-cream text-xs outline-none focus:border-gold pr-10"
                    required
                  />
                  <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-stone-900/40 rounded-xl border border-gold/20 space-y-2">
                <span className="text-[10px] text-gold/80 font-bold uppercase tracking-wider block">
                  Password Complexity Guidelines:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${hasMinLength ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'border-gold/20 text-cream/30'}`}>
                      {hasMinLength && <Check size={10} />}
                    </div>
                    <span className={hasMinLength ? 'text-emerald-300 font-semibold' : 'text-cream/50'}>
                      8+ Characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${hasUppercase ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'border-gold/20 text-cream/30'}`}>
                      {hasUppercase && <Check size={10} />}
                    </div>
                    <span className={hasUppercase ? 'text-emerald-300 font-semibold' : 'text-cream/50'}>
                      1 Uppercase Letter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${hasNumber ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'border-gold/20 text-cream/30'}`}>
                      {hasNumber && <Check size={10} />}
                    </div>
                    <span className={hasNumber ? 'text-emerald-300 font-semibold' : 'text-cream/50'}>
                      1 Number
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${passwordsMatch ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'border-gold/20 text-cream/30'}`}>
                      {passwordsMatch && <Check size={10} />}
                    </div>
                    <span className={passwordsMatch ? 'text-emerald-300 font-semibold' : 'text-cream/50'}>
                      Passwords Match
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-3.5 bg-gold hover:bg-gold-light text-ivy font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form to request password reset link if opening page directly */}
          {!isResetMode && !requestSent && (
            <form onSubmit={handleRequestLinkSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cream/70 mb-1.5 ml-1">
                  Email Address (@orderofkpi.org)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@orderofkpi.org"
                  className="w-full px-4 py-3 bg-stone-900/60 border border-gold/30 rounded-xl text-cream text-xs outline-none focus:border-gold placeholder:text-cream/30"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 bg-gold hover:bg-gold-light text-ivy font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login Footer */}
          <div className="mt-8 pt-6 border-t border-gold/20 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-gold/90 hover:text-gold font-semibold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft size={14} /> Back to Member Login
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
