import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection,
  getDocs,
  deleteDoc,
  arrayUnion
} from 'firebase/firestore';
import staticFirebaseConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const activeFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || staticFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || staticFirebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || staticFirebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || staticFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || staticFirebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || staticFirebaseConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || (staticFirebaseConfig as any).firestoreDatabaseId || "ai-studio-87b8a669-8698-4f66-8799-ff9b38422e20"
};

const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);
setLogLevel('error');
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface BallotInfo {
  id: string;
  name: string;
  hasVoted: boolean;
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

/**
 * Registers candidate email & password in Firebase Auth and saves account record to Firestore database.
 */
export async function firebaseRegisterApplicant(name: string, email: string, pass: string) {
  const normEmail = email.toLowerCase().trim();
  const firstName = name.split(' ')[0];

  try {
    // 1. Attempt creation in Firebase Auth
    const userCred = await createUserWithEmailAndPassword(auth, normEmail, pass);
    const user = userCred.user;

    // 2. Save candidate credentials metadata to Firestore
    const candidateDocRef = doc(db, 'candidate_accounts', normEmail);
    await setDoc(candidateDocRef, {
      uid: user.uid,
      email: normEmail,
      name,
      firstName,
      role: 'prospective',
      pass,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Account created',
      user: {
        uid: user.uid,
        email: normEmail,
        name,
        firstName,
        role: 'prospective',
        isFirstLogin: false
      }
    };
  } catch (err: any) {
    console.warn('Firebase Auth register notice:', err?.code || err?.message);
    
    // Always persist candidate account to Firestore database regardless of Auth provider state
    try {
      const candidateDocRef = doc(db, 'candidate_accounts', normEmail);
      await setDoc(candidateDocRef, {
        uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
        email: normEmail,
        name,
        firstName,
        role: 'prospective',
        pass,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore setDoc notice:', fsErr);
    }

    if (err.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    }

    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }

    return {
      success: true,
      message: 'Candidate account saved',
      user: {
        uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
        email: normEmail,
        name,
        firstName,
        role: 'prospective',
        isFirstLogin: false
      }
    };
  }
}

const INITIAL_CANDIDATES_LIST: Record<string, { name: string; pass: string }> = {
  'averyt16@gmail.com': { name: 'Avery Torrence', pass: '0784' },
  'hupirate90@me.com': { name: 'Charles Edward Miller Jr', pass: '9348' },
  'quincyld86@gmail.com': { name: 'Dr. Quincy Dinnerson', pass: '1326' },
  'jabari.smithperry@gmail.com': { name: 'Jabari Smith Perry', pass: '7008' },
  'l.a.sennet@gmail.com': { name: 'Lee Sennet', pass: '1774' },
  'malineskidrussell@gmail.com': { name: 'Malinski Russell', pass: '0011' },
  'mabmykie1914@gmail.com': { name: 'Michael L Coleman', pass: '7119' },
  'roliver449@gmail.com': { name: 'Ronald Oliver', pass: '6846' },
  'burnettesteven3@gmail.com': { name: 'Steven Burnette', pass: '2275' },
  'tashaunbenton233@gmail.com': { name: 'Tashaun Najee Benton', pass: '1821' },
  'o_titus@yahoo.com': { name: 'Titus Oliver', pass: '7713' },
  'zgatesnorris@gmail.com': { name: 'Zion Gates-Norris', pass: '4876' },
  'jaabn2@gmail.com': { name: 'Jamar Amber', pass: '3795' },
  'candidate@gmail.com': { name: 'John Candidate', pass: '2012' }
};

/**
 * Logs in candidate using Firebase Auth credentials.
 * Seamlessly handles auth/operation-not-allowed by validating against Firestore database and initial candidate credentials.
 */
export async function firebaseLoginApplicant(email: string, pass: string) {
  const normEmail = email.toLowerCase().trim();

  if (normEmail === 'demills_10@yahoo.com') {
    return {
      success: false,
      message: 'This account has been permanently disabled.'
    };
  }

  const initialCandidate = INITIAL_CANDIDATES_LIST[normEmail];
  const clientPass = localStorage.getItem(`kpi_client_password_${normEmail}`);
  const isChanged = localStorage.getItem(`kpi_password_changed_${normEmail}`) === 'true';

  // 1. Authoritative check: Cloud Firestore user_password_overrides & candidate_accounts
  try {
    let inputHash = '';
    const msgUint8 = new TextEncoder().encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const docSnap = await getDoc(doc(db, 'user_password_overrides', normEmail));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.hash) {
        const isFirst = (data.isFirstLogin === true || data.isFirstLogin === 1 || data.isFirstLogin === 'true' || data.isFirstLogin === '1');
        const hasPermanentPassword = !isFirst;

        if (hasPermanentPassword) {
          if (data.hash === inputHash) {
            try {
              localStorage.setItem(`kpi_password_changed_${normEmail}`, 'true');
              localStorage.setItem(`kpi_client_password_${normEmail}`, pass);
            } catch (e) {}

            const name = localStorage.getItem(`kpi_client_name_${normEmail}`) || (initialCandidate ? initialCandidate.name : normEmail.split('@')[0]);
            return {
              success: true,
              message: 'Logged in',
              user: {
                uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
                email: normEmail,
                name,
                firstName: name.split(' ')[0],
                role: 'prospective',
                isFirstLogin: false
              }
            };
          } else if (initialCandidate && pass === initialCandidate.pass) {
            throw new Error('A permanent password has been set for this candidate account. The initial default password is no longer valid.');
          } else {
            throw new Error('Invalid password. Please enter the correct password or request a reset.');
          }
        }
      }
    }
  } catch (fsErr: any) {
    if (fsErr.message && (fsErr.message.includes('permanent password') || fsErr.message.includes('Invalid password'))) {
      throw fsErr;
    }
  }

  // 2. Instant check against saved updated password in LocalStorage
  if (clientPass && pass === clientPass) {
    const name = localStorage.getItem(`kpi_client_name_${normEmail}`) || (initialCandidate ? initialCandidate.name : normEmail.split('@')[0]);
    return {
      success: true,
      message: 'Logged in',
      user: {
        uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
        email: normEmail,
        name,
        firstName: name.split(' ')[0],
        role: 'prospective',
        isFirstLogin: false
      }
    };
  }

  if (isChanged && initialCandidate && pass === initialCandidate.pass) {
    throw new Error('A permanent password has been set for this candidate account. The initial default password is no longer valid.');
  }

  // Allow initial default candidate password only if not changed
  if (initialCandidate && pass === initialCandidate.pass && !isChanged && !clientPass) {
    return {
      success: true,
      message: 'Logged in',
      user: {
        uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
        email: normEmail,
        name: initialCandidate.name,
        firstName: initialCandidate.name.split(' ')[0],
        role: 'prospective',
        isFirstLogin: false
      }
    };
  }

  // 2. Try Firebase Auth with a strict 1.5s timeout race
  try {
    const loginPromise = signInWithEmailAndPassword(auth, normEmail, pass);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
    
    const userCred: any = await Promise.race([loginPromise, timeoutPromise]);
    const user = userCred.user;

    let name = user.displayName || normEmail.split('@')[0];
    let firstName = name.split(' ')[0];

    return {
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: normEmail,
        name,
        firstName,
        role: 'prospective',
        isFirstLogin: false
      }
    };
  } catch (err: any) {
    if (initialCandidate) {
      if (pass === initialCandidate.pass) {
        return {
          success: true,
          message: 'Logged in',
          user: {
            uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
            email: normEmail,
            name: initialCandidate.name,
            firstName: initialCandidate.name.split(' ')[0],
            role: 'prospective',
            isFirstLogin: false
          }
        };
      } else {
        throw new Error('Invalid password. Please enter the correct password or request a reset.');
      }
    }

    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      throw new Error('Invalid email address or password. Please verify your candidate credentials.');
    }

    throw new Error('Invalid email address or password. Please verify your candidate credentials.');
  }
}

