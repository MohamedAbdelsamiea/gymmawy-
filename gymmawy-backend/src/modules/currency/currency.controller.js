import { Currency } from '@prisma/client';
import { detectCurrencyService } from '../../middlewares/currencyMiddleware.js';
import { getPricesByCurrency, getCurrencyRates } from './currency.service.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

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
 * Get location data from IP using FindIP.net
 */
export async function getLocationData(req, res, next) {
  try {
    const FINDIP_API_KEY = process.env.FINDIP_API_KEY;
    const FINDIP_BASE_URL = 'https://api.findip.net';
    
    if (!FINDIP_API_KEY) {
      throw new Error('FindIP API key not configured');
    }
    
    // Get client IP
    const getClientIP = (req) => {
      const forwardedFor = req.headers['x-forwarded-for'];
      const realIP = req.headers['x-real-ip'];
      const cfConnectingIP = req.headers['cf-connecting-ip'];
      const xClientIP = req.headers['x-client-ip'];
      
      if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[0];
      }
      
      if (realIP) return realIP;
      if (cfConnectingIP) return cfConnectingIP;
      if (xClientIP) return xClientIP;
      
      return (
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1'
      );
    };
    
    const clientIP = getClientIP(req);
    
    // Skip localhost for external API calls
    if (clientIP === '127.0.0.1' || clientIP === '::1') {
      return res.json({
        success: true,
        data: {
          country_code: 'US',
          country_name: 'United States',
          city: 'Localhost',
          region: 'Development',
          timezone: 'UTC',
          currency: 'USD',
          currency_name: 'US Dollar'
        },
        fallback: true,
        reason: 'localhost'
      });
    }
    
    const url = `${FINDIP_BASE_URL}/${clientIP}/?token=${FINDIP_API_KEY}`;
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Gymmawy-Location-Detection/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      data: {
        country_code: data.country?.iso_code || data.country_code || data.country?.code,
        country_name: data.country?.names?.en || data.country_name || data.country?.name,
        city: data.city?.names?.en || data.city || data.location?.city,
        region: data.subdivisions?.[0]?.names?.en || data.region || data.location?.region,
        timezone: data.location?.time_zone || data.timezone || data.location?.timezone,
        currency: data.currency || data.country?.currency,
        currency_name: data.currency_name || data.country?.currency_name
      }
    });
  } catch (error) {
    console.error('Location data fetch error:', error.message);
    
    // Return fallback data instead of error
    res.json({
      success: true,
      data: {
        country_code: 'US',
        country_name: 'United States',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'UTC',
        currency: 'USD',
        currency_name: 'US Dollar'
      },
      fallback: true,
      error: error.message
    });
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
