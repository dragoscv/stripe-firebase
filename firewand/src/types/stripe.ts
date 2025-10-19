/**
 * Type definitions for Stripe-related functionality
 */

/**
 * Possible states a subscription can be in.
 */
export type SubscriptionStatus =
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "trialing"
    | "unpaid";

/**
 * Interface for a Stripe product
 */
export interface Product {
    /**
     * Unique product ID
     */
    id: string;

    /**
     * Product name
     */
    name: string;

    /**
     * Product description
     */
    description?: string;

    /**
     * Whether the product is active
     */
    active: boolean;

    /**
     * Metadata associated with the product
     */
    metadata?: {
        [key: string]: string | undefined;
        trial_days?: string;
        type?: string;
        description?: string;
        available_features?: string;
        unavailable_features?: string;
    };

    /**
     * URL of the product's image
     */
    images?: string[];

    /**
     * The product's URL
     */
    url?: string;
}

/**
 * Interface for a Stripe price
 */
export interface Price {
    /**
     * Unique price ID
     */
    id: string;

    /**
     * Three-letter ISO currency code
     */
    currency: string;

    /**
     * Product ID associated with this price
     */
    product: string;

    /**
     * Type of the price, either 'one_time' or 'recurring'
     */
    type: 'one_time' | 'recurring';

    /**
     * Human-readable price description
     */
    description?: string;

    /**
     * Price amount in the smallest currency unit (e.g., cents)
     */
    unit_amount?: number;

    /**
     * Billing configuration for recurring prices
     */
    recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count: number;
    };

    /**
     * Whether this price can be used for new purchases
     */
    active: boolean;

    /**
     * Set of key-value pairs for additional information
     */
    metadata?: Record<string, string>;
}

/**
 * Interface of a Stripe Subscription
 */
export interface Subscription {
    /**
     * Unique Stripe subscription ID
     */
    readonly id: string;

    /**
     * A future date in UTC format at which the subscription will automatically get canceled
     */
    readonly cancel_at: string | null;

    /**
     * If `true`, the subscription has been canceled by the user and will be deleted at the end
     * of the billing period
     */
    readonly cancel_at_period_end: boolean;

    /**
     * Date of cancellation as a UTC timestamp
     */
    readonly canceled_at: string | null;

    /**
     * The date when the subscription was created as a UTC timestamp
     */
    readonly created: string;

    /**
     * End of the current period that the subscription has been invoiced for
     */
    readonly current_period_end: string;

    /**
     * Start of the current period that the subscription has been invoiced for
     */
    readonly current_period_start: string;

    /**
     * If the subscription has ended, the date the subscription ended
     */
    readonly ended_at: string | null;

    /**
     * Set of extra key-value pairs attached to the subscription object
     */
    readonly metadata: { [name: string]: string };

    /**
     * Stripe price ID associated with this subscription
     */
    readonly price: string;

    /**
     * Array of product ID and price ID pairs
     */
    readonly prices: Array<{ product: string; price: string }>;

    /**
     * Stripe product ID associated with this subscription
     */
    readonly product: string;

    /**
     * Quantity of items purchased with this subscription
     */
    readonly quantity: number | null;

    /**
     * The Firebase role that can be assigned to the user with this subscription
     */
    readonly role: string | null;

    /**
     * The status of the subscription object
     */
    readonly status: SubscriptionStatus;

    /**
     * A link to the subscription in the Stripe dashboard
     */
    readonly stripe_link: string;

    /**
     * If the subscription has a trial, the end date of that trial
     */
    readonly trial_end: string | null;

    /**
     * If the subscription has a trial, the start date of that trial
     */
    readonly trial_start: string | null;

    /**
     * Firebase Auth UID of the user that created the subscription
     */
    readonly uid: string;

    [propName: string]: any;
}

/**
 * Snapshot containing subscription data and changes
 */
export interface SubscriptionSnapshot {
    /**
     * A list of all currently available subscriptions
     */
    subscriptions: Subscription[];

    /**
     * Changes in subscriptions since the last snapshot
     */
    changes: Array<{
        type: 'added' | 'modified' | 'removed';
        subscription: Subscription;
    }>;

    /**
     * Number of currently available subscriptions
     */
    size: number;

    /**
     * True if there are no subscriptions available
     */
    empty: boolean;
}

/**
 * Configuration for creating a checkout session
 */
export interface SessionConfig {
    priceId: string;
    promoCode?: string | null;
    metadata?: Record<string, any>;
    trial_period_days?: number;
    payment_mode?: 'subscription' | 'payment';
    currency: string;
    priceValue: number;
    subscriptionName: string;
}