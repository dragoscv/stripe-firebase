import { User } from 'firebase/auth';
import { Product } from '../stripe/product';
import { Subscription } from '../stripe/subscription';
import { Timestamp } from 'firebase/firestore';
import { ReactNode } from 'react';

/**
 * Props for the AppProvider component.
 */
export interface FirewandProviderProps {
    children: React.ReactNode;
    app: string;
    logs?: boolean;
}

export interface FirewandContextProps {
    user: User | null;
    userDetails: UserDetails | null;
    users: User[] | null;
    fetchUsers: () => void;
    products: Product[] | null;
    userSubscriptions: Subscription[] | null;
    userPayments: any[] | null;
    userInvoices: Invoice[] | null;
    userProfiles: Profile[] | null;
    platformPayments: any[] | null;
    fetchPlatformPayments: () => void;
    isSubscribed: boolean;
    userActiveSubscriptions: Subscription[] | null;
    currentProfile: string;
    switchCurrentProfile: (profile: string) => void;

    remoteConfig: RemoteConfig | null;
    profiles: Profile[] | null;
    publicProfiles: Profile[] | null;
    fetchPublicProfile: (profile: string) => Promise<string[]>;
}

export interface FirewandStateProps {
    user: User | null;
    userDetails: UserDetails | null;
    users: User[] | null;
    products: Product[] | null;
    userSubscriptions: Subscription[] | null;
    userPayments: any[] | null;
    userInvoices: Invoice[] | null;
    userProfiles: Profile[] | null;
    platformPayments: any[] | null;
    isSubscribed: boolean;
    userActiveSubscriptions: Subscription[] | null;
    currentProfile: string;
    currentProfileDetails: ProfileDetailsProps | null;

    remoteConfig: any | null;
    profiles: Profile[] | null;
    publicProfiles: Profile[] | null;
}

export interface FirewandActionProps {
    type: string;
    payload: any;
}


export interface UserDetails {
    id?: string;
    displayName: string | null;
    email: string | null;
    emailVerified: boolean;
    creationTime: string | undefined;
    lastSignInTime: string | undefined;
    phoneNumber: string | null;
    providerId: string | null;
    photoURL: string | null;
    name: string;
    fcmTokens: { [deviceId: string]: string } | never[];
    settings: UserSettings;
    uid: string;
    role: UserRole;
}

export type UserRole = 'administrator' | 'user' | 'provider' | 'guest';

export interface UserSettings {
    notifications: NotificationSettings;
    locale: string;
}

export interface NotificationSettings {
    all: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    categories: string[];
}


/**
 * Represents the properties of a profile's details.
 * 
 * @property {string} id - The unique identifier for the profile.
 * @property {string} [displayName] - The display name of the profile.
 * @property {string} [email] - The email address associated with the profile.
 * @property {string} [name] - The full name of the profile.
 * @property {string} [phoneNumber] - The phone number associated with the profile.
 * @property {string} [photoURL] - The URL to the profile's photo.
 * @property {string} [businessName] - The name of the business associated with the profile.
 * @property {string} [businessAddress] - The address of the business associated with the profile.
 * @property {string} [businessCUI] - The unique identifier (CUI) of the business.
 * @property {string} [businessCIF] - The fiscal identifier (CIF) of the business.
 * @property {string | number | null} [profileType] - The type of profile, which can be a string, number, or null.
 */
export type ProfileDetailsProps = {
    id: string;
    displayName?: string;
    email?: string;
    name?: string;
    phoneNumber?: string;
    photoURL?: string;
    businessName?: string;
    businessAddress?: string;
    businessCUI?: string;
    businessCIF?: string;
    profileType?: string | number | null;

}



/**
 * Represents an invoice with detailed information about the transaction.
 */
