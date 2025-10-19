/*
 * Copyright 2023 Dragos Catalin
 *
 * Licensed under the ISC License;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/ISC
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { BTPPayments, getBTPPayments, BTPEnvironment, BTPOptionsInterface } from './init';
import {
    createPayment,
    getCurrentUserPayment,
    getCurrentUserPayments,
    onCurrentUserPaymentUpdate,
    updatePaymentStatus,
    PaymentInitiationResponse,
    PaymentSnapshot,
    CreatePaymentParams,
    TransactionStatus
} from './payment';
import { initiateSimplePayment, SimplifiedPaymentConfig } from './utils';

// Context props interface
export interface BTPContextProps {
    isInitialized: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
    payments: BTPPayments | null;
    transactions: PaymentInitiationResponse[];
    createPayment: (params: CreatePaymentParams) => Promise<PaymentInitiationResponse>;
    initiateSimplePayment: (config: SimplifiedPaymentConfig) => Promise<PaymentInitiationResponse>;
    getCurrentUserPayment: (paymentId: string) => Promise<PaymentInitiationResponse>;
    getCurrentUserPayments: () => Promise<PaymentInitiationResponse[]>;
    updatePaymentStatus: (paymentId: string, status: TransactionStatus) => Promise<void>;
}

// Provider props interface
export interface BTPProviderProps {
    children: ReactNode;
    app: FirebaseApp;
    apiKey: string;
    environment?: BTPEnvironment;
}

// Create the context
const BTPContext = createContext<BTPContextProps | undefined>(undefined);

// Provider component
export function BTPProvider({ children, app, apiKey, environment }: BTPProviderProps) {
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [payments, setPayments] = useState<BTPPayments | null>(null);
    const [transactions, setTransactions] = useState<PaymentInitiationResponse[]>([]);

    // Initialize BTPay payments on mount
    useEffect(() => {
        try {
            const options: BTPOptionsInterface = {
                apiKey,
                environment: environment || BTPEnvironment.SANDBOX
            };

            const btpPayments = getBTPPayments(app, options);
            setPayments(btpPayments);
            setIsInitialized(true);

            // Authenticate
            setIsLoading(true);
            btpPayments.authenticate()
                .then(() => {
                    setIsAuthenticated(true);
                    setIsLoading(false);
                })
                .catch(err => {
                    setError(err);
                    setIsLoading(false);
                });
        } catch (err) {
            setError(err as Error);
            setIsInitialized(false);
        }
    }, [app, apiKey, environment]);

    // Listen for payment updates
    useEffect(() => {
        if (!payments || !isAuthenticated) return;

        const unsubscribe = onCurrentUserPaymentUpdate(
            payments,
            (snapshot: PaymentSnapshot) => {
                setTransactions(snapshot.payments);
            },
            (error) => {
                setError(error);
            }
        );

        return () => unsubscribe();
    }, [payments, isAuthenticated]);

    // Create payment handler
    const handleCreatePayment = useCallback(async (params: CreatePaymentParams) => {
        if (!payments) throw new Error('BTPay not initialized');
        setIsLoading(true);
        try {
            const response = await createPayment(payments, params);
            setIsLoading(false);
            return response;
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            throw err;
        }
    }, [payments]);

    // Initiate simple payment handler
    const handleInitiateSimplePayment = useCallback(async (config: SimplifiedPaymentConfig) => {
        if (!payments) throw new Error('BTPay not initialized');
        setIsLoading(true);
        try {
            const response = await initiateSimplePayment(payments, config);
            setIsLoading(false);
            return response;
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            throw err;
        }
    }, [payments]);

    // Get payment handler
    const handleGetCurrentUserPayment = useCallback(async (paymentId: string) => {
        if (!payments) throw new Error('BTPay not initialized');
        setIsLoading(true);
        try {
            const response = await getCurrentUserPayment(payments, paymentId);
            setIsLoading(false);
            return response;
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            throw err;
        }
    }, [payments]);

    // Get all payments handler
    const handleGetCurrentUserPayments = useCallback(async () => {
        if (!payments) throw new Error('BTPay not initialized');
        setIsLoading(true);
        try {
            const response = await getCurrentUserPayments(payments);
            setIsLoading(false);
            return response;
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            throw err;
        }
    }, [payments]);

    // Update payment status handler
    const handleUpdatePaymentStatus = useCallback(async (paymentId: string, status: TransactionStatus) => {
        if (!payments) throw new Error('BTPay not initialized');
        setIsLoading(true);
        try {
            await updatePaymentStatus(payments, paymentId, status);
            setIsLoading(false);
        } catch (err) {
            setError(err as Error);
            setIsLoading(false);
            throw err;
        }
    }, [payments]);

    // Context value
    const contextValue: BTPContextProps = {
        isInitialized,
        isAuthenticated,
        isLoading,
        error,
        payments,
        transactions,
        createPayment: handleCreatePayment,
        initiateSimplePayment: handleInitiateSimplePayment,
        getCurrentUserPayment: handleGetCurrentUserPayment,
        getCurrentUserPayments: handleGetCurrentUserPayments,
        updatePaymentStatus: handleUpdatePaymentStatus
    };

    return (
        <BTPContext.Provider value={contextValue}>
            {children}
        </BTPContext.Provider>
    );
}

// Hook for using the BTPay context
export function useBTP(): BTPContextProps {
    const context = useContext(BTPContext);
    if (context === undefined) {
        throw new Error('useBTP must be used within a BTPProvider');
    }
    return context;
}