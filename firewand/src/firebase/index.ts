export { firebaseApp } from './app'
export {
    firebaseAuth, 
    signInWithGoogle,
    signOutUser
} from './auth'
export { firebaseDB as realtimeDB } from './database'
export { 
    firestoreDB,
    // Firestore utility functions
    getCollection,
    getDocument,
    updateDocument,
    addDocument,
    setDocument,
    setDocumentMerge,
    deleteDocument,
    getCollectionWithOrder,
    getCollectionWithFilter,
    getCollectionWithFilterAndOrder,
    runTransactionWithDocument,
    onSnapshotWithCollection,
    onSnapshotWithDocument,
    onSnapshotWithOrder,
    onSnapshotWithFilter,
    onSnapshotWithFilterAndOrder
} from './firestore'
export { firebaseFunctions } from './functions'
export { 
    firebaseStorage,
    uploadFile 
} from './storage'
export { firebaseAnalytics, logAnalyticsEvent } from './analytics'
export { firebaseMessaging } from './messaging.js'
export { firebaseConfig } from './firebase.config'
export { 
    useEmulators,
    isReactNative,
    isWeb,
    functionsRegion
} from './utils'


