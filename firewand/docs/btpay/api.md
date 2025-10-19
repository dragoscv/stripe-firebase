# BTPay API Reference

This document describes the key components and usage of the BTPay integration for Firewand.

## Table of Contents

- [Core Client](#core-client)
- [Data Types](#data-types)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)
- [React Integration](#react-integration)

## Core Client

### BTPPayments

The main client for interacting with the BTPay API through Firebase.

#### Constructor

```typescript
constructor(app: FirebaseApp, options: BTPOptionsInterface)
```

Creates a new BTPPayments client instance.

**Parameters**:

- `app`: Firebase app instance
- `options`: Configuration options for the BTPay client
  - `apiKey`: Your API key for authentication
  - `environment`: Either BTPEnvironment.SANDBOX or BTPEnvironment.PRODUCTION
  - `customersCollection` (optional): Name of the Firestore collection for customer data
  - `transactionsCollection` (optional): Name of the Firestore collection for transaction data

**Example**:

```typescript
import { getBTPPayments, BTPEnvironment, firebaseApp } from "firewand";

const btpayClient = getBTPPayments(firebaseApp, {
  apiKey: "YOUR_API_KEY",
  environment: BTPEnvironment.SANDBOX,
});
```

#### Methods

##### authenticate

```typescript
async authenticate(): Promise<boolean>
```

Authenticates with the BTPay API.

**Returns**: A Promise resolving to a boolean indicating authentication success.

**Example**:

```typescript
const isAuthenticated = await btpayClient.authenticate();
```

##### isAuthenticated

```typescript
isAuthenticated(): boolean
```

Checks if the client is authenticated.

**Returns**: A boolean indicating whether the client is authenticated.

**Example**:

```typescript
if (btpayClient.isAuthenticated()) {
  // Client is authenticated
}
```

##### getApiEndpoint

```typescript
getApiEndpoint(): string
```

Gets the API endpoint URL based on the environment.

**Returns**: The API endpoint URL.

**Example**:

```typescript
const apiUrl = btpayClient.getApiEndpoint();
```

## Utility Functions

The BTPay integration provides several utility functions to simplify common tasks.

### initiateSimplePayment

```typescript
async initiateSimplePayment(
  payments: BTPPayments,
  config: SimplifiedPaymentConfig
): Promise<PaymentInitiationResponse>
```

Creates and redirects to a BTPay payment interface with simplified configuration.

**Parameters**:

- `payments`: The BTPPayments instance
- `config`: Simplified payment configuration
  - `amount`: Payment amount (required)
  - `currency`: Payment currency (default: Currency.RON)
  - `paymentType`: Type of payment (default: PaymentType.CARD)
  - `creditorIBAN`: Creditor's IBAN (required for SINGLE payments)
  - `creditorName`: Creditor's name (required for SINGLE payments)
  - `description`: Payment description
  - `redirectUrl`: URL to redirect after payment
  - `cancelUrl`: URL to redirect if payment is cancelled
  - `metadata`: Additional metadata for the payment

**Returns**: Promise resolving to the payment initiation response.

**Example**:

```typescript
import {
  initiateSimplePayment,
  getBTPPayments,
  Currency,
  PaymentType,
  firebaseApp,
} from "firewand";

const btpayClient = getBTPPayments(firebaseApp, {
  apiKey: "YOUR_API_KEY",
});

const makePayment = async () => {
  const paymentResponse = await initiateSimplePayment(btpayClient, {
    amount: 100,
    currency: Currency.RON,
    paymentType: PaymentType.CARD,
    description: "Test payment",
    redirectUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
  });

  // Payment URL is automatically redirected to in browser environments
  console.log(paymentResponse.paymentUrl);
};
```

### formatAmount

```typescript
formatAmount(
  amount: string | number,
  currency: Currency = Currency.RON,
  locale: string = 'en-US'
): string
```

Formats an amount with currency symbol.

**Parameters**:

- `amount`: Amount to format
- `currency`: Currency enum value
- `locale`: Locale string for formatting

**Returns**: Formatted amount string.

**Example**:

```typescript
import { formatAmount, Currency } from "firewand";

const formattedAmount = formatAmount(100.5, Currency.RON);
// Returns: "100.50 RON" (format depends on locale)
```

### generateTransactionReference

```typescript
generateTransactionReference(): string
```

Generates a unique transaction reference ID.

**Returns**: A unique reference ID string.

**Example**:

```typescript
import { generateTransactionReference } from "firewand";

const reference = generateTransactionReference();
// Returns something like: "TR1XBCDE2FGHIJ"
```

### formatDateString

```typescript
formatDateString(
  isoDateString: string,
  locale: string = 'en-US'
): string
```

Formats a date string from ISO to localized format.

**Parameters**:

- `isoDateString`: ISO format date string
- `locale`: Locale for formatting

**Returns**: Formatted date string.

**Example**:

```typescript
import { formatDateString } from "firewand";

const formattedDate = formatDateString("2025-03-23T15:30:00Z");
// Returns: "March 23, 2025, 3:30 PM" (format depends on locale)
```

## Data Types

### Enums

#### BTPEnvironment

```typescript
enum BTPEnvironment {
  SANDBOX = "sandbox",
  PRODUCTION = "production",
}
```

Environment settings for BTPay API.

#### PaymentType

```typescript
enum PaymentType {
  SINGLE = "payments",
  PERIODIC = "periodic-payments",
  BULK = "bulk-payments",
  CARD = "card-payments",
}
```

Types of payments supported by BTPay.

#### PaymentProduct

```typescript
enum PaymentProduct {
  RON = "ron-payment",
  OTHER_CURRENCY = "other-currency-payment",
}
```

Payment product types.

#### Currency

```typescript
enum Currency {
  RON = "RON",
  EUR = "EUR",
  USD = "USD",
  GBP = "GBP",
}
```

Supported currencies.

#### TransactionStatus

```typescript
enum TransactionStatus {
  RCVD = "RCVD", // Received
  ACTC = "ACTC", // AcceptedTechnicalValidation
  ACCP = "ACCP", // AcceptedCustomerProfile
  ACWC = "ACWC", // AcceptedWithChange
  ACFC = "ACFC", // AcceptedFundsChecked
  ACSC = "ACSC", // AcceptedSettlementCompleted
  RJCT = "RJCT", // Rejected
  PDNG = "PDNG", // Pending
  CANC = "CANC", // Cancelled
}
```

Payment transaction statuses.

### Interfaces

#### BTPOptionsInterface

```typescript
interface BTPOptionsInterface {
  apiKey: string;
  environment?: BTPEnvironment;
  customersCollection?: string;
  transactionsCollection?: string;
}
```

Options for initializing BTPPayments.

#### SimplifiedPaymentConfig

```typescript
interface SimplifiedPaymentConfig {
  creditorIBAN?: string;
  creditorName?: string;
  amount: string | number;
  currency?: Currency;
  paymentType?: PaymentType;
  description?: string;
  redirectUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}
```

Configuration for simplified payment initiation.

#### CreatePaymentParams

```typescript
interface CreatePaymentParams {
  paymentService: PaymentType;
  paymentProduct: PaymentProduct;
  payment: {
    creditorAccount?: {
      iban: string;
    };
    creditorName?: string;
    instructedAmount: {
      currency: Currency;
      amount: string;
    };
    remittanceInformationUnstructured?: string;
  };
  redirectUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}
```

Parameters for creating a payment.

#### PaymentInitiationResponse

```typescript
interface PaymentInitiationResponse {
  paymentId: string;
  transactionStatus: TransactionStatus;
  paymentUrl?: string;
  aspspRedirectUrl?: string;
  psuMessage?: string;
}
```

Response from payment initiation.

## Error Handling

### BTPPaymentsError

```typescript
class BTPPaymentsError extends Error {
  public readonly code: BTPErrorCode;
  public readonly cause?: unknown;
}
```

Custom error class for BTPay-related errors.

**Properties**:

- `code`: Error code from BTPErrorCode
- `message`: Error message
- `cause`: Original error that caused this error

**Example**:

```typescript
import { BTPPaymentsError } from "firewand";

try {
  await btpayClient.authenticate();
} catch (error) {
  if (error instanceof BTPPaymentsError) {
    console.error(`BTPay Error (${error.code}): ${error.message}`);
    // Handle specific errors based on code
    if (error.code === "unauthenticated") {
      // Handle authentication errors
    }
  }
}
```

### BTPErrorCode

```typescript
type BTPErrorCode =
  | "cancelled"
  | "unknown"
  | "invalid-argument"
  | "deadline-exceeded"
  | "not-found"
  | "already-exists"
  | "permission-denied"
  | "resource-exhausted"
  | "failed-precondition"
  | "aborted"
  | "out-of-range"
  | "unimplemented"
  | "internal"
  | "unavailable"
  | "data-loss"
  | "unauthenticated";
```

Error codes for BTPay operations.

## React Integration

The BTPay integration includes React components and hooks for easier integration.

### BTPProvider

```typescript
<BTPProvider
  firebaseApp={firebaseApp}
  apiKey="YOUR_API_KEY"
  environment={BTPEnvironment.SANDBOX}
>
  {children}
</BTPProvider>
```

Provider component that initializes BTPay and makes it available to child components.

**Props**:

- `firebaseApp`: Firebase app instance
- `apiKey`: BTPay API key
- `environment`: BTPay environment
- `customersCollection` (optional): Name of the customers collection
- `transactionsCollection` (optional): Name of the transactions collection
- `children`: Child components

**Example**:

```tsx
import { BTPProvider, BTPEnvironment, firebaseApp } from "firewand";

function App() {
  return (
    <BTPProvider
      firebaseApp={firebaseApp}
      apiKey="YOUR_API_KEY"
      environment={BTPEnvironment.SANDBOX}
    >
      <YourApp />
    </BTPProvider>
  );
}
```

### useBTP

```typescript
const useBTP = () => {
  // Returns BTPay context
};
```

Hook for accessing BTPay functions and data from the BTPProvider.

**Returns**:

- `btpayClient`: BTPPayments instance
- `isInitialized`: Whether BTPay is initialized
- `isAuthenticated`: Whether BTPay is authenticated
- `authenticate`: Function to authenticate
- `createPayment`: Function to create a payment
- `getCurrentPayment`: Function to get current payment
- `getCurrentPayments`: Function to get all payments
- `onPaymentUpdate`: Function to listen for payment updates

**Example**:

```tsx
import { useBTP } from "firewand";

function PaymentComponent() {
  const { btpayClient, isAuthenticated, createPayment } = useBTP();

  const handlePayment = async () => {
    if (!isAuthenticated) {
      await btpayClient.authenticate();
    }

    await createPayment({
      // Payment details
    });
  };

  return <button onClick={handlePayment}>Make Payment</button>;
}
```
