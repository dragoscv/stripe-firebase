import { useState, useContext } from 'react';
import { Platform } from 'react-native';
import {
    stripePayments,
    createCheckoutSession,
    StripePayments,
    getCurrentUserSubscriptions,
    getCurrentUserSubscription,
    onCurrentUserSubscriptionUpdate,
    SessionCreateParams
} from '../stripe';
import {
    FirewandContextNative,
    firebaseFunctions,
    firebaseApp,

} from '..';
import { httpsCallable } from "firebase/functions";
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import type {
    Price,
    Product,
    Subscription,
    SubscriptionStatus,
    SessionConfig,
    SubscriptionSnapshot
} from '../types';

/**
 * Hook for managing Stripe payments and subscriptions
 */
export const useStripe = () => {
    const [loadingPayment, setLoadingPayment] = useState(false);
    const router = useRouter();

    const context = useContext(FirewandContextNative);
    if (!context) {
        throw new Error('FirewandContextNative must be used within a FirewandProviderNative');
    }

    const { user, userActiveSubscriptions } = context;

    /**
     * Creates a new Stripe checkout session and redirects the user to it
     */
    const newCheckoutSession = async (sessionConfig: SessionConfig): Promise<void> => {
        const { priceId, promoCode, metadata, trial_period_days, payment_mode, currency, priceValue, subscriptionName } = sessionConfig;
        setLoadingPayment(true);

        try {
            // Create base URL for success and cancel redirects that works on all platforms
            const baseUrl = Platform.select({
                web: window.location.href?.split('?')[0], // On web, get the current URL without query params
                default: Linking.createURL('/shop') // On native, use Expo Linking to create deep link URL
            });

            const successUrl = `${baseUrl}?paymentStatus=success&currency=${currency}&priceValue=${priceValue}&subscriptionName=${subscriptionName}&priceId=${priceId}`;
            const cancelUrl = `${baseUrl}?paymentStatus=cancel`;

            const payments = stripePayments(firebaseApp);

            const paymentConfig: SessionCreateParams = {
                price: priceId,
                allow_promotion_codes: true,
                success_url: successUrl,
                cancel_url: cancelUrl,
            };

            if (payment_mode) {
                paymentConfig.mode = payment_mode;
                paymentConfig.invoice_creation = true;
            }

            if (trial_period_days) {
                paymentConfig.trial_period_days = trial_period_days;
            }

            if (promoCode) {
                paymentConfig.promotion_code = promoCode;
            }

            if (metadata) {
                paymentConfig.metadata = metadata;
            }

            const session = await createCheckoutSession(payments, paymentConfig, {});

            // Open the Stripe checkout URL in a way that works across platforms
            if (Platform.OS === 'web') {
                window.location.assign(session.url);
            } else {
                // On native platforms, open the URL in the browser
                await Linking.openURL(session.url);
            }
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            setLoadingPayment(false);
        }
    };

    /**
     * Finds the active subscription from the user's subscriptions
     */
    const getActiveSubscription = (): Subscription | undefined => {
        return userActiveSubscriptions?.find(subscription =>
            subscription.status === 'trialing' || subscription.status === 'active'
        );
    };

    /**
     * Fetches user's subscriptions directly from Stripe
     */
    const fetchUserSubscriptions = async (): Promise<Subscription[]> => {
        try {
            const payments = stripePayments(firebaseApp);
            return await getCurrentUserSubscriptions(payments);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            return [];
        }
    };

    /**
     * Fetches a specific subscription by ID
     */
    const fetchSubscription = async (subscriptionId: string): Promise<Subscription | null> => {
        try {
            const payments = stripePayments(firebaseApp);
            return await getCurrentUserSubscription(payments, subscriptionId);
        } catch (error) {
            console.error(`Failed to fetch subscription ${subscriptionId}:`, error);
            return null;
        }
    };

    /**
     * Manages an existing subscription by opening the Stripe customer portal
     */
    const manageSubscription = (): void => {
        setLoadingPayment(true);
        const activeSubscription = getActiveSubscription();
        const manageSubscriptionFn = httpsCallable(firebaseFunctions, 'createPortalLink');

        // Get the current URL for the return URL parameter
        const returnUrl = Platform.select({
            web: window.location.href,
            default: Linking.createURL('/shop')
        });

        manageSubscriptionFn({ returnUrl })
            .then((result: any) => {
                const { data } = result;
                // Update the URL if there's an active subscription
                if (activeSubscription) {
                    data.url = data.url + `/subscriptions/${activeSubscription.id}/update`;
                }

                // Open the URL in a way that works across platforms
                if (Platform.OS === 'web') {
                    window.location.assign(data.url);
                } else {
                    Linking.openURL(data.url);
                }
                setLoadingPayment(false);
            })
            .catch((error: any) => {
                console.error('Failed to manage subscription:', error);
                setLoadingPayment(false);
            });
    };

    /**
     * Sets up a subscription listener for real-time updates
     */
    const subscribeToSubscriptionUpdates = (
        onUpdate: (subscriptions: Subscription[]) => void,
        onError?: (error: Error) => void
    ): () => void => {
        const payments = stripePayments(firebaseApp);
        return onCurrentUserSubscriptionUpdate(
            payments,
            (snapshot) => {
                onUpdate(snapshot.subscriptions);
            },
            (error) => {
                if (onError) {
                    onError(error);
                } else {
                    console.error('Subscription update error:', error);
                }
            }
        );
    };

    /**
     * Handles payment for a given price
     */
    const handlePayment = async (price: Price, product: Product): Promise<void> => {
        setLoadingPayment(true);

        const metadata = {
            url: '/shop',
        };

        const session: SessionConfig = {
            priceId: price.id,
            promoCode: null,
            metadata: metadata,
            currency: price.currency,
            priceValue: price.unit_amount || 0,
            subscriptionName: price.description || product.name,
            payment_mode: price.type === 'recurring' ? 'subscription' : 'payment',
            trial_period_days: product.metadata?.trial_days ? Number(product.metadata.trial_days) : undefined,
        };

        if (user) {
            await newCheckoutSession(session);
        } else {
            setLoadingPayment(false);
            // If user is not logged in, redirect to auth screen
            router.push('/auth/login');
        }
    };

    /**
     * Checks if there's an active subscription for a product
     */
    const hasActiveSubscription = (productId: string): boolean => {
        return Boolean(userActiveSubscriptions?.some(
            subscription => subscription.product === productId &&
                (subscription.status === 'trialing' || subscription.status === 'active')
        ));
    };

    /**
     * Extracts available features from product metadata
     */
    const getAvailableFeatures = (product: Product): any[] => {
        if (!product.metadata?.available_features) {
            return [];
        }
        try {
            return JSON.parse(product.metadata.available_features as string);
        } catch (e) {
            console.error('Failed to parse available features:', e);
            return [];
        }
    };

    /**
     * Extracts unavailable features from product metadata
     */
    const getUnavailableFeatures = (product: Product): any[] => {
        if (!product.metadata?.unavailable_features) {
            return [];
        }
        try {
            return JSON.parse(product.metadata.unavailable_features as string);
        } catch (e) {
            console.error('Failed to parse unavailable features:', e);
            return [];
        }
    };

    return {
        loadingPayment,
        userActiveSubscriptions,
        getActiveSubscription,
        fetchUserSubscriptions,
        fetchSubscription,
        manageSubscription,
        subscribeToSubscriptionUpdates,
        handlePayment,
        hasActiveSubscription,
        getAvailableFeatures,
        getUnavailableFeatures,
        user
    };
};

export default useStripe;