/**
 * Universal Portal Self-Healing Sync Engine
 * Enforces triple-channel persistence (LocalStorage + Cloud Firestore + Backend API)
 * for all Member & Applicant actions across the entire web application.
 */

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// -----------------------------------------------------------------------------
// 1. SELECTION VOTES & BALLOTS (Self-Healing Multi-Channel Sync)
// -----------------------------------------------------------------------------
export async function syncMemberVote(voterEmail: string, candidateId: string, decision: 'yes' | 'no' | 'abstain') {
  const normEmail = voterEmail.toLowerCase().trim();
  const voteKey = `kpi_vote_${normEmail}_${candidateId}`;
  const voteRecord = {
    id: `vote_${normEmail.replace(/[^a-z0-9]/g, '_')}_${candidateId}`,
    voter_email: normEmail,
    candidate_id: candidateId,
    decision,
    timestamp: new Date().toISOString()
  };

  // Channel 1: Immediate Browser LocalStorage Backup
  try {
    localStorage.setItem(voteKey, JSON.stringify(voteRecord));
    const allVotes = JSON.parse(localStorage.getItem('kpi_all_user_votes') || '[]');
    const existingIdx = allVotes.findIndex((v: any) => v.voter_email === normEmail && v.candidate_id === candidateId);
    if (existingIdx >= 0) {
      allVotes[existingIdx] = voteRecord;
    } else {
      allVotes.push(voteRecord);
    }
    localStorage.setItem('kpi_all_user_votes', JSON.stringify(allVotes));
  } catch (e) {
    console.warn('[SYNC] LocalStorage vote backup notice:', e);
  }

  // Channel 2: Cloud Firestore Sync
  try {
    const voteRef = doc(db, 'votes', voteRecord.id);
    await setDoc(voteRef, voteRecord, { merge: true });
  } catch (e) {
    console.warn('[SYNC] Firestore vote sync notice:', e);
  }

  // Channel 3: Backend API Sync
  try {
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteRecord)
    });
  } catch (e) {
    console.warn('[SYNC] Backend API vote sync notice:', e);
  }

  return voteRecord;
}

export async function fetchMemberVotes(voterEmail?: string): Promise<any[]> {
  const votesMap = new Map<string, any>();

  // 1. LocalStorage cache
  try {
    const localStr = localStorage.getItem('kpi_all_user_votes');
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (Array.isArray(parsed)) {
        parsed.forEach(v => votesMap.set(`${v.voter_email}_${v.candidate_id}`, v));
      }
    }
  } catch (e) {}

  // 2. Cloud Firestore
  try {
    const snap = await getDocs(collection(db, 'votes'));
    snap.forEach(d => {
      const data = d.data();
      if (data.voter_email && data.candidate_id) {
        votesMap.set(`${data.voter_email}_${data.candidate_id}`, data);
      }
    });
  } catch (e) {}

  // 3. Backend API
  try {
    const res = await fetch('/api/votes');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.votes)) {
        data.votes.forEach((v: any) => votesMap.set(`${v.voter_email}_${v.candidate_id}`, v));
      }
    }
  } catch (e) {}

  const combined = Array.from(votesMap.values());
  if (voterEmail) {
    const norm = voterEmail.toLowerCase().trim();
    return combined.filter(v => v.voter_email === norm);
  }
  return combined;
}

// -----------------------------------------------------------------------------
// 2. DEAN NOMINATIONS & DEAN VOTING (Self-Healing Multi-Channel Sync)
// -----------------------------------------------------------------------------
export async function syncDeanNomination(voterEmail: string, nomineeFirstName: string, nomineeLastName: string, statement: string) {
  const normEmail = voterEmail.toLowerCase().trim();
  const nominationRecord = {
    id: `dean_nom_${normEmail.replace(/[^a-z0-9]/g, '_')}`,
    voter_email: normEmail,
    nominee_first_name: nomineeFirstName,
    nominee_last_name: nomineeLastName,
    statement,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem(`kpi_dean_nomination_${normEmail}`, JSON.stringify(nominationRecord));
  } catch (e) {}

  try {
    await setDoc(doc(db, 'dean_nominations', nominationRecord.id), nominationRecord, { merge: true });
  } catch (e) {}

  try {
    await fetch('/api/dean-nominations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nominationRecord)
    });
  } catch (e) {}

  return nominationRecord;
}

export async function syncDeanVote(voterEmail: string, nomineeName: string) {
  const normEmail = voterEmail.toLowerCase().trim();
  const voteRecord = {
    id: `dean_vote_${normEmail.replace(/[^a-z0-9]/g, '_')}`,
    voter_email: normEmail,
    nominee_name: nomineeName,
    timestamp: new Date().toISOString()
  };

  try {
    localStorage.setItem(`kpi_dean_vote_${normEmail}`, JSON.stringify(voteRecord));
  } catch (e) {}

  try {
    await setDoc(doc(db, 'dean_votes', voteRecord.id), voteRecord, { merge: true });
  } catch (e) {}

  try {
    await fetch('/api/dean-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteRecord)
    });
  } catch (e) {}

  return voteRecord;
}
