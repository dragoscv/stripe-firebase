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
import {
    collection,
    CollectionReference,
    doc,
    DocumentChange,
    DocumentData,
    DocumentReference,
    DocumentSnapshot,
    Firestore,
    FirestoreDataConverter,
    FirestoreError,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    query,
    Query,
    QueryDocumentSnapshot,
    QuerySnapshot,
    where,
    addDoc,
    updateDoc,
    Timestamp
} from "firebase/firestore";
import { BTPPayments, BTPPaymentsError } from "./init";
import { getCurrentUser } from "../btpay/user";

export enum PaymentType {
    SINGLE = 'payments',
    PERIODIC = 'periodic-payments',
    BULK = 'bulk-payments',
}

export enum PaymentProduct {
    RON = 'ron-payment',
    OTHER_CURRENCY = 'other-currency-payment',
}

export enum Currency {
    RON = 'RON',
    EUR = 'EUR',
    USD = 'USD',
    GBP = 'GBP',
}

export enum TransactionStatus {
    RCVD = 'RCVD', // Received
    ACTC = 'ACTC', // AcceptedTechnicalValidation
    ACCP = 'ACCP', // AcceptedCustomerProfile
    ACWC = 'ACWC', // AcceptedWithChange
    ACFC = 'ACFC', // AcceptedFundsChecked
    ACSC = 'ACSC', // AcceptedSettlementCompleted
    RJCT = 'RJCT', // Rejected
    PDNG = 'PDNG', // Pending
    CANC = 'CANC', // Cancelled
}

export interface Account {
    iban: string;
}

export interface Amount {
    currency: Currency;
    amount: string;
}

export interface Address {
    country: string;
    city?: string;
    street?: string;
    buildingNumber?: string;
}

export interface BTPaymentInitiationRon {
    debtorAccount?: Account;
    instructedAmount: Amount;
    creditorAccount: Account;
    creditorName: string;
    debtorId?: string;
    endToEndIdentification?: string;
    remittanceInformationUnstructured?: string;
}

export interface BTPaymentInitiationVal {
    debtorAccount?: Account;
    instructedAmount: Amount;
    creditorAccount: Account;
    creditorAgent: string; // BIC/SWIFT
    creditorAgentName: string; // Creditor Bank Name
    creditorName: string;
    creditorAddress: Address;
    endToEndIdentification?: string;
    remittanceInformationUnstructured?: string;
}

export type BTPaymentInitiation = BTPaymentInitiationRon | BTPaymentInitiationVal;

export interface CreatePaymentParams {
    paymentService: PaymentType;
    paymentProduct: PaymentProduct;
    payment: BTPaymentInitiation;
    requestId?: string;
    psuIpAddress?: string;
    psuGeoLocation?: string;
    metadata?: Record<string, string | number | boolean>;
}

export interface PaymentInitiationResponse {
    paymentId: string;
    status: TransactionStatus;
    aspspRedirectUrl: string;
    scaStatus?: string;
    authorisationId?: string;
    psuMessage?: string;
    _links?: Record<string, { href: string }>;
    created: string;
    uid?: string;
    metadata?: Record<string, string | number | boolean>;
}

export interface PaymentStatusResponse {
    paymentId: string;
    status: TransactionStatus;
    fundsAvailable?: boolean;
    statusReason?: string;
    psuMessage?: string;
    _links?: Record<string, { href: string }>;
    updated: string;
    uid?: string;
}

export interface GetPaymentsOptions {
    status?: TransactionStatus[];
}

export type PaymentChangeType = "added" | "modified" | "removed";

export interface PaymentChange {
    type: PaymentChangeType;
    payment: PaymentInitiationResponse;
}

export interface PaymentSnapshot {
    payments: PaymentInitiationResponse[];
    changes: PaymentChange[];
    size: number;
    empty: boolean;
}

// DAO (Data Access Object) interface for payments
export interface PaymentDAO {
    createPayment(
        uid: string,
        params: CreatePaymentParams
    ): Promise<PaymentInitiationResponse>;

    getPayment(
        uid: string,
        paymentId: string
    ): Promise<PaymentInitiationResponse>;

    getPayments(
        uid: string,
        options?: GetPaymentsOptions
    ): Promise<PaymentInitiationResponse[]>;

    updatePaymentStatus(
        uid: string,
        paymentId: string,
        status: TransactionStatus
    ): Promise<PaymentStatusResponse>;

