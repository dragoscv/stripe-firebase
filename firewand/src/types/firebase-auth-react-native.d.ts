declare module '@firebase/auth/react-native' {
    import { Auth, initializeAuth } from '@firebase/auth';
    import { FirebaseApp } from '@firebase/app';

    export function initializeAuth(app: FirebaseApp, options?: any): Auth;
    export function getReactNativePersistedAuth(storage: any): any;


}

declare module 'firebase/auth/react-native' {
    import { Persistence } from 'firebase/auth';

    export function getReactNativePersistence(storage: Storage): Persistence;
}

declare module '@react-native-async-storage/async-storage' {
    import { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
    export default AsyncStorageStatic;
}

declare module '@firebase/auth/react-native' {
    export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}