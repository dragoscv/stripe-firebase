import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { firebaseApp } from '../../firebase/app';
import {
    Subscription,
    SubscriptionStatus,
    SubscriptionSnapshot,
    SubscriptionDAO,
    getCurrentUserSubscription,
    getCurrentUserSubscriptions,
    onCurrentUserSubscriptionUpdate
} from '../../stripe/subscription';
import { StripePayments, StripePaymentsError } from '../../stripe/init';
import { FirebaseApp } from 'firebase/app';

jest.mock('../../firebase/app');

// Mock test user that matches setup.ts
const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
};

// Helper types to help with mocking
type UserDAOWithGetCurrentUser = {
    getCurrentUser: jest.Mock<() => Promise<string>>;
};

type UserDAOWithGetCurrentUserSync = {
    getCurrentUserSync: jest.Mock<() => string>;
};

describe('Stripe Subscriptions', () => {
    let mockPayments: jest.Mocked<StripePayments>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPayments = {
            app: firebaseApp as unknown as FirebaseApp,
            customersCollection: 'customers',
            productsCollection: 'products',
            getComponent: jest.fn(),
            setComponent: jest.fn(),
        } as unknown as jest.Mocked<StripePayments>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getCurrentUserSubscription', () => {
        it('should get subscription for current user', async () => {
            const mockSubscription: Subscription = {
                id: 'sub_123',
                status: 'active' as SubscriptionStatus,
                current_period_end: new Date().toUTCString(),
                current_period_start: new Date().toUTCString(),
                price: 'price_123',
                prices: [{ product: 'prod_123', price: 'price_123' }],
                product: 'prod_123',
                quantity: 1,
                role: 'premium',
                metadata: {},
                uid: mockUser.uid,
                stripe_link: 'https://stripe.com/sub_123',
                trial_end: null,
                trial_start: null,
                cancel_at_period_end: false,
                created: new Date().toUTCString(),
                ended_at: null,
                cancel_at: null,
                canceled_at: null
            };

            // Mock the user retrieval first, followed by the subscription retrieval
            const mockGetUser = jest.fn<() => Promise<string>>().mockResolvedValue(mockUser.uid);
            const mockGetSubscription = jest.fn<(uid: string, subscriptionId: string) => Promise<Subscription>>()
                .mockResolvedValue(mockSubscription);

            // Create mock DAOs
            const mockUserDAO: UserDAOWithGetCurrentUser = {
                getCurrentUser: mockGetUser
            };

            const mockSubscriptionDAO: Partial<SubscriptionDAO> = {
                getSubscription: mockGetSubscription,
                getSubscriptions: jest.fn<(uid: string, options?: { status?: SubscriptionStatus[] }) => Promise<Subscription[]>>(),
                onSubscriptionUpdate: jest.fn<(uid: string, onUpdate: (snapshot: SubscriptionSnapshot) => void, onError?: (error: StripePaymentsError) => void) => () => void>()
            };

            // Setup the mocks to be returned in sequence with proper typing
            (mockPayments.getComponent as jest.Mock).mockImplementation(function (this: unknown, ...args: unknown[]) {
                const key = args[0] as string;
                if (key === 'user-dao') {
                    return mockUserDAO;
                }
                if (key === 'subscription-dao') {
                    return mockSubscriptionDAO;
                }
                return null;
            });

            const subscription = await getCurrentUserSubscription(mockPayments, 'sub_123');
            expect(subscription).toEqual(mockSubscription);
            expect(mockGetSubscription).toHaveBeenCalledWith(mockUser.uid, 'sub_123');
        });

        it('should throw error if subscription not found', async () => {
            const mockGetUser = jest.fn<() => Promise<string>>().mockResolvedValue(mockUser.uid);
            const mockError = new Error('Subscription not found');
            const mockGetSubscription = jest.fn<(uid: string, subscriptionId: string) => Promise<Subscription>>()
                .mockRejectedValue(mockError);

            const mockUserDAO: UserDAOWithGetCurrentUser = {
                getCurrentUser: mockGetUser
            };

            const mockSubscriptionDAO: Partial<SubscriptionDAO> = {
                getSubscription: mockGetSubscription,
                getSubscriptions: jest.fn<(uid: string, options?: { status?: SubscriptionStatus[] }) => Promise<Subscription[]>>(),
                onSubscriptionUpdate: jest.fn<(uid: string, onUpdate: (snapshot: SubscriptionSnapshot) => void, onError?: (error: StripePaymentsError) => void) => () => void>()
            };

            (mockPayments.getComponent as jest.Mock)
                .mockImplementation(function (this: unknown, ...args: unknown[]) {
                    const key = args[0] as string;
                    if (key === 'user-dao') {
                        return mockUserDAO;
                    }
                    if (key === 'subscription-dao') {
                        return mockSubscriptionDAO;
                    }
                    return null;
                });

            await expect(getCurrentUserSubscription(mockPayments, 'invalid_sub'))
                .rejects.toThrow('Subscription not found');
        });
    });

    describe('getCurrentUserSubscriptions', () => {
        it('should get all subscriptions for current user', async () => {
            const mockSubscriptions: Subscription[] = [{
                id: 'sub_123',
                status: 'active' as SubscriptionStatus,
                current_period_end: new Date().toUTCString(),
                current_period_start: new Date().toUTCString(),
                price: 'price_123',
                prices: [{ product: 'prod_123', price: 'price_123' }],
                product: 'prod_123',
                quantity: 1,
                role: 'premium',
                metadata: {},
                uid: mockUser.uid,
                stripe_link: 'https://stripe.com/sub_123',
                trial_end: null,
                trial_start: null,
                cancel_at_period_end: false,
                created: new Date().toUTCString(),
                ended_at: null,
                cancel_at: null,
                canceled_at: null
            }];

            const mockGetUser = jest.fn<() => Promise<string>>().mockResolvedValue(mockUser.uid);
            const mockGetSubscriptions = jest.fn<(uid: string, options?: { status?: SubscriptionStatus[] }) => Promise<Subscription[]>>()
                .mockResolvedValue(mockSubscriptions);

            const mockUserDAO: UserDAOWithGetCurrentUser = {
                getCurrentUser: mockGetUser
            };

            const mockSubscriptionDAO: Partial<SubscriptionDAO> = {
                getSubscription: jest.fn<(uid: string, subscriptionId: string) => Promise<Subscription>>(),
                getSubscriptions: mockGetSubscriptions,
                onSubscriptionUpdate: jest.fn<(uid: string, onUpdate: (snapshot: SubscriptionSnapshot) => void, onError?: (error: StripePaymentsError) => void) => () => void>()
            };

            (mockPayments.getComponent as jest.Mock)
                .mockImplementation(function (this: unknown, ...args: unknown[]) {
                    const key = args[0] as string;
                    if (key === 'user-dao') {
                        return mockUserDAO;
                    }
                    if (key === 'subscription-dao') {
                        return mockSubscriptionDAO;
                    }
                    return null;
                });

            const subscriptions = await getCurrentUserSubscriptions(mockPayments);
            expect(subscriptions).toEqual(mockSubscriptions);
            expect(mockGetSubscriptions).toHaveBeenCalledWith(mockUser.uid, {});
        });
    });

    describe('onCurrentUserSubscriptionUpdate', () => {
        it('should set up subscription update listener', () => {
            const mockOnUpdate = jest.fn();
            const mockOnError = jest.fn();
            const mockUnsubscribe = jest.fn();

            const mockSnapshot: SubscriptionSnapshot = {
                subscriptions: [],
                changes: [],
                size: 0,
                empty: true
            };

            const mockGetCurrentUserSync = jest.fn<() => string>().mockReturnValue(mockUser.uid);
            const mockOnSubscriptionUpdate = jest.fn<(uid: string, callback: (snapshot: SubscriptionSnapshot) => void, onError?: (error: StripePaymentsError) => void) => () => void>()
                .mockImplementation((uid, callback) => {
                    callback(mockSnapshot);
                    return mockUnsubscribe;
                });

            const mockUserDAO: UserDAOWithGetCurrentUserSync = {
                getCurrentUserSync: mockGetCurrentUserSync
            };

            const mockSubscriptionDAO: Partial<SubscriptionDAO> = {
                getSubscription: jest.fn<(uid: string, subscriptionId: string) => Promise<Subscription>>(),
                getSubscriptions: jest.fn<(uid: string, options?: { status?: SubscriptionStatus[] }) => Promise<Subscription[]>>(),
                onSubscriptionUpdate: mockOnSubscriptionUpdate
            };

            (mockPayments.getComponent as jest.Mock)
                .mockImplementation(function (this: unknown, ...args: unknown[]) {
                    const key = args[0] as string;
                    if (key === 'user-dao') {
                        return mockUserDAO;
                    }
                    if (key === 'subscription-dao') {
                        return mockSubscriptionDAO;
                    }
                    return null;
                });

            const unsubscribe = onCurrentUserSubscriptionUpdate(
                mockPayments,
                mockOnUpdate,
                mockOnError
            );

            expect(unsubscribe).toBe(mockUnsubscribe);
            expect(mockOnSubscriptionUpdate).toHaveBeenCalledWith(mockUser.uid, mockOnUpdate, mockOnError);
            expect(mockOnUpdate).toHaveBeenCalledWith(mockSnapshot);
        });
    });
});