export interface Invoice {
    /**
     * Information about automatic tax applied to the invoice.
     */
    automatic_tax: {
        /**
         * Liability details for the automatic tax.
         */
        liability: {
            /**
             * Type of liability.
             * @example "self"
             */
            type: string;
        };
        /**
         * Indicates if automatic tax is enabled.
         */
        enabled: boolean;
        /**
         * Status of the automatic tax.
         * @example "complete"
         */
        status: string;
    };
    /**
     * Currency used for the invoice.
     * @example "ron"
     */
    currency: string;
    /**
     * Amount due for the invoice.
     * @example 4900
     */
    amount_due: number;
    /**
     * Status of the invoice.
     * @example "paid"
     */
    status: string;
    /**
     * Indicates if the invoice was paid out of band.
     */
    paid_out_of_band: boolean;
    /**
     * Total amount for the invoice.
     * @example 4900
     */
    total: number;
    /**
     * Account tax IDs associated with the invoice.
     */
    account_tax_ids: string | null;
    /**
     * Default payment method for the invoice.
     */
    default_payment_method: string | null;
    /**
     * Footer text for the invoice.
     */
    footer: string | null;
    /**
     * Statement descriptor for the invoice.
     */
    statement_descriptor: string | null;
    /**
     * Unique identifier for the invoice.
     * @example "in_1QAKwNFkc7zfQc5ngvfFoIy4"
     */
    id: string;
    /**
     * Customer tax exemption status.
     * @example "none"
     */
    customer_tax_exempt: string;
    /**
     * Amount charged for shipping.
     * @example 0
     */
    amount_shipping: number;
    /**
     * Status transitions for the invoice.
     */
    status_transitions: {
        /**
         * Timestamp when the invoice was marked uncollectible.
         */
        marked_uncollectible_at: number | null;
        /**
         * Timestamp when the invoice was paid.
         */
        paid_at: number;
        /**
         * Timestamp when the invoice was voided.
         */
        voided_at: number | null;
        /**
         * Timestamp when the invoice was finalized.
         */
        finalized_at: number;
    };
    /**
     * Custom fields for the invoice.
     */
    custom_fields: string | null;
    /**
     * Next payment attempt for the invoice.
     */
    next_payment_attempt: string | null;
    /**
     * Amount of post-payment credit notes.
     * @example 0
     */
    post_payment_credit_notes_amount: number;
    /**
     * Last finalization error for the invoice.
     */
    last_finalization_error: string | null;
    /**
     * Charge ID associated with the invoice.
     * @example "ch_3QAKx2Fkc7zfQc5n0Mcvkbri"
     */
    charge: string;
    /**
     * Total tax amounts for the invoice.
     */
    total_tax_amounts: Array<{
        /**
         * Taxable amount.
         * @example 0
         */
        taxable_amount: number;
        /**
         * Tax rate ID.
         * @example "txr_1QAKwoFkc7zfQc5nvkJ5F4Vn"
         */
        tax_rate: string;
        /**
         * Indicates if the tax is inclusive.
         */
        inclusive: boolean;
        /**
         * Reason for taxability.
         * @example "not_collecting"
         */
        taxability_reason: string;
        /**
         * Amount of tax.
         * @example 0
         */
        amount: number;
    }>;
    /**
     * Name of the account associated with the invoice.
     * @example "BURSA X"
     */
    account_name: string;
    /**
     * Number of attempts made to collect payment.
     * @example 1
     */
    attempt_count: number;
    /**
     * ID of the invoice from which this invoice was created.
     */
    from_invoice: string | null;
    /**
     * Customer tax IDs associated with the invoice.
     * @example []
     */
    customer_tax_ids: string[];
    /**
     * Indicates if the invoice will auto-advance.
     */
    auto_advance: boolean;
    /**
     * Rendering details for the invoice.
     */
    rendering: {
        /**
         * Template used for rendering the invoice.
         */
        template: string | null;
        /**
         * Version of the template used.
         */
        template_version: string | null;
        /**
         * Display amount of tax.
         */
        amount_tax_display: string | null;
        /**
         * PDF rendering details.
         */
        pdf: {
            /**
             * Page size for the PDF.
             * @example "letter"
             */
            page_size: string;
        };
    };
    /**
     * Timestamp when webhooks were delivered.
     */
    webhooks_delivered_at: number;
    /**
     * Shipping details for the customer.
     */
    customer_shipping: string | null;
    /**
     * Total discount amounts for the invoice.
     */
    total_discount_amounts: any[];
    /**
     * Total amount excluding tax.
     * @example 4900
     */
    total_excluding_tax: number;
    /**
     * Collection method for the invoice.
     * @example "send_invoice"
     */
    collection_method: string;
    /**
     * Line items for the invoice.
     */
    lines: {
        /**
         * Data for each line item.
         */
        data: Array<{
            /**
             * Invoice item ID.
             * @example "ii_1QAKwoFkc7zfQc5nQKPNOkwo"
             */
            invoice_item: string;
            /**
             * Unique identifier for the line item.
             * @example "il_1QAKwoFkc7zfQc5nOf2bQMV8"
             */
            id: string;
            /**
             * Object type.
             * @example "line_item"
             */
            object: string;
            /**
             * Tax amounts for the line item.
             */
            tax_amounts: Array<{
                /**
                 * Reason for taxability.
                 * @example "not_collecting"
                 */
                taxability_reason: string;
                /**
                 * Indicates if the tax is inclusive.
                 */
                inclusive: boolean;
                /**
                 * Taxable amount.
                 * @example 0
                 */
                taxable_amount: number;
                /**
                 * Tax rate ID.
                 * @example "txr_1QAKwoFkc7zfQc5nvkJ5F4Vn"
                 */
                tax_rate: string;
                /**
                 * Amount of tax.
                 * @example 0
                 */
                amount: number;
            }>;
            /**
             * Unit amount excluding tax.
             * @example "4900"
             */
            unit_amount_excluding_tax: string;
            /**
             * Tax rates for the line item.
             */
            tax_rates: any[];
            /**
             * Metadata for the line item.
             */
            metadata: any;
            /**
             * Invoice ID associated with the line item.
             * @example "in_1QAKwNFkc7zfQc5ngvfFoIy4"
             */
            invoice: string;
            /**
             * Plan associated with the line item.
             */
            plan: string | null;
            /**
             * Description of the line item.
             * @example "5 Oferte"
             */
            description: string;
            /**
             * Currency used for the line item.
             * @example "ron"
             */
            currency: string;
            /**
             * Proration details for the line item.
             */
            proration_details: {
                /**
                 * Credited items for proration.
                 */
                credited_items: string | null;
            };
            /**
             * Amount excluding tax.
             * @example 4900
             */
            amount_excluding_tax: number;
            /**
             * Indicates if the line item is a proration.
             */
            proration: boolean;
            /**
             * Price details for the line item.
             */
            price: {
                /**
                 * Product ID associated with the price.
                 * @example "prod_QzoECr6WIiVxOM"
                 */
                product: string;
                /**
                 * Transform quantity details.
                 */
                transform_quantity: string | null;
                /**
                 * Lookup key for the price.
                 */
                lookup_key: string | null;
                /**
                 * Tax behavior for the price.
                 * @example "unspecified"
                 */
                tax_behavior: string;
                /**
                 * Recurring details for the price.
                 */
                recurring: string | null;
                /**
                 * Unit amount in decimal.
                 * @example "4900"
                 */
                unit_amount_decimal: string;
                /**
                 * Currency used for the price.
                 * @example "ron"
                 */
                currency: string;
                /**
                 * Indicates if the price is live mode.
                 */
                livemode: boolean;
                /**
                 * Billing scheme for the price.
                 * @example "per_unit"
                 */
                billing_scheme: string;
                /**
                 * Type of price.
                 * @example "one_time"
                 */
                type: string;
                /**
                 * Object type.
                 * @example "price"
                 */
                object: string;
                /**
                 * Indicates if the price is active.
                 */
                active: boolean;
                /**
                 * Nickname for the price.
                 */
                nickname: string | null;
                /**
                 * Custom unit amount for the price.
                 */
                custom_unit_amount: string | null;
                /**
                 * Unit amount.
                 * @example 4900
                 */
                unit_amount: number;
                /**
                 * Metadata for the price.
                 */
                metadata: any;
                /**
                 * Unique identifier for the price.
                 * @example "price_1Q7obgFkc7zfQc5nal1meP3i"
                 */
                id: string;
                /**
                 * Timestamp when the price was created.
                 */
                created: number;
                /**
                 * Tiers mode for the price.
                 */
                tiers_mode: string | null;
            };
            /**
             * Period details for the line item.
             */
            period: {
                /**
                 * End timestamp for the period.
                 */
                end: number;
                /**
                 * Start timestamp for the period.
                 */
                start: number;
            };
            /**
             * Amount for the line item.
             * @example 4900
             */
            amount: number;
            /**
             * Discount amounts for the line item.
             */
            discount_amounts: any[];
            /**
             * Type of line item.
             * @example "invoiceitem"
             */
            type: string;
            /**
             * Indicates if the line item is live mode.
             */
            livemode: boolean;
            /**
             * Discounts applied to the line item.
             */
            discounts: any[];
            /**
             * Subscription ID associated with the line item.
             */
            subscription: string | null;
            /**
             * Indicates if the line item is discountable.
             */
            discountable: boolean;
            /**
             * Quantity of the line item.
             * @example 1
             */
            quantity: number;
        }>;
        /**
         * Indicates if there are more line items.
         */
        has_more: boolean;
        /**
         * URL for the line items.
         * @example "/v1/invoices/in_1QAKwNFkc7zfQc5ngvfFoIy4/lines"
         */
        url: string;
        /**
         * Total count of line items.
         * @example 1
         */
        total_count: number;
        /**
         * Object type.
         * @example "list"
         */
        object: string;
    };
    /**
     * Timestamp when the invoice was created.
     */
    created: number;
    /**
     * Email address of the customer.
     * @example "vladulescu.catalin@gmail.com"
     */
    customer_email: string;
    /**
     * Country of the account associated with the invoice.
     * @example "RO"
     */
    account_country: string;
    /**
     * ID of the entity on behalf of which the invoice was issued.
     */
    on_behalf_of: string | null;
    /**
     * Amount paid for the invoice.
     * @example 4900
     */
    amount_paid: number;
    /**
     * Subscription ID associated with the invoice.
     */
    subscription: string | null;
    /**
     * Subtotal amount for the invoice.
     * @example 4900
     */
    subtotal: number;
    /**
     * Object type.
     * @example "invoice"
     */
    object: string;
    /**
     * URL for the hosted invoice.
     */
    hosted_invoice_url: string;
    /**
     * Quote ID associated with the invoice.
     */
    quote: string | null;
    /**
     * Reason for billing.
     * @example "manual"
     */
    billing_reason: string;
    /**
     * Shipping cost details.
     */
    shipping_cost: string | null;
    /**
     * Subtotal amount excluding tax.
     * @example 4900
     */
    subtotal_excluding_tax: number;
    /**
     * Metadata for the invoice.
     */
    metadata: any;
    /**
     * Starting balance for the invoice.
     * @example 0
     */
    starting_balance: number;
    /**
     * Amount remaining to be paid.
     * @example 0
     */
    amount_remaining: number;
    /**
     * Default source for the invoice.
     */
    default_source: string | null;
    /**
     * Shipping details for the invoice.
     */
    shipping_details: string | null;
    /**
     * Subscription details for the invoice.
     */
    subscription_details: {
        /**
         * Metadata for the subscription.
         */
        metadata: string | null;
    };
    /**
     * Customer ID associated with the invoice.
     * @example "cus_R0303eAVDldaNm"
     */
    customer: string;
    /**
     * Phone number of the customer.
     */
    customer_phone: string | null;
    /**
     * Tax amount for the invoice.
     * @example 0
     */
    tax: number;
    /**
     * Ending balance for the invoice.
     * @example 0
     */
    ending_balance: number;
    /**
     * Description of the invoice.
     */
    description: string | null;
    /**
     * Transfer data for the invoice.
     */
    transfer_data: string | null;
    /**
     * Start timestamp for the period.
     */
    period_start: number;
    /**
     * Invoice number.
     * @example "256923A5-0006"
     */
    number: string;
    /**
     * Discount details for the invoice.
     */
    discount: string | null;
    /**
     * Timestamp when the invoice will automatically finalize.
     */
    automatically_finalizes_at: string | null;
    /**
     * Amount of pre-payment credit notes.
     * @example 0
     */
    pre_payment_credit_notes_amount: number;
    /**
     * Timestamp when the invoice becomes effective.
     */
    effective_at: number;
    /**
     * Indicates if the invoice was attempted.
     */
    attempted: boolean;
    /**
     * Receipt number for the invoice.
     */
    receipt_number: string | null;
    /**
     * Latest revision ID for the invoice.
     */
    latest_revision: string | null;
    /**
     * Test clock ID for the invoice.
     */
    test_clock: string | null;
    /**
     * Discounts applied to the invoice.
     */
    discounts: any[];
    /**
     * Application ID associated with the invoice.
     */
    application: string | null;
    /**
     * Payment settings for the invoice.
     */
    payment_settings: {
        /**
         * Payment method options.
         */
        payment_method_options: string | null;
        /**
         * Payment method types.
         */
        payment_method_types: string | null;
        /**
         * Default mandate for the payment.
         */
        default_mandate: string | null;
    };
    /**
     * End timestamp for the period.
     */
    period_end: number;
    /**
     * Address details of the customer.
     */
    customer_address: {
        /**
         * Country of the customer.
         * @example "RO"
         */
        country: string;
        /**
         * City of the customer.
         * @example "targu jiu"
         */
        city: string;
        /**
         * Postal code of the customer.
         * @example "210202"
         */
        postal_code: string;
        /**
         * Line 2 of the customer's address.
         * @example "t"
         */
        line2: string;
        /**
         * Line 1 of the customer's address.
         * @example "test"
         */
        line1: string;
        /**
         * State of the customer.
         * @example "gorj"
         */
        state: string;
    };
    /**
     * Name of the customer.
     * @example "Dragos Catalin"
     */
    customer_name: string;
    /**
     * Payment intent ID associated with the invoice.
     * @example "pi_3QAKx2Fkc7zfQc5n0KYk3sR5"
     */
    payment_intent: string;
    /**
     * Indicates if the invoice is live mode.
     */
    livemode: boolean;
    /**
     * Indicates if the invoice is paid.
     */
    paid: boolean;
    /**
     * Application fee amount for the invoice.
     */
    application_fee_amount: number | null;
    /**
     * URL for the invoice PDF.
     */
    invoice_pdf: string;
    /**
     * Issuer details for the invoice.
     */
    issuer: {
        /**
         * Type of issuer.
         * @example "self"
         */
        type: string;
    };
    /**
     * Due date for the invoice.
     */
    due_date: number;
    /**
     * Default tax rates for the invoice.
     */
    default_tax_rates: any[];
}
export interface ProfileFileProps {
    name: string;
    url: string;
    type: string;
    size: number;
}


export interface Profile {
    county: string; // "Gorj"
    timestamp: number; // 1729275050300
    reg: string; // "RO"
    createdAt: {
        seconds: number; // 1729275050
        nanoseconds: number; // 300000000
    };
    email: string; // "vladulescu.catalin@gmail.com"
    city: string; // "Tg-Jiu"
    name: string; // "Test"
    phone: string; // "0725246591"
    description: string; // "Test"
    address: string; // "Str. Slt. M.C. Oancea nr. 2"
    cui: string; // "123456"
    website: string; // "https://dragoscatalin.ro"
    files: Array<ProfileFileProps>;
    uid: string; // "WduicE57oCddMgeCFG4Qbgb4hEy2"
    id: string; // "VXyIoR0NZV8XbSH4H80r"
    status: 'active' | 'inactive' | 'pending';
    licitatiiCastigate: number;
    startedAt: Timestamp;
    licitatiiParticipate: number;
    licitatiiPublicate: number;
}

export interface RemoteConfig {
    maintenance: boolean;
    // ...other config properties...
}

export interface CreditsTotal {
    profiles: number;
    services: number;
    offers: number;
}








