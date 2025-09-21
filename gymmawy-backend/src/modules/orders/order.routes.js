import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./order.controller.js";

const router = Router();

router.post("/", requireAuth, controller.createOrder);
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

