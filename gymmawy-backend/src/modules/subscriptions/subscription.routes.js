import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import { currencyDetectionMiddleware } from "../../middlewares/currencyMiddleware.js";
import * as controller from "./subscription.controller.js";

const router = Router();

// Apply currency detection to all subscription routes
router.use(currencyDetectionMiddleware);

router.get("/plans", controller.listPlans);
router.post("/", requireAuth, controller.subscribe);
router.post("/with-payment", requireAuth, controller.createSubscriptionWithPayment);
router.get("/", requireAuth, controller.listUserSubscriptions);
router.patch("/:id/cancel", requireAuth, controller.cancel);

// Admin routes
router.patch("/admin/:id/activate", requireAuth, requireAdmin, controller.activateSubscription);
router.patch("/admin/:id/status", requireAuth, requireAdmin, controller.adminUpdateSubscriptionStatus);
router.post("/admin/:subscriptionId/fix", requireAuth, requireAdmin, controller.fixSubscriptionStatus);

export default router;

