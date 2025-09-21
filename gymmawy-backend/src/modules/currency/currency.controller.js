import { Currency } from '@prisma/client';
import { detectCurrencyService } from '../../middlewares/currencyMiddleware.js';
import { getPricesByCurrency, getCurrencyRates } from './currency.service.js';

/**
 * Detect user's currency based on location
 */
export async function detectCurrency(req, res, next) {
  try {
    const result = await detectCurrencyService(req);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get prices for a specific currency
 */
export async function getPrices(req, res, next) {
  try {
    const { currency = req.currency } = req.query;
    const { purchasableType, purchasableId } = req.query;
    
    if (!Object.values(Currency).includes(currency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: `Invalid currency. Must be one of: ${Object.values(Currency).join(', ')}`
        }
      });
    }
    
    const prices = await getPricesByCurrency({
      currency,
      purchasableType,
      purchasableId
    });
    
    res.json({
      success: true,
      data: prices,
      currency,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get currency exchange rates
 */
export async function getRates(req, res, next) {
  try {
    const { base = 'USD' } = req.query;
    
    if (!Object.values(Currency).includes(base)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BASE_CURRENCY',
          message: `Invalid base currency. Must be one of: ${Object.values(Currency).join(', ')}`
        }
      });
    }
    
    const rates = await getCurrencyRates(base);
    
    res.json({
      success: true,
      data: rates,
      base,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user's preferred currency
 */
export async function updatePreferredCurrency(req, res, next) {
  try {
    const { currency } = req.body;
    const userId = req.user.id;
    
    if (!Object.values(Currency).includes(currency)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: `Invalid currency. Must be one of: ${Object.values(Currency).join(', ')}`
        }
      });
    }
    
    // Update user's preferred currency
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { preferredCurrency: currency },
      select: {
        id: true,
        email: true,
        preferredCurrency: true
      }
    });
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Preferred currency updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available currencies with their details
 */
export async function getAvailableCurrencies(req, res, next) {
  try {
    const currencies = [
      {
        code: Currency.EGP,
        name: 'Egyptian Pound',
        symbol: '£',
        country: 'Egypt',
        flag: '🇪🇬'
      },
      {
        code: Currency.SAR,
        name: 'Saudi Riyal',
        symbol: 'ر.س',
        country: 'Saudi Arabia',
        flag: '🇸🇦'
      },
      {
        code: Currency.AED,
        name: 'UAE Dirham',
        symbol: 'د.إ',
        country: 'United Arab Emirates',
        flag: '🇦🇪'
      },
      {
        code: Currency.USD,
        name: 'US Dollar',
        symbol: '$',
        country: 'United States',
        flag: '🇺🇸'
      }
    ];
    
    res.json({
      success: true,
      data: currencies,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}
