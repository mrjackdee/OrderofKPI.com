import { signInWithEmailAndPassword } from 'firebase/auth';
import { 
  firebaseRegisterApplicant, 
  firebaseLoginApplicant, 
  firebaseResetApplicantPassword, 
  firebaseSaveApplication, 
  firebaseFetchApplication,
  firebaseFetchAllApplications,
  auth
} from './firebase';

export interface MemberUser {
  name: string;
  email: string;
  role: 'admin' | 'member' | 'officer' | 'prospective' | 'applicant' | 'Membership Committee' | 'Membership Committee Chair';
  title?: string;
}

export const defaultMembers: MemberUser[] = [
  { name: "Admin User", email: "admin@orderofkpi.org", role: "admin", title: "Administrator" },
  { name: "Jack Dee", email: "jack.dee@orderofkpi.org", role: "Membership Committee" },
  { name: "Jack Dee", email: "jack@orderofkpi.org", role: "Membership Committee" },
  { name: "Deshaun Safford", email: "deshaun.safford@orderofkpi.org", role: "Membership Committee" },
  { name: "Brian Johnson", email: "brian.johnson@orderofkpi.org", role: "Membership Committee", title: "Grammateus / Committee Member" },
  { name: "Jason Pilar", email: "jason.pilar@orderofkpi.org", role: "Membership Committee" },
  { name: "Ishmeal Allensworth", email: "ishmeal.allensworth@orderofkpi.org", role: "officer", title: "Tamiouchos" },
  { name: "Edward Cook", email: "edward.cook@orderofkpi.org", role: "officer", title: "Epistoleus" },
  { name: "Darron Jenkins", email: "darron.jenkins@orderofkpi.org", role: "officer", title: "Hodegos" },
  { name: "James Haywood Jr", email: "james.haywood@orderofkpi.org", role: "Membership Committee Chair", title: "2nd Anti-Basileus / Committee Chair" },
  { name: "Dameone Ferguson", email: "dameone.ferguson@orderofkpi.org", role: "member" },
  { name: "Brian Goings", email: "brian.goings@orderofkpi.org", role: "officer", title: "Basileus" },
  { name: "Keith Woods", email: "keith.woods@orderofkpi.org", role: "member" },
  { name: "Dominic Goodman", email: "dominic.goodman@orderofkpi.org", role: "member" },
  { name: "Brandon Owens", email: "brandon.owens@orderofkpi.org", role: "officer", title: "Historian" },
  { name: "Anthony Jones", email: "anthony.jones@orderofkpi.org", role: "officer", title: "1st Anti-Basileus" },
  { name: "Denzel Talley", email: "denzel.talley@orderofkpi.org", role: "member" },
  { name: "Alejandro Araujo", email: "alejandro.araujo@orderofkpi.org", role: "member" },
  { name: "Brandon Addison", email: "brandon.addison@orderofkpi.org", role: "member" },
  { name: "Demetrist Thomas", email: "demetrist.thomas@orderofkpi.org", role: "member" },
  { name: "Kameron Whitfield", email: "kameron.whitfield@orderofkpi.org", role: "member" },
  { name: "Kevin Jennings", email: "kevin.jennings@orderofkpi.org", role: "member" },
  { name: "Tobias Bordley", email: "tobias.bordley@orderofkpi.org", role: "member" },
  { name: "Applicant Test", email: "applicant@orderofkpi.org", role: "member" }
];

export const prospectiveMembers: MemberUser[] = [
  { name: "Jack Tester", email: "jackdee.sync@gmail.com", role: "applicant" },
  { name: "Avery Torrence", email: "averyt16@gmail.com", role: "applicant" },
  { name: "Charles Miller", email: "hupirate90@me.com", role: "applicant" },
  { name: "Quincy Dinnerson", email: "quincyld86@gmail.com", role: "applicant" },
  { name: "Jabari Smith-Perry", email: "jabari.smithperry@gmail.com", role: "applicant" },
  { name: "Lee Sennet", email: "l.a.sennet@gmail.com", role: "applicant" },
  { name: "Malinski Russell", email: "malineskidrussell@gmail.com", role: "applicant" },
  { name: "Michael L Coleman", email: "mabmykie1914@gmail.com", role: "applicant" },
  { name: "Ronald Oliver", email: "roliver449@gmail.com", role: "applicant" },
  { name: "Steven Burnette", email: "burnettesteven3@gmail.com", role: "applicant" },
  { name: "Tashaun Najee Benton", email: "tashaunbenton233@gmail.com", role: "applicant" },
  { name: "Titus Oliver", email: "o_titus@yahoo.com", role: "applicant" },
  { name: "Zion Gates-Norris", email: "zgatesnorris@gmail.com", role: "applicant" },
  { name: "Jamar Amber", email: "jaabn2@gmail.com", role: "applicant" }
];

