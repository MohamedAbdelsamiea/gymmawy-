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
router.get("/admin/pending", requireAuth, requireAdmin, controller.getPendingSubscriptions);
router.patch("/admin/:id/approve", requireAuth, requireAdmin, controller.approveSubscription);
router.patch("/admin/:id/reject", requireAuth, requireAdmin, controller.rejectSubscription);
router.post("/admin/expire", requireAuth, requireAdmin, controller.expireSubscriptions);

export default router;

