

import { getMessaging, isSupported as isSupportedMessaging, Messaging } from 'firebase/messaging';
import { firebaseApp } from './app';





/**
 * Asynchronously initializes Firebase Messaging if it's supported by the browser.
 * 
 * @remarks
 * This variable holds a Promise that resolves to a Firebase Messaging instance or null.
 * It first checks if the browser supports Firebase Messaging, and if so, initializes
 * the Messaging service with the Firebase application.
 * 
 * @returns A Promise that resolves to a Firebase Messaging instance if messaging is supported,
 * or null if it's not supported in the current browser environment.
 */
export const firebaseMessaging: Promise<Messaging | null> = isSupportedMessaging().then((isSupported) => {
    if (isSupported) {
        return getMessaging(firebaseApp);
    }
    return null;
});