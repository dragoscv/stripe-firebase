/**
 * Firebase configuration and initialization module.
 * 
 * This module handles initialization of Firebase services and connects to emulators
 * when running in development mode with emulators enabled.
 * 
 * @module firebase/firebase.config
 * 
 * @exports firebaseConfig - Configuration object for Firebase initialization
 * @exports firestoreDB - Firestore database instance
 * @exports firebaseAuth - Firebase authentication instance
 * @exports firebaseStorage - Firebase storage instance
 * @exports firebaseAnalytics - Promise resolving to Firebase analytics instance or null if not supported
 * @exports firebaseMessaging - Promise resolving to Firebase messaging instance or null if not supported
 * @exports firebaseFunctions - Firebase cloud functions instance
 * @exports firebaseDB - Firebase realtime database instance
 * @exports currentFirebaseApp - Reference to the default Firebase app instance
 */



/**
 * Firebase configuration object
 * @typedef {Object} FirebaseConfig
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase authentication domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Firebase storage bucket
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 * @property {string} measurementId - Firebase measurement ID
 */
export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL
};

