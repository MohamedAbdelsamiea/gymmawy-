import { Router } from "express";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import * as controller from "./rewards.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// LOYALTY POINTS TRACKING & HISTORY
// ============================================================================

// Get recent loyalty transactions for dashboard
router.get("/transactions/recent", controller.getRecentTransactions);

// Get paginated loyalty transactions for full history
router.get("/transactions", controller.getTransactions);

// Get loyalty statistics
router.get("/stats", controller.getStats);

// Get filter options for loyalty transactions
router.get("/filters", controller.getFilterOptions);

// Get specific transaction by ID
router.get("/transactions/:id", controller.getTransactionById);

// ============================================================================
// REWARD REDEMPTION & VALIDATION
// ============================================================================

// Validate redemption request
router.post("/validate", controller.validateRedemption);

// Process redemption
router.post("/redeem", controller.processRedemption);

// Get redemption history
router.get("/history", controller.getRedemptionHistory);

// ============================================================================
// AVAILABLE REWARDS
// ============================================================================

// Get available rewards for redemption
router.get("/available", controller.getAvailableRewards);

export default router;