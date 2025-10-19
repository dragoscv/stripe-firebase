// Web-only entry point for Firewand
// This file exports only web-compatible modules without React Native dependencies

// Import specific modules first to avoid circular dependencies
import {
    StripePayments,
    StripePaymentsError,
    getStripePayments,
    CREATE_SESSION_TIMEOUT_MILLIS,
    createCheckoutSession,
    getCurrentUserPayment,
    getCurrentUserPayments,
    onCurrentUserPaymentUpdate,
    getPrice,
    getPrices,
    getProduct,
    getProducts,
    getCurrentUserSubscription,
    getCurrentUserSubscriptions,
    onCurrentUserSubscriptionUpdate,
    stripePayments,
} from "./stripe";

// Export Firebase related functionality
export {
    firebaseApp,
    firebaseAnalytics,
    logAnalyticsEvent,
    firebaseAuth,  // Including firebaseAuth for web version
    firebaseConfig,
    firebaseFunctions,
    firebaseMessaging,
    firebaseStorage,
    firestoreDB,
    realtimeDB,
    signInWithGoogle,
    signOutUser
} from "./firebase";

// Export Stripe payments
export {
    StripePayments,
    StripePaymentsError,
    getStripePayments,
    CREATE_SESSION_TIMEOUT_MILLIS,
    createCheckoutSession,
    getCurrentUserPayment as getStripeUserPayment,
    getCurrentUserPayments as getStripeUserPayments,
    onCurrentUserPaymentUpdate as onStripeUserPaymentUpdate,
    getPrice,
    getPrices,
    getProduct,
    getProducts,
    getCurrentUserSubscription,
    getCurrentUserSubscriptions,
    onCurrentUserSubscriptionUpdate,
    stripePayments
};

// Export web hooks
export { useStripeWeb as useStripe } from "./hooks/useStripeWeb";

// Export web provider only
export { FirewandProvider, FirewandContext } from "./providers/provider";

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