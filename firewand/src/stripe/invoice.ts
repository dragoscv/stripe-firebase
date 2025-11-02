/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FirebaseApp } from "firebase/app";
import {
    collection,
    CollectionReference,
    collectionGroup,
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
} from "firebase/firestore";
import { StripePayments, StripePaymentsError } from "./init";
import { getCurrentUser, getCurrentUserSync } from "./user";
import { checkNonEmptyString } from "./utils";
import { firebaseApp } from "../firebase";

/**
 * Interface of a Stripe invoice stored in the app database.
 */
export interface Invoice {
    /**
     * Unique Stripe invoice ID.
     */
    readonly id: string;

    /**
     * Total after discounts and taxes.
     */
    readonly amount_due: number;

    /**
     * Total before discounts and taxes are applied.
     */
    readonly amount_paid: number;

    /**
     * Total amount that was credited.
     */
    readonly amount_remaining: number;

    /**
     * The date when the invoice was created as a UTC timestamp.
     */
    readonly created: string;

    /**
     * Three-letter ISO currency code, in lowercase.
     */
    readonly currency: string;

    /**
     * ID of the customer this invoice belongs to.
     */
    readonly customer: string;

    /**
     * An arbitrary string attached to the object. Often useful for displaying to users.
     */
    readonly description: string | null;

    /**
     * Hosted invoice URL for viewing the invoice.
     */
    readonly hosted_invoice_url: string | null;

    /**
     * Invoice PDF URL.
     */
    readonly invoice_pdf: string | null;

    /**
     * Array of line items that make up the invoice.
     */
    readonly lines: {
        data: Array<{
            amount: number;
            currency: string;
            description: string | null;
            quantity: number;
            [propName: string]: any;
        }>;
    };

    /**
     * Set of key-value pairs attached to the invoice.
     */
    readonly metadata: { [name: string]: string };

    /**
     * Invoice number.
     */
    readonly number: string | null;

    /**
     * Whether payment was successfully collected for this invoice.
     */
    readonly paid: boolean;

    /**
     * Array of product ID and price ID pairs.
     */
    readonly prices: Array<{ product: string; price: string }>;

    /**
     * Status of this invoice.
     */
    readonly status: InvoiceStatus | null;

    /**
     * ID of the subscription this invoice belongs to, if any.
     */
    readonly subscription: string | null;

    /**
     * Total amount of all line items before taxes and discounts.
     */
    readonly subtotal: number;

    /**
     * Total tax amount.
     */
    readonly tax: number | null;

    /**
     * Total after discounts and taxes.
     */
    readonly total: number;

    /**
     * Firebase Auth UID of the user that owns the invoice.
     */
    readonly uid: string;

    readonly [propName: string]: any;
}

/**
 * Possible states an invoice can be in.
 */
export type InvoiceStatus =
    | "draft"
    | "open"
    | "paid"
    | "uncollectible"
    | "void";

/**
 * Retrieves an existing Stripe invoice for the currently signed in user from the database.
 *
 * @param payments - A valid {@link StripePayments} object.
 * @param invoiceId - ID of the invoice to retrieve.
 * @param subscriptionId - Optional ID of the subscription. If provided, looks for the invoice
 *   in the subscription's invoices subcollection. If omitted, looks in the customer's invoices.
 * @returns Resolves with an Invoice object if found. Rejects if the specified invoice ID
 *  does not exist, or if the user is not signed in.
 */
export function getCurrentUserInvoice(
    payments: StripePayments,
    invoiceId: string,
    subscriptionId?: string
): Promise<Invoice> {
    checkNonEmptyString(invoiceId, "invoiceId must be a non-empty string.");
    return getCurrentUser(payments).then((uid: string) => {
        const dao: InvoiceDAO = getOrInitInvoiceDAO(payments);
        return dao.getInvoice(uid, invoiceId, subscriptionId);
    });
}

/**
 * Optional parameters for the {@link getCurrentUserInvoices} function.
 */
export interface GetInvoicesOptions {
    /**
     * Specify one or more invoice status values to retrieve. When set only the invoices
     * with the given status are returned.
     */
    status?: InvoiceStatus | InvoiceStatus[];

