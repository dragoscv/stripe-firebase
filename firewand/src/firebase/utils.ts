


/**
 * Platform detection
 */
export const isReactNative = typeof navigator !== 'undefined' &&
    /ReactNative/.test(navigator.userAgent);

export const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export const useEmulators = process.env.USE_EMULATORS === 'true' ? true : false;
export const functionsRegion = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1';
