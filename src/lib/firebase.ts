import { initializeApp } from 'firebase/app';
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
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
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
    // 1. Create credential in Firebase Auth
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
    console.warn('Firebase Auth register error:', err);
    
    // If account already exists in Firebase Auth, attempt sign-in to verify
    if (err.code === 'auth/email-already-in-use') {
      try {
        const signResult = await signInWithEmailAndPassword(auth, normEmail, pass);
        return {
          success: true,
          message: 'Signed in with existing Firebase credentials',
          user: {
            uid: signResult.user.uid,
            email: normEmail,
            name,
            firstName,
            role: 'prospective',
            isFirstLogin: false
          }
        };
      } catch (signInErr: any) {
        throw new Error('An account with this email already exists in Firebase. Please log in or use Password Reset.');
      }
    }

    if (err.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    }

    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }

    throw new Error(err.message || 'Failed to register account with Firebase.');
  }
}

/**
 * Logs in candidate using Firebase Auth credentials.
 */
export async function firebaseLoginApplicant(email: string, pass: string) {
  const normEmail = email.toLowerCase().trim();

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
    console.warn('Firebase login error:', err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please verify your credentials or use self-service password reset.');
    }
    throw new Error(err.message || 'Firebase login failed.');
  }
}

/**
 * Self-service password reset via Firebase Authentication.
 */
export async function firebaseResetApplicantPassword(email: string) {
  const normEmail = email.toLowerCase().trim();

  if (!normEmail) {
    throw new Error('Please provide a valid email address to send the password reset link.');
  }

  try {
    await sendPasswordResetEmail(auth, normEmail);
    return {
      success: true,
      message: `A self-service password reset link has been dispatched to ${normEmail} via Firebase. Please check your inbox or spam folder.`
    };
  } catch (err: any) {
    console.warn('Firebase password reset error:', err);
    if (err.code === 'auth/user-not-found') {
      // For security, present a helpful generic message or clear prompt
      return {
        success: true,
        message: `If an account associated with ${normEmail} exists in Firebase, a password reset link has been sent.`
      };
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please provide a valid email address.');
    }
    throw new Error(err.message || 'Failed to send password reset email.');
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
      isFraternityMember: !!data.isFraternityMember,
      fraternityDetails: data.fraternityDetails || '',
      hasAkaFamily: !!data.hasAkaFamily,
      akaFamilyDetails: data.akaFamilyDetails || '',
      previousApplied: !!data.previousApplied,
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