    onPaymentUpdate(
        uid: string,
        onUpdate: (snapshot: PaymentSnapshot) => void,
        onError?: (error: BTPPaymentsError) => void
    ): () => void;
}

// Firestore converter for BTPay payments
const PAYMENT_CONVERTER: FirestoreDataConverter<PaymentInitiationResponse> = {
    toFirestore(payment: PaymentInitiationResponse): DocumentData {
        return payment;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): PaymentInitiationResponse {
        const data = snapshot.data();
        return {
            paymentId: snapshot.id,
            status: data.status,
            aspspRedirectUrl: data.aspspRedirectUrl,
            scaStatus: data.scaStatus,
            authorisationId: data.authorisationId,
            psuMessage: data.psuMessage,
            _links: data._links,
            created: data.created || new Date().toISOString(),
            uid: snapshot.ref.parent.parent!.id,
            metadata: data.metadata || {},
        };
    }
};

const TRANSACTIONS_COLLECTION = "transactions" as const;

// Implementation of PaymentDAO for Firestore
class FirestorePaymentDAO implements PaymentDAO {
    private readonly firestore: Firestore;

    constructor(app: FirebaseApp, private readonly customersCollection: string) {
        this.firestore = getFirestore(app);
    }

    public async createPayment(
        uid: string,
        params: CreatePaymentParams
    ): Promise<PaymentInitiationResponse> {
        try {
            // In a real implementation, this would call the BTPay API
            // For now, we'll create a simulated response and store it in Firestore

            const paymentId = `payment_${Math.random().toString(36).substring(2, 15)}`;
            const now = new Date().toISOString();

            const payment: PaymentInitiationResponse = {
                paymentId,
                status: TransactionStatus.RCVD,
                aspspRedirectUrl: `https://sandbox.btpay.example.com/redirect/${paymentId}`,
                created: now,
                uid,
                metadata: params.metadata || {},
            };

            // Save to Firestore
            const transactionRef = collection(
                this.firestore,
                this.customersCollection,
                uid,
                TRANSACTIONS_COLLECTION
            );

            await addDoc(transactionRef, payment);

            return payment;
        } catch (error) {
            throw new BTPPaymentsError(
                "internal",
                "Error creating payment",
                error
            );
        }
    }

    public async getPayment(
        uid: string,
        paymentId: string
    ): Promise<PaymentInitiationResponse> {
        try {
            const paymentQuery = query(
                collection(this.firestore, this.customersCollection, uid, TRANSACTIONS_COLLECTION),
                where("paymentId", "==", paymentId)
            );

            const snapshot = await getDocs(paymentQuery);

            if (snapshot.empty) {
                throw new BTPPaymentsError(
                    "not-found",
                    `No payment found with ID: ${paymentId} for user: ${uid}`
                );
            }

            return snapshot.docs[0].data() as PaymentInitiationResponse;
        } catch (error) {
            if (error instanceof BTPPaymentsError) {
                throw error;
            }
            throw new BTPPaymentsError(
                "internal",
                "Error retrieving payment",
                error
            );
        }
    }

    public async getPayments(
        uid: string,
        options?: GetPaymentsOptions
    ): Promise<PaymentInitiationResponse[]> {
        try {
            let paymentsQuery: Query = collection(
                this.firestore,
                this.customersCollection,
                uid,
                TRANSACTIONS_COLLECTION
            );

            if (options?.status && options.status.length > 0) {
                paymentsQuery = query(
                    paymentsQuery,
                    where("status", "in", options.status)
                );
            }

            const snapshot = await getDocs(paymentsQuery);
            return snapshot.docs.map(doc => doc.data() as PaymentInitiationResponse);
        } catch (error) {
            throw new BTPPaymentsError(
                "internal",
                "Error retrieving payments",
                error
            );
        }
    }

