import { Currency } from '@prisma/client';

// FindIP.net API configuration
const FINDIP_API_KEY = process.env.FINDIP_API_KEY;
const FINDIP_BASE_URL = 'https://api.findip.net';

if (!FINDIP_API_KEY) {
  console.warn('⚠️ FINDIP_API_KEY not found. Currency detection will use fallback.');
} else {
  console.log('✅ FindIP.net API key configured successfully');
}

/**
 * Main currency detection middleware
 */
export async function currencyDetectionMiddleware(req, res, next) {
  try {
    
    // Check for user currency preference from headers or cookies
    const userCurrencyPreference = req.headers['x-user-currency'] || req.cookies?.userCurrencyPreference;
    
    if (userCurrencyPreference && Object.values(Currency).includes(userCurrencyPreference)) {
      console.log(`👤 User currency preference: ${userCurrencyPreference}`);
      req.currency = userCurrencyPreference;
      res.set('X-Currency', userCurrencyPreference);
      res.set('X-Currency-Source', 'user-preference');
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
    res.set('X-Currency-Source', 'ip-detection');
    
    // Log currency detection (less verbose in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌍 Currency detected: ${currency} for IP: ${clientIP}`);
    } else {
      console.log(`🌍 Currency: ${currency} for IP: ${clientIP.substring(0, 8)}...`);
    }
    
    next();
  } catch (error) {
    console.error('Currency detection error:', error.message);
    
    // Fallback to EGP if detection fails
    const fallbackCurrency = Currency.EGP;
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
      detectedFrom: FINDIP_API_KEY ? 'ip_geolocation' : 'fallback',
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
    console.log(`🏠 Localhost detected, using dev currency: ${process.env.DEV_CURRENCY || Currency.USD}`);
    return process.env.DEV_CURRENCY || Currency.USD; // Default for localhost
  }
  
  try {
    const countryCode = await getCountryFromIP(ip);
    
    if (!countryCode) {
      console.log(`⚠️ No country code returned for IP: ${ip}, using default currency: ${Currency.USD}`);
      return Currency.USD;
    }
    
    console.log(`🌍 Country code detected: ${countryCode} for IP: ${ip}`);
    
    switch (countryCode) {
      case 'EG': 
        console.log(`✅ Egypt detected, using EGP`);
        return Currency.EGP;
      case 'SA': 
        console.log(`✅ Saudi Arabia detected, using SAR`);
        return Currency.SAR;
      case 'AE': 
        console.log(`✅ UAE detected, using AED`);
        return Currency.AED;
      default: 
        console.log(`✅ Other country (${countryCode}) detected, using USD`);
        return Currency.USD; // Default for all other countries
    }
  } catch (error) {
    console.error('💥 Currency detection completely failed:', error);
    return Currency.USD;
  }
}

/**
 * Get country code from IP using FindIP.net API
 */
async function getCountryFromIP(ip) {
  // Check if API key is available
  if (!FINDIP_API_KEY) {
    console.warn('⚠️ FindIP API key not available, using fallback');
    return null;
  }

  try {
    console.log(`🔍 FindIP.net lookup for IP: ${ip}`);
    const url = `${FINDIP_BASE_URL}/${ip}/?token=${FINDIP_API_KEY}`;
    const response = await fetch(url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Gymmawy-Currency-Detection/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const countryCode = data.country?.iso_code || data.country_code || data.country?.code;
    
    console.log(`✅ FindIP.net response for ${ip}:`, countryCode || 'No country code');
    return countryCode || null;
  } catch (err) {
    console.error('❌ FindIP.net lookup failed for IP:', ip);
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
