/*
 * Copyright 2023 Dragos Catalin
 *
 * Licensed under the ISC License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/ISC
 */

import { BTPPayments, BTPPaymentsError } from "./init";
import {
    createPayment,
    CreatePaymentParams,
    PaymentInitiationResponse,
    PaymentType,
    PaymentProduct,
    Currency
} from "./payment";

export interface SimplifiedPaymentConfig {
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

/**
 * Creates and redirects to a BTPay payment interface with simplified configuration.
 * 
 * @param payments - The BTPPayments instance
 * @param config - Simplified payment configuration
 * @returns Promise resolving to the payment response
 * @throws {BTPPaymentsError} If authentication fails or payment creation fails
 */
export async function initiateSimplePayment(
    payments: BTPPayments,
    config: SimplifiedPaymentConfig
): Promise<PaymentInitiationResponse> {
    try {
        if (!payments.isAuthenticated()) {
            await payments.authenticate();
        }

        // Validate required parameters
        if (config.paymentType === PaymentType.SINGLE) {
            validateForSinglePayment(config);
        } else {
            // For all other payment types, just require amount
            validateAmount(config.amount);
        }

        // Allow string or number for amount, but ensure it's converted to string
        const amountValue = typeof config.amount === "number"
            ? config.amount.toString()
            : config.amount;

        // Create payment configuration object
        const paymentConfig: CreatePaymentParams = {
            paymentService: config.paymentType || PaymentType.SINGLE,
            paymentProduct: PaymentProduct.RON,
            payment: {
                creditorAccount: config.creditorIBAN ? {
                    iban: config.creditorIBAN
                } : { iban: "" },
                creditorName: config.creditorName || "",
                instructedAmount: {
                    currency: config.currency || Currency.RON,
                    amount: amountValue
                },
                remittanceInformationUnstructured: config.description
            },
            metadata: config.metadata ?
                // Ensure metadata is properly typed as Record<string, string>
                Object.entries(config.metadata).reduce<Record<string, string>>((acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                }, {}) :
                undefined
        };

        // Create the payment
        try {
            const session = await createPayment(payments, paymentConfig);

            // In a browser environment, redirect to the payment URL if redirectUrl is not provided
            if (typeof window !== 'undefined' && session.aspspRedirectUrl && !config.redirectUrl) {
                window.location.assign(session.aspspRedirectUrl);
            }

            return session;
        } catch (error) {
            throw new BTPPaymentsError(
                "failed-precondition",
                `Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    } catch (error) {
        // Convert regular errors to BTPPaymentsError for consistency
        if (!(error instanceof BTPPaymentsError)) {
            throw new BTPPaymentsError(
                "invalid-argument",
                error instanceof Error ? error.message : 'Invalid payment configuration',
                error
            );
        }
        throw error;
    }
}

/**
 * Validates configuration for a single payment type
 * @param config The payment configuration to validate
 * @throws Error if validation fails
 */
function validateForSinglePayment(config: SimplifiedPaymentConfig): void {
    if (!config.creditorIBAN) {
        throw new Error("Creditor IBAN is required for single payments");
    }

    if (!config.creditorName) {
        throw new Error("Creditor name is required for single payments");
    }

    validateAmount(config.amount);
}

/**
 * Validates that an amount is present and valid
 * @param amount The amount to validate
 * @throws Error if validation fails
 */
function validateAmount(amount: string | number | undefined): void {
    if (amount === undefined || amount === null) {
        throw new Error("Amount is required");
    }

    if (typeof amount === "string" && (amount === "" || isNaN(parseFloat(amount)))) {
        throw new Error("Amount must be a valid number");
    }

    if (typeof amount === "number" && (isNaN(amount) || amount <= 0)) {
        throw new Error("Amount must be a positive number");
    }
}

/**
 * Utility function to check if a string argument is non-empty.
 * 
 * @param arg - The argument to check
 * @param message - Custom error message if validation fails
 * @throws Error if validation fails
 */
export function checkNonEmptyString(arg: unknown, message?: string): void {
    if (typeof arg !== "string" || arg === "") {
        throw new Error(message ?? "Argument must be a non-empty string");
    }
}

/**
 * Utility function to check if a number argument is positive.
 * 
 * @param arg - The argument to check
 * @param message - Custom error message if validation fails
 * @throws Error if validation fails
 */
export function checkPositiveNumber(arg: unknown, message?: string): void {
    if (typeof arg !== "number" || isNaN(arg) || arg <= 0) {
        throw new Error(message ?? "Argument must be a positive number");
    }
}

/**
 * Utility function to check if an array argument is non-empty.
 * 
 * @param arg - The argument to check
 * @param message - Custom error message if validation fails
 * @throws Error if validation fails
 */
export function checkNonEmptyArray(arg: unknown, message?: string): void {
    if (!Array.isArray(arg) || arg.length === 0) {
        throw new Error(message ?? "Argument must be a non-empty array");
    }
}

/**
 * Format an amount with currency symbol
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param locale - Locale for formatting
 * @returns Formatted amount string
 */
export function formatAmount(
    amount: string | number,
    currency: Currency = Currency.RON,
    locale: string = 'en-US'
): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toString()
    }).format(numericAmount);
}

/**
 * Generate a transaction reference ID
 * 
 * @returns A unique reference ID string
 */
export function generateTransactionReference(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `TR${timestamp}${randomStr}`.toUpperCase();
}

/**
 * Format a date string from ISO to localized format
 * 
 * @param isoDateString - ISO format date string
 * @param locale - Locale for formatting
 * @returns Formatted date string
 */
export function formatDateString(
    isoDateString: string,
    locale: string = 'en-US'
): string {
    const date = new Date(isoDateString);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}