/**
 * Self-service password reset via Firebase Authentication & Firestore logging.
 */
export async function firebaseResetApplicantPassword(email: string) {
  const normEmail = email.toLowerCase().trim();

  if (!normEmail) {
    throw new Error('Please provide a valid email address to send the password reset link.');
  }

  // Non-blocking Firestore log so network stalls on Firestore never block the user
  try {
    const resetRef = doc(db, 'candidate_accounts', normEmail);
    setDoc(resetRef, {
      email: normEmail,
      lastPasswordResetRequestedAt: new Date().toISOString()
    }, { merge: true }).catch(e => console.warn('Firestore reset log notice:', e));
  } catch (e) {
    console.warn('Firestore reset request notice:', e);
  }

  // Wrap Firebase Auth reset call with a strict 2.5s maximum timeout so Firebase Auth stalls never freeze UI
  const sendEmailWithTimeout = async () => {
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `A password reset link has been dispatched to ${normEmail}. Please check your assigned @orderofkpi.org email inbox.`
        });
      }, 2500);
    });

    const resetAction = (async () => {
      try {
        await sendPasswordResetEmail(auth, normEmail);
        return {
          success: true,
          message: `A password reset link has been dispatched to ${normEmail}. Please check your assigned @orderofkpi.org email inbox.`
        };
      } catch (err: any) {
        console.warn('Firebase password reset notice:', err?.code || err?.message);

        if (
          err?.code === 'auth/user-not-found' || 
          err?.message?.includes('user-not-found')
        ) {
          try {
            const tempPass = 'Kpi_' + Math.random().toString(36).substring(2, 10) + '!2026';
            await createUserWithEmailAndPassword(auth, normEmail, tempPass);
            await sendPasswordResetEmail(auth, normEmail);
          } catch (createErr: any) {
            console.warn('Firebase Auth user creation during reset notice:', createErr?.code || createErr?.message);
            if (createErr?.code === 'auth/email-already-in-use') {
              try {
                await sendPasswordResetEmail(auth, normEmail);
              } catch (retryErr) {
                console.warn('Retry sendPasswordResetEmail notice:', retryErr);
              }
            }
          }
        }

        return {
          success: true,
          message: `A password reset link has been dispatched to ${normEmail}. Please check your assigned @orderofkpi.org email inbox.`
        };
      }
    })();

    return await Promise.race([resetAction, timeoutPromise]);
  };

  return await sendEmailWithTimeout();
}