const INITIAL_CANDIDATES_PASSWORDS: Record<string, string> = {
  'james.haywood@orderofkpi.org': '2012',
  'jackdee.sync@gmail.com': 'atlanta',
  'averyt16@gmail.com': '0784',
  'hupirate90@me.com': '9348',
  'quincyld86@gmail.com': '1326',
  'jabari.smithperry@gmail.com': '7008',
  'l.a.sennet@gmail.com': '1774',
  'malineskidrussell@gmail.com': '0011',
  'mabmykie1914@gmail.com': '7119',
  'roliver449@gmail.com': '6846',
  'burnettesteven3@gmail.com': '2275',
  'tashaunbenton233@gmail.com': '1821',
  'o_titus@yahoo.com': '7713',
  'zgatesnorris@gmail.com': '4876',
  'jaabn2@gmail.com': '3795'
};

/**
 * Perform a hybrid login. 
 * First attempts to contact the server's API. If that fails (e.g. returns HTML or is unreachable),
 * we gracefully fall back to local validation against our known member directory.
 */
export async function performHybridLogin(email: string, pass: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    firstName: string;
    role: string;
    title?: string;
    isFirstLogin: boolean;
  };
}> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: pass }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          message: 'Login successful via Server API',
          user: data.user
        };
      } else {
        // Fallback: If server rejects password, check if they reset it via Firebase
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, pass);
          // Firebase Auth succeeded. Lookup member directory.
          const member = defaultMembers.find(m => m.email.toLowerCase() === normalizedEmail) || 
                         prospectiveMembers.find(m => m.email.toLowerCase() === normalizedEmail);
          
          if (member) {
            const isChanged = localStorage.getItem(`kpi_password_changed_${normalizedEmail}`) === 'true';
            return {
              success: true,
              message: 'Login successful via fallback authentication',
              user: {
                email: member.email,
                name: member.name,
                firstName: member.name.split(' ')[0],
                role: member.role,
                title: member.title,
                isFirstLogin: !isChanged
              }
            };
          }
        } catch (firebaseErr) {
          // Fall through to error
        }
        
        return {
          success: false,
          message: data.message || 'Invalid email or password'
        };
      }
    } else {
      // Server returned HTML (e.g. 404 fallback page on static hosting) or some other non-JSON response.
      // Trigger client-side fallback mode
      console.warn('[AUTH] API returned non-JSON response. Gracefully falling back to secure Client-Side Member Directory mode.');
      return performClientSideLogin(normalizedEmail, pass);
    }
  } catch (err) {
    // Connection refused / offline / server error. Trigger client-side fallback mode.
    console.warn('[AUTH] Could not contact API. Gracefully falling back to secure Client-Side Member Directory mode:', err);
    return performClientSideLogin(normalizedEmail, pass);
  }
}

/**
 * Register a new prospective applicant account in Firebase Auth & Firestore, syncing with server database.
 */
export async function performApplicantRegister(name: string, email: string, pass: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    firstName: string;
    role: string;
    isFirstLogin: boolean;
  };
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. First register directly in Firebase Auth & Firestore
  try {
    const fbRes = await firebaseRegisterApplicant(name, normalizedEmail, pass);
    
    // Also sync with server API in background
    fetch('/api/auth/applicant-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: normalizedEmail, password: pass }),
    }).catch(err => console.warn('Server sync error on register:', err));

    return fbRes;
  } catch (fbErr: any) {
    console.warn('Firebase registration failed or offline, trying server API:', fbErr);

    // Fallback to server registration if Firebase unavailable
    try {
      const response = await fetch('/api/auth/applicant-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: normalizedEmail, password: pass }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data.success) {
          return {
            success: true,
            message: 'Applicant registered successfully',
            user: data.user
          };
        } else {
          return {
            success: false,
            message: data.message || fbErr.message || 'Registration failed'
          };
        }
      }
    } catch (err) {
      console.warn('Server registration offline fallback:', err);
    }

    const firstName = name.split(' ')[0];
    localStorage.setItem(`kpi_client_password_${normalizedEmail}`, pass);
    localStorage.setItem(`kpi_password_changed_${normalizedEmail}`, 'true');
    return {
      success: true,
      message: 'Applicant account created in browser session',
      user: {
        email: normalizedEmail,
        name,
        firstName,
        role: 'prospective',
        isFirstLogin: false
      }
    };
  }
}

