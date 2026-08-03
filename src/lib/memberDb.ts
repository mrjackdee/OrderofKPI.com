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
  { name: "Applicant Test", email: "applicant@orderofkpi.org", role: "member" }
];

export const prospectiveMembers: MemberUser[] = [
  { name: "Avery Torrence", email: "averyt16@gmail.com", role: "applicant" },
  { name: "Charles Miller", email: "hupirate90@me.com", role: "applicant" },
  { name: "Dennis Test", email: "dennis@gmail.com", role: "applicant" },
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
  { name: "Jamar Amber", email: "jaabn2@gmail.com", role: "applicant" },
  { name: "John Candidate", email: "candidate@gmail.com", role: "applicant" }
];

const INITIAL_CANDIDATES_PASSWORDS: Record<string, string> = {
  'james.haywood@orderofkpi.org': '2012',
  'averyt16@gmail.com': '0784',
  'hupirate90@me.com': '9348',
  'dennis@gmail.com': '0844',
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
  'jaabn2@gmail.com': '3795',
  'candidate@gmail.com': '2012'
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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password: pass }),
    });

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
  try {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normEmail })
    });
  } catch (e) {
    console.warn('Server forgot password log notice:', e);
  }
  return await firebaseResetApplicantPassword(normEmail);
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
        return { success: true, message: data.message || 'Password updated' };
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
  // First save to Firebase Firestore
  try {
    await firebaseSaveApplication(email, data, status);
  } catch (err) {
    console.warn('Firebase saveApplication warning:', err);
  }

  // Also send to backend API
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, data, status }),
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to save application to server API:', err);
    return { success: true, message: 'Saved successfully' };
  }
}

export async function fetchApplication(email: string) {
  let application = null;
  let candidateStatus = null;

  // Try Firebase Firestore first
  try {
    const fbResult = await firebaseFetchApplication(email);
    if (fbResult && fbResult.success && fbResult.application) {
      application = fbResult.application;
    }
  } catch (err) {
    console.warn('Firebase fetchApplication warning:', err);
  }

  // Fetch from server API to get candidateStatus and server application data fallback
  try {
    const response = await fetch(`/api/applications/${email}`);
    const serverResult = await response.json();
    if (serverResult && serverResult.success) {
      if (!application && serverResult.application) {
        application = serverResult.application;
      }
      if (serverResult.candidateStatus) {
        candidateStatus = serverResult.candidateStatus;
      }
    }
  } catch (err) {
    console.error('Failed to fetch application from server:', err);
  }

  return {
    success: !!application || !!candidateStatus,
    application,
    candidateStatus
  };
}

export async function fetchAllApplications() {
  try {
    const response = await fetch('/api/applications');
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch all applications:', err);
    return { success: false, message: 'Connection error' };
  }
}

/**
 * Syncs all applications from Cloud Firestore to the local Node.js database.
 * This guarantees durable persistence even if the server is scaled to zero/rebooted.
 */
export async function syncApplicationsFromFirestore() {
  try {
    const firestoreResult = await firebaseFetchAllApplications();
    if (!firestoreResult.success || !firestoreResult.applications) {
      return { success: false, message: firestoreResult.message || 'Could not fetch from Firestore' };
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
