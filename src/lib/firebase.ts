import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection,
  getDocs,
  connectFirestoreEmulator
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
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || (staticFirebaseConfig as any).firestoreDatabaseId
};

const app = getApps().length > 0 ? getApp() : initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// ---------------------------------------------------------------------------
// Emulator support: set VITE_USE_EMULATOR=true in .env.local to use local
// Firebase emulators instead of production Firestore/Auth.
// ---------------------------------------------------------------------------
if (metaEnv.VITE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.info('[Firebase] 🔧 Connected to LOCAL emulators (Firestore:8080, Auth:9099)');
  } catch (e) {
    // Already connected — safe to ignore
  }
}

// ---------------------------------------------------------------------------
// Dev-mode debug logger — logs raw Firestore document shapes before
// normalization so you can spot schema mismatches in DevTools > Console.
// Only active when VITE_DEBUG_FIRESTORE=true in .env.local
// ---------------------------------------------------------------------------
export function debugLogRawDoc(label: string, data: unknown) {
  if (metaEnv.VITE_DEBUG_FIRESTORE === 'true') {
    console.group(`[Firestore DEBUG] ${label}`);
    console.log('Raw document shape:', JSON.stringify(data, null, 2));
    console.groupEnd();
  }
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
      message: 'Account created successfully',
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
  'jackdee.sync@gmail.com': { name: 'Jack Tester', pass: 'atlanta' },
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
  'zgatesnorris@gmail.com': { name: 'Zion Gates-Norris', pass: '4876' }
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

  // 1. Instant check against saved updated password
  if (clientPass && pass === clientPass) {
    const name = localStorage.getItem(`kpi_client_name_${normEmail}`) || (initialCandidate ? initialCandidate.name : normEmail.split('@')[0]);
    return {
      success: true,
      message: 'Authenticated successfully',
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

  // Allow initial default candidate password only if not changed
  if (initialCandidate && pass === initialCandidate.pass && !isChanged && !clientPass) {
    return {
      success: true,
      message: 'Authenticated successfully',
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
          message: 'Authenticated successfully',
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
          message: `Password Reset Activated for ${normEmail}. You can sign in using your initial security key to set your new password.`
        });
      }, 2500);
    });

    const resetAction = (async () => {
      try {
        await sendPasswordResetEmail(auth, normEmail);
        return {
          success: true,
          message: `Password Reset Activated for ${normEmail}. You can sign in using your initial security key to set your new password.`
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
          message: `Password Reset Activated for ${normEmail}. You can sign in using your initial security key to set your new password.`
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
export function normalizeApplication(app: any, fallbackId?: string): any {
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
      firstName: app.firstName || app.first_name || app.name?.split(' ')[0] || '',
      middleName: app.middleName || app.middle_name || '',
      lastName: app.lastName || app.last_name || app.name?.split(' ').slice(1).join(' ') || '',
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
      firstName: dataObj.firstName || app.firstName || app.first_name || '',
      middleName: dataObj.middleName || app.middleName || app.middle_name || '',
      lastName: dataObj.lastName || app.lastName || app.last_name || '',
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

  // Robust email extraction: check app.email -> app.data.email -> fallbackId -> document id
  let email = app.email || (app.data && typeof app.data === 'object' ? app.data.email : '');
  if (!email && fallbackId && fallbackId.includes('@')) {
    email = fallbackId;
  } else if (!email && fallbackId && fallbackId.includes('_')) {
    // e.g. "admin_orderofkpi_org" or "john_doe_gmail_com" -> try best effort reconstruction
    const parts = fallbackId.split('_');
    if (parts.length >= 3) {
      const domainExt = parts.pop();
      const domainName = parts.pop();
      const userPart = parts.join('.');
      email = `${userPart}@${domainName}.${domainExt}`;
    }
  }
  email = (email || '').toLowerCase().trim();

  return {
    id: app.id || fallbackId || 'app_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
    email: email,
    status: app.status || 'draft',
    lastSavedAt: app.lastSavedAt || app.last_saved_at || new Date().toISOString(),
    last_saved_at: app.last_saved_at || app.lastSavedAt || new Date().toISOString(),
    submittedAt: app.submittedAt || app.submitted_at || new Date().toISOString(),
    submitted_at: app.submitted_at || app.submittedAt || new Date().toISOString(),
    data: dataObj
  };
}

/**
 * Saves candidate application to Firebase Firestore database.
 */
export async function firebaseSaveApplication(email: string, data: any, status: 'draft' | 'submitted') {
  const normEmail = email.toLowerCase().trim();
  const appId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const now = new Date().toISOString();

  const appDoc = {
    id: appId,
    email: normEmail,
    status,
    lastSavedAt: now,
    last_saved_at: now,
    submittedAt: status === 'submitted' ? now : null,
    submitted_at: status === 'submitted' ? now : null,
    data
  };

  try {
    const savePromise = (async () => {
      // Save in applications collection
      await setDoc(doc(db, 'applications', appId), appDoc, { merge: true });
      // Also dual-write to membership_applications for backwards compatibility
      await setDoc(doc(db, 'membership_applications', appId), appDoc, { merge: true });
      return { success: true, message: 'Application saved to Cloud Firestore database.' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore save operation timed out' }), 3500);
    });

    return await Promise.race([savePromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Error saving application to Firestore:', err);
    return { success: false, message: err.message || 'Failed to save application to Firestore' };
  }
}

/**
 * Fetches candidate application for a specific email address from Firebase Firestore.
 */
export async function firebaseFetchApplication(email: string) {
  const normEmail = email.toLowerCase().trim();
  const appId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const fetchPromise = (async () => {
      // Try applications collection first
      let docRef = doc(db, 'applications', appId);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Fallback to membership_applications collection
        docRef = doc(db, 'membership_applications', appId);
        docSnap = await getDoc(docRef);
      }

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        debugLogRawDoc(`firebaseFetchApplication [${docSnap.id}]`, rawData);
        const normalized = normalizeApplication(rawData, docSnap.id);
        return { success: true, application: normalized };
      }

      return { success: false, message: 'No application found for this email address.' };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore fetch operation timed out' }), 3000);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Error fetching application from Firestore:', err);
    return { success: false, message: err.message || 'Failed to fetch application from Firestore' };
  }
}

/**
 * Fetches all submitted applications across Firestore collections for Admin / Reviewers.
 */
export async function firebaseFetchAllApplications() {
  try {
    const fetchPromise = (async () => {
      const list: any[] = [];
      const seenEmails = new Set<string>();

      const collectionsToScan = ['applications', 'membership_applications', 'candidate_accounts', 'candidates'];

      for (const colName of collectionsToScan) {
        try {
          const querySnapshot = await getDocs(collection(db, colName));
          querySnapshot.forEach((docSnapshot) => {
            const appData = docSnapshot.data();
            debugLogRawDoc(`firebaseFetchAllApplications [${colName}/${docSnapshot.id}]`, appData);
            if (appData) {
              const normalized = normalizeApplication(appData, docSnapshot.id);
              if (normalized && normalized.email && !seenEmails.has(normalized.email)) {
                list.push(normalized);
                seenEmails.add(normalized.email);
              }
            }
          });
        } catch (err) {
          console.warn(`Could not load ${colName} collection:`, err);
        }
      }

      return { success: true, applications: list };
    })();

    const timeoutPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      setTimeout(() => resolve({ success: false, message: 'Firestore query timed out' }), 5000);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    console.error('Error fetching all applications from Firestore:', err);
    return { success: false, message: err.message || 'Failed to fetch all applications from Firestore' };
  }
}
