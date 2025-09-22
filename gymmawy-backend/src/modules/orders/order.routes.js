import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import { currencyDetectionMiddleware } from "../../middlewares/currencyMiddleware.js";
import * as controller from "./order.controller.js";

const router = Router();

// Apply currency detection middleware to all order routes
router.use(currencyDetectionMiddleware);

router.post("/", requireAuth, controller.createOrder);
router.post("/from-cart", requireAuth, controller.createOrderFromCart);
router.get("/", requireAuth, controller.listOrders);
router.get("/:id", requireAuth, controller.getOrder);
router.patch("/:id", requireAuth, controller.updateOrder);
router.patch("/:id/cancel", requireAuth, controller.cancelOrder);
router.get("/:id/tracking", requireAuth, controller.getOrderTracking);

router.patch("/:id/status", requireAuth, requireAdmin, controller.adminUpdateStatus);
router.post("/:id/activate", requireAuth, requireAdmin, controller.activateOrder);
router.post("/:id/reject", requireAuth, requireAdmin, controller.rejectOrder);

// Admin routes
router.get("/admin", requireAuth, requireAdmin, controller.adminListOrders);

export default router;