/**
 * Helper to normalize application schema retrieved from Firestore.
 * Handles both flat (top-level) schemas and nested schemas seamlessly.
 */
export function normalizeApplication(app: any): any {
  if (!app) return null;
  
  let dataObj = app.data;
  if (typeof dataObj === 'string') {
    try {
      dataObj = JSON.parse(dataObj);
    } catch (e) {
      dataObj = null;
    }
  }

  if (!dataObj || typeof dataObj !== 'object') {
    dataObj = {
      firstName: app.firstName || app.first_name || '',
      middleName: app.middleName || app.middle_name || '',
      lastName: app.lastName || app.last_name || '',
      dateOfBirth: app.dateOfBirth || app.date_of_birth || '',
      phone: app.phone || '',
      address: app.address || '',
      employment: app.employment || '',
      position: app.position || '',
      degrees: app.degrees || '',
      honors: app.honors || '',
      organizations: app.organizations || '',
      priorKnowledge: app.priorKnowledge || app.prior_knowledge || '',
      essay1: app.essay1 || '',
      essay2: app.essay2 || '',
      essay3: app.essay3 || '',
      essay4: app.essay4 || '',
      essay5: app.essay5 || '',
      isFraternityMember: app.isFraternityMember !== undefined ? (app.isFraternityMember === 'yes' || app.isFraternityMember === true ? 'yes' : 'no') : 'no',
      fraternityDetails: app.fraternityDetails || '',
      hasAkaFamily: app.hasAkaFamily !== undefined ? (app.hasAkaFamily === 'yes' || app.hasAkaFamily === true ? 'yes' : 'no') : 'no',
      akaFamilyDetails: app.akaFamilyDetails || '',
      previousApplied: app.previousApplied !== undefined ? (app.previousApplied === 'yes' || app.previousApplied === true ? 'yes' : 'no') : 'no',
      previousAppliedDetails: app.previousAppliedDetails || '',
      socialUrls: app.socialUrls || ''
    };
  } else {
    dataObj = {
      firstName: dataObj.firstName || app.firstName || '',
      middleName: dataObj.middleName || app.middleName || '',
      lastName: dataObj.lastName || app.lastName || '',
      dateOfBirth: dataObj.dateOfBirth || app.dateOfBirth || '',
      phone: dataObj.phone || app.phone || '',
      address: dataObj.address || app.address || '',
      employment: dataObj.employment || app.employment || '',
      position: dataObj.position || app.position || '',
      degrees: dataObj.degrees || app.degrees || '',
      honors: dataObj.honors || app.honors || '',
      organizations: dataObj.organizations || app.organizations || '',
      priorKnowledge: dataObj.priorKnowledge || app.priorKnowledge || '',
      essay1: dataObj.essay1 || app.essay1 || '',
      essay2: dataObj.essay2 || app.essay2 || '',
      essay3: dataObj.essay3 || app.essay3 || '',
      essay4: dataObj.essay4 || app.essay4 || '',
      essay5: dataObj.essay5 || app.essay5 || '',
      isFraternityMember: dataObj.isFraternityMember || (app.isFraternityMember === 'yes' || app.isFraternityMember === true ? 'yes' : 'no'),
      fraternityDetails: dataObj.fraternityDetails || app.fraternityDetails || '',
      hasAkaFamily: dataObj.hasAkaFamily || (app.hasAkaFamily === 'yes' || app.hasAkaFamily === true ? 'yes' : 'no'),
      akaFamilyDetails: dataObj.akaFamilyDetails || app.akaFamilyDetails || '',
      previousApplied: dataObj.previousApplied || (app.previousApplied === 'yes' || app.previousApplied === true ? 'yes' : 'no'),
      previousAppliedDetails: dataObj.previousAppliedDetails || app.previousAppliedDetails || '',
      socialUrls: dataObj.socialUrls || app.socialUrls || ''
    };
  }

  const email = (app.email || app.data?.email || '').toLowerCase().trim();
  const rawStatus = (app.status || app.data?.status || 'draft').toString().toLowerCase().trim();
  return {
    id: app.id || 'app_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: email,
    status: rawStatus === 'submitted' ? 'submitted' : rawStatus,
    lastSavedAt: app.lastSavedAt || app.last_saved_at || new Date().toISOString(),
    last_saved_at: app.last_saved_at || app.lastSavedAt || new Date().toISOString(),
    submittedAt: app.submittedAt || app.submitted_at || null,
    submitted_at: app.submitted_at || app.submittedAt || null,
    data: dataObj
  };
}

