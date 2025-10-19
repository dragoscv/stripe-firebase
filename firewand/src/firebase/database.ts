


import { ref, set, get, remove, update, getDatabase, connectDatabaseEmulator } from "firebase/database";
import { firebaseApp } from "./app";

/**
 * Firebase Realtime Database instance
 * @type {import('firebase/database').Database}
 * @see {@link https://firebase.google.com/docs/database/web/start|Firebase Realtime Database Documentation}
 * */
export const firebaseDB = getDatabase(firebaseApp);
if (process.env.NODE_ENV === 'development' && process.env.USE_EMULATORS) {
    connectDatabaseEmulator(firebaseDB, 'localhost', 9080);
}

/**
 * Adds or sets an object at the specified path in the Firebase Realtime Database.
 * 
 * @param path - The path where the data should be stored in the database.
 * @param data - The data to be stored at the specified path.
 * @returns A Promise that resolves when the data has been successfully written to the database.
 * 
 * @example
 * ```typescript
 * // Store user data
 * await addObject('users/user1', { name: 'John Doe', email: 'john@example.com' });
 * ```
 */
export const addObject = async (path: string, data: any) => {
    const dbRef = ref(firebaseDB, path);
    await set(dbRef, data);
};

/**
 * Retrieves an object from the Firebase Realtime Database at the specified path.
 * @param path - The database path where the object is stored.
 * @returns A promise that resolves with the value at the specified path, 
 * or null if no data exists at the path.
 * @throws Will throw an error if the database operation fails.
 */
export const getObject = async (path: string) => {
    const dbRef = ref(firebaseDB, path);
    const snapshot = await get(dbRef);
    return snapshot.val();
};

/**
 * Deletes a Firebase Realtime Database object at the specified path.
 * 
 * @param {string} path - The path to the database object to be deleted
 * @returns {Promise<void>} A promise that resolves when the deletion is complete
 * @throws Will throw an error if the deletion operation fails
 */
export const deleteObject = async (path: string) => {
    const dbRef = ref(firebaseDB, path);
    await remove(dbRef);
};

