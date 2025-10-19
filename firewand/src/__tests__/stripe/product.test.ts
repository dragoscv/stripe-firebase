import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { firebaseApp } from '../../firebase/app';
import { Product, Price, getProduct, getProducts, getPrice, getPrices } from '../../stripe/product';
import { StripePayments } from '../../stripe/init';

jest.mock('../../firebase/app');

describe('Stripe Products', () => {
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

  describe('getProduct', () => {
    it('should get a single product by ID', async () => {
      const mockProduct: Product = {
        id: 'prod_123',
        name: 'Test Product',
        active: true,
        description: 'A test product',
        images: [],
        metadata: {},
        role: 'basic',
        prices: []
      };

      const mockGetProduct: jest.MockedFunction<(id: string) => Promise<Product>> = jest.fn();
      mockGetProduct.mockResolvedValue(mockProduct);
      (mockPayments.getComponent as jest.Mock).mockReturnValue({ getProduct: mockGetProduct });

      const product = await getProduct(mockPayments, 'prod_123');
      expect(product).toEqual(mockProduct);
      expect(mockGetProduct).toHaveBeenCalledWith('prod_123');
    });
  });

  describe('getProducts', () => {
    it('should get all products with optional filters', async () => {
      const mockProducts: Product[] = [{
        id: 'prod_123',
        name: 'Test Product',
        active: true,
        description: 'A test product',
        images: [],
        metadata: {},
        role: 'basic',
        prices: []
      }];

      const mockGetProducts: jest.MockedFunction<(options: { activeOnly: boolean }) => Promise<Product[]>> = jest.fn();
      mockGetProducts.mockResolvedValue(mockProducts);
      (mockPayments.getComponent as jest.Mock).mockReturnValue({ getProducts: mockGetProducts });

      const products = await getProducts(mockPayments, { activeOnly: true });
      expect(products).toEqual(mockProducts);
      expect(mockGetProducts).toHaveBeenCalledWith({ activeOnly: true });
    });
  });

  describe('getPrice', () => {
    it('should get a single price by ID', async () => {
      const mockPrice: Price = {
        id: 'price_123',
        active: true,
        currency: 'usd',
        description: 'Monthly subscription',
        unit_amount: 1000,
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        product: 'prod_123',
        metadata: {},
        trial_period_days: null,
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      };

      const mockGetPrice: jest.MockedFunction<(productId: string, priceId: string) => Promise<Price>> = jest.fn();
      mockGetPrice.mockResolvedValue(mockPrice);
      (mockPayments.getComponent as jest.Mock).mockReturnValue({ getPrice: mockGetPrice });

      const price = await getPrice(mockPayments, 'prod_123', 'price_123');
      expect(price).toEqual(mockPrice);
      expect(mockGetPrice).toHaveBeenCalledWith('prod_123', 'price_123');
    });
  });

  describe('getPrices', () => {
    it('should get all prices for a product', async () => {
      const mockPrices: Price[] = [{
        id: 'price_123',
        active: true,
        currency: 'usd',
        description: 'Monthly subscription',
        unit_amount: 1000,
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        product: 'prod_123',
        metadata: {},
        trial_period_days: null,
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      }];

      const mockGetPrices: jest.MockedFunction<(productId: string, options: { assertProduct: boolean }) => Promise<Price[]>> = jest.fn();
      mockGetPrices.mockResolvedValue(mockPrices);
      (mockPayments.getComponent as jest.Mock).mockReturnValue({ getPrices: mockGetPrices });

      const prices = await getPrices(mockPayments, 'prod_123');
      expect(prices).toEqual(mockPrices);
      expect(mockGetPrices).toHaveBeenCalledWith('prod_123', { assertProduct: true });
    });
  });
});