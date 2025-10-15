import { Router } from "express";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import * as controller from "./rewards.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Validate redemption
router.post("/validate", controller.validateRedemption);

// Process redemption
router.post("/redeem", controller.processRedemption);

// Get redemption history
router.get("/history", controller.getRedemptionHistory);

export default router;
