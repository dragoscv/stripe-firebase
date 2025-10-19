import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut, UserCredential } from 'firebase/auth';
import { firebaseApp } from './app.js';

// Initialize and export firebaseAuth for web environments
export const firebaseAuth: Auth = getAuth(firebaseApp);

/**
 * Signs in the user with Google.
 * @param firebaseAuth - The Firebase Auth instance
 * @param enableLogs - Whether to enable detailed logging (defaults to false)
 * @returns UserCredential if successful, null if there was an error
 */
export async function signInWithGoogle(firebaseAuth: Auth, enableLogs?: boolean): Promise<UserCredential | null> {
  if (enableLogs) console.log('🔥 Initializing Google sign-in process');
  const provider = new GoogleAuthProvider();

  if (enableLogs) console.log('🔥 Google Auth provider created');

  try {
    if (enableLogs) console.log('🔥 Attempting sign in with popup');
    const result = await signInWithPopup(firebaseAuth, provider);

    if (enableLogs) {
      console.log('🔥 Google sign-in successful');
      console.log('🔥 User info:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        isAnonymous: result.user.isAnonymous,
        emailVerified: result.user.emailVerified,
        creationTime: result.user.metadata.creationTime,
        lastSignInTime: result.user.metadata.lastSignInTime
      });
    }

    return result;
  } catch (error: any) {
    console.error("Error signing in with Google", error);

    if (enableLogs) {
      console.error('🔥 Detailed sign-in error:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      });
    }

    return null;
  }
}

/**
 * Signs out the user.
 * @param firebaseAuth - The Firebase Auth instance
 * @param enableLogs - Whether to enable detailed logging (defaults to false)
 * @returns true if sign out was successful, false otherwise
 */
export async function signOutUser(firebaseAuth: Auth, enableLogs?: boolean): Promise<boolean> {
  if (enableLogs) {
    const currentUser = firebaseAuth.currentUser;
    console.log('🔥 Attempting to sign out user:', currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    } : 'No user currently signed in');
  }

  try {
    await signOut(firebaseAuth);
    if (enableLogs) console.log('🔥 User signed out successfully');
    return true;
  } catch (error: any) {
    console.error("Error signing out", error);

    if (enableLogs) {
      console.error('🔥 Detailed sign-out error:', {
        code: error.code,
        message: error.message
      });
    }

    return false;
  }
}

/**
 * Helper function to log the current auth state
 * @param firebaseAuth - The Firebase Auth instance
 */
export function logAuthState(firebaseAuth: Auth): void {
  const user = firebaseAuth.currentUser;

  console.log('🔥 Current Auth State:', {
    isSignedIn: !!user,
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      },
      providerData: user.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        photoURL: provider.photoURL
      }))
    } : 'No user'
  });
}
