# Firewand

Firewand is a modular Firebase utility library for simplifying interactions with Firebase services such as Analytics, Auth, Firestore, Storage, and Stripe payments. It provides a set of hooks and functions for common Firebase operations and integrates with Stripe for handling payments and subscriptions. Firewand is designed to be used with React applications, Next.js projects, and React Native/Expo applications.

[![npm version](https://badge.fury.io/js/firewand.svg)](https://badge.fury.io/js/firewand)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Platform-Specific Features

### Authentication Persistence

Firewand automatically handles Firebase Authentication persistence based on the platform:

- **React Native**: Uses AsyncStorage for persistence through `@react-native-async-storage/async-storage`
- **Web**: Uses the default Firebase Auth persistence mechanism

This configuration is handled internally and requires no additional setup, though you must install the peer dependency for React Native:

```bash
npm install @react-native-async-storage/async-storage
# or
expo install @react-native-async-storage/async-storage
```

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
  - [Web Applications](#web-applications)
  - [React Native/Expo](#react-nativeexpo)
- [Exported Utilities](#exported-utilities)
  - [Firebase Core Services](#firebase-core-services)
  - [Authentication Utilities](#authentication-utilities)
  - [Firestore Utilities](#firestore-utilities)
  - [Stripe Payment Integration](#stripe-payment-integration)
  - [BTPay Integration](#btpay-integration)
- [Usage Examples](#usage-examples)
  - [Basic Firebase App Usage](#basic-firebase-app-usage)
  - [User Authentication](#user-authentication)
  - [Firestore Operations](#firestore-operations)
  - [Analytics Event Logging](#analytics-event-logging)
  - [Stripe Payments Integration](#stripe-payments-integration)
    - [Initialize Stripe Payments](#initialize-stripe-payments)
    - [Create a Checkout Session](#create-a-checkout-session)
    - [Manage Subscriptions](#manage-subscriptions)
    - [Products and Pricing](#products-and-pricing)
  - [BTPay Integration](#btpay-integration-usage)
    - [Initialize BTPay](#initialize-btpay)
    - [Process Payments](#process-payments)
- [React Native/Expo Integration](#react-nativeexpo-integration)
  - [Installation](#react-native-installation)
  - [Configuration](#react-native-configuration)
  - [Resolving Common Issues](#resolving-common-issues)
- [FirewandProvider Component](#firewandprovider-component)
- [Contributing](#contributing)
- [License](#license)

## Overview

Firewand centralizes Firebase functionalities into a single library. It exports all necessary Firebase helpers from the main entry point.

## Installation

To install Firewand, run:

```bash
npm install firewand
# or
yarn add firewand
```

## Environment Configuration

### Web Applications

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1

# Firebase Cloud Messaging
NEXT_PUBLIC_VAPID_KEY=your_vapid_key

# Development Configuration
USE_EMULATORS=false
```

### React Native/Expo

For React Native/Expo projects, use the Expo environment variables in your `app.json` or `.env` file:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1
```

## Exported Utilities

Firewand exports the following utilities:

### Firebase Core Services

```typescript
import {
  firebaseApp, // Firebase App instance
  firestoreDB, // Firestore database instance
  firebaseAuth, // Firebase Authentication instance
  firebaseStorage, // Firebase Storage instance
  firebaseAnalytics, // Firebase Analytics instance
  firebaseMessaging, // Firebase Cloud Messaging instance
  firebaseFunctions, // Firebase Cloud Functions instance
  firebaseDB, // Firebase Realtime Database instance
} from "firewand";
```

### Authentication Utilities

```typescript
import {
  useUserSession, // Hook for accessing authenticated user and details
  onAuthStateChanged, // Auth state change listener
  signInWithGoogle, // Google sign-in method
  signOut, // Sign out method
} from "firewand";
```

### Firestore Utilities

```typescript
import {
  getCollection, // Get all documents from a collection
  getDocument, // Get a specific document
  updateDocument, // Update a document
  addDocument, // Add a new document
  setDocument, // Set document data
  setDocumentMerge, // Set document data with merge option
  deleteDocument, // Delete a document
  onSnapshotWithCollection, // Real-time collection listener
  onSnapshotWithDocument, // Real-time document listener
} from "firewand";
```

### Stripe Payment Integration

```typescript
import {
  stripePayments, // Initialize Stripe payments
  createCheckoutSession, // Create a checkout session
  getCurrentUserSubscriptions, // Get user subscriptions
  onCurrentUserSubscriptionUpdate, // Listen for subscription updates
  getProducts, // Get available products
  getPrices, // Get prices for a product
} from "firewand";
```

### BTPay Integration

```typescript
import {
  BTPPayments, // BTPay payments client
  getBTPPayments, // Initialize BTPay payments
  BTPEnvironment, // BTPay environment enum
  createPayment, // Create a payment
  getCurrentUserPayment, // Get user payment
  updatePaymentStatus, // Update payment status
  PaymentType, // Payment type enum
  Currency, // Currency enum
  initiateSimplePayment, // Simple payment helper
} from "firewand";
```

## Usage Examples

### Basic Firebase App Usage

```typescript
import { firebaseApp, firestoreDB } from "firewand";

// Use firebaseApp to initialize other services
// Use firestoreDB for database operations
```

### User Authentication

```typescript
import { useUserSession } from "firewand";

function App() {
  const { user, userDetails } = useUserSession();

  return (
    <div>
      {user ? `Welcome, ${user.email}` : "Sign in"}
      {userDetails && <p>User role: {userDetails.role}</p>}
    </div>
  );
}
```

### Firestore Operations

```typescript
import { getCollection, addDocument } from "firewand";

// Get all documents from a collection
const fetchUsers = async () => {
  const users = await getCollection("users");
  console.log(users);
};

// Add a new document
const addUser = async (userData) => {
  await addDocument("users", userData);
};
```

### Analytics Event Logging

```typescript
import { logAnalyticsEvent } from "firewand";

// Log a custom event
logAnalyticsEvent("button_click", { button_id: "login", page: "home" });
```

### Stripe Payments Integration

Firewand provides extensive Stripe integration capabilities for handling subscriptions, payments, and products.

#### Initialize Stripe Payments

```typescript
import { stripePayments, firebaseApp } from "firewand";

const payments = stripePayments(firebaseApp);
```

#### Create a Checkout Session

```typescript
import { createCheckoutSession, stripePayments, firebaseApp } from "firewand";

const createSubscription = async (priceId) => {
  const payments = stripePayments(firebaseApp);

  const session = await createCheckoutSession(payments, {
    price: priceId,
    success_url: window.location.origin + "/success",
    cancel_url: window.location.origin + "/cancel",
    mode: "subscription",
  });

  // Redirect to checkout
  window.location.assign(session.url);
};
```

#### Manage Subscriptions

```typescript
import {
  getCurrentUserSubscriptions,
  onCurrentUserSubscriptionUpdate,
  stripePayments,
  firebaseApp,
} from "firewand";

// Get user's subscriptions
const fetchSubscriptions = async () => {
  const payments = stripePayments(firebaseApp);
  const subscriptions = await getCurrentUserSubscriptions(payments);
  return subscriptions;
};

// Listen for subscription changes
const subscribeToSubscriptionChanges = () => {
  const payments = stripePayments(firebaseApp);

  return onCurrentUserSubscriptionUpdate(
    payments,
    (snapshot) => {
      console.log("Subscriptions updated:", snapshot.subscriptions);
    },
    (error) => {
      console.error("Subscription error:", error);
    }
  );
};
```

#### Products and Pricing

```typescript
import { getProducts, getPrices, stripePayments, firebaseApp } from "firewand";

// Get all products with prices
const fetchProducts = async () => {
  const payments = stripePayments(firebaseApp);
  const products = await getProducts(payments, { includePrices: true });
  return products;
};

// Get prices for a specific product
const fetchPrices = async (productId) => {
  const payments = stripePayments(firebaseApp);
  const prices = await getPrices(payments, productId);
  return prices;
};
```

### BTPay Integration Usage

Firewand also provides integration with BTPay for payment processing.

#### Initialize BTPay

```typescript
import { getBTPPayments, firebaseApp, BTPEnvironment } from "firewand";

const btpayClient = getBTPPayments(firebaseApp, {
  apiKey: "your-btpay-api-key",
  environment: BTPEnvironment.SANDBOX,
});
```

#### Process Payments

```typescript
import {
  initiateSimplePayment,
  PaymentType,
  Currency,
  getBTPPayments,
  firebaseApp,
} from "firewand";

const initiatePayment = async (amount) => {
  const btpayClient = getBTPPayments(firebaseApp, {
    apiKey: "your-btpay-api-key",
    environment: BTPEnvironment.SANDBOX,
  });

  const paymentConfig = {
    amount: amount,
    currency: Currency.RON,
    paymentType: PaymentType.CARD,
    description: "Product purchase",
    redirectUrl: "https://yourdomain.com/success",
    cancelUrl: "https://yourdomain.com/cancel",
  };

  const result = await initiateSimplePayment(btpayClient, paymentConfig);

  // Redirect to payment page
  window.location.assign(result.paymentUrl);
};
```

## React Native/Expo Integration

### React Native Installation

For React Native or Expo projects, install the required dependencies:

```bash
# For Expo
expo install firewand firebase @react-native-async-storage/async-storage

# For React Native
npm install firewand firebase @react-native-async-storage/async-storage
```

### React Native Configuration

Set up the Firebase config in your main App component:

```tsx
import React from "react";
import { FirewandProvider } from "firewand";
import Constants from "expo-constants";

export default function App() {
  return (
    <FirewandProvider
      app="your-app-name"
      firebaseConfig={{
        apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain:
          Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket:
          Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId:
          Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId:
          Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      }}
    >
      <MainApp />
    </FirewandProvider>
  );
}
```

### Resolving Common Issues

#### Authentication Persistence

Firewand automatically handles authentication persistence in React Native using AsyncStorage. Ensure you have `@react-native-async-storage/async-storage` installed:

```bash
expo install @react-native-async-storage/async-storage
```

#### Metro Bundler Issues

If you encounter "Requiring unknown module 'undefined'" errors with Metro bundler, add this to your `metro.config.js`:

```javascript
module.exports = {
  resolver: {
    extraNodeModules: {
      "@react-native-async-storage/async-storage": require.resolve(
        "@react-native-async-storage/async-storage"
      ),
      "@firebase/auth/react-native": require.resolve(
        "@firebase/auth/react-native"
      ),
    },
  },
};
```

## FirewandProvider Component

Firewand includes a context provider component for accessing shared state:

```tsx
import { FirewandProvider, FirewandContext } from "firewand";

function MyApp() {
  return (
    <FirewandProvider app="your-app-name">
      <MainComponent />
    </FirewandProvider>
  );
}

function MainComponent() {
  const { user, userDetails, products, userSubscriptions, isSubscribed } =
    useContext(FirewandContext);

  // Use the context values
}
```

## Contributing

Contributions are welcome. Please refer to the contribution guidelines in the repository for further details.

## License

Licensed under the MIT License.