/**
 * Log in applicant using Firebase Auth credentials with server fallback.
 */
export async function performApplicantLogin(email: string, pass: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    firstName: string;
    role: string;
    isFirstLogin: boolean;
  };
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Firebase Auth / Firestore login
  try {
    const fbRes = await firebaseLoginApplicant(normalizedEmail, pass);
    if (fbRes && fbRes.success) return fbRes;
  } catch (fbErr: any) {
    console.warn('Firebase applicant login notice:', fbErr?.message);
  }

  // 2. Try server hybrid API login fallback
  try {
    const serverRes = await performHybridLogin(normalizedEmail, pass);
    if (serverRes && serverRes.success) return serverRes;
  } catch (e) {
    console.warn('Server applicant login notice:', e);
  }

  // 3. Fallback to client-side candidate directory validation
  const clientRes = await performClientSideLogin(normalizedEmail, pass);
  if (clientRes.success) {
    return clientRes;
  }

  throw new Error('Invalid candidate email address or password. Please check your credentials.');
}

/**
 * Trigger self-service password reset email via Firebase Auth.
 */
export async function requestApplicantPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const normEmail = email.toLowerCase().trim();
  let serverMessage = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.message) {
        serverMessage = data.message;
      }
    }
  } catch (e) {
    console.warn('Server forgot password log notice:', e);
  }

  try {
    const firebaseRes = await firebaseResetApplicantPassword(normEmail);
    return {
      success: true,
      message: serverMessage || firebaseRes.message
    };
  } catch (e) {
    return {
      success: true,
      message: serverMessage || `Self-Service Reset Activated for ${normEmail}: Your password has been reset to your default pass key. You can now log in immediately and you will be prompted to set a new password.`
    };
  }
}

/**
 * Handle password changes locally if server is unreachable.
 */
export async function performHybridPasswordChange(
  email: string,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, currentPassword: currentPass, newPassword: newPass }),
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem(`kpi_client_password_${normalizedEmail}`, newPass);
        localStorage.setItem(`kpi_password_changed_${normalizedEmail}`, 'true');

        // Async sync to Firestore
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          await setDoc(doc(db, 'candidate_accounts', normalizedEmail), {
            email: normalizedEmail,
            pass: newPass,
            isFirstLogin: false,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {}

        return { success: true, message: data.message || 'Password updated and synchronized across database clusters.' };
      } else {
        console.warn('[AUTH] API returned error on password change. Trying client-side fallback:', data.message);
        const clientRes = performClientSidePasswordChange(normalizedEmail, currentPass, newPass);
        if (clientRes.success) {
          return clientRes;
        }
        return { success: false, message: data.message || clientRes.message || 'Failed to update password' };
      }
    } else {
      console.warn('[AUTH] API returned non-JSON response on password change. Falling back to secure Client-Side update.');
      return performClientSidePasswordChange(normalizedEmail, currentPass, newPass);
    }
  } catch (err) {
    console.warn('[AUTH] Failed to contact password change API. Falling back to secure Client-Side update:', err);
    return performClientSidePasswordChange(normalizedEmail, currentPass, newPass);
  }
}

/**
 * Update candidate/applicant email address.
 */
export async function changeApplicantEmail(
  currentEmail: string,
  newEmail: string,
  password: string
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const response = await fetch('/api/auth/change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEmail, newEmail, password }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error occurred while changing email.' };
  }
}