    /**
     * Optional subscription ID to filter invoices. When set, only invoices for this
     * subscription are returned.
     */
    subscriptionId?: string;
}

/**
 * Retrieves all Stripe invoices for the currently signed in user.
 *
 * @param payments - A valid {@link StripePayments} object.
 * @param options - Optional parameters for filtering invoices.
 * @returns Resolves with an array of Invoice objects. Empty array if no invoices found.
 *  Rejects if the user is not signed in.
 */
export function getCurrentUserInvoices(
    payments: StripePayments,
    options?: GetInvoicesOptions
): Promise<Invoice[]> {
    const queryOptions: { status?: InvoiceStatus[]; subscriptionId?: string } =
        {};
    if (typeof options?.status !== "undefined") {
        queryOptions.status = getStatusAsArray(options.status);
    }
    if (options?.subscriptionId) {
        queryOptions.subscriptionId = options.subscriptionId;
    }

    return getCurrentUser(payments).then((uid: string) => {
        const dao: InvoiceDAO = getOrInitInvoiceDAO(payments);
        return dao.getInvoices(uid, queryOptions);
    });
}

/**
 * Different types of changes that may occur on an invoice object.
 */
export type InvoiceChangeType = "added" | "modified" | "removed";

/**
 * Represents the current state of a set of invoices owned by a user.
 */
export interface InvoiceSnapshot {
    /**
     * A list of all currently available invoices ordered by creation date. Empty
     * if no invoices are available.
     */
    invoices: Invoice[];

    /**
     * The list of changes in the invoices since the last snapshot.
     */
    changes: Array<{
        type: InvoiceChangeType;
        invoice: Invoice;
    }>;

    /**
     * Number of currently available invoices. This is same as the length of the
     * `invoices` array in the snapshot.
     */
    size: number;

    /**
     * True if there are no invoices available. False whenever at least one invoice is
     * present. When True, the `invoices` array is empty, and the `size` is 0.
     */
    empty: boolean;
}

/**
 * Registers a listener to receive invoice update events for the currently signed in
 * user. If the user is not signed in throws an `unauthenticated` error, and no listener is
 * registered.
 *
 * Upon successful registration, the `onUpdate` callback will fire once with
 * the current state of all the invoices. From then onwards, each update to an invoice
 * will fire the `onUpdate` callback with the latest state of the invoices.
 *
 * @param payments - A valid {@link StripePayments} object.
 * @param onUpdate - A callback that will fire whenever the current user's invoices
 *   are updated.
 * @param onError - A callback that will fire whenever an error occurs while listening to
 *   invoice updates.
 * @param subscriptionId - Optional subscription ID. If provided, only listens to invoices
 *   for this subscription.
 * @returns A function that can be called to cancel and unregister the listener.
 */
export function onCurrentUserInvoiceUpdate(
    payments: StripePayments,
    onUpdate: (snapshot: InvoiceSnapshot) => void,
    onError?: (error: StripePaymentsError) => void,
    subscriptionId?: string
): () => void {
    const uid: string = getCurrentUserSync(payments);
    const dao: InvoiceDAO = getOrInitInvoiceDAO(payments);
    return dao.onInvoiceUpdate(uid, onUpdate, onError, subscriptionId);
}

function getStatusAsArray(
    status: InvoiceStatus | InvoiceStatus[]
): InvoiceStatus[] {
    if (typeof status === "string") {
        return [status];
    }

    if (!Array.isArray(status) || status.length === 0) {
        throw new StripePaymentsError(
            "internal",
            "status must be a non-empty array."
        );
    }
    return status;
}

/**
 * Internal interface for all database interactions pertaining to Stripe invoices. Exported
 * for testing.
 *
 * @internal
 */
export interface InvoiceDAO {
    getInvoice(
        uid: string,
        invoiceId: string,
        subscriptionId?: string
    ): Promise<Invoice>;
    getInvoices(
        uid: string,
        options?: { status?: InvoiceStatus[]; subscriptionId?: string }
    ): Promise<Invoice[]>;
    onInvoiceUpdate(
        uid: string,
        onUpdate: (snapshot: InvoiceSnapshot) => void,
        onError?: (error: StripePaymentsError) => void,
        subscriptionId?: string
    ): () => void;
}