    public async updatePaymentStatus(
        uid: string,
        paymentId: string,
        status: TransactionStatus
    ): Promise<PaymentStatusResponse> {
        try {
            // Find the payment document
            const paymentQuery = query(
                collection(this.firestore, this.customersCollection, uid, TRANSACTIONS_COLLECTION),
                where("paymentId", "==", paymentId)
            );

            const snapshot = await getDocs(paymentQuery);

            if (snapshot.empty) {
                throw new BTPPaymentsError(
                    "not-found",
                    `No payment found with ID: ${paymentId} for user: ${uid}`
                );
            }

            const paymentDoc = snapshot.docs[0];
            const payment = paymentDoc.data() as PaymentInitiationResponse;

            // Update the status
            const now = new Date().toISOString();
            await updateDoc(paymentDoc.ref, {
                status,
                updated: now,
            });

            // Return status response
            return {
                paymentId,
                status,
                updated: now,
                uid,
            };
        } catch (error) {
            if (error instanceof BTPPaymentsError) {
                throw error;
            }
            throw new BTPPaymentsError(
                "internal",
                "Error updating payment status",
                error
            );
        }
    }

    public onPaymentUpdate(
        uid: string,
        onUpdate: (snapshot: PaymentSnapshot) => void,
        onError?: (error: BTPPaymentsError) => void
    ): () => void {
        const paymentsRef = collection(
            this.firestore,
            this.customersCollection,
            uid,
            TRANSACTIONS_COLLECTION
        );

        return onSnapshot(
            paymentsRef,
            (querySnap: QuerySnapshot) => {
                const snapshot: PaymentSnapshot = {
                    payments: [],
                    changes: [],
                    size: querySnap.size,
                    empty: querySnap.empty,
                };

                querySnap.forEach((doc) => {
                    snapshot.payments.push(doc.data() as PaymentInitiationResponse);
                });

                querySnap.docChanges().forEach((change) => {
                    snapshot.changes.push({
                        type: change.type as PaymentChangeType,
                        payment: change.doc.data() as PaymentInitiationResponse,
                    });
                });

                onUpdate(snapshot);
            },
            (error: FirestoreError) => {
                if (onError) {
                    onError(
                        new BTPPaymentsError(
                            "internal",
                            "Error listening to payment updates",
                            error
                        )
                    );
                }
            }
        );
    }
}

const PAYMENT_DAO_KEY = "payment-dao" as const;

// Helper to get or initialize a PaymentDAO
function getOrInitPaymentDAO(payments: BTPPayments): PaymentDAO {
    let dao = payments.getDAO<PaymentDAO>(PAYMENT_DAO_KEY);
    if (!dao) {
        dao = new FirestorePaymentDAO(
            payments.getApp(),
            payments.getCustomersCollection()
        );
        payments.setDAO(PAYMENT_DAO_KEY, dao);
    }
    return dao;
}

// User-facing API
export async function createPayment(
    payments: BTPPayments,
    params: CreatePaymentParams
): Promise<PaymentInitiationResponse> {
    const user = await getCurrentUser(payments);
    const dao = getOrInitPaymentDAO(payments);
    return dao.createPayment(user.uid, params);
}

export async function getCurrentUserPayment(
    payments: BTPPayments,
    paymentId: string
): Promise<PaymentInitiationResponse> {
    const user = await getCurrentUser(payments);
    const dao = getOrInitPaymentDAO(payments);
    return dao.getPayment(user.uid, paymentId);
}

export async function getCurrentUserPayments(
    payments: BTPPayments,
    options?: GetPaymentsOptions
): Promise<PaymentInitiationResponse[]> {
    const user = await getCurrentUser(payments);
    const dao = getOrInitPaymentDAO(payments);
    return dao.getPayments(user.uid, options);
}

export function onCurrentUserPaymentUpdate(
    payments: BTPPayments,
    onUpdate: (snapshot: PaymentSnapshot) => void,
    onError?: (error: BTPPaymentsError) => void
): () => void {
    const dao = getOrInitPaymentDAO(payments);
    let unsubscribe: (() => void) | null = null;

    // Use an IIFE (Immediately Invoked Function Expression) to handle the async getCurrentUser
    (async () => {
        try {
            const user = await getCurrentUser(payments);
            unsubscribe = dao.onPaymentUpdate(user.uid, onUpdate, onError);
        } catch (error) {
            if (onError) {
                onError(
                    new BTPPaymentsError(
                        "unauthenticated",
                        "User must be logged in to listen to payment updates",
                        error
                    )
                );
            }
        }
    })();

    // Return a function to unsubscribe
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
}

export async function updatePaymentStatus(
    payments: BTPPayments,
    paymentId: string,
    status: TransactionStatus
): Promise<PaymentStatusResponse> {
    const user = await getCurrentUser(payments);
    const dao = getOrInitPaymentDAO(payments);
    return dao.updatePaymentStatus(user.uid, paymentId, status);
}