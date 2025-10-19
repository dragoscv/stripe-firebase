
import {
    collection,
    onSnapshot,
    query,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    orderBy,
    Timestamp,
    runTransaction,
    where,
    addDoc,
    setDoc,
    connectFirestoreEmulator,
    getFirestore
} from "firebase/firestore";

import { firebaseApp } from "./app";
import { useEmulators } from "./utils";

/**
 * Firestore database instance
 * @type {import('firebase/firestore').Firestore}
 */
export const firestoreDB = getFirestore(firebaseApp);

if (process.env.NODE_ENV === 'development' && useEmulators) {
    connectFirestoreEmulator(firestoreDB, 'localhost', 8080);
}

/**
 * Asynchronously retrieves all documents from a specified Firestore collection.
 * 
 * @param collectionName - The name of the collection to retrieve documents from
 * @returns A Promise that resolves to an array of objects, each representing a document
 *          from the collection with an added 'id' field containing the document ID
 * @example
 * // Get all documents from the 'users' collection
 * const users = await getCollection('users');
 */
export const getCollection = async (collectionName: string) => {
    const q = query(collection(firestoreDB, collectionName));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
        return {
            id: doc.id, ...doc
                .data()
        };
    });
    return data;
};

/**
 * Retrieves a document from a specified collection in Firestore.
 * 
 * @param collectionName - The name of the collection to fetch the document from.
 * @param docId - The ID of the document to retrieve.
 * @returns A Promise that resolves to the data of the requested document, or undefined if the document doesn't exist.
 * 
 * @example
 * ```typescript
 * const userData = await getDocument('users', 'user123');
 * if (userData) {
 *   console.log('User data:', userData);
 * } else {
 *   console.log('User not found');
 * }
 * ```
 */
export const getDocument = async (collectionName: string, docId: string) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.data();
};

/**
 * Updates a document in Firestore with the provided data.
 * 
 * @async
 * @param {string} collectionName - The name of the collection containing the document to update
 * @param {string} docId - The ID of the document to update
 * @param {any} data - The data to update the document with
 * @returns {Promise<void>} A promise that resolves when the update is complete
 */
export const updateDocument = async (
    collectionName: string,
    docId: string,
    data: any
) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    await updateDoc(docRef, data);
};

/**
 * Adds a new document to a specified Firestore collection.
 * 
 * @param collectionName - The name of the collection where the document should be added
 * @param data - The data to store in the new document
 * @returns A Promise that resolves when the document has been added successfully
 */
export const addDocument = async (collectionName: string, data: any) => {
    await addDoc(collection(firestoreDB, collectionName), data);
};

/**
 * Sets a document in Firestore with the specified data.
 * 
 * @param collectionName - The name of the collection in which to set the document
 * @param docId - The ID of the document to set
 * @param data - The data to set in the document
 * @returns A Promise that resolves when the document has been successfully written to Firestore
 * 
 * @example
 * ```typescript
 * await setDocument('users', 'user123', { name: 'John Doe', age: 30 });
 * ```
 */
export const setDocument = async (collectionName: string, docId: string, data: any) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    await setDoc(docRef, data);
};

/**
 * Updates or creates a document in Firestore with the provided data, using the merge option.
 * 
 * @param collectionName - The name of the Firestore collection
 * @param docId - The document ID
 * @param data - The data to set in the document (will be merged with existing data)
 * @returns Promise that resolves when the operation is complete
 * 
 * @example
 * ```typescript
 * await setDocumentMerge('users', 'user123', { name: 'John Doe', age: 30 });
 * ```
 */
export const setDocumentMerge = async (collectionName: string, docId: string, data: any) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
};

/**
 * Soft deletes a document by updating its 'deletedAt' field with the current timestamp.
 * 
 * @param collectionName - The name of the collection containing the document to delete
 * @param docId - The ID of the document to delete
 * @returns A promise that resolves when the deletion is complete
 * 
 * @remarks
 * This function performs a soft delete by setting the 'deletedAt' timestamp
 * rather than physically removing the document from Firestore.
 */
export const deleteDocument = async (collectionName: string, docId: string) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    await updateDoc(docRef, { deletedAt: Timestamp.now() });
};



/**
 * Retrieves documents from a Firestore collection with specified ordering.
 *
 * @param collectionName - The name of the Firestore collection to query.
 * @param field - The document field to order by.
 * @param order - The order direction, either "asc" for ascending or "desc" for descending.
 * @returns A Promise that resolves to an array of documents with their IDs and data.
 * Each document in the array includes its ID as the 'id' property merged with all its fields.
 */
