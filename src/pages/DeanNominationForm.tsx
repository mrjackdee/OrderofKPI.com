import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Award, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { useToast } from '../components/ToastContext';
import { 
  firebaseSaveDeanNomination, 
  firebaseFetchDeanNomination, 
  syncDeanDataFromFirestore 
} from '../lib/firebase';

export default function DeanNominationForm() {
  const { showToast } = useToast();
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [statement, setStatement] = useState('');
  const [existingNomination, setExistingNomination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[DeanNominationForm] Loaded. userEmail:', userEmail, 'userName:', userName);
    // Background sync on load to ensure local database matches Firestore
    syncDeanDataFromFirestore()
      .catch((err) => console.warn('[DeanNominationForm] Background sync error:', err))
      .finally(() => {
        fetchUserNomination();
      });
  }, [userEmail]);

  const fetchUserNomination = async () => {
    if (!userEmail) {
      console.warn('[DeanNominationForm] No userEmail found in sessionStorage.');
      setLoading(false);
      return;
    }
    try {
      console.log('[DeanNominationForm] Fetching existing nomination for:', userEmail);
      let nomination = null;

      // Try server first
      try {
        const res = await fetch(`/api/dean-nominations/user?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && data.nomination) {
              nomination = data.nomination;
            }
          }
        }
      } catch (err) {
        console.warn('[DeanNominationForm] Server fetch nomination failed, falling back to Firestore:', err);
      }

      // Fallback to Firestore if server failed or had no nomination
      if (!nomination) {
        console.log('[DeanNominationForm] Attempting to fetch nomination from Firestore...');
        const fsRes = await firebaseFetchDeanNomination(userEmail);
        if (fsRes.success && fsRes.nomination) {
          nomination = fsRes.nomination;
        }
      }

      if (nomination) {
        console.log('[DeanNominationForm] Found nomination:', nomination);
        setExistingNomination(nomination);
        setFirstName(nomination.nominee_first_name || '');
        setLastName(nomination.nominee_last_name || '');
        setStatement(nomination.statement || '');
      } else {
        console.log('[DeanNominationForm] No existing nomination found for user.');
      }
    } catch (err) {
      console.error('[DeanNominationForm] Error fetching nomination:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedFirstName = (firstName || '').trim();
    const trimmedLastName = (lastName || '').trim();
    const trimmedStatement = (statement || '').trim();

    console.log('[DeanNominationForm] handleSubmit triggered.', {
      voter_email: userEmail,
      nominee_first_name: trimmedFirstName,
      nominee_last_name: trimmedLastName,
      statementLength: trimmedStatement.length
    });

    if (!trimmedFirstName || !trimmedLastName || !trimmedStatement) {
      const errMsg = 'Please provide nominee first name, last name, and a nomination statement.';
      setError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    if (!userEmail) {
      const errMsg = 'Your session has expired. Please log in again.';
      setError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Dual-write to Cloud Firestore first (guarantees zero data loss)
      console.log('[DeanNominationForm] Saving nomination to Cloud Firestore...');
      const fsRes = await firebaseSaveDeanNomination(userEmail, {
        nominee_first_name: trimmedFirstName,
        nominee_last_name: trimmedLastName,
        statement: trimmedStatement
      });

      if (!fsRes.success) {
        console.warn('[DeanNominationForm] Firestore dual-write warning:', fsRes.message);
      } else {
        console.log('[DeanNominationForm] Firestore dual-write completed successfully.');
      }

      // 2. Write to local server Express API
      let serverSuccess = false;
      let serverErrorMsg = '';

      try {
        console.log('[DeanNominationForm] Sending POST request to /api/dean-nominations...');
        const res = await fetch('/api/dean-nominations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voter_email: userEmail,
            nominee_first_name: trimmedFirstName,
            nominee_last_name: trimmedLastName,
            statement: trimmedStatement
          })
        });

        console.log('[DeanNominationForm] POST response status:', res.status);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            serverSuccess = true;
          } else {
            serverErrorMsg = data.message || 'Server rejected nomination';
          }
        } else {
          console.warn('[DeanNominationForm] Server returned non-JSON response (likely proxy cookie redirect/fallback).');
        }
      } catch (err: any) {
        console.warn('[DeanNominationForm] Server API request failed:', err?.message || err);
      }

      // We consider it a complete success if at least Firestore was written successfully
      if (fsRes.success || serverSuccess) {
        const successMsg = 'Your nomination for Intake Dean has been successfully recorded. Each member is limited to 1 active nomination, which you may update at any time.';
        setSuccessMessage(successMsg);
        showToast('Nomination submitted successfully!', 'success');

        // If server failed but Firestore succeeded, trigger background sync
        if (!serverSuccess && fsRes.success) {
          console.log('[DeanNominationForm] Attempting background sync to update local server...');
          syncDeanDataFromFirestore().catch(() => {});
        }

        fetchUserNomination();
      } else {
        throw new Error(serverErrorMsg || 'Failed to record nomination. Please verify your internet connection.');
      }
    } catch (err: any) {
      console.error('[DeanNominationForm] Error during submission:', err);
      const errMsg = err.message || 'Network error occurred.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
      console.log('[DeanNominationForm] Submission process completed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans pb-24">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <MemberHeader />

        {/* Back Link */}
        <div>
          <Link 
            to="/member-portal" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1E3F20] hover:text-[#B8860B] transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Portal
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-4">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1E3F20]">
            Intake Dean Nomination
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            Submit your recommendation for the FY27 Intake Dean position. Each eligible member is restricted to a single active nomination.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-2xl p-5 space-y-2 mt-4 text-xs text-[#1E3F20]">
            <p className="font-bold uppercase tracking-wider text-[#B8860B]">Nomination Period & Timeline</p>
            <p><strong>Period:</strong> Monday, August 10, 2026 at 12:01 AM ET to Wednesday, August 12, 2026 at 9:08 PM ET.</p>
            <p><strong>Deadline:</strong> Dean nominations close strictly at <strong>9:08 PM ET on August 12, 2026</strong>.</p>
            <p className="pt-2 border-t border-[#B8860B]/20 text-gray-600">
              If you have any questions about the process, please reach out to <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a> (Membership Intake Chair).
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {existingNomination && (
          <div className="bg-[#1E3F20]/5 border border-[#1E3F20]/20 rounded-2xl p-6 flex items-start gap-4">
            <CheckCircle2 size={24} className="text-[#1E3F20] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#1E3F20] text-sm uppercase tracking-wider">Active Nomination Registered</h3>
              <p className="text-xs text-gray-600 mt-1">
                You currently have an active nomination for <span className="font-bold text-[#1E3F20]">{existingNomination.nominee_first_name} {existingNomination.nominee_last_name}</span>. Submitting this form again will update your active nomination.
              </p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgba(30,63,32,0.06)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800 text-xs">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F20] mb-2">
                  Nominee First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Marcus"
                  className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl px-4 py-3 text-sm text-[#1E3F20] focus:outline-none focus:border-[#1E3F20] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F20] mb-2">
                  Nominee Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Garvey"
                  className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl px-4 py-3 text-sm text-[#1E3F20] focus:outline-none focus:border-[#1E3F20] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3F20] mb-2">
                Nomination Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Provide a brief statement explaining why this member is qualified and endorsed for the Intake Dean position..."
                rows={5}
                className="w-full bg-[#FDFCF0] border border-[#B8860B]/30 rounded-xl p-4 text-sm text-[#1E3F20] focus:outline-none focus:border-[#1E3F20] transition-all resize-none"
                required
              />
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#B8860B]/20">
              <span className="text-xs text-gray-500 font-medium">
                Logging as: <strong className="text-[#1E3F20]">{userName || userEmail}</strong> (Anonymous to review committees)
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1E3F20] hover:bg-[#B8860B] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Nomination'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
