import { WebServiceClient } from '@maxmind/geoip2-node';
import { Currency } from '@prisma/client';

// Initialize MaxMind client with error handling
let client = null;
try {
  if (process.env.MAXMIND_ACCOUNT_ID && process.env.MAXMIND_LICENSE_KEY) {
    client = new WebServiceClient(
      process.env.MAXMIND_ACCOUNT_ID,
      process.env.MAXMIND_LICENSE_KEY,
      { 
        host: 'geolite.info', // important for free GeoLite service
        timeout: 5000 // 5 second timeout
      }
    );
    console.log('✅ MaxMind client initialized successfully');
  } else {
    console.warn('⚠️ MaxMind credentials not found. Currency detection will use fallback.');
  }
} catch (error) {
  console.error('❌ Failed to initialize MaxMind client:', error.message);
}

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
    
    // Get currency from IP geolocation
    const currency = await detectCurrencyFromIP(req);
    const clientIP = getClientIP(req);
    
    // Set currency in request object for use in controllers
    req.currency = currency;
    
    // Set currency in response headers for frontend
    res.set('X-Currency', currency);
    
    // Log currency detection (less verbose in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌍 Currency detected: ${currency} for IP: ${clientIP}`);
    } else {
      console.log(`🌍 Currency: ${currency} for IP: ${clientIP.substring(0, 8)}...`);
    }
    
    next();
  } catch (error) {
    console.error('Currency detection error:', error.message);
    
    // Fallback to USD if detection fails
    const fallbackCurrency = process.env.DEV_CURRENCY || Currency.USD;
    req.currency = fallbackCurrency;
    res.set('X-Currency', fallbackCurrency);
    
    // Log fallback usage
    console.warn(`⚠️ Using fallback currency: ${fallbackCurrency}`);
    
    next();
  }
}

/**
 * Currency detection service for API endpoints
 */
export async function detectCurrencyService(req) {
  try {
    const currency = await detectCurrencyFromIP(req);
    const clientIP = getClientIP(req);
    
    return {
      success: true,
      currency,
      detectedFrom: client ? 'ip_geolocation' : 'fallback',
      clientIP: process.env.NODE_ENV === 'development' ? clientIP : clientIP.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Currency detection service error:', error.message);
    return {
      success: false,
      currency: process.env.DEV_CURRENCY || Currency.USD,
      error: 'Failed to detect currency',
      detectedFrom: 'fallback',
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
  // Check if client is available
  if (!client) {
    console.warn('⚠️ MaxMind client not available, using fallback currency detection');
    return null;
  }

  try {
    console.log(`🔍 MaxMind lookup for IP: ${ip}`);
    const response = await client.country(ip);
    const countryCode = response.country?.isoCode;
    console.log(`✅ MaxMind response for ${ip}:`, countryCode || 'No country code');
    return countryCode || null;
  } catch (err) {
    console.error('❌ MaxMind lookup failed for IP:', ip);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      type: err.constructor.name
    });
    
    // Don't log full stack trace in production
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Full error:', err);
    }
    
    return null;
  }
}

/**
 * Get client IP address from request
 * Handles various proxy configurations for production deployment
 */
function getClientIP(req) {
  // Check for various proxy headers (order matters for security)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  const xClientIP = req.headers['x-client-ip'];
  
  // Parse X-Forwarded-For (can contain multiple IPs)
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    // Return the first IP (original client)
    return ips[0];
  }
  
  // Check other proxy headers
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  if (xClientIP) return xClientIP;
  
  // Fallback to connection info
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1' // Ultimate fallback
  );
}
