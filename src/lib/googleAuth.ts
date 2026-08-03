import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

const provider = new GoogleAuthProvider();
// Request Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/presentations');
provider.addScope('https://www.googleapis.com/auth/forms.body');

// Google Classroom Scopes
provider.addScope('https://www.googleapis.com/auth/classroom.addons.student');
provider.addScope('https://www.googleapis.com/auth/classroom.addons.teacher');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.courses');
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials');
provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.students');
provider.addScope('https://www.googleapis.com/auth/classroom.guardianlinks.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.profile.emails');
provider.addScope('https://www.googleapis.com/auth/classroom.profile.photos');
provider.addScope('https://www.googleapis.com/auth/classroom.push-notifications');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters');
provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.me.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.student-submissions.students.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.topics');
provider.addScope('https://www.googleapis.com/auth/classroom.topics.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // We have a user but no token (e.g. page refresh)
        // In a real app we might try to refresh the token, but for now we'll require a fresh sign-in if the token is gone from memory
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
