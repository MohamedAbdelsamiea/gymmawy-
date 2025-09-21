import { Currency } from '@prisma/client';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Get prices filtered by currency
 */
export async function getPricesByCurrency({ currency, purchasableType, purchasableId }) {
  try {
    const whereClause = {
      currency,
      ...(purchasableType && { purchasableType }),
      ...(purchasableId && { purchasableId })
    };
    
    const prices = await prisma.price.findMany({
      where: whereClause,
      include: {
        // Include related purchasable entity based on type
        ...(purchasableType && getPurchasableInclude(purchasableType))
      },
      orderBy: {
        amount: 'asc'
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching prices by currency:', error);
    throw error;
  }
}

/**
 * Get currency exchange rates (mock implementation)
 * In production, integrate with a real exchange rate API
 */
export async function getCurrencyRates(baseCurrency = 'USD') {
  try {
    // Mock exchange rates - in production, fetch from real API
    const mockRates = {
      USD: { EGP: 30.5, SAR: 3.75, AED: 3.67, USD: 1.0 },
      EGP: { USD: 0.033, SAR: 0.123, AED: 0.120, EGP: 1.0 },
      SAR: { USD: 0.267, EGP: 8.13, AED: 0.98, SAR: 1.0 },
      AED: { USD: 0.272, EGP: 8.30, SAR: 1.02, AED: 1.0 }
    };
    
    const rates = mockRates[baseCurrency] || mockRates.USD;
    
    return {
      base: baseCurrency,
      rates,
      lastUpdated: new Date().toISOString(),
      source: 'mock' // In production, indicate real source
    };
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    throw error;
  }
}

/**
 * Convert price from one currency to another
 */
export async function convertPrice(amount, fromCurrency, toCurrency) {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const rates = await getCurrencyRates(fromCurrency);
    const rate = rates.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Error converting price:', error);
    throw error;
  }
}

/**
 * Get purchasable entity include based on type
 */
function getPurchasableInclude(purchasableType) {
  switch (purchasableType) {
    case 'PRODUCT':
      return {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      };
    case 'SUBSCRIPTION':
      return {
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      };
    case 'PROGRAMME':
      return {
        programme: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true
          }
        }
      };
    default:
      return {};
  }
}

/**
 * Get prices for subscription plans in specific currency
 */
export async function getSubscriptionPlanPrices(planId, currency) {
  try {
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'SUBSCRIPTION',
        purchasableId: planId,
        currency
      },
      orderBy: {
        amount: 'asc'
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching subscription plan prices:', error);
    throw error;
  }
}

/**
 * Get prices for products in specific currency
 */
export async function getProductPrices(productId, currency) {
  try {
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'PRODUCT',
        purchasableId: productId,
        currency
      },
      orderBy: {
        amount: 'asc'
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching product prices:', error);
    throw error;
  }
}

/**
 * Get prices for programmes in specific currency
 */
export async function getProgrammePrices(programmeId, currency) {
  try {
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'PROGRAMME',
        purchasableId: programmeId,
        currency
      },
      orderBy: {
        amount: 'asc'
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching programme prices:', error);
    throw error;
  }
}

/**
 * Get all available currencies for a specific purchasable entity
 */
export async function getAvailableCurrenciesForEntity(purchasableType, purchasableId) {
  try {
    const currencies = await prisma.price.findMany({
      where: {
        purchasableType,
        purchasableId
      },
      select: {
        currency: true
      },
      distinct: ['currency']
    });
    
    return currencies.map(c => c.currency);
  } catch (error) {
    console.error('Error fetching available currencies:', error);
    throw error;
  }
}
