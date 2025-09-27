/**
 * Production Currency Middleware Configuration
 * This file contains production-specific currency detection logic
 */

import { Currency } from '@prisma/client';

/**
 * Production currency detection with enhanced fallback strategies
 */
export async function productionCurrencyDetection(req, res, next) {
  try {
    const clientIP = getClientIP(req);
    
    // 1. Check for development override first
    if (process.env.DEV_CURRENCY) {
      req.currency = process.env.DEV_CURRENCY;
      res.set('X-Currency', process.env.DEV_CURRENCY);
      next();
      return;
    }
    
    // 2. Check for user preference in session/cookie
    const userPreferredCurrency = getUserPreferredCurrency(req);
    if (userPreferredCurrency) {
      req.currency = userPreferredCurrency;
      res.set('X-Currency', userPreferredCurrency);
      next();
      return;
    }
    
    // 3. Try IP-based detection
    const detectedCurrency = await detectCurrencyFromIP(req);
    
    // 4. Set currency with fallback
    const finalCurrency = detectedCurrency || process.env.DEFAULT_CURRENCY || Currency.USD;
    req.currency = finalCurrency;
    res.set('X-Currency', finalCurrency);
    
    // 5. Log for monitoring (production-safe)
    console.log(`Currency: ${finalCurrency} for IP: ${clientIP.substring(0, 8)}...`);
    
    next();
  } catch (error) {
    console.error('Production currency detection error:', error.message);
    
    // Ultimate fallback
    const fallbackCurrency = process.env.DEFAULT_CURRENCY || Currency.USD;
    req.currency = fallbackCurrency;
    res.set('X-Currency', fallbackCurrency);
    
    next();
  }
}

/**
 * Get user's preferred currency from session or cookie
 */
function getUserPreferredCurrency(req) {
  // Check session first
  if (req.session?.user?.preferredCurrency) {
    return req.session.user.preferredCurrency;
  }
  
  // Check cookie
  if (req.cookies?.preferredCurrency) {
    return req.cookies.preferredCurrency;
  }
  
  // Check header
  if (req.headers['x-preferred-currency']) {
    return req.headers['x-preferred-currency'];
  }
  
  return null;
}

/**
 * Enhanced IP detection for production
 */
async function detectCurrencyFromIP(req) {
  const ip = getClientIP(req);
  
  // Skip localhost and private IPs
  if (isLocalOrPrivateIP(ip)) {
    return process.env.DEFAULT_CURRENCY || Currency.USD;
  }
  
  try {
    // Use MaxMind if available
    if (global.maxmindClient) {
      const response = await global.maxmindClient.country(ip);
      const countryCode = response.country?.isoCode;
      
      if (countryCode) {
        return mapCountryToCurrency(countryCode);
      }
    }
    
    // Fallback to simple IP range detection
    return detectCurrencyFromIPRange(ip);
    
  } catch (error) {
    console.error('IP-based currency detection failed:', error.message);
    return null;
  }
}

/**
 * Check if IP is local or private
 */
function isLocalOrPrivateIP(ip) {
  if (!ip) return true;
  
  // Localhost
  if (ip === '127.0.0.1' || ip === '::1') return true;
  
  // Private IP ranges
  const privateRanges = [
    /^10\./,           // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,     // 192.168.0.0/16
    /^fc00:/,          // IPv6 private
    /^fe80:/           // IPv6 link-local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Map country code to currency
 */
function mapCountryToCurrency(countryCode) {
  const currencyMap = {
    'EG': Currency.EGP,
    'SA': Currency.SAR,
    'AE': Currency.AED,
    'US': Currency.USD,
    'GB': Currency.USD, // Default to USD for UK
    'CA': Currency.USD, // Default to USD for Canada
    'AU': Currency.USD, // Default to USD for Australia
  };
  
  return currencyMap[countryCode] || Currency.USD;
}

/**
 * Simple IP range-based currency detection
 */
function detectCurrencyFromIPRange(ip) {
  // This is a simplified approach for production
  // In reality, you'd want to use a proper IP geolocation service
  
  // Example IP ranges (these would need to be updated with real data)
  const ipRanges = {
    '41.': Currency.EGP,    // Egypt
    '185.': Currency.SAR,   // Saudi Arabia (example)
    '94.': Currency.AED,    // UAE (example)
  };
  
  for (const [prefix, currency] of Object.entries(ipRanges)) {
    if (ip.startsWith(prefix)) {
      return currency;
    }
  }
  
  return Currency.USD; // Default
}

/**
 * Enhanced client IP detection for production
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