const INVOICE_CONVERTER: FirestoreDataConverter<Invoice> = {
    toFirestore: () => {
        throw new Error("Not implemented for readonly Invoice type.");
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): Invoice => {
        const data: DocumentData = snapshot.data();
        const refs: DocumentReference[] = data.prices || [];
        const prices: Array<{ product: string; price: string }> = refs.map(
            (priceRef: DocumentReference) => {
                return {
                    product: priceRef.parent.parent!.id,
                    price: priceRef.id,
                };
            }
        );

        // Determine UID from document path
        const pathSegments = snapshot.ref.path.split("/");
        const uid = pathSegments[1]; // customers/{uid}/...

        return {
            id: snapshot.id,
            amount_due: data.amount_due ?? 0,
            amount_paid: data.amount_paid ?? 0,
            amount_remaining: data.amount_remaining ?? 0,
            created: toUTCDateString(data.created),
            currency: data.currency ?? "usd",
            customer: data.customer ?? "",
            description: data.description ?? null,
            hosted_invoice_url: data.hosted_invoice_url ?? null,
            invoice_pdf: data.invoice_pdf ?? null,
            lines: data.lines ?? { data: [] },
            metadata: data.metadata ?? {},
            number: data.number ?? null,
            paid: data.paid ?? false,
            prices,
            status: data.status ?? null,
            subscription: data.subscription ?? null,
            subtotal: data.subtotal ?? 0,
            tax: data.tax ?? null,
            total: data.total ?? 0,
            uid,
        };
    },
};

function toUTCDateString(seconds: number): string {
    const date = new Date(seconds * 1000);
    return date.toUTCString();
}

const INVOICES_COLLECTION = "invoices" as const;
const SUBSCRIPTIONS_COLLECTION = "subscriptions" as const;

class FirestoreInvoiceDAO implements InvoiceDAO {
    private readonly firestore: Firestore;

    constructor(app: FirebaseApp, private readonly customersCollection: string) {
        this.firestore = getFirestore(app);
    }

    public async getInvoice(
        uid: string,
        invoiceId: string,
        subscriptionId?: string
    ): Promise<Invoice> {
        const snap: QueryDocumentSnapshot<Invoice> =
            await this.getInvoiceSnapshotIfExists(uid, invoiceId, subscriptionId);
        return snap.data();
    }

    public async getInvoices(
        uid: string,
        options?: { status?: InvoiceStatus[]; subscriptionId?: string }
    ): Promise<Invoice[]> {
        const querySnap: QuerySnapshot<Invoice> = await this.getInvoiceSnapshots(
            uid,
            options?.status,
            options?.subscriptionId
        );
        const invoices: Invoice[] = [];
        querySnap.forEach((snap: QueryDocumentSnapshot<Invoice>) => {
            invoices.push(snap.data());
        });

        return invoices;
    }

    public onInvoiceUpdate(
        uid: string,
        onUpdate: (snapshot: InvoiceSnapshot) => void,
        onError?: (error: StripePaymentsError) => void,
        subscriptionId?: string
    ): () => void {
        let invoicesRef: Query<Invoice>;

        if (subscriptionId) {
            // Listen to invoices for a specific subscription
            invoicesRef = collection(
                this.firestore,
                this.customersCollection,
                uid,
                SUBSCRIPTIONS_COLLECTION,
                subscriptionId,
                INVOICES_COLLECTION
            ).withConverter(INVOICE_CONVERTER);
        } else {
            // Listen to all invoices using collectionGroup for both customer-level and subscription-level invoices
            invoicesRef = query(
                collectionGroup(this.firestore, INVOICES_COLLECTION),
                where("customer", "==", `customers/${uid}`)
            ).withConverter(INVOICE_CONVERTER);
        }

        return onSnapshot(
            invoicesRef,
            (querySnap: QuerySnapshot<Invoice>) => {
                const snapshot: InvoiceSnapshot = {
                    invoices: [],
                    changes: [],
                    size: querySnap.size,
                    empty: querySnap.empty,
                };
                querySnap.forEach((snap: QueryDocumentSnapshot<Invoice>) => {
                    snapshot.invoices.push(snap.data());
                });
                querySnap.docChanges().forEach((change: DocumentChange<Invoice>) => {
                    snapshot.changes.push({
                        type: change.type,
                        invoice: change.doc.data(),
                    });
                });

                onUpdate(snapshot);
            },
            (err: FirestoreError) => {
                if (onError) {
                    const arg: StripePaymentsError = new StripePaymentsError(
                        "internal",
                        `Error while listening to database updates: ${err.message}`,
                        err
                    );
                    onError(arg);
                }
            }
        );
    }