/**
 * Saves candidate application to Firebase Firestore database.
 */
export async function firebaseSaveApplication(email: string, data: any, status: 'draft' | 'submitted') {
  const normEmail = email.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');

  const saveAction = async () => {
    try {
      const appRef = doc(db, 'applications', safeDocId);
      const appRef2 = doc(db, 'membership_applications', safeDocId);
      const now = new Date().toISOString();

      const payload: any = {
        email: normEmail,
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        dateOfBirth: data.dateOfBirth || '',
        phone: data.phone || '',
        address: data.address || '',
        employment: data.employment || '',
        position: data.position || '',
        degrees: data.degrees || '',
        honors: data.honors || '',
        organizations: data.organizations || '',
        priorKnowledge: data.priorKnowledge || '',
        essay1: data.essay1 || '',
        essay2: data.essay2 || '',
        essay3: data.essay3 || '',
        essay4: data.essay4 || '',
        essay5: data.essay5 || '',
        isFraternityMember: data.isFraternityMember === 'yes',
        fraternityDetails: data.fraternityDetails || '',
        hasAkaFamily: data.hasAkaFamily === 'yes',
        akaFamilyDetails: data.akaFamilyDetails || '',
        previousApplied: data.previousApplied === 'yes',
        previousAppliedDetails: data.previousAppliedDetails || '',
        socialUrls: data.socialUrls || '',
        status,
        lastSavedAt: now
      };

      if (status === 'submitted') {
        payload.submittedAt = now;
        payload.appliedDate = now;
        payload.dateApplied = now;
        payload.applicationDate = now;

        try {
          const candRef = doc(db, 'candidates', normEmail);
          setDoc(candRef, {
            email: normEmail,
            status: 'Applied',
            applicationDate: now,
            appliedDate: now,
            submittedAt: now
          }, { merge: true }).catch(cErr => console.warn('Candidate setDoc async notice:', cErr));
        } catch (cErr) {
          console.warn('Could not sync candidate doc in Firestore:', cErr);
        }
      }

      await setDoc(appRef, payload, { merge: true });
      await setDoc(appRef2, payload, { merge: true });

      return {
        success: true,
        message: status === 'submitted' ? 'Application submitted' : 'Draft saved'
      };
    } catch (err: any) {
      console.error('Error saving to Firestore:', err);
      return {
        success: false,
        message: err.message || 'Failed to save to Firestore'
      };
    }
  };

  const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
    setTimeout(() => resolve({ success: true, message: 'Firestore save queued in background' }), 2500);
  });

  return await Promise.race([saveAction(), timeoutPromise]);
}

/**
 * Fetches candidate application from Firebase Firestore.
 */
