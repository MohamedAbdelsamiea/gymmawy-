import { WebServiceClient } from '@maxmind/geoip2-node';
import { Currency } from '@prisma/client';

const client = new WebServiceClient(
  process.env.MAXMIND_ACCOUNT_ID,
  process.env.MAXMIND_LICENSE_KEY,
  { host: 'geolite.info' } // important for free GeoLite service
);

/**
 * Main currency detection middleware
 */
export async function currencyDetectionMiddleware(req, res, next) {
  try {
    // Check if DEV_CURRENCY is set for development override
    if (process.env.DEV_CURRENCY) {
      console.log(`🔧 DEV_CURRENCY override: ${process.env.DEV_CURRENCY}`);
      req.currency = process.env.DEV_CURRENCY;
      res.set('X-Currency', process.env.DEV_CURRENCY);
      next();
      return;
    }
    
    // Get currency from IP geolocation only
    const currency = await detectCurrencyFromIP(req);
    
    // Set currency in request object for use in controllers
    req.currency = currency;
    
    // Set currency in response headers for frontend
    res.set('X-Currency', currency);
    
    console.log(`🌍 Currency detected: ${currency} for IP: ${getClientIP(req)}`);
    
    next();
  } catch (error) {
    console.error('Currency detection error:', error);
    // Fallback to USD if detection fails
    req.currency = Currency.USD;
    res.set('X-Currency', Currency.USD);
    next();
  }
}

/**
 * Currency detection service for API endpoints
 */
export async function detectCurrencyService(req) {
  try {
    const currency = await detectCurrencyFromIP(req);
    
    return {
      success: true,
      currency,
      detectedFrom: 'ip_geolocation',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency detection service error:', error);
    return {
      success: false,
      currency: Currency.USD,
      error: 'Failed to detect currency',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Detect currency from IP using MaxMind Web Service
 */
async function detectCurrencyFromIP(req) {
  const ip = getClientIP(req);
  
  // Skip localhost - but allow override for development
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    // For development, you can override this by setting an environment variable
    return process.env.DEV_CURRENCY || Currency.USD; // Default for localhost
  }
  
  try {
    const countryCode = await getCountryFromIP(ip);
    
    if (!countryCode) {
      console.log(`⚠️ No country code returned for IP: ${ip}, using default currency`);
      return process.env.DEV_CURRENCY || Currency.USD;
    }
    
    switch (countryCode) {
      case 'EG': return Currency.EGP;
      case 'SA': return Currency.SAR;
      case 'AE': return Currency.AED;
      default: return Currency.USD; // Default for all other countries
    }
  } catch (error) {
    console.error('💥 Currency detection completely failed:', error);
    return process.env.DEV_CURRENCY || Currency.USD;
  }
}

/**
 * Get country code from IP using MaxMind Web Service
 */
async function getCountryFromIP(ip) {
  try {
    console.log(`🔍 MaxMind lookup for IP: ${ip}`);
    const response = await client.country(ip);
    console.log(`✅ MaxMind response for ${ip}:`, response.country?.isoCode || 'No country code');
    return response.country?.isoCode || null;
  } catch (err) {
    console.error('❌ MaxMind lookup failed for IP:', ip);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      fullError: err
    });
    return null;
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}