    private async getInvoiceSnapshotIfExists(
        uid: string,
        invoiceId: string,
        subscriptionId?: string
    ): Promise<QueryDocumentSnapshot<Invoice>> {
        let invoiceRef: DocumentReference<Invoice>;

        if (subscriptionId) {
            // Invoice in subscription subcollection
            invoiceRef = doc(
                this.firestore,
                this.customersCollection,
                uid,
                SUBSCRIPTIONS_COLLECTION,
                subscriptionId,
                INVOICES_COLLECTION,
                invoiceId
            ).withConverter(INVOICE_CONVERTER);
        } else {
            // Invoice in customer collection
            invoiceRef = doc(
                this.firestore,
                this.customersCollection,
                uid,
                INVOICES_COLLECTION,
                invoiceId
            ).withConverter(INVOICE_CONVERTER);
        }

        const snapshot: DocumentSnapshot<Invoice> = await this.queryFirestore(() =>
            getDoc(invoiceRef)
        );
        if (!snapshot.exists()) {
            throw new StripePaymentsError(
                "not-found",
                `No invoice found with the ID: ${invoiceId} for user: ${uid}`
            );
        }

        return snapshot;
    }

    private async getInvoiceSnapshots(
        uid: string,
        status?: InvoiceStatus[],
        subscriptionId?: string
    ): Promise<QuerySnapshot<Invoice>> {
        let invoicesQuery: Query<Invoice>;

        if (subscriptionId) {
            // Get invoices for a specific subscription
            invoicesQuery = collection(
                this.firestore,
                this.customersCollection,
                uid,
                SUBSCRIPTIONS_COLLECTION,
                subscriptionId,
                INVOICES_COLLECTION
            ).withConverter(INVOICE_CONVERTER);
        } else {
            // Get all invoices from both customer-level and subscription-level
            // Using collectionGroup to query across all invoice subcollections
            invoicesQuery = query(
                collectionGroup(this.firestore, INVOICES_COLLECTION),
                where("customer", "==", `customers/${uid}`)
            ).withConverter(INVOICE_CONVERTER);
        }

        if (status) {
            invoicesQuery = query(invoicesQuery, where("status", "in", status));
        }

        return await this.queryFirestore(() => getDocs(invoicesQuery));
    }

    private async queryFirestore<T>(fn: () => Promise<T>): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            throw new StripePaymentsError(
                "internal",
                "Unexpected error while querying Firestore",
                error
            );
        }
    }
}

const INVOICE_DAO_KEY = "invoice-dao" as const;

function getOrInitInvoiceDAO(payments: StripePayments): InvoiceDAO {
    let dao: InvoiceDAO | null =
        payments.getComponent<InvoiceDAO>(INVOICE_DAO_KEY);
    if (!dao) {
        dao = new FirestoreInvoiceDAO(firebaseApp, payments.customersCollection);
        setInvoiceDAO(payments, dao);
    }

    return dao;
}

/**
 * Internal API for registering a {@link InvoiceDAO} instance with {@link StripePayments}.
 * Exported for testing.
 *
 * @internal
 */
export function setInvoiceDAO(
    payments: StripePayments,
    dao: InvoiceDAO
): void {
    payments.setComponent(INVOICE_DAO_KEY, dao);
}
