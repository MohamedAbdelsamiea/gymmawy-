import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./lead.controller.js";

const router = Router();

router.post("/", controller.submit);
router.get("/", requireAuth, requireAdmin, controller.list);
router.get("/stats", requireAuth, requireAdmin, controller.getStats);
router.get("/:id", requireAuth, requireAdmin, controller.getById);
router.patch("/:id/status", requireAuth, requireAdmin, controller.updateStatus);
router.delete("/:id", requireAuth, requireAdmin, controller.deleteLead);

export default router;

