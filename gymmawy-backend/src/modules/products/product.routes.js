import { Router } from "express";
import { requireAdmin } from "../../middlewares/authMiddleware.js";
import { currencyDetectionMiddleware } from "../../middlewares/currencyMiddleware.js";
import * as controller from "./product.controller.js";

const router = Router();

// Apply currency detection middleware to all routes
router.use(currencyDetectionMiddleware);

router.get("/categories", controller.listCategories);
router.post("/categories", requireAdmin, controller.createCategory);

router.get("/", controller.listProducts);
router.get("/:id", controller.getProduct);

router.post("/", requireAdmin, controller.createProduct);
router.patch("/:id", requireAdmin, controller.updateProduct);
router.delete("/:id", requireAdmin, controller.deleteProduct);

export default router;

