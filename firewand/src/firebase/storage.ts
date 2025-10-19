import { ref, uploadBytesResumable, getDownloadURL, getStorage, connectStorageEmulator } from "firebase/storage";

import { firebaseApp } from "./app";
import { useEmulators } from "./utils";

/**
 * Uploads a file to Firebase Storage.
 * 
 * @param file - The file to upload
 * @param path - The path in Firebase Storage to upload the file to
 * @returns A Promise that resolves to the download URL of the uploaded file
 */

/**
 * Firebase storage instance
 * @type {import('firebase/storage').Storage}
 */
export const firebaseStorage = getStorage(firebaseApp);
if (process.env.NODE_ENV === 'development' && useEmulators) {
    connectStorageEmulator(firebaseStorage, 'localhost', 9199);
}

export async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(firebaseStorage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            null,
            reject,
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve);
            }
        );
    });
}

