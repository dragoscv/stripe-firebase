// Main entry point for Firewand that dynamically chooses the right version
// when used in different environments

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// We'll use the appropriate version based on the detected platform
// Web is the default for Next.js and other web apps
export * from './web';

// This comment helps TypeScript know about the native export path
// To use React Native specific functionality, import from 'firewand/native'

// Import specific modules first to avoid circular dependencies
import {
    StripePayments,
    StripePaymentsError,
    getStripePayments,
    CREATE_SESSION_TIMEOUT_MILLIS,
    createCheckoutSession,
    getCurrentUserPayment as getStripeUserPaymentInternal,
    getCurrentUserPayments as getStripeUserPaymentsInternal,
    onCurrentUserPaymentUpdate as onStripeUserPaymentUpdateInternal,
    getPrice,
    getPrices,
    getProduct,
    getProducts,
    getCurrentUserSubscription,
    getCurrentUserSubscriptions,
    onCurrentUserSubscriptionUpdate,
    stripePayments,
} from "./stripe";

import {
    BTPPayments,
    BTPPaymentsError,
    getBTPPayments,
    BTPEnvironment,
    createPayment,
    getCurrentUserPayment as getBTPUserPaymentInternal,
    getCurrentUserPayments as getBTPUserPaymentsInternal,
    onCurrentUserPaymentUpdate as onBTPUserPaymentUpdateInternal,
    updatePaymentStatus,
    PaymentType,
    PaymentProduct,
    Currency,
    TransactionStatus,
    initiateSimplePayment,
    BTPProvider,
    useBTP
} from "./btpay";

// Export Firebase related functionality
export {
    firebaseApp,
    firebaseAnalytics,
    logAnalyticsEvent,
    // firebaseAuth,
    firebaseConfig,
    firebaseFunctions,
    firebaseMessaging,
    firebaseStorage,
    firestoreDB,
    realtimeDB,
    signInWithGoogle,
    signOutUser
    // setFirebaseAuth,
    // getCurrentUser,
    // onAuthStateChange,
    // signOut
} from "./firebase";
// export { useUserSession } from "./hooks/auth";

// Export Stripe with renamed functions to avoid conflicts
export {
    StripePayments,
    StripePaymentsError,
    getStripePayments,
    CREATE_SESSION_TIMEOUT_MILLIS,
    createCheckoutSession,
    getPrice,
    getPrices,
    getProduct,
    getProducts,
    getCurrentUserSubscription,
    getCurrentUserSubscriptions,
    onCurrentUserSubscriptionUpdate,
    stripePayments
};

// Re-export renamed Stripe functions
export const getStripeUserPayment = getStripeUserPaymentInternal;
export const getStripeUserPayments = getStripeUserPaymentsInternal;
export const onStripeUserPaymentUpdate = onStripeUserPaymentUpdateInternal;

// Export BTPay with renamed functions to avoid conflicts
export {
    BTPPayments,
    BTPPaymentsError,
    getBTPPayments,
    BTPEnvironment,
    createPayment,
    updatePaymentStatus,
    PaymentType,
    PaymentProduct,
    Currency,
    TransactionStatus,
    initiateSimplePayment,
    BTPProvider,
    useBTP
};

// Re-export renamed BTPay functions
export const getBTPUserPayment = getBTPUserPaymentInternal;
export const getBTPUserPayments = getBTPUserPaymentsInternal;
export const onBTPUserPaymentUpdate = onBTPUserPaymentUpdateInternal;

export * from "./providers/provider";
export * from "./providers/providerNative"

// Re-export types
export * from "./types/basic";
export type {
    Invoice,
    ProfileDetailsProps,
    UserDetails,
    UserRole
} from "./types/app";
export * from "./types/chat";
export * from "./types/post";
export type {
    AppUser
} from "./types/user";