

import { firebaseApp } from './app';
import { useEmulators, functionsRegion } from './utils';
import { getFunctions, connectFunctionsEmulator as _connectFunctionsEmulator } from 'firebase/functions';





/**
 * Firebase Functions instance configured to run in the functionsRegion or "us-central1" region.
 * This allows calling Cloud Functions deployed to the specified region.
 * 
 * @see {@link https://firebase.google.com/docs/functions/callable Cloud Functions documentation}
 */
export const firebaseFunctions = getFunctions(firebaseApp, functionsRegion);
