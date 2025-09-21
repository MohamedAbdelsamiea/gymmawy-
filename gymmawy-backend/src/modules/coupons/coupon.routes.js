import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./coupon.controller.js";

const router = Router();

router.post("/apply", requireAuth, controller.apply);
router.post("/redeem/:code", requireAuth, controller.redeem);
router.get("/my-coupons", requireAuth, controller.getMyCoupons);
router.get("/validate/:code", requireAuth, controller.validateCoupon); // Require auth to check user-specific usage

router.post("/", requireAuth, requireAdmin, controller.create);
router.get("/", requireAuth, requireAdmin, controller.list);
router.get("/:id", requireAuth, requireAdmin, controller.getById);
router.patch("/:id", requireAuth, requireAdmin, controller.update);
router.delete("/:id", requireAuth, requireAdmin, controller.deleteCoupon);

export default router;

