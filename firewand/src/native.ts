// Native-only entry point for Firewand
// This file exports React Native specific modules and functionality

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
    // firebaseAuth is intentionally NOT exported for native version
    // as it needs to be created differently in React Native environments
    firebaseConfig,
    firebaseFunctions,
    firebaseMessaging,
    firebaseStorage,
    firestoreDB,
    realtimeDB,
    signInWithGoogle,
    signOutUser
} from "./firebase";

// Export Stripe
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

// Export BTPay
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

// Export native provider
export { FirewandProviderNative, FirewandContextNative } from "./providers/providerNative";

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