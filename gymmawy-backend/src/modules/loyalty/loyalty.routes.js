import { Router } from "express";
import { requireAuth } from "../../middlewares/authMiddleware.js";
import * as controller from "./loyalty.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get recent loyalty transactions for dashboard
router.get("/recent", controller.getRecentTransactions);

// Get paginated loyalty transactions for full history
router.get("/", controller.getTransactions);

// Get loyalty statistics
router.get("/stats", controller.getStats);

// Get filter options
router.get("/filters", controller.getFilterOptions);

export default router;
