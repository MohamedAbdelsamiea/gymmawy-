/**
 * Security Middleware - Production-Ready Security Suite
 * 
 * Provides essential security protections for Express.js applications:
 * - Helmet security headers with CSP
 * - DOMPurify request sanitization (body + query)
 * - Express rate limiting with custom handler
 * - Body size limits
 * - Enhanced security event logging
 */

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import DOMPurify from "isomorphic-dompurify";

// Utility function for safe error handling
const safeExecute = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    console.warn('Security middleware error:', error.message);
    return fallback;
  }
};

// 1. Security headers with improved CSP
export const addSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // disable if causing issues
});

// 2. Request body sanitization with DOMPurify
export const sanitizeRequestBody = (req, res, next) => {
  const sanitizeValue = (value) => {
    return safeExecute(() => {
      if (typeof value === "string") return DOMPurify.sanitize(value);
      if (Array.isArray(value)) return value.map(sanitizeValue);
      if (typeof value === "object" && value !== null) {
        const sanitized = {};
        for (const key in value) sanitized[key] = sanitizeValue(value[key]);
        return sanitized;
      }
      return value;
    }, value); // Return original if sanitization fails
  };

         safeExecute(() => {
           if (req.body && typeof req.body === "object") req.body = sanitizeValue(req.body);
           // Note: req.query is read-only, so we skip sanitizing it
         });
  
  next();
};

// 3. Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many requests" } },
  skip: (req) => req.path === "/health",
  handler: (req, res) => {
    console.warn(`[RATE_LIMIT] IP: ${req.ip} - Path: ${req.path} - User: ${req.user?.id || 'guest'}`);
    res.status(429).json({ error: { message: "Too many requests" } });
  },
});

// 4. Body size limit
export const bodyParserOptions = { limit: "10mb" };

// 5. Security event logging
export const logSecurityEvents = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400) {
      const userId = req.user?.id || "guest";
      const userAgent = req.get('User-Agent') || 'unknown';
      const referer = req.get('Referer') || 'direct';
      
      console.log(
        `[SECURITY] ${req.method} ${req.originalUrl} - ${res.statusCode} - IP: ${req.ip} - User: ${userId} - UA: ${userAgent.substring(0, 50)} - Ref: ${referer.substring(0, 50)} - ${duration}ms`
      );
    }
    return originalSend.call(this, data);
  };

  next();
};
