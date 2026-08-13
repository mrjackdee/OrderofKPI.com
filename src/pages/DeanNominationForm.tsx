import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Users } from 'lucide-react';
import MemberHeader from '../components/MemberHeader';
import { 
  firebaseFetchAllDeanNominations, 
  syncDeanDataFromFirestore 
} from '../lib/firebase';

interface NomineeItem {
  fullName: string;
  firstName: string;
  lastName: string;
}

export default function DeanNominationForm() {
  const userEmail = sessionStorage.getItem('userEmail') || '';
  const userName = sessionStorage.getItem('userName') || '';

  const [nominees, setNominees] = useState<NomineeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[DeanNominationForm] Loaded closed portal view. userEmail:', userEmail, 'userName:', userName);
    loadNomineesData();
  }, [userEmail]);

  const loadNomineesData = async () => {
    setLoading(true);
    let allNominations: any[] = [];

    // Background sync on load to ensure local state matches Firestore
    syncDeanDataFromFirestore().catch((err) => console.warn('[DeanNominationForm] Background sync error:', err));

    // 1. Fetch server nominations
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/dean-nominations', { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.nominations)) {
            allNominations = [...data.nominations];
          }
        }
      }
    } catch (err) {
      console.warn('[DeanNominationForm] Server fetch nominations error:', err);
    }

    // 2. Fetch Firestore nominations
    try {
      const fsRes = await firebaseFetchAllDeanNominations();
      if (fsRes && fsRes.success && Array.isArray(fsRes.nominations)) {
        const map = new Map<string, any>();
        [...allNominations, ...fsRes.nominations].forEach((item) => {
          if (!item) return;
          const key = (item.voter_email || item.id || Math.random().toString()).toLowerCase().trim();
          map.set(key, item);
        });
        allNominations = Array.from(map.values());
      }
    } catch (err) {
      console.warn('[DeanNominationForm] Firestore fetch nominations error:', err);
    }

    // Process unique nominee full names
    const nomineeMap: Record<string, NomineeItem> = {};
    allNominations.forEach((nom) => {
      const fn = (nom.nominee_first_name || '').trim();
      const ln = (nom.nominee_last_name || '').trim();
      const fullName = `${fn} ${ln}`.trim();
      if (fullName) {
        const key = fullName.toLowerCase();
        if (!nomineeMap[key]) {
          nomineeMap[key] = {
            fullName,
            firstName: fn,
            lastName: ln
          };
        }
      }
    });

    const compiledNominees = Object.values(nomineeMap).sort((a, b) => 
      a.fullName.localeCompare(b.fullName)
    );

    setNominees(compiledNominees);
    setLoading(false);
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-full">
            <Lock size={14} className="text-[#B8860B]" />
            <span className="text-[10px] font-bold text-[#1E3F20] uppercase tracking-[0.2em]">
              Nomination Process Closed
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#1E3F20]">
            Intake Dean Nominations
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            The official recommendation process for the FY27 Intake Dean position. Nominations are now closed.
          </p>
          <div className="bg-[#FDFCF0] border border-[#B8860B]/30 rounded-2xl p-5 space-y-2 mt-4 text-xs text-[#1E3F20]">
            <p className="font-bold uppercase tracking-wider text-[#B8860B]">Nomination Period & Timeline</p>
            <p><strong>Period:</strong> Monday, August 10, 2026 at 12:01 AM ET to Wednesday, August 12, 2026 at 9:08 PM ET.</p>
            <p><strong>Status:</strong> <span className="text-amber-800 font-bold uppercase tracking-wide">Officially Closed (9:08 PM ET on August 12, 2026)</span></p>
            <p className="pt-2 border-t border-[#B8860B]/20 text-gray-600">
              For questions regarding the dean nomination process, contact Membership Intake Chair <a href="mailto:james.haywood@orderofkpi.org" className="font-bold text-[#1E3F20] underline">james.haywood@orderofkpi.org</a>.
            </p>
          </div>
        </div>

        {/* Closed Announcement Banner */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-8 md:p-10 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-amber-900 font-bold text-sm uppercase tracking-wider">
            <Lock size={22} className="text-amber-700 shrink-0" />
            <span>Intake Dean Nomination Period Is Formally Closed</span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">
            The nomination window for the FY27 Intake Dean position officially concluded at <strong>9:08 PM ET on Wednesday, August 12, 2026</strong>. Submitting new nominations or modifying existing recommendations is now disabled.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">
            Thank you to all financial members who submitted recommendations during the official window. Below is the simple roster of official Intake Dean nominees.
          </p>
        </div>

        {/* Simple Table of Intake Dean Nominees */}
        <div className="bg-white border border-[#B8860B]/30 rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgba(30,63,32,0.06)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#B8860B]/20 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1E3F20]">
                Intake Dean Nominees
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Official list of members nominated for the FY27 Intake Dean position
              </p>
            </div>
            <div className="bg-[#1E3F20]/10 border border-[#1E3F20]/20 px-4 py-2 rounded-full text-xs font-bold text-[#1E3F20] flex items-center gap-2 self-start sm:self-auto">
              <Users size={16} />
              <span>{nominees.length} Nominee{nominees.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm font-medium">
              Loading nominees list...
            </div>
          ) : nominees.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm italic">
              No nominations were recorded during the active nomination window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#B8860B]/30 text-[11px] font-bold uppercase tracking-widest text-[#1E3F20] bg-[#FDFCF0]">
                    <th className="py-3.5 px-4 w-16">#</th>
                    <th className="py-3.5 px-4">Nominee Name</th>
                    <th className="py-3.5 px-4 text-right">Nomination Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8860B]/15 text-sm">
                  {nominees.map((nominee, index) => (
                    <tr key={nominee.fullName} className="hover:bg-[#FDFCF0]/60 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#1E3F20]">
                        {nominee.fullName}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1E3F20]/10 text-[#1E3F20] border border-[#1E3F20]/20 text-xs font-semibold rounded-full">
                          <CheckCircle2 size={12} className="text-[#1E3F20]" />
                          Official Nominee
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