export const getCollectionWithOrder = async (
    collectionName: string,
    field: string,
    order: "asc" | "desc"
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        orderBy(field, order)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
    });
    return data;
};

export const getCollectionWithFilter = async (
    collectionName: string,
    field: string,
    operator: any,
    value: any
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        where(field, operator, value)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
        return {
            id: doc.id, ...doc
                .data()
        };
    });
    return data;
};

/**
 * Retrieves documents from a Firestore collection with filtering and ordering.
 * 
 * @param collectionName - The name of the Firestore collection to query
 * @param field - The field to filter on
 * @param operator - The comparison operator to use in the filter (e.g., '==', '>', '<', '>=', '<=', 'in', 'array-contains')
 * @param value - The value to compare against in the filter
 * @param orderField - The field to order the results by
 * @param order - The direction to order the results ('asc' for ascending, 'desc' for descending)
 * @returns A Promise that resolves to an array of documents with their IDs and data
 */
export const getCollectionWithFilterAndOrder = async (
    collectionName: string,
    field: string,
    operator: any,
    value: any,
    orderField: string,
    order: "asc" | "desc"
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        where(field, operator, value),
        orderBy(orderField, order)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => {
        return {
            id: doc.id, ...doc
                .data()
        };
    });
    return data;
};

export const runTransactionWithDocument = async (
    collectionName: string,
    docId: string,
    transactionFunction: any
) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    await runTransaction(firestoreDB, async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = doc.data();
        transactionFunction(transaction, data);
    });
};

/**
 * Sets up a real-time listener for all documents in a specified Firestore collection.
 * 
 * This function creates a snapshot listener on a Firestore collection and transforms
 * the document data to include the document ID in each object before passing it to the callback.
 * 
 * @param collectionName - The name of the Firestore collection to listen to
 * @param callback - Function that will be called with an array of documents whenever the collection changes.
 *                  Each document is an object with the document ID added as an 'id' property and all the fields from the document data.
 * 
 * @returns An unsubscribe function that can be called to remove the listener
 * 
 * @example
 * ```
 * onSnapshotWithCollection('users', (users) => {
 *   console.log('Users updated:', users);
 * });
 * ```
 */
export const onSnapshotWithCollection = (
    collectionName: string,
    callback: any
) => {
    const q = query(collection(firestoreDB, collectionName));
    onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() };
        });
        callback(data);
    });
};

/**
 * Sets up a real-time listener on a specific Firestore document
 * 
 * This function creates a listener that triggers a callback whenever changes
 * are made to the specified document in Firestore.
 * 
 * @param collectionName - The name of the Firestore collection
 * @param docId - The ID of the document to listen to
 * @param callback - Function to call when document changes. The function will receive
 *                  an object with the document ID and all document data merged together
 * @returns An unsubscribe function that can be called to cancel the snapshot listener
 * 
 * @example
 * ```typescript
 * // Listen to a user document
 * const unsubscribe = onSnapshotWithDocument(
 *   'users',
 *   'user123',
 *   (userData) => {
 *     console.log('User data changed:', userData);
 *   }
 * );
 * 
 * // Later, to stop listening
 * unsubscribe();
 * ```
 */
export const onSnapshotWithDocument = (
    collectionName: string,
    docId: string,
    callback: any
) => {
    const docRef = doc(firestoreDB, collectionName, docId);
    onSnapshot(docRef, (doc) => {
        callback({ id: doc.id, ...doc.data() });
    });
};

export const onSnapshotWithOrder = (
    collectionName: string,
    field: string,
    order: "asc" | "desc",
    callback: any
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        orderBy(field, order)
    );
    onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() };
        });
        callback(data);
    });
};

export const onSnapshotWithFilter = (
    collectionName: string,
    field: string,
    operator: any,
    value: any,
    callback: any
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        where(field, operator, value)
    );
    onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() };
        });
        callback(data);
    });
};

export const onSnapshotWithFilterAndOrder = (
    collectionName: string,
    field: string,
    operator: any,
    value: any,
    orderField: string,
    order: "asc" | "desc",
    callback: any
) => {
    const q = query(
        collection(firestoreDB, collectionName),
        where(field, operator, value),
        orderBy(orderField, order)
    );
    onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
            return { id: doc.id, ...doc.data() };
        });
        callback(data);
    });
};