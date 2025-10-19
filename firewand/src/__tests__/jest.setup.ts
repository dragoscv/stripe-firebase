import { jest } from '@jest/globals';
import { FirebaseApp } from 'firebase/app';
import { IdTokenResult, User, UserCredential } from 'firebase/auth';

// Mock Firebase config
const mockFirebaseConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: 'test-sender-id',
    appId: 'test-app-id'
};

// Create a complete mock User object that matches Firebase's User interface
export const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: false,
    isAnonymous: false,
    metadata: {
        creationTime: Date.now().toString(),
        lastSignInTime: Date.now().toString()
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn<() => Promise<void>>().mockResolvedValue(),
    getIdToken: jest.fn<(forceRefresh?: boolean) => Promise<string>>().mockResolvedValue('mock-id-token'),
    getIdTokenResult: jest.fn<(forceRefresh?: boolean) => Promise<IdTokenResult>>().mockResolvedValue({
        authTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        issuedAtTime: new Date().toISOString(),
        signInProvider: null,
        signInSecondFactor: null,
        token: 'mock-id-token',
        claims: {}
    }),
    reload: jest.fn<() => Promise<void>>().mockResolvedValue(),
    toJSON: jest.fn<() => object>().mockReturnValue({
        uid: 'test-user-123',
        email: 'test@example.com'
    }),
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    providerId: 'firebase'
} as unknown as User;

// Create mock Firebase app
const mockFirebaseApp = {
    name: '[DEFAULT]',
    options: { ...mockFirebaseConfig },
    automaticDataCollectionEnabled: false,
    delete: jest.fn<() => Promise<void>>().mockResolvedValue()
} as unknown as FirebaseApp;

// Create mock Firestore
const mockFirestore = {
    type: 'firestore',
    app: mockFirebaseApp,
    toJSON: jest.fn().mockReturnValue({}),
};

const setupMocks = () => {
    // Mock Firebase App
    jest.mock('firebase/app', () => ({
        initializeApp: jest.fn(() => mockFirebaseApp),
        getApp: jest.fn(() => mockFirebaseApp),
        registerVersion: jest.fn(),
    }));

    // Mock Firebase Auth
    const mockSignOut = jest.fn<() => Promise<void>>().mockResolvedValue();
    jest.mock('firebase/auth', () => ({
        getAuth: jest.fn(() => ({
            currentUser: mockUser,
            onAuthStateChanged: jest.fn(),
            signOut: mockSignOut,
            app: mockFirebaseApp
        })),
        signInWithEmailAndPassword: jest.fn<() => Promise<UserCredential>>().mockResolvedValue({ user: mockUser } as UserCredential),
        createUserWithEmailAndPassword: jest.fn<() => Promise<UserCredential>>().mockResolvedValue({ user: mockUser } as UserCredential),
        signOut: mockSignOut,
    }));

    // Mock Firestore
    jest.mock('firebase/firestore', () => ({
        getFirestore: jest.fn(() => mockFirestore),
        collection: jest.fn(),
        doc: jest.fn(),
        getDoc: jest.fn(),
        getDocs: jest.fn(),
        addDoc: jest.fn(),
        updateDoc: jest.fn(),
        deleteDoc: jest.fn(),
        onSnapshot: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
    }));

    // Mock Firebase Storage
    jest.mock('firebase/storage', () => ({
        getStorage: jest.fn(() => ({
            app: mockFirebaseApp,
            maxUploadRetryTime: 0,
            maxOperationRetryTime: 0,
            host: 'localhost',
            port: 0,
            protocol: 'http',
        })),
        connectStorageEmulator: jest.fn(),
    }));

    // Mock Firebase Functions
    jest.mock('firebase/functions', () => ({
        getFunctions: jest.fn(() => ({
            app: mockFirebaseApp,
        })),
        connectFunctionsEmulator: jest.fn(),
        httpsCallable: jest.fn(),
    }));

    // Mock Firebase Database
    jest.mock('firebase/database', () => ({
        getDatabase: jest.fn(() => ({
            app: mockFirebaseApp,
            type: 'database',
        })),
        connectDatabaseEmulator: jest.fn(),
        ref: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        push: jest.fn(),
        remove: jest.fn(),
        onValue: jest.fn(),
    }));

    // Mock User DAO
    jest.mock('../stripe/user', () => ({
        getCurrentUser: jest.fn<() => Promise<string>>().mockResolvedValue(mockUser.uid),
        getCurrentUserSync: jest.fn<() => string>().mockReturnValue(mockUser.uid),
        setUserDAO: jest.fn(),
    }));

    // Mock Firebase config
    jest.mock('../firebase/fireabase.config', () => ({
        firebaseApp: mockFirebaseApp,
        firebaseAuth: {
            currentUser: mockUser,
            onAuthStateChanged: jest.fn(),
            signOut: jest.fn<(auth?: any) => Promise<void>>().mockResolvedValue(),
            app: mockFirebaseApp
        },
        firestoreDB: mockFirestore,
    }));
};

setupMocks();