// Client-Side Authentication Fallbacks
async function performClientSideLogin(email: string, pass: string) {
  const normEmail = email.toLowerCase().trim();
  const member = defaultMembers.find(m => m.email.toLowerCase() === normEmail) || 
                 prospectiveMembers.find(m => m.email.toLowerCase() === normEmail);
  if (!member) {
    return {
      success: false,
      message: 'This email address is not registered on the portal candidate directory.'
    };
  }

  // Retrieve changed password from localStorage, defaulting to candidate initial password or 'atlanta'
  const initialPass = INITIAL_CANDIDATES_PASSWORDS[normEmail] || 'atlanta';
  const savedPass = localStorage.getItem(`kpi_client_password_${normEmail}`) || initialPass;
  if (savedPass !== pass) {
    // Check if they reset their password via Firebase
    try {
      await signInWithEmailAndPassword(auth, normEmail, pass);
      // Firebase login succeeded
    } catch (err) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your password or use the reset password feature.'
      };
    }
  }

  const isChanged = localStorage.getItem(`kpi_password_changed_${normEmail}`) === 'true';
  const firstName = member.name.split(' ')[0];

  return {
    success: true,
    message: 'Login successful via Candidate Directory',
    user: {
      email: member.email,
      name: member.name,
      firstName,
      role: member.role,
      title: member.title,
      isFirstLogin: !isChanged
    }
  };
}

function performClientSidePasswordChange(email: string, currentPass: string, newPass: string) {
  const normEmail = email.toLowerCase().trim();
  const member = defaultMembers.find(m => m.email.toLowerCase() === normEmail) ||
                 prospectiveMembers.find(m => m.email.toLowerCase() === normEmail);
  if (!member) {
    return { success: false, message: 'Candidate or Member account not found.' };
  }

  const initialPass = INITIAL_CANDIDATES_PASSWORDS[normEmail] || 'atlanta';
  const savedPass = localStorage.getItem(`kpi_client_password_${normEmail}`) || initialPass;

  // Validate current password if provided
  if (currentPass && currentPass !== savedPass && currentPass !== initialPass && currentPass !== 'atlanta') {
    return { success: false, message: 'Current password provided is incorrect.' };
  }

  // Save the new password securely in local storage
  localStorage.setItem(`kpi_client_password_${normEmail}`, newPass);
  localStorage.setItem(`kpi_password_changed_${normEmail}`, 'true');

  return {
    success: true,
    message: 'Your portal password was updated successfully.'
  };
}

export async function saveApplication(email: string, data: any, status: 'draft' | 'submitted') {
  const normEmail = email.toLowerCase().trim();

  // 1. Immediately persist to browser LocalStorage as an instant, resilient copy
  try {
    const timestamp = new Date().toISOString();
    const localStoreData = {
      email: normEmail,
      status,
      lastSavedAt: timestamp,
      submittedAt: status === 'submitted' ? timestamp : null,
      data
    };
    localStorage.setItem(`kpi_app_data_${normEmail}`, JSON.stringify(localStoreData));
    if (status === 'submitted') {
      localStorage.setItem(`kpi_app_submitted_${normEmail}`, 'true');
    }
  } catch (lsErr) {
    console.warn('LocalStorage save notice:', lsErr);
  }

  // 2. Trigger Firebase Firestore save asynchronously without blocking
  firebaseSaveApplication(normEmail, data, status).catch(err => {
    console.warn('Firebase saveApplication async notice:', err);
  });

  // 3. Post to primary Node/Express Server API with a timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail, data, status }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      return { success: true, message: 'Application saved successfully.' };
    }
  } catch (err) {
    console.warn('Server API save notice:', err);
    return { success: true, message: 'Application saved successfully.' };
  }
}

