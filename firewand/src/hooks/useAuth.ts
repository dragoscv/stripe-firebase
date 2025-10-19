import { User } from 'firebase/auth'
import { useEffect, useState } from 'react'
// import { firebaseApp } from '@/utils/firebase/app'
// import { firebaseAuth } from '../firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import { firestoreDB, firebaseApp } from '../firebase'

/**
 * Custom hook to get the current user session from Firebase Authentication.
 * @returns An object containing the current user session.
 */
/**
 * A custom React hook that manages user authentication state and user details.
 * 
 * This hook uses Firebase Authentication to track the current user's authentication state
 * and fetches additional user details from Firestore when a user is authenticated.
 * 
 * @param enableLogs - Whether to enable detailed logging (defaults to false)
 * @returns An object containing:
 *  - user: The current Firebase Auth user object or null if not authenticated
 *  - userDetails: Additional user information from Firestore or null if not available
 * 
 * @example
 * ```tsx
 * const { user, userDetails } = useUserSession();
 * 
 * if (user) {
 *   console.log("User is signed in:", user.displayName);
 *   console.log("User details:", userDetails);
 * } else {
 *   console.log("User is not signed in");
 * }
 * ```
 */
export function useUserSession(enableLogs?: boolean) {
    if (enableLogs) console.log('🔥 useUserSession hook initialized');

    const [user, setUser] = useState<User | null>(null)
    const [userDetails, setUserDetails] = useState<any>(null)
    const firebaseAuth = getAuth(firebaseApp)

    useEffect(() => {
        if (!firebaseAuth) {
            console.error('Firebase Auth is not initialized')
            return
        }

        if (enableLogs) console.log('🔥 Setting up auth state listener');

        const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
            if (currentUser) {
                if (enableLogs) {
                    console.log('🔥 Auth state changed: User signed in', {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        emailVerified: currentUser.emailVerified,
                        isAnonymous: currentUser.isAnonymous,
                        metadata: {
                            creationTime: currentUser.metadata.creationTime,
                            lastSignInTime: currentUser.metadata.lastSignInTime
                        }
                    });
                }
                setUser(currentUser)
            } else {
                if (enableLogs) console.log('🔥 Auth state changed: User signed out');
                setUser(null)
                setUserDetails(null)
            }
        })

        return () => {
            if (enableLogs) console.log('🔥 Cleaning up auth state listener');
            unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (user) {
            if (enableLogs) console.log('🔥 User present, fetching additional user details from Firestore');

            const getUserDetails = async () => {
                try {
                    const userDocRef = doc(firestoreDB, 'users', user.uid);
                    if (enableLogs) console.log(`🔥 Fetching user doc from path: users/${user.uid}`);

                    const userDoc = await getDoc(userDocRef)

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (enableLogs) {
                            console.log('🔥 User document found in Firestore', {
                                docId: userDoc.id,
                                hasData: !!userData,
                                dataFields: userData ? Object.keys(userData) : []
                            });
                        }
                        setUserDetails(userData)
                    } else {
                        if (enableLogs) console.log('🔥 No user document found in Firestore for this user');
                        setUserDetails(null)
                    }
                } catch (error: any) {
                    console.error('Error fetching user details', error);
                    if (enableLogs) {
                        console.error('🔥 Detailed Firestore error:', {
                            code: error.code,
                            message: error.message,
                            userId: user.uid
                        });
                    }
                    setUserDetails(null)
                }
            }

            getUserDetails()
        }
    }, [user, enableLogs])

    if (enableLogs && user && userDetails) {
        console.log('🔥 Current authenticated session', {
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            },
            userDetails: {
                fields: Object.keys(userDetails),
                hasCustomClaims: !!userDetails.customClaims
            }
        });
    }

    return { user, userDetails }
}