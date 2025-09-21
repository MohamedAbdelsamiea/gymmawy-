import { getPrismaClient } from '../../config/db.js';
import { Currency, PurchasableType } from '@prisma/client';

const prisma = getPrismaClient();

/**
 * Get prices for a specific purchasable entity
 */
export async function getPricesByPurchasable(purchasableId, purchasableType, currency) {
  try {
    const whereClause = {
      purchasableId,
      purchasableType,
      ...(currency && { currency })
    };

    const prices = await prisma.price.findMany({
      where: whereClause,
      orderBy: {
        amount: 'asc'
      }
    });

    return prices;
  } catch (error) {
    console.error('Error fetching prices by purchasable:', error);
    throw error;
  }
}

/**
 * Get all prices for a specific currency
 */
export async function getPricesByCurrency(currency, purchasableType) {
  try {
    const whereClause = {
      currency,
      ...(purchasableType && { purchasableType })
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
 * Create a new price
 */
export async function createPrice(priceData) {
  try {
    const { amount, currency, purchasableId, purchasableType } = priceData;

    // Validate currency
    if (!Object.values(Currency).includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    // Validate purchasable type
    if (!Object.values(PurchasableType).includes(purchasableType)) {
      throw new Error(`Invalid purchasable type: ${purchasableType}`);
    }

    // Check if price already exists for this purchasable entity and currency
    const existingPrice = await prisma.price.findFirst({
      where: {
        purchasableId,
        purchasableType,
        currency
      }
    });

    if (existingPrice) {
      throw new Error(`Price already exists for this purchasable entity in ${currency}`);
    }

    const price = await prisma.price.create({
      data: {
        amount,
        currency,
        purchasableId,
        purchasableType
      }
    });

    return price;
  } catch (error) {
    console.error('Error creating price:', error);
    throw error;
  }
}

/**
 * Update a price
 */
export async function updatePrice(priceId, updateData) {
  try {
    const { amount, currency } = updateData;

    // Validate currency if provided
    if (currency && !Object.values(Currency).includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }

    const price = await prisma.price.update({
      where: { id: priceId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(currency && { currency })
      }
    });

    return price;
  } catch (error) {
    console.error('Error updating price:', error);
    throw error;
  }
}

/**
 * Delete a price
 */
export async function deletePrice(priceId) {
  try {
    const price = await prisma.price.delete({
      where: { id: priceId }
    });

    return price;
  } catch (error) {
    console.error('Error deleting price:', error);
    throw error;
  }
}

/**
 * Get price by ID
 */
export async function getPriceById(priceId) {
  try {
    const price = await prisma.price.findUnique({
      where: { id: priceId }
    });

    if (!price) {
      throw new Error('Price not found');
    }

    return price;
  } catch (error) {
    console.error('Error fetching price by ID:', error);
    throw error;
  }
}

/**
 * Get prices for subscription plans
 */
export async function getSubscriptionPlanPrices(planId, currency) {
  try {
    return getPricesByPurchasable(planId, 'PLAN', currency);
  } catch (error) {
    console.error('Error fetching subscription plan prices:', error);
    throw error;
  }
}

/**
 * Get prices for products
 */
export async function getProductPrices(productId, currency) {
  try {
    return getPricesByPurchasable(productId, 'PRODUCT', currency);
  } catch (error) {
    console.error('Error fetching product prices:', error);
    throw error;
  }
}

/**
 * Get prices for programmes
 */
export async function getProgrammePrices(programmeId, currency) {
  try {
    return getPricesByPurchasable(programmeId, 'PROGRAMME', currency);
  } catch (error) {
    console.error('Error fetching programme prices:', error);
    throw error;
  }
}

/**
 * Get medical prices for subscription plans
 */
export async function getMedicalPrices(planId, currency) {
  try {
    return getPricesByPurchasable(planId, 'MEDICAL', currency);
  } catch (error) {
    console.error('Error fetching medical prices:', error);
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
            description: true
          }
        }
      };
    case 'PLAN':
      return {
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      };
    case 'PROGRAMME':
      return {
        programme: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      };
    default:
      return {};
  }
}

/**
 * Get all available currencies for a purchasable entity
 */
export async function getAvailableCurrenciesForEntity(purchasableId, purchasableType) {
  try {
    const currencies = await prisma.price.findMany({
      where: {
        purchasableId,
        purchasableType
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

/**
 * Bulk create prices for multiple currencies
 */
export async function createBulkPrices(purchasableId, purchasableType, priceData) {
  try {
    const prices = [];
    
    for (const { currency, amount } of priceData) {
      const price = await createPrice({
        purchasableId,
        purchasableType,
        currency,
        amount
      });
      prices.push(price);
    }

    return prices;
  } catch (error) {
    console.error('Error creating bulk prices:', error);
    throw error;
  }
}
