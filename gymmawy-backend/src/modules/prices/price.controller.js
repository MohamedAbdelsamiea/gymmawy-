import { z } from 'zod';
import { parseOrThrow } from '../../utils/validation.js';
import * as service from './price.service.js';

/**
 * Get prices for a specific purchasable entity
 */
export async function getPricesByPurchasable(req, res, next) {
  try {
    const schema = z.object({
      purchasableId: z.string().uuid(),
      purchasableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION']),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional()
    });

    const { purchasableId, purchasableType, currency } = parseOrThrow(schema, req.query);

    const prices = await service.getPricesByPurchasable(purchasableId, purchasableType, currency);

    res.json({
      success: true,
      data: prices,
      meta: {
        purchasableId,
        purchasableType,
        currency: currency || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all prices for a specific currency
 */
export async function getPricesByCurrency(req, res, next) {
  try {
    const schema = z.object({
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']),
      purchasableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION']).optional()
    });

    const { currency, purchasableType } = parseOrThrow(schema, req.query);

    const prices = await service.getPricesByCurrency(currency, purchasableType);

    res.json({
      success: true,
      data: prices,
      meta: {
        currency,
        purchasableType: purchasableType || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new price
 */
export async function createPrice(req, res, next) {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']),
      purchasableId: z.string().uuid(),
      purchasableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION', 'ORDER', 'PROGRAMME'])
    });

    const priceData = parseOrThrow(schema, req.body);

    const price = await service.createPrice(priceData);

    res.status(201).json({
      success: true,
      data: price,
      message: 'Price created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a price
 */
export async function updatePrice(req, res, next) {
  try {
    const { id } = req.params;

    const schema = z.object({
      amount: z.number().positive().optional(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional()
    });

    const updateData = parseOrThrow(schema, req.body);

    const price = await service.updatePrice(id, updateData);

    res.json({
      success: true,
      data: price,
      message: 'Price updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a price
 */
export async function deletePrice(req, res, next) {
  try {
    const { id } = req.params;

    const price = await service.deletePrice(id);

    res.json({
      success: true,
      data: price,
      message: 'Price deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get price by ID
 */
export async function getPriceById(req, res, next) {
  try {
    const { id } = req.params;

    const price = await service.getPriceById(id);

    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscription plan prices
 */
export async function getSubscriptionPlanPrices(req, res, next) {
  try {
    const { planId } = req.params;
    const { currency } = req.query;

    const prices = await service.getSubscriptionPlanPrices(planId, currency);

    res.json({
      success: true,
      data: prices,
      meta: {
        planId,
        currency: currency || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get product prices
 */
export async function getProductPrices(req, res, next) {
  try {
    const { productId } = req.params;
    const { currency } = req.query;

    const prices = await service.getProductPrices(productId, currency);

    res.json({
      success: true,
      data: prices,
      meta: {
        productId,
        currency: currency || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get programme prices
 */
export async function getProgrammePrices(req, res, next) {
  try {
    const { programmeId } = req.params;
    const { currency } = req.query;

    const prices = await service.getProgrammePrices(programmeId, currency);

    res.json({
      success: true,
      data: prices,
      meta: {
        programmeId,
        currency: currency || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get medical prices for subscription plans
 */
export async function getMedicalPrices(req, res, next) {
  try {
    const { planId } = req.params;
    const { currency } = req.query;

    const prices = await service.getMedicalPrices(planId, currency);

    res.json({
      success: true,
      data: prices,
      meta: {
        planId,
        currency: currency || 'all',
        count: prices.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available currencies for an entity
 */
export async function getAvailableCurrencies(req, res, next) {
  try {
    const schema = z.object({
      purchasableId: z.string().uuid(),
      purchasableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION', 'ORDER', 'PROGRAMME'])
    });

    const { purchasableId, purchasableType } = parseOrThrow(schema, req.query);

    const currencies = await service.getAvailableCurrenciesForEntity(purchasableId, purchasableType);

    res.json({
      success: true,
      data: currencies,
      meta: {
        purchasableId,
        purchasableType,
        count: currencies.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk create prices
 */
export async function createBulkPrices(req, res, next) {
  try {
    const schema = z.object({
      purchasableId: z.string().uuid(),
      purchasableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION']),
      prices: z.array(z.object({
        currency: z.enum(['EGP', 'SAR', 'AED', 'USD']),
        amount: z.number().positive()
      })).min(1)
    });

    const { purchasableId, purchasableType, prices } = parseOrThrow(schema, req.body);

    const createdPrices = await service.createBulkPrices(purchasableId, purchasableType, prices);

    res.status(201).json({
      success: true,
      data: createdPrices,
      message: `${createdPrices.length} prices created successfully`
    });
  } catch (error) {
    next(error);
  }
}
