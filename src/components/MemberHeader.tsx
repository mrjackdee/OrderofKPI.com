import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Key, Check, AlertCircle, X, ShieldAlert, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MemberHeader() {
  const [firstName, setFirstName] = useState('Member');
  const [email, setEmail] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const savedFirstName = sessionStorage.getItem('userFirstName');
    const savedEmail = sessionStorage.getItem('userEmail');
    const savedFirstLogin = sessionStorage.getItem('isFirstLogin');
    
    if (savedFirstName) {
      setFirstName(savedFirstName);
    }
    if (savedEmail) {
      setEmail(savedEmail);
    }
    if (savedFirstLogin === 'true') {
      setIsFirstLogin(true);
      setShowModal(true); // Force show modal
    }
  }, []);

  // Password requirements
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  
  const isFormValid = hasMinLength && hasNumber && hasUppercase && passwordsMatch;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isFormValid) {
      setError('Please meet all password complexity requirements.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword: isFirstLogin ? '2012' : currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update password.');
      }

      setSuccess(true);
      sessionStorage.setItem('isFirstLogin', 'false');
      setIsFirstLogin(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeChangePasswordModal = () => {
    if (isFirstLogin) return; // Prevent closing if forced
    setShowModal(false);
    // Reset states
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-12 pt-6">
      <div className="bg-white/5 border border-primary/20 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black uppercase text-sm">
            {firstName.substring(0, 2)}
          </div>
          <div className="text-left">
            <h3 className="text-white text-base md:text-lg font-bold uppercase tracking-wider">
              Welcome, {firstName}
            </h3>
            <p className="text-xs text-silver/60 uppercase font-medium tracking-widest">
              KPI Active Financial Member Portal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-transparent border border-primary/40 hover:border-primary text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Key size={13} /> Change Password
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl transition-all flex items-center gap-1.5"
          >
            <LogOut size={13} /> Log Out
          </button>
        </div>
      </div>

      {/* Change Password Dialog/Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-pure-black border border-primary/40 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(212,175,55,0.15)]"
            >
              {!isFirstLogin && (
                <button
                  onClick={closeChangePasswordModal}
                  className="absolute top-5 right-5 text-silver/40 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              )}

              {success ? (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 size={36} />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
                    Password Changed Successfully
                  </h2>
                  <p className="text-silver/60 text-xs uppercase tracking-widest leading-relaxed max-w-sm mx-auto mb-6">
                    Your password has been updated securely. You can now use your new password for future sessions.
                  </p>
                  <button
                    onClick={closeChangePasswordModal}
                    className="px-8 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-colors shadow-md shadow-primary/20"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">
                        {isFirstLogin ? 'Secure Your Account' : 'Change Password'}
                      </h2>
                      <p className="text-[10px] text-silver/60 uppercase tracking-widest font-bold">
                        {isFirstLogin ? 'First login password configuration' : 'Self-service password update'}
                      </p>
                    </div>
                  </div>

                  {isFirstLogin && (
                    <div className="mb-5 p-3.5 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                      <ShieldAlert size={16} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-primary uppercase tracking-wider font-bold leading-normal">
                        Security Notice: Since this is your first login, you are required to change your default password before accessing portal content.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-5 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-200 font-medium">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {!isFirstLogin && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold ml-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all placeholder:text-silver/30"
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold ml-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all placeholder:text-silver/30"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-silver/80 uppercase tracking-widest font-bold ml-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all placeholder:text-silver/30"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>

                    {/* Requirements validation indicator checklist */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                      <span className="text-[9px] text-silver/40 uppercase tracking-widest font-bold block mb-1">Complexity Requirements:</span>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${hasMinLength ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'border-silver/20 text-silver/30'}`}>
                          <Check size={10} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${hasMinLength ? 'text-emerald-400' : 'text-silver/40'}`}>
                          At least 8 characters
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${hasNumber ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'border-silver/20 text-silver/30'}`}>
                          <Check size={10} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${hasNumber ? 'text-emerald-400' : 'text-silver/40'}`}>
                          Contains at least 1 number
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${hasUppercase ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'border-silver/20 text-silver/30'}`}>
                          <Check size={10} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${hasUppercase ? 'text-emerald-400' : 'text-silver/40'}`}>
                          Contains 1 uppercase letter
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${passwordsMatch ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'border-silver/20 text-silver/30'}`}>
                          <Check size={10} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${passwordsMatch ? 'text-emerald-400' : 'text-silver/40'}`}>
                          Passwords match exactly
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-white text-black py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
