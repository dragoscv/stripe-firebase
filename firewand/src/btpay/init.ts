/*
 * Copyright 2023 Dragos Catalin
 *
 * Licensed under the ISC License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/ISC
 */

import { FirebaseApp } from "firebase/app";

export enum BTPEnvironment {
    SANDBOX = 'sandbox',
    PRODUCTION = 'production'
}

export type BTPOptionsInterface = {
    apiKey: string;
    environment?: BTPEnvironment;
    customersCollection?: string;
    transactionsCollection?: string;
}

export type BTPErrorCode =
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

export class BTPPayments {
    private readonly app: FirebaseApp;
    private readonly apiKey: string;
    private readonly environment: BTPEnvironment;
    private readonly customersCollection: string;
    private readonly transactionsCollection: string;
    private daos: Map<string, unknown>;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    constructor(app: FirebaseApp, options: BTPOptionsInterface) {
        this.app = app;
        this.apiKey = options.apiKey;
        this.environment = options.environment || BTPEnvironment.SANDBOX;
        this.customersCollection = options.customersCollection || "customers";
        this.transactionsCollection = options.transactionsCollection || "transactions";
        this.daos = new Map();
    }

    getApp(): FirebaseApp {
        return this.app;
    }

    getCustomersCollection(): string {
        return this.customersCollection;
    }

    getTransactionsCollection(): string {
        return this.transactionsCollection;
    }

    setDAO<T>(key: string, dao: T): void {
        this.daos.set(key, dao);
    }

    getDAO<T>(key: string): T | undefined {
        return this.daos.get(key) as T | undefined;
    }

    async authenticate(): Promise<boolean> {
        try {
            // Actual authentication logic would be implemented here
            // For now, simulate successful authentication
            this.accessToken = "simulated-access-token";
            const now = new Date();
            this.tokenExpiry = new Date(now.getTime() + 3600 * 1000); // Token valid for 1 hour
            return true;
        } catch (error) {
            throw new BTPPaymentsError(
                "unauthenticated",
                "Failed to authenticate with BTPay API",
                error
            );
        }
    }

    isAuthenticated(): boolean {
        if (!this.accessToken || !this.tokenExpiry) {
            return false;
        }
        return new Date() < this.tokenExpiry;
    }

    getApiEndpoint(): string {
        return this.environment === BTPEnvironment.PRODUCTION
            ? "https://api.btrl.ro/btpay/sb/api/v1"
            : "https://api.btrl.ro/btpay/sb/api/v1/sandbox";
    }
}

export class BTPPaymentsError extends Error {
    public readonly code: BTPErrorCode;
    public readonly cause?: unknown;

    constructor(code: BTPErrorCode, message: string, cause?: unknown) {
        super(message);
        this.code = code;
        this.cause = cause;
        // Set the prototype explicitly to ensure instanceof works correctly
        Object.setPrototypeOf(this, BTPPaymentsError.prototype);
    }
}

const BTP_KEY = "btp-payments" as const;

// Cache BTPay payments client per app
const appToBTP = new Map<string, BTPPayments>();

/**
 * Get or initialize a BTPay payments client for the specified app.
 */
export function getBTPPayments(
    app: FirebaseApp,
    options: BTPOptionsInterface
): BTPPayments {
    const appId = app.options.appId;
    if (!appId) {
        throw new Error(
            "Cannot initialize BTPay with a FirebaseApp that has no appId."
        );
    }

    let payments = appToBTP.get(appId);
    if (payments) {
        return payments;
    }

    payments = new BTPPayments(app, options);
    appToBTP.set(appId, payments);
    return payments;
}