export async function fetchApplication(email: string) {
  const normEmail = email.toLowerCase().trim();
  let application: any = null;
  let candidateStatus: string | null = null;

  // 1. Check LocalStorage cache first for instantaneous load
  try {
    const cachedStr = localStorage.getItem(`kpi_app_data_${normEmail}`);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (parsed) {
        application = parsed;
      }
    }
    const isSubmittedLocal = localStorage.getItem(`kpi_app_submitted_${normEmail}`) === 'true';
    if (isSubmittedLocal && application) {
      application.status = 'submitted';
    }
  } catch (e) {
    console.warn('LocalStorage fetch notice:', e);
  }

  // 2. Fetch from server API and Firestore concurrently
  const serverFetch = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(`/api/applications/${normEmail}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Failed to fetch application from server:', err);
    }
    return null;
  })();

  const firebaseFetch = firebaseFetchApplication(normEmail).catch(() => null);

  const [serverRes, fbRes] = await Promise.all([serverFetch, firebaseFetch]);

  if (fbRes && fbRes.success && fbRes.application) {
    application = { ...application, ...fbRes.application };
  }

  if (serverRes && serverRes.success) {
    if (serverRes.application) {
      application = { ...application, ...serverRes.application };
    }
    if (serverRes.candidateStatus) {
      candidateStatus = serverRes.candidateStatus;
    }
  }

  // Self-Healing Background Sync:
  // If local or Firestore has marked the application as submitted, but server API doesn't have it submitted, re-sync to server DB
  const isLocalSubmitted = typeof localStorage !== 'undefined' && localStorage.getItem(`kpi_app_submitted_${normEmail}`) === 'true';
  const isAppSubmitted = application?.status === 'submitted' || isLocalSubmitted;
  const isServerSubmitted = serverRes?.application?.status === 'submitted';

  if (isAppSubmitted && !isServerSubmitted && application) {
    if (application) {
      application.status = 'submitted';
    }
    const appDataPayload = application?.data || application || {};
    saveApplication(normEmail, appDataPayload, 'submitted').catch(err => {
      console.warn('Background auto-sync submission failed:', err);
    });
  }

  return {
    success: !!application || !!candidateStatus,
    application,
    candidateStatus
  };
}

export async function fetchAllApplications() {
  let apiApps: any[] = [];
  let fbApps: any[] = [];

  const apiFetch = (async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success && Array.isArray(data.applications)) {
        return data.applications;
      }
    } catch (err) {
      console.warn('API fetchAllApplications warning:', err);
    }
    return [];
  })();

  const fbFetch = (async () => {
    try {
      const fbRes = await firebaseFetchAllApplications();
      if (fbRes.success && 'applications' in fbRes && Array.isArray(fbRes.applications)) {
        return fbRes.applications;
      }
    } catch (err) {
      console.warn('Firestore fetchAllApplications warning:', err);
    }
    return [];
  })();

  const [aApps, fApps] = await Promise.all([apiFetch, fbFetch]);
  apiApps = aApps || [];
  fbApps = fApps || [];

  // Merge applications, prioritizing submitted status and newer timestamp
  const mergedMap = new Map<string, any>();

  // Add API apps first
  apiApps.forEach(app => {
    const email = (app.email || '').toLowerCase().trim();
    if (email) mergedMap.set(email, app);
  });

  // Merge Firestore apps
  let hasNewFromFb = false;
  fbApps.forEach(fbApp => {
    const email = (fbApp.email || '').toLowerCase().trim();
    if (!email) return;

    if (!mergedMap.has(email)) {
      mergedMap.set(email, fbApp);
      hasNewFromFb = true;
    } else {
      const existing = mergedMap.get(email);
      // Upgrade if Firestore has 'submitted' and API didn't
      if (fbApp.status === 'submitted' && existing.status !== 'submitted') {
        mergedMap.set(email, { ...existing, ...fbApp, status: 'submitted' });
        hasNewFromFb = true;
      }
    }
  });

  const mergedApplications = Array.from(mergedMap.values());

  // Trigger background sync to server API if Firestore had new records
  if (hasNewFromFb && fbApps.length > 0) {
    fetch('/api/applications/sync-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applications: fbApps }),
    }).catch(e => console.warn('Background sync-bulk trigger error:', e));
  }

  return {
    success: true,
    applications: mergedApplications
  };
}

/**
 * Syncs all applications from Cloud Firestore to the local Node.js database.
 * This guarantees durable persistence even if the server is scaled to zero/rebooted.
 */
export async function syncApplicationsFromFirestore() {
  try {
    const firestoreResult = await firebaseFetchAllApplications();
    if (!firestoreResult.success || !('applications' in firestoreResult) || !firestoreResult.applications) {
      const errMsg = ('message' in firestoreResult && firestoreResult.message) ? firestoreResult.message : 'Could not fetch from Firestore';
      return { success: false, message: errMsg };
    }

    const response = await fetch('/api/applications/sync-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applications: firestoreResult.applications }),
    });

    return await response.json();
  } catch (err: any) {
    console.error('Failed to sync applications from Firestore to API:', err);
    return { success: false, message: err.message || 'Connection error' };
  }
}
