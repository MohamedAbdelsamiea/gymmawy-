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
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
    
    if (!plan) return [];
    
    const prices = [];
    if (plan.priceEGP) prices.push({ amount: plan.priceEGP, currency: 'EGP' });
    if (plan.priceSAR) prices.push({ amount: plan.priceSAR, currency: 'SAR' });
    if (plan.priceAED) prices.push({ amount: plan.priceAED, currency: 'AED' });
    if (plan.priceUSD) prices.push({ amount: plan.priceUSD, currency: 'USD' });
    
    // Filter by currency if specified
    if (currency) {
      return prices.filter(p => p.currency === currency);
    }
    
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
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) return [];
    
    const prices = [];
    if (product.priceEGP) prices.push({ amount: product.priceEGP, currency: 'EGP' });
    if (product.priceSAR) prices.push({ amount: product.priceSAR, currency: 'SAR' });
    if (product.priceAED) prices.push({ amount: product.priceAED, currency: 'AED' });
    if (product.priceUSD) prices.push({ amount: product.priceUSD, currency: 'USD' });
    
    // Filter by currency if specified
    if (currency) {
      return prices.filter(p => p.currency === currency);
    }
    
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
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId }
    });
    
    if (!programme) return [];
    
    const prices = [];
    if (programme.priceEGP) prices.push({ amount: programme.priceEGP, currency: 'EGP' });
    if (programme.priceSAR) prices.push({ amount: programme.priceSAR, currency: 'SAR' });
    if (programme.priceAED) prices.push({ amount: programme.priceAED, currency: 'AED' });
    if (programme.priceUSD) prices.push({ amount: programme.priceUSD, currency: 'USD' });
    
    // Filter by currency if specified
    if (currency) {
      return prices.filter(p => p.currency === currency);
    }
    
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
    let entity = null;
    
    // Get the entity based on type
    switch (purchasableType) {
      case 'PRODUCT':
        entity = await prisma.product.findUnique({ where: { id: purchasableId } });
        break;
      case 'PROGRAMME':
        entity = await prisma.programme.findUnique({ where: { id: purchasableId } });
        break;
      case 'SUBSCRIPTION':
        entity = await prisma.subscriptionPlan.findUnique({ where: { id: purchasableId } });
        break;
      default:
        return [];
    }
    
    if (!entity) return [];
    
    // Check which currencies are available
    const currencies = [];
    if (entity.priceEGP) currencies.push('EGP');
    if (entity.priceSAR) currencies.push('SAR');
    if (entity.priceAED) currencies.push('AED');
    if (entity.priceUSD) currencies.push('USD');
    
    return currencies;
  } catch (error) {
    console.error('Error fetching available currencies:', error);
    throw error;
  }
}
