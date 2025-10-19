import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './firebase.config.js';

/**
 * Initialize Firebase app with detailed logging
 * 
 * @param config - Firebase configuration object
 * @param enableLogs - Whether to enable detailed logging
 * @returns Initialized Firebase app instance
 */
export function initializeFirebaseApp(config = firebaseConfig, enableLogs = false): FirebaseApp {
    try {
        if (enableLogs) {
            console.log('🔥 Initializing Firebase app with config:', {
                projectId: config.projectId,
                appId: config.appId,
                apiKey: config.apiKey ? '✓ Provided' : '✗ Missing',
                authDomain: config.authDomain ? '✓ Provided' : '✗ Missing',
                databaseURL: config.databaseURL ? '✓ Provided' : '✗ Missing',
                storageBucket: config.storageBucket ? '✓ Provided' : '✗ Missing',
                messagingSenderId: config.messagingSenderId ? '✓ Provided' : '✗ Missing',
                measurementId: config.measurementId ? '✓ Provided' : '✗ Missing'
            });
        }

        // Try to get an existing app instance first
        try {
            if (enableLogs) console.log('🔥 Checking for existing Firebase app instance');
            const existingApp = getApp(config.appId || '[DEFAULT]');
            if (enableLogs) console.log('🔥 Using existing Firebase app instance');
            return existingApp;
        } catch (e) {
            // No existing app found, initialize a new one
            if (enableLogs) console.log('🔥 No existing app found, creating new Firebase app instance');
            const newApp = initializeApp(config);
            if (enableLogs) console.log('🔥 Firebase app initialized successfully');
            return newApp;
        }
    } catch (error: any) {
        console.error('🔥 Error initializing Firebase app:', error.message);
        throw error;
    }
}

// Initialize app with default config
const app = initializeFirebaseApp(firebaseConfig);

/**
 * Export of the initialized Firebase application instance.
 * 
 * This is the main entry point for accessing Firebase services.
 * The app instance can be used to access various Firebase services 
 * like authentication, database, storage, etc.
 * 
 * @exports {FirebaseApp} firebaseApp - The Firebase application instance
 */
export const firebaseApp = app;

/**
 * Logs the current status of the Firebase app initialization
 * Useful for debugging Firebase setup issues
 * 
 * @param app - The Firebase app instance to check
 */
export function logFirebaseAppStatus(app: FirebaseApp): void {
    console.log('🔥 Firebase App Status:', {
        name: app.name,
        options: {
            projectId: app.options.projectId,
            appId: app.options.appId,
            apiKey: app.options.apiKey ? '✓ Provided' : '✗ Missing',
            authDomain: app.options.authDomain ? '✓ Provided' : '✗ Missing',
            databaseURL: app.options.databaseURL ? '✓ Provided' : '✗ Missing',
            storageBucket: app.options.storageBucket ? '✓ Provided' : '✗ Missing',
            messagingSenderId: app.options.messagingSenderId ? '✓ Provided' : '✗ Missing'
        },
        automaticDataCollectionEnabled: app.automaticDataCollectionEnabled
    });
}