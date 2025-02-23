# Stripe-Firebase

A library for integrating [Stripe](https://stripe.com) with [Firebase](https://firebase.google.com), now enhanced to support trial days. This tool simplifies the process of creating payment flows, managing subscriptions, and handling trial periods, all while leveraging Firebase services.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Configuration](#configuration)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Installation

Ensure you have [Node.js](https://nodejs.org) installed, then run:

```bash
npm install stripe-firebase
```

## Usage

After installing the package, import and initialize the library in your project.

For subscription management functions:

```javascript
const stripeFirebase = require("stripe-firebase");

// Initialize Firebase and Stripe keys before using the functions
// ...existing code for Firebase initialization...

// Example: Creating a subscription with trial days
stripeFirebase
  .createSubscription({
    customerId: "<FIREBASE_USER_ID>",
    planId: "<STRIPE_PLAN_ID>",
    trialDays: 14,
  })
  .then((subscription) => {
    console.log("Subscription created:", subscription);
  })
  .catch((error) => {
    console.error("Error creating subscription:", error);
  });
```

For checkout session creation, you can integrate it as follows:

```typescript
import { FirebaseApp } from "firebase/app";
import {
  getStripePayments,
  StripePayments,
  createCheckoutSession,
  SessionCreateParams,
  SessionConfig,
} from "stripe-firebase";

// Get StripePayments instance with your Firebase app configuration
export const stripePayments = (firebaseApp: FirebaseApp): StripePayments =>
  getStripePayments(firebaseApp, {
    productsCollection: "products",
    customersCollection: "/customers",
  });

// Example: Creating and redirecting to a new checkout session
export const newCheckoutSession = async (sessionConfig: SessionConfig) => {
  const {
    firebaseApp,
    priceId,
    promoCode,
    metadata,
    trial_period_days,
    payment_mode,
  } = sessionConfig;
  const payments = stripePayments(firebaseApp);
  const paymentConfig: SessionCreateParams = {
    price: priceId,
    allow_promotion_codes: true,
    success_url: `${window.location.href}?paymentStatus=success&currency=${sessionConfig.currency}&priceValue=${sessionConfig.priceValue}&subscriptionName=${sessionConfig.subscriptionName}&priceId=${priceId}`,
    cancel_url: `${window.location.href}?paymentStatus=cancel`,
  };

  if (payment_mode) {
    paymentConfig["mode"] = payment_mode;
    paymentConfig["invoice_creation"] = true;
  }
  if (trial_period_days) {
    paymentConfig["trial_period_days"] = trial_period_days;
  }
  if (promoCode) {
    paymentConfig["promotion_code"] = promoCode;
  }
  if (metadata) {
    paymentConfig["metadata"] = metadata as {
      [key: string]: string | number | boolean;
    };
  }

  const session = await createCheckoutSession(payments, paymentConfig);
  window.location.assign(session.url);
};

// Usage in a project file:
// ...existing code...
```

## Features

- **Stripe Integration:** Easily process payments and manage subscriptions.
- **Firebase Connection:** Leverage Firebase for user authentication and database operations.
- **Trial Days Support:** Offer free trial periods before commencing billing.
- **Checkout Sessions:** Seamlessly create checkout sessions with flexible payment configurations.
- **Simple API:** Clean and straightforward methods to handle payment and subscription workflows.

## Configuration

Before using the library, ensure you properly configure:

- **Firebase:** Initialize your Firebase project and set up authentication.
- **Stripe:** Obtain your secret API key by logging into your Stripe dashboard.
- **Environment Variables:** Use environment variables or a configuration file to store your keys securely.

Example `.env` file:

```
FIREBASE_CONFIG=your_firebase_config_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

## Examples

For complete integration examples, check out the [examples folder](#) in the repository.

```javascript
// Example: Using the subscription functions
const stripeFirebase = require("stripe-firebase");

async function subscribeUser() {
  try {
    const subscription = await stripeFirebase.createSubscription({
      customerId: "firebaseUserId",
      planId: "stripePlanId",
      trialDays: 14,
    });
    console.log("Subscription created successfully:", subscription);
  } catch (error) {
    console.error("Subscription creation failed:", error);
  }
}

subscribeUser();
```

```typescript
// Example: Using the checkout session functions in a TypeScript project
import { FirebaseApp } from "firebase/app";
import { getStripePayments, createCheckoutSession } from "stripe-firebase";

const firebaseApp: FirebaseApp = /* your firebase app initialization */;
const payments = getStripePayments(firebaseApp, {
  productsCollection: "products",
  customersCollection: "/customers"
});
const paymentConfig = {
  price: "priceId_here",
  allow_promotion_codes: true,
  success_url: "https://yourapp.com/success",
  cancel_url: "https://yourapp.com/cancel",
  trial_period_days: 7 // optional
};

createCheckoutSession(payments, paymentConfig)
  .then(session => {
    window.location.assign(session.url);
  })
  .catch(error => console.error("Checkout session error:", error));
```

## API Reference

### createSubscription

Creates a new subscription with an optional trial period.

```javascript
// Example usage for createSubscription
stripeFirebase
  .createSubscription({
    customerId: "firebaseUserId",
    planId: "stripePlanId",
    trialDays: 14,
  })
  .then((subscription) => {
    console.log("Created:", subscription);
  })
  .catch((error) => console.error("Error:", error));
```

### cancelSubscription

Cancels an existing subscription.

```javascript
// Example usage for cancelSubscription
stripeFirebase
  .cancelSubscription({
    subscriptionId: "sub_12345",
  })
  .then((response) => {
    console.log("Cancelled subscription:", response);
  })
  .catch((error) => console.error("Error:", error));
```

### updateSubscription

Updates a subscription's plan.

```javascript
// Example usage for updateSubscription
stripeFirebase
  .updateSubscription({
    subscriptionId: "sub_12345",
    newPlanId: "newStripePlanId",
  })
  .then((updated) => {
    console.log("Updated subscription:", updated);
  })
  .catch((error) => console.error("Error:", error));
```

### getSubscription

Retrieves details of a subscription.

```javascript
// Example usage for getSubscription
stripeFirebase
  .getSubscription("sub_12345")
  .then((subscription) => {
    console.log("Subscription details:", subscription);
  })
  .catch((error) => console.error("Error:", error));
```

### getStripePayments

Initializes a Stripe payments instance using a Firebase app and configuration.

```typescript
// Example usage for getStripePayments
import { FirebaseApp } from "firebase/app";
import { getStripePayments } from "stripe-firebase";

const firebaseApp: FirebaseApp = /* your firebase initialization */;
const payments = getStripePayments(firebaseApp, {
  productsCollection: "products",
  customersCollection: "/customers"
});
console.log("StripePayments instance:", payments);
```

### createCheckoutSession

Creates a checkout session based on the provided payment configuration.

```typescript
// Example usage for createCheckoutSession
import { getStripePayments, createCheckoutSession } from "stripe-firebase";

const payments = getStripePayments(firebaseApp, {
  productsCollection: "products",
  customersCollection: "/customers",
});
const paymentConfig = {
  price: "priceId_here",
  allow_promotion_codes: true,
  success_url: "https://yourapp.com/success",
  cancel_url: "https://yourapp.com/cancel",
  trial_period_days: 7, // optional
};

createCheckoutSession(payments, paymentConfig)
  .then((session) => {
    console.log("Checkout session URL:", session.url);
  })
  .catch((error) => console.error("Error creating checkout session:", error));
```

## Contributing

Contributions are welcome! Feel free to open issues or pull requests.

1. Fork the repository.
2. Create your feature branch.
3. Make your changes.
4. Submit a pull request.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
