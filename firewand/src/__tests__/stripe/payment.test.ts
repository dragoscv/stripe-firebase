import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { FirebaseApp } from 'firebase/app';
import { firebaseApp } from '../../firebase/app';
import { stripePayments } from '../../stripe/utils';
import { Payment, PaymentDAO, PaymentStatus, getCurrentUserPayment, getCurrentUserPayments, onCurrentUserPaymentUpdate } from '../../stripe/payment';
import { StripePayments } from '../../stripe/init';

jest.mock('../../stripe/utils');
jest.mock('../../firebase/app');

describe('Stripe Payments', () => {
    let mockPayments: jest.Mocked<StripePayments>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPayments = {
            app: firebaseApp,
            customersCollection: 'customers',
            productsCollection: 'products',
            getComponent: jest.fn(),
            setComponent: jest.fn(),
        } as unknown as jest.Mocked<StripePayments>;
    });

    describe('getCurrentUserPayment', () => {
        it('should get payment for current user', async () => {
            const mockPayment = {
                id: 'payment_123',
                amount: 1000,
                amount_capturable: 0,
                amount_received: 1000,
                created: new Date().toUTCString(),
                currency: 'usd',
                customer: 'cus_123',
                description: 'Test payment',
                invoice: null,
                metadata: {},
                payment_method_types: ['card'],
                prices: [{ product: 'prod_123', price: 'price_123' }],
                status: 'succeeded' as PaymentStatus,
                uid: 'user_123'
            };

            const mockGetPayment = jest.fn(() => Promise.resolve(mockPayment));
            (mockPayments.getComponent as jest.Mock).mockReturnValue({ getPayment: mockGetPayment });

            const payment = await getCurrentUserPayment(mockPayments, 'payment_123');
            expect(payment).toEqual(mockPayment);
        });

        it('should get all payments for current user', async () => {
            const mockPaymentsList = [{
                id: 'payment_123',
                amount: 1000,
                amount_capturable: 0,
                amount_received: 1000,
                created: new Date().toUTCString(),
                currency: 'usd',
                customer: 'cus_123',
                description: 'Test payment',
                invoice: null,
                metadata: {},
                payment_method_types: ['card'],
                prices: [{ product: 'prod_123', price: 'price_123' }],
                status: 'succeeded' as PaymentStatus,
                uid: 'user_123'
            }];

            type PaymentDAOGetPaymentsReturnType = Promise<Payment[]>;
            const mockGetPayments = jest.fn<() => PaymentDAOGetPaymentsReturnType>()
                .mockResolvedValue(mockPaymentsList);
            (mockPayments.getComponent as jest.Mock).mockReturnValue({ getPayments: mockGetPayments });

            const payments = await getCurrentUserPayments(mockPayments);
            expect(payments).toEqual(mockPaymentsList);
        });
    });

    describe('onCurrentUserPaymentUpdate', () => {
        it('should set up payment update listener', () => {
            const mockOnUpdate = jest.fn();
            const mockOnError = jest.fn();
            const mockUnsubscribe = jest.fn();

            const mockOnPaymentUpdate = jest.fn().mockReturnValue(mockUnsubscribe);
            (mockPayments.getComponent as jest.Mock).mockReturnValue({
                onPaymentUpdate: mockOnPaymentUpdate
            });

            const unsubscribe = onCurrentUserPaymentUpdate(
                mockPayments,
                mockOnUpdate,
                mockOnError
            );

            expect(unsubscribe).toBe(mockUnsubscribe);
        });
    });
});