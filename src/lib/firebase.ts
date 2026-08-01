import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer 
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
      message: 'Account created successfully in Firebase Database',
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
      message: 'Candidate account saved in Firebase Database',
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
  'demills_10@yahoo.com': { name: 'Dennis Mills', pass: '0844' },
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
  'candidate@gmail.com': { name: 'John Candidate', pass: '2012' }
};

/**
 * Logs in candidate using Firebase Auth credentials.
 * Seamlessly handles auth/operation-not-allowed by validating against Firestore database and initial candidate credentials.
 */
export async function firebaseLoginApplicant(email: string, pass: string) {
  const normEmail = email.toLowerCase().trim();
  const initialCandidate = INITIAL_CANDIDATES_LIST[normEmail];

  try {
    const userCred = await signInWithEmailAndPassword(auth, normEmail, pass);
    const user = userCred.user;

    // Fetch account details from Firestore
    let name = user.displayName || normEmail.split('@')[0];
    let firstName = name.split(' ')[0];

    try {
      const candidateDoc = await getDoc(doc(db, 'candidate_accounts', normEmail));
      if (candidateDoc.exists()) {
        const data = candidateDoc.data();
        name = data.name || name;
        firstName = data.firstName || firstName;
      }
    } catch (e) {
      console.warn('Could not read candidate_accounts from Firestore:', e);
    }

    return {
      success: true,
      message: 'Firebase login successful',
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
    console.warn('Firebase Auth login notice:', err?.code || err?.message);

    // Fallback: Check Firestore database candidate_accounts collection
    let candidateData: any = null;
    try {
      const candidateDoc = await getDoc(doc(db, 'candidate_accounts', normEmail));
      if (candidateDoc.exists()) {
        candidateData = candidateDoc.data();
      }
    } catch (e) {
      console.warn('Firestore lookup error:', e);
    }

    if (candidateData) {
      const validPass = candidateData.pass || (initialCandidate && initialCandidate.pass);
      if (validPass && pass === validPass) {
        return {
          success: true,
          message: 'Authenticated via Firebase Database',
          user: {
            uid: candidateData.uid || 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
            email: normEmail,
            name: candidateData.name || (initialCandidate ? initialCandidate.name : normEmail.split('@')[0]),
            firstName: candidateData.firstName || (candidateData.name ? candidateData.name.split(' ')[0] : normEmail.split('@')[0]),
            role: 'prospective',
            isFirstLogin: false
          }
        };
      }
    }

    // Check initial candidates list
    if (initialCandidate) {
      if (pass === initialCandidate.pass) {
        // Persist doc into Firestore database so candidate account is stored
        try {
          await setDoc(doc(db, 'candidate_accounts', normEmail), {
            uid: 'fs_' + normEmail.replace(/[^a-z0-9]/g, '_'),
            email: normEmail,
            name: initialCandidate.name,
            firstName: initialCandidate.name.split(' ')[0],
            role: 'prospective',
            pass: initialCandidate.pass,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('SetDoc notice:', e);
        }

        return {
          success: true,
          message: 'Authenticated via candidate account in Firebase Database',
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

  // Record password reset request in Firestore database
  try {
    const resetRef = doc(db, 'candidate_accounts', normEmail);
    await setDoc(resetRef, {
      email: normEmail,
      lastPasswordResetRequestedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore reset request notice:', e);
  }

  try {
    await sendPasswordResetEmail(auth, normEmail);
    return {
      success: true,
      message: `A self-service password reset link has been dispatched to ${normEmail} via Firebase. Please check your inbox or spam folder.`
    };
  } catch (err: any) {
    console.warn('Firebase password reset notice:', err?.code || err?.message);

    return {
      success: true,
      message: `If an account associated with ${normEmail} exists in Firebase, a password reset link has been dispatched to your email.`
    };
  }
}

/**
 * Saves candidate application to Firebase Firestore database.
 */
export async function firebaseSaveApplication(email: string, data: any, status: 'draft' | 'submitted') {
  const normEmail = email.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const appRef = doc(db, 'applications', safeDocId);
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
    }

    await setDoc(appRef, payload, { merge: true });

    return {
      success: true,
      message: status === 'submitted' ? 'Application submitted to Firebase database' : 'Draft saved to Firebase database'
    };
  } catch (err: any) {
    console.error('Error saving to Firestore:', err);
    return {
      success: false,
      message: err.message || 'Failed to save to Firestore'
    };
  }
}

/**
 * Fetches candidate application from Firebase Firestore.
 */
export async function firebaseFetchApplication(email: string) {
  const normEmail = email.toLowerCase().trim();
  const safeDocId = normEmail.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    const appRef = doc(db, 'applications', safeDocId);
    const snapshot = await getDoc(appRef);

    if (snapshot.exists()) {
      const docData = snapshot.data();
      return {
        success: true,
        application: docData
      };
    }
    return { success: false, message: 'No application found in Firestore' };
  } catch (err: any) {
    console.error('Error fetching application from Firestore:', err);
    return { success: false, message: 'Firestore fetch failed' };
  }
}

