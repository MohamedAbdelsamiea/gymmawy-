import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./notification.controller.js";

const router = Router();

// Admin notification routes
router.get("/admin", requireAuth, requireAdmin, controller.getAdminNotifications);
router.get("/admin/counts", requireAuth, requireAdmin, controller.getNotificationCounts);
router.patch("/admin/:notificationId/read", requireAuth, requireAdmin, controller.markAsRead);
router.patch("/admin/mark-all-read", requireAuth, requireAdmin, controller.markAllAsRead);
router.patch("/admin/:notificationId/archive", requireAuth, requireAdmin, controller.archiveNotification);
router.post("/admin/check-expiring", requireAuth, requireAdmin, controller.checkExpiringSubscriptions);

export default router;