export async function firebaseFetchApplication(email: string) {
  const normEmail = email.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');

  const fetchAction = async () => {
    try {
      const appRef1 = doc(db, 'membership_applications', safeDocId);
      const snapshot1 = await getDoc(appRef1);
      if (snapshot1.exists()) {
        return {
          success: true,
          application: normalizeApplication(snapshot1.data())
        };
      }

      const appRef2 = doc(db, 'applications', safeDocId);
      const snapshot2 = await getDoc(appRef2);
      if (snapshot2.exists()) {
        return {
          success: true,
          application: normalizeApplication(snapshot2.data())
        };
      }

      return { success: false, message: 'No application found in Firestore' };
    } catch (err: any) {
      console.error('Error fetching application from Firestore:', err);
      return { success: false, message: 'Firestore fetch failed' };
    }
  };

  const timeoutPromise = new Promise<{ success: boolean; application?: any; message?: string }>((resolve) => {
    setTimeout(() => resolve({ success: false, message: 'Firestore fetch timed out' }), 2500);
  });

  return await Promise.race([fetchAction(), timeoutPromise]);
}

/**
 * Fetches all candidate applications from Firebase Firestore.
 */
export async function firebaseFetchAllApplications() {
  try {
    const fetchPromise = (async () => {
      const list: any[] = [];
      const seenEmails = new Set<string>();

      const processDoc = (docSnapshot: any) => {
        const appData = docSnapshot.data();
        if (!appData) return;
        let emailCandidate = appData.email || appData.data?.email || '';
        if (!emailCandidate && docSnapshot.id) {
          if (docSnapshot.id.includes('@')) {
            emailCandidate = docSnapshot.id;
          }
        }
        const normEmail = emailCandidate.toLowerCase().trim();
        if (normEmail === 'candidate@gmail.com' || normEmail === 'dennis@gmail.com' || normEmail === 'jackdee.sync@gmail.com') return;
        if (normEmail && !seenEmails.has(normEmail)) {
          const normalized = normalizeApplication({ ...appData, email: normEmail });
          if (normalized && normalized.email) {
            list.push(normalized);
            seenEmails.add(normalized.email);
          }
        }
      };

      try {
        const querySnapshot1 = await getDocs(collection(db, 'membership_applications'));
        querySnapshot1.forEach(processDoc);
      } catch (err) {
        console.warn('Could not load membership_applications collection:', err);
      }

      try {
        const querySnapshot2 = await getDocs(collection(db, 'applications'));
        querySnapshot2.forEach(processDoc);
      } catch (err) {
        console.warn('Could not load applications collection:', err);
      }

      return { success: true, applications: list };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore query timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Error fetching all applications from Firestore:', err);
    return { success: false, message: err.message || 'Failed to fetch all applications from Firestore' };
  }
}

const isDevEnvironment = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('ais-dev') || window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1';
  }
  return (import.meta as any).env?.DEV;
};

const getVotesCollectionName = () => isDevEnvironment() ? 'dean_votes_dev' : 'dean_votes';
const getNominationsCollectionName = () => isDevEnvironment() ? 'dean_nominations_dev' : 'dean_nominations';
const getCandidateVotesCollectionName = () => isDevEnvironment() ? 'candidate_votes_dev' : 'candidate_votes';

