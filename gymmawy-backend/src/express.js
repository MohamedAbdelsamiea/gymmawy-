import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { 
  addSecurityHeaders, 
  sanitizeRequestBody, 
  logSecurityEvents,
  rateLimiter,
  bodyParserOptions
} from "./middlewares/securityMiddleware.js";
import { requestLogger, errorLogger } from "./utils/logger.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import tabbyRoutes from "./modules/payments/tabby.routes.js";
import couponRoutes from "./modules/coupons/coupon.routes.js";
import leadRoutes from "./modules/leads/lead.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import programmeRoutes from "./modules/programmes/programme.routes.js";
import cmsRoutes from "./modules/cms/cms.routes.js";
import shippingRoutes from "./modules/shipping/shipping.routes.js";
import referralRoutes from "./modules/referrals/referral.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import imageRoutes from "./modules/images/image.routes.js";
import videoRoutes from "./modules/videos/video.routes.js";
import uploadRoutes from "./modules/uploads/upload.routes.js";
import loyaltyRoutes from "./modules/loyalty/loyalty.routes.js";
import currencyRoutes from "./modules/currency/currency.routes.js";
import priceRoutes from "./modules/prices/price.routes.js";
import fileRoutes from "./routes/fileRoutes.js";

const app = express();

app.set("trust proxy", 1);

// Security middleware (order matters!)
app.use(addSecurityHeaders);
app.use(compression());
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000", 
      "http://localhost:3001", 
      "http://localhost:5173"
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(express.json(bodyParserOptions));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || (() => {
  console.warn("WARNING: Using default cookie secret. Set COOKIE_SECRET environment variable in production!");
  return "change-me";
})()));

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(requestLogger);
app.use(logSecurityEvents);

// Security validation
app.use(sanitizeRequestBody);

// Rate limiting
app.use(rateLimiter);

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString()
  });
});

// Mount all routes according to new structure
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tabby", tabbyRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/programmes", programmeRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/prices", priceRoutes);

// Secure file serving routes
app.use("/files", fileRoutes);

// Serve static files from uploads directory with CORS headers and access control
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for static files
  const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
    "http://localhost:3000", 
    "http://localhost:3001", 
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes("*") || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Block direct access to payment-proofs through static serving
  if (req.path.startsWith('/payment-proofs/')) {
    return res.status(403).json({ 
      error: { message: "Access denied. Use /files/payment-proofs/:filename instead." } 
    });
  }
  
  next();
}, express.static("uploads", {
  setHeaders: (res, path) => {
    // Set additional headers for static files
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    
    // Set proper content type for images
    if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));


// Error handling (must be last)
app.use(errorLogger);

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.message === 'Only image files (JPEG, PNG, GIF, WebP) are allowed') {
    return res.status(400).json({ 
      error: { message: error.message } 
    });
  }
  
  if (error.message === 'File too large. Maximum size is 10MB.') {
    return res.status(400).json({ 
      error: { message: error.message } 
    });
  }
  
  if (error.message === 'Too many files. Only one file allowed.') {
    return res.status(400).json({ 
      error: { message: error.message } 
    });
  }
  
  res.status(error.status || 500).json({
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    }
  });
});

export default app;

