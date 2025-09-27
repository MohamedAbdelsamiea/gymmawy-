import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../express.js';
import tabbyService from '../services/tabbyService.js';
import { getPrismaClient } from '../config/db.js';

const prisma = getPrismaClient();

// Mock the Tabby service
jest.mock('../services/tabbyService.js');

describe('Tabby Payment Integration', () => {
  let authToken;
  let userId;
  let mockUser;
  let mockPaymentData;

  beforeEach(async () => {
    // Create a test user
    mockUser = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        mobileNumber: '+1234567890',
        password: 'hashedpassword',
        isEmailVerified: true
      }
    });

    userId = mockUser.id;

    // Mock auth token (you might need to generate a real JWT token)
    authToken = 'mock-jwt-token';

    // Mock payment data
    mockPaymentData = {
      amount: 100.00,
      currency: 'EGP',
      description: 'Test payment',
      paymentableId: 'test-order-id',
      paymentableType: 'PRODUCT',
      lang: 'en',
      buyer: {
        phone: '+1234567890',
        email: 'test@example.com',
        name: 'Test User',
        dob: '1990-01-01'
      },
      shipping_address: {
        line1: '123 Test Street',
        city: 'Cairo',
        zip: '12345',
        country: 'EG'
      },
      items: [
        {
          title: 'Test Product',
          description: 'Test product description',
          quantity: 1,
          unit_price: '100.00',
          category: 'electronics'
        }
      ]
    };

    // Mock successful Tabby responses
    tabbyService.createCheckoutSession.mockResolvedValue({
      id: 'test-session-id',
      payment: {
        id: 'test-payment-id',
        status: 'NEW',
        amount: '100.00',
        currency: 'EGP'
      },
      status: 'NEW',
      configuration: {
        available_products: {
          installments: [
            {
              web_url: 'https://checkout.tabby.ai/test-session-id'
            }
          ]
        }
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany({
      where: { userId }
    });
    await prisma.user.deleteMany({
      where: { id: userId }
    });

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('POST /api/tabby/checkout', () => {
    test('should create a Tabby checkout session successfully', async () => {
      const response = await request(app)
        .post('/api/tabby/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockPaymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.checkout_session).toBeDefined();
      expect(response.body.checkout_session.id).toBe('test-session-id');
      expect(response.body.checkout_session.payment_id).toBe('test-payment-id');
      expect(response.body.payment).toBeDefined();

      // Verify Tabby service was called with correct data
      expect(tabbyService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          payment: expect.objectContaining({
            amount: '100.00',
            currency: 'EGP',
            buyer: expect.objectContaining({
              email: 'test@example.com',
              name: 'Test User'
            })
          }),
          lang: 'en',
          merchant_urls: expect.objectContaining({
            success: expect.stringContaining('/payment/success'),
            cancel: expect.stringContaining('/payment/cancel'),
            failure: expect.stringContaining('/payment/failure')
          })
        })
      );
    });

    test('should return 400 for invalid payment data', async () => {
      const invalidData = {
        ...mockPaymentData,
        amount: -100 // Invalid negative amount
      };

      await request(app)
        .post('/api/tabby/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('should return 401 for missing authentication', async () => {
      await request(app)
        .post('/api/tabby/checkout')
        .send(mockPaymentData)
        .expect(401);
    });

    test('should handle Tabby API errors gracefully', async () => {
      // Mock Tabby service to throw an error
      tabbyService.createCheckoutSession.mockRejectedValue(
        new Error('Tabby API error')
      );

      await request(app)
        .post('/api/tabby/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockPaymentData)
        .expect(500);
    });
  });

  describe('POST /api/tabby/webhook', () => {
    test('should handle payment.created webhook', async () => {
      const webhookData = {
        event: 'payment.created',
        payment: {
          id: 'test-payment-id',
          status: 'NEW',
          amount: '100.00',
          currency: 'EGP'
        }
      };

      const response = await request(app)
        .post('/api/tabby/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    test('should handle payment.authorized webhook', async () => {
      // First create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'PENDING',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const webhookData = {
        event: 'payment.authorized',
        payment: {
          id: 'test-payment-id',
          status: 'AUTHORIZED',
          amount: '100.00',
          currency: 'EGP'
        }
      };

      const response = await request(app)
        .post('/api/tabby/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.received).toBe(true);

      // Verify payment status was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });

      expect(updatedPayment.status).toBe('AUTHORIZED');
      expect(updatedPayment.processedAt).toBeDefined();
    });

    test('should handle payment.closed webhook', async () => {
      // First create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'AUTHORIZED',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const webhookData = {
        event: 'payment.closed',
        payment: {
          id: 'test-payment-id',
          status: 'CLOSED',
          amount: '100.00',
          currency: 'EGP'
        }
      };

      const response = await request(app)
        .post('/api/tabby/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.received).toBe(true);

      // Verify payment status was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });

      expect(updatedPayment.status).toBe('COMPLETED');
    });

    test('should handle payment.rejected webhook', async () => {
      // First create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'PENDING',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const webhookData = {
        event: 'payment.rejected',
        payment: {
          id: 'test-payment-id',
          status: 'REJECTED',
          amount: '100.00',
          currency: 'EGP',
          rejection_reason: 'Insufficient funds'
        }
      };

      const response = await request(app)
        .post('/api/tabby/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.received).toBe(true);

      // Verify payment status was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });

      expect(updatedPayment.status).toBe('FAILED');
    });
  });

  describe('GET /api/tabby/payment/:paymentId/status', () => {
    test('should get payment status successfully', async () => {
      // Mock Tabby service response
      tabbyService.getPayment.mockResolvedValue({
        id: 'test-payment-id',
        status: 'AUTHORIZED',
        amount: '100.00',
        currency: 'EGP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'PENDING',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const response = await request(app)
        .get('/api/tabby/payment/test-payment-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.payment_id).toBe('test-payment-id');
      expect(response.body.status).toBe('AUTHORIZED');
      expect(response.body.tabby_status).toBe('AUTHORIZED');

      // Verify Tabby service was called
      expect(tabbyService.getPayment).toHaveBeenCalledWith('test-payment-id');
    });

    test('should return 404 for non-existent payment', async () => {
      await request(app)
        .get('/api/tabby/payment/non-existent-payment-id/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/tabby/payment/:paymentId/capture', () => {
    test('should capture payment successfully', async () => {
      // Mock Tabby service response
      tabbyService.capturePayment.mockResolvedValue({
        id: 'test-payment-id',
        status: 'CLOSED',
        amount: '100.00',
        currency: 'EGP'
      });

      // Create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'AUTHORIZED',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const captureData = {
        amount: '100.00',
        tax_amount: '0.00',
        shipping_amount: '0.00',
        discount_amount: '0.00'
      };

      const response = await request(app)
        .post('/api/tabby/payment/test-payment-id/capture')
        .set('Authorization', `Bearer ${authToken}`)
        .send(captureData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();

      // Verify Tabby service was called
      expect(tabbyService.capturePayment).toHaveBeenCalledWith('test-payment-id', captureData);
    });
  });

  describe('POST /api/tabby/payment/:paymentId/refund', () => {
    test('should refund payment successfully', async () => {
      // Mock Tabby service response
      tabbyService.refundPayment.mockResolvedValue({
        id: 'test-payment-id',
        status: 'REFUNDED',
        amount: '100.00',
        currency: 'EGP'
      });

      // Create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'COMPLETED',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const refundData = {
        amount: '50.00',
        reason: 'Customer request',
        comment: 'Partial refund'
      };

      const response = await request(app)
        .post('/api/tabby/payment/test-payment-id/refund')
        .set('Authorization', `Bearer ${authToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();

      // Verify Tabby service was called
      expect(tabbyService.refundPayment).toHaveBeenCalledWith('test-payment-id', refundData);
    });
  });

  describe('POST /api/tabby/payment/:paymentId/close', () => {
    test('should close payment successfully', async () => {
      // Mock Tabby service response
      tabbyService.closePayment.mockResolvedValue({
        id: 'test-payment-id',
        status: 'CLOSED',
        amount: '100.00',
        currency: 'EGP'
      });

      // Create a payment in the database
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: 100.00,
          currency: 'EGP',
          method: 'TABBY',
          status: 'AUTHORIZED',
          paymentReference: 'TEST-PAY-REF',
          transactionId: 'test-payment-id',
          paymentableId: 'test-order-id',
          paymentableType: 'PRODUCT'
        }
      });

      const response = await request(app)
        .post('/api/tabby/payment/test-payment-id/close')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();

      // Verify Tabby service was called
      expect(tabbyService.closePayment).toHaveBeenCalledWith('test-payment-id');
    });
  });

  describe('POST /api/tabby/webhook/setup', () => {
    test('should setup webhook successfully', async () => {
      // Mock Tabby service response
      tabbyService.createWebhook.mockResolvedValue({
        id: 'webhook-id',
        url: 'https://example.com/webhook',
        is_test: true,
        events: ['payment.*']
      });

      const webhookData = {
        url: 'https://example.com/webhook',
        is_test: true,
        events: ['payment.*']
      };

      const response = await request(app)
        .post('/api/tabby/webhook/setup')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.webhook).toBeDefined();

      // Verify Tabby service was called
      expect(tabbyService.createWebhook).toHaveBeenCalledWith(webhookData);
    });
  });
});