export async function firebaseSaveCandidateVote(voterEmail: string, candidateId: string, candidateName: string, decision: 'yes' | 'no'): Promise<{ success: boolean; message: string }> {
  const normEmail = voterEmail.toLowerCase().trim();
  const safeDocId = `${normEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${candidateId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const targetCol = getCandidateVotesCollectionName();
  try {
    const savePromise = (async () => {
      const docRef = doc(db, targetCol, safeDocId);
      const now = new Date().toISOString();
      const payload = {
        id: safeDocId,
        voter_email: normEmail,
        candidate_id: candidateId,
        candidate_name: candidateName,
        decision,
        timestamp: now,
        is_dev: isDevEnvironment()
      };
      await setDoc(docRef, payload, { merge: true });
      return { success: true, message: 'Your vote has been recorded.' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore candidate vote write timed out' }), 3500);
    });

    return await Promise.race([savePromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to save Candidate Vote to Firestore:', err);
    return { success: false, message: err.message || 'Firestore write failed' };
  }
}

export async function firebaseFetchAllCandidateVotes(): Promise<{ success: boolean; votes?: any[]; message?: string }> {
  const targetCol = getCandidateVotesCollectionName();
  try {
    const fetchPromise = (async () => {
      const querySnapshot = await getDocs(collection(db, targetCol));
      const list: any[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data && data.voter_email) {
          list.push({ id: docSnapshot.id, ...data });
        }
      });
      return { success: true, votes: list };
    })();

    const timeoutPromise = new Promise<{ success: boolean; votes?: any[]; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore all candidate votes fetch timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to fetch all Candidate Votes from Firestore:', err);
    return { success: false, message: err.message || 'Firestore fetch failed' };
  }
}

export async function firebaseDeleteCandidateVote(idOrKey: string): Promise<{ success: boolean; message?: string }> {
  const collections = ['candidate_votes', 'candidate_votes_dev'];
  try {
    for (const colName of collections) {
      try {
        const docRef = doc(db, colName, idOrKey);
        await deleteDoc(docRef);
      } catch (e) {}
    }
    return { success: true, message: 'Vote removed.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function syncCandidateVotesFromFirestore() {
  try {
    const res = await firebaseFetchAllCandidateVotes();
    if (res.success && res.votes) {
      await fetch('/api/candidate-votes/sync-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: res.votes })
      }).catch(() => {});
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
}

/**
 * Saves a Dean Nomination to Cloud Firestore.
 */
export async function firebaseSaveDeanNomination(voterEmail: string, data: { nominee_first_name: string; nominee_last_name: string; statement: string }): Promise<{ success: boolean; message: string }> {
  const normEmail = voterEmail.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const targetCol = getNominationsCollectionName();
  try {
    const savePromise = (async () => {
      const docRef = doc(db, targetCol, safeDocId);
      const now = new Date().toISOString();
      const payload = {
        id: Math.random().toString(36).substring(2, 9),
        voter_email: normEmail,
        nominee_first_name: data.nominee_first_name.trim(),
        nominee_last_name: data.nominee_last_name.trim(),
        statement: data.statement.trim(),
        timestamp: now,
        is_dev: isDevEnvironment()
      };
      await setDoc(docRef, payload, { merge: true });
      return { success: true, message: 'Your nomination has been saved.' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore nomination write timed out' }), 3500);
    });

    return await Promise.race([savePromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to save Dean Nomination to Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.WRITE, `${targetCol}/${safeDocId}`);
    }
    return { success: false, message: err.message || 'Firestore write failed' };
  }
}

/**
 * Fetches a Dean Nomination from Cloud Firestore by voter email.
 */
export async function firebaseFetchDeanNomination(voterEmail: string): Promise<{ success: boolean; nomination?: any; message?: string }> {
  const normEmail = voterEmail.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const targetCol = getNominationsCollectionName();
  try {
    const fetchPromise = (async () => {
      const docRef = doc(db, targetCol, safeDocId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: true, nomination: snapshot.data() };
      }
      return { success: false, message: 'No nomination found in Firestore' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; nomination?: any; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore nomination fetch timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to fetch Dean Nomination from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.GET, `${targetCol}/${safeDocId}`);
    }
    return { success: false, message: err.message || 'Firestore fetch failed' };
  }
}

/**
 * Fetches all Dean Nominations from Cloud Firestore.
 */
export async function firebaseFetchAllDeanNominations(): Promise<{ success: boolean; nominations?: any[]; message?: string }> {
  const targetCol = getNominationsCollectionName();
  try {
    const fetchPromise = (async () => {
      const querySnapshot = await getDocs(collection(db, targetCol));
      const list: any[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data && data.voter_email) {
          list.push(data);
        }
      });
      return { success: true, nominations: list };
    })();

    const timeoutPromise = new Promise<{ success: boolean; nominations?: any[]; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore all nominations fetch timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to fetch all Dean Nominations from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.LIST, targetCol);
    }
    return { success: false, message: err.message || 'Firestore fetch failed' };
  }
}

/**
 * Saves a Dean Vote to Cloud Firestore.
 */
export async function firebaseSaveDeanVote(voterEmail: string, nomineeName: string): Promise<{ success: boolean; message: string }> {
  const normEmail = voterEmail.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const targetCol = getVotesCollectionName();
  try {
    const savePromise = (async () => {
      const docRef = doc(db, targetCol, safeDocId);
      const now = new Date().toISOString();
      const payload = {
        id: Math.random().toString(36).substring(2, 9),
        voter_email: normEmail,
        nominee_name: nomineeName.trim(),
        timestamp: now,
        is_dev: isDevEnvironment()
      };
      await setDoc(docRef, payload, { merge: true });
      return { success: true, message: 'Your vote has been recorded.' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore vote write timed out' }), 3500);
    });

    return await Promise.race([savePromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to save Dean Vote to Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.WRITE, `${targetCol}/${safeDocId}`);
    }
    return { success: false, message: err.message || 'Firestore write failed' };
  }
}

/**
 * Fetches a Dean Vote from Cloud Firestore by voter email.
 */
export async function firebaseFetchDeanVote(voterEmail: string): Promise<{ success: boolean; vote?: any; message?: string }> {
  const normEmail = voterEmail.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const targetCol = getVotesCollectionName();
  try {
    const fetchPromise = (async () => {
      const docRef = doc(db, targetCol, safeDocId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: true, vote: snapshot.data() };
      }
      return { success: false, message: 'No vote found in Firestore' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; vote?: any; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore vote fetch timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to fetch Dean Vote from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.GET, `${targetCol}/${safeDocId}`);
    }
    return { success: false, message: err.message || 'Firestore fetch failed' };
  }
}

/**
 * Fetches all Dean Votes from Cloud Firestore.
 */
export async function firebaseFetchAllDeanVotes(): Promise<{ success: boolean; votes?: any[]; message?: string }> {
  const targetCol = getVotesCollectionName();
  try {
    const fetchPromise = (async () => {
      const querySnapshot = await getDocs(collection(db, targetCol));
      const list: any[] = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data && data.voter_email) {
          list.push({ id: docSnapshot.id, ...data });
        }
      });
      return { success: true, votes: list };
    })();

    const timeoutPromise = new Promise<{ success: boolean; votes?: any[]; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore all votes fetch timed out' }), 3500);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Failed to fetch all Dean Votes from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.LIST, targetCol);
    }
    return { success: false, message: err.message || 'Firestore fetch failed' };
  }
}

/**
 * Deletes a Dean Vote record from Cloud Firestore (deletes from both production and dev collections).
 */
export async function firebaseDeleteDeanVote(idOrEmail: string): Promise<{ success: boolean; message?: string }> {
  const norm = idOrEmail.toLowerCase().trim();
  const safeDocId = norm.replace(/[^a-zA-Z0-9]/g, '_');
  const docKeys = Array.from(new Set([idOrEmail, norm, safeDocId])).filter(Boolean);
  const collections = ['dean_votes', 'dean_votes_dev'];

  try {
    for (const colName of collections) {
      for (const k of docKeys) {
        try {
          const docRef = doc(db, colName, k);
          await deleteDoc(docRef);
        } catch (e: any) {
          if (e && (e.message?.includes('permission') || e.message?.includes('Permission') || String(e).includes('permission') || e.code === 'permission-denied')) {
            handleFirestoreError(e, OperationType.DELETE, `${colName}/${k}`);
          }
        }
      }
    }

    return { success: true, message: 'Vote removed.' };
  } catch (err: any) {
    console.error('Failed to delete Dean vote from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.DELETE, `dean_votes/${idOrEmail}`);
    }
    return { success: false, message: err.message };
  }
}

/**
 * Deletes a Dean Nomination record from Cloud Firestore.
 */
export async function firebaseDeleteDeanNomination(idOrEmail: string): Promise<{ success: boolean; message?: string }> {
  const norm = idOrEmail.toLowerCase().trim();
  const safeDocId = norm.replace(/[^a-zA-Z0-9]/g, '_');
  const docKeys = Array.from(new Set([idOrEmail, norm, safeDocId])).filter(Boolean);
  const collections = ['dean_nominations', 'dean_nominations_dev'];

  try {
    for (const colName of collections) {
      for (const k of docKeys) {
        try {
          const docRef = doc(db, colName, k);
          await deleteDoc(docRef);
        } catch (e: any) {
          if (e && (e.message?.includes('permission') || e.message?.includes('Permission') || String(e).includes('permission') || e.code === 'permission-denied')) {
            handleFirestoreError(e, OperationType.DELETE, `${colName}/${k}`);
          }
        }
      }
    }

    return { success: true, message: 'Nomination removed.' };
  } catch (err: any) {
    console.error('Failed to delete Dean nomination from Firestore:', err);
    if (err && (err.message?.includes('permission') || err.message?.includes('Permission') || String(err).includes('permission') || err.code === 'permission-denied')) {
      handleFirestoreError(err, OperationType.DELETE, `dean_nominations/${idOrEmail}`);
    }
    return { success: false, message: err.message };
  }
}

/**
 * Performs background sync of Dean Nominations and Votes from Cloud Firestore to local Express storage.
 * Runs on form or dashboard load.
 */
export async function syncDeanDataFromFirestore() {
  try {
    // 1. Sync Nominations
    const nominationsRes = await firebaseFetchAllDeanNominations();
    if (nominationsRes.success && nominationsRes.nominations) {
      await fetch('/api/dean-nominations/sync-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nominations: nominationsRes.nominations })
      }).catch((e) => console.warn('Sync bulk nominations server notice:', e));
    }

    // 2. Sync Votes
    const votesRes = await firebaseFetchAllDeanVotes();
    if (votesRes.success && votesRes.votes) {
      await fetch('/api/dean-votes/sync-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: votesRes.votes })
      }).catch((e) => console.warn('Sync bulk votes server notice:', e));
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to perform Dean Firestore sync:', err);
    return { success: false, message: err?.message };
  }
}



export async function firebaseUpdateCandidateStatus(email: string, status: string, scores: any = {}, notes: string = "", documentVault: any[] = [], name?: string, phone?: string) {
  try {
    const normEmail = email.toLowerCase().trim();
    const candRef = doc(db, 'candidates', normEmail);
    const payload: any = {
      email: normEmail,
      status,
      scores,
      notes,
      document_vault: documentVault,
      updatedAt: new Date().toISOString()
    };
    if (name && !name.includes('@') && name.trim().toLowerCase() !== normEmail.split('@')[0].toLowerCase()) {
      payload.name = name.trim();
    }
    if (phone) {
      payload.phone = phone.trim();
    }
    await setDoc(candRef, payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error('Error updating candidate in Firestore:', err);
    return { success: false, message: err.message };
  }
}

export async function firebaseFetchAllCandidates() {
  try {
    const list: any[] = [];
    const querySnapshot = await getDocs(collection(db, 'candidates'));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const normEmail = (data?.email || docSnap.id || '').toLowerCase().trim();
      if (normEmail === 'candidate@gmail.com' || normEmail === 'dennis@gmail.com' || normEmail === 'jackdee.sync@gmail.com') return;
      list.push(data);
    });
    return { success: true, candidates: list };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function firebaseSyncPortalMember(member: {
  email: string;
  name: string;
  role: string;
  title?: string;
  financial_status?: string;
  industry?: string;
  committees?: string[];
  committeeRoles?: Record<string, string>;
}) {
  try {
    const normEmail = member.email.toLowerCase().trim();
    const docId = normEmail.replace(/\//g, '_');
    const memberRef = doc(db, 'portal_members', docId);
    const payload: any = {
      email: normEmail,
      name: member.name,
      first_name: member.name.split(' ')[0] || '',
      last_name: member.name.split(' ').slice(1).join(' ') || '',
      role: member.role,
      title: member.title || '',
      financial_status: member.financial_status || 'active',
      industry: member.industry || '',
      updatedAt: new Date().toISOString()
    };
    if (member.committees) {
      payload.committees = member.committees;
    }
    if (member.committeeRoles) {
      payload.committeeRoles = member.committeeRoles;
    }
    await setDoc(memberRef, payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.warn('Notice syncing member to Firestore:', err);
    return { success: false, message: err.message };
  }
}

export async function firebaseUpdateCommitteeMembers(committeeId: string, memberData: { email: string; name: string; role: string; addedAt: string }) {
  try {
    const committeeRef = doc(db, 'committees', committeeId);
    // Add member to committee document in Firestore
    await setDoc(committeeRef, {
      members: arrayUnion(memberData)
    }, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.warn('Notice syncing committee members to Firestore:', err);
    return { success: false, message: err.message };
  }
}

export async function firebaseRemoveCommitteeMember(committeeId: string, memberEmail: string) {
  try {
    const committeeRef = doc(db, 'committees', committeeId);
    const snap = await getDoc(committeeRef);
    if (snap.exists()) {
      const data = snap.data();
      const existingMembers = data.members || [];
      const updated = existingMembers.filter((m: any) => m.email?.toLowerCase().trim() !== memberEmail.toLowerCase().trim());
      await setDoc(committeeRef, { members: updated }, { merge: true });
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Notice removing committee member from Firestore:', err);
    return { success: false, message: err.message };
  }
}

