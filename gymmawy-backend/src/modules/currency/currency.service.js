import { Currency } from '@prisma/client';
import { getPrismaClient } from '../../config/db.js';
import axios from 'axios';

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
    // Use exchangerate-api.com for free FX rates (no API key required)
    const url = `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(baseCurrency)}`;

    const response = await axios.get(url, { timeout: 5000 });
    if (!response.data || !response.data.rates) {
      throw new Error('Failed to fetch currency rates');
    }

    const rates = response.data.rates;
    // Filter to only the currencies we support
    const supportedCurrencies = ['USD', 'AED', 'SAR', 'EGP'];
    const filteredRates = {};
    supportedCurrencies.forEach(currency => {
      if (rates[currency]) {
        filteredRates[currency] = rates[currency];
      }
    });

    return {
      base: baseCurrency,
      rates: filteredRates,
      lastUpdated: new Date().toISOString(),
      source: 'exchangerate-api.com'
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
