/*
 * Copyright 2023 Dragos Catalin
 *
 * Licensed under the ISC License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/ISC
 */

// Export from init.ts
export {
    BTPPayments,
    BTPPaymentsError,
    getBTPPayments,
    BTPEnvironment
} from "./init";
export type {
    BTPErrorCode,
    BTPOptionsInterface
} from "./init";

// Export from payment.ts
export {
    createPayment,
    getCurrentUserPayment,
    getCurrentUserPayments,
    onCurrentUserPaymentUpdate,
    updatePaymentStatus,
    PaymentType,
    PaymentProduct,
    Currency,
    TransactionStatus
} from "./payment";
export type {
    Account,
    Amount,
    Address,
    BTPaymentInitiationRon,
    BTPaymentInitiationVal,
    BTPaymentInitiation,
    CreatePaymentParams,
    PaymentInitiationResponse,
    PaymentStatusResponse,
    GetPaymentsOptions,
    PaymentChangeType,
    PaymentChange,
    PaymentSnapshot
} from "./payment";

// Export from utils.ts
export {
    initiateSimplePayment,
    checkNonEmptyString,
    checkPositiveNumber,
    checkNonEmptyArray,
    formatAmount,
    generateTransactionReference,
    formatDateString
} from "./utils";
export type {
    SimplifiedPaymentConfig
} from "./utils";

// Export from provider.tsx
export {
    BTPProvider,
    useBTP
} from "./provider";
export type {
    BTPContextProps,
    BTPProviderProps
} from "./provider";