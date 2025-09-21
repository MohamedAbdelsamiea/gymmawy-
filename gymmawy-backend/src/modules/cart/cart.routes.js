import { Router } from "express";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import * as controller from "./cart.controller.js";

const router = Router();

router.get("/", requireAuth, controller.getCart);
router.post("/add", requireAuth, controller.addItem);
router.patch("/update", requireAuth, controller.updateItem);
router.delete("/remove/:itemId", requireAuth, controller.removeItem);
router.delete("/", requireAuth, controller.clearCart);
router.post("/coupon", requireAuth, controller.applyCoupon);
router.delete("/coupon", requireAuth, controller.removeCoupon);

export default router;


