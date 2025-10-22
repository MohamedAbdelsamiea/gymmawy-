import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middlewares/authMiddleware.js";
import * as controller from "./admin.controller.js";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, controller.dashboard);
router.get("/analytics", requireAuth, requireAdmin, controller.getAnalytics);
router.get("/analytics/monthly-trends", requireAuth, requireAdmin, controller.getMonthlyTrends);
router.get("/orders/export", requireAuth, requireAdmin, controller.exportOrders);
router.get("/leads/export", requireAuth, requireAdmin, controller.exportLeads);

// User management
router.get("/users", requireAuth, requireAdmin, controller.getUsers);
router.get("/users/:id", requireAuth, requireAdmin, controller.getUserById);
router.patch("/users/:id", requireAuth, requireAdmin, controller.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, controller.deleteUser);

// Admin management
router.post("/admins", requireAuth, requireAdmin, controller.createAdmin);

// Order management
router.get("/orders", requireAuth, requireAdmin, controller.getOrders);
router.get("/orders/:id", requireAuth, requireAdmin, controller.getOrderById);
router.patch("/orders/:id", requireAuth, requireAdmin, controller.updateOrder);
router.delete("/orders/:id", requireAuth, requireAdmin, controller.deleteOrder);

// Product management
router.get("/products", requireAuth, requireAdmin, controller.getProducts);
router.post("/products", requireAuth, requireAdmin, controller.createProduct);
router.patch("/products/order", requireAuth, requireAdmin, controller.updateProductOrder);
router.get("/products/:id", requireAuth, requireAdmin, controller.getProductById);
router.patch("/products/:id", requireAuth, requireAdmin, controller.updateProduct);
router.delete("/products/:id", requireAuth, requireAdmin, controller.deleteProduct);

// Subscription management
router.get("/subscriptions", requireAuth, requireAdmin, controller.getSubscriptions);
router.get("/subscriptions/stats", requireAuth, requireAdmin, controller.getSubscriptionStats);
router.get("/subscriptions/export", requireAuth, requireAdmin, controller.exportSubscriptions);
router.get("/subscriptions/:id", requireAuth, requireAdmin, controller.getSubscriptionById);
router.patch("/subscriptions/:id", requireAuth, requireAdmin, controller.updateSubscription);
router.patch("/subscriptions/:id/status", requireAuth, requireAdmin, controller.updateSubscriptionStatus);
router.patch("/subscriptions/:id/activate", requireAuth, requireAdmin, controller.activateSubscription);
router.patch("/subscriptions/:id/cancel", requireAuth, requireAdmin, controller.cancelSubscription);
router.delete("/subscriptions/:id", requireAuth, requireAdmin, controller.deleteSubscription);
router.get("/programmes/stats", requireAuth, requireAdmin, controller.getProgrammeStats);
router.get("/payments", requireAuth, requireAdmin, controller.getPayments);

// Leads management
router.get("/leads", requireAuth, requireAdmin, controller.getLeads);
router.get("/leads/stats", requireAuth, requireAdmin, controller.getLeadsStats);
router.get("/leads/:id", requireAuth, requireAdmin, controller.getLeadById);
router.patch("/leads/:id/status", requireAuth, requireAdmin, controller.updateLeadStatus);
router.delete("/leads/:id", requireAuth, requireAdmin, controller.deleteLead);

// Benefits management
router.get("/benefits", requireAuth, requireAdmin, controller.getBenefits);
router.post("/benefits", requireAuth, requireAdmin, controller.createBenefit);
router.patch("/benefits/:id", requireAuth, requireAdmin, controller.updateBenefit);
router.delete("/benefits/:id", requireAuth, requireAdmin, controller.deleteBenefit);

// Subscription plans management
router.get("/subscription-plans", requireAuth, requireAdmin, controller.getSubscriptionPlans);
router.get("/subscription-plans/:id", requireAuth, requireAdmin, controller.getSubscriptionPlanById);
router.post("/subscription-plans", requireAuth, requireAdmin, controller.createSubscriptionPlan);
router.patch("/subscription-plans/:id", requireAuth, requireAdmin, controller.updateSubscriptionPlan);
router.patch("/subscription-plans/:id/benefits/order", requireAuth, requireAdmin, controller.updateSubscriptionPlanBenefitOrder);
router.delete("/subscription-plans/:id", requireAuth, requireAdmin, controller.deleteSubscriptionPlan);

// Programme management
router.get("/programmes", requireAuth, requireAdmin, controller.getProgrammes);
router.post("/programmes", requireAuth, requireAdmin, controller.createProgramme);
router.patch("/programmes/order", requireAuth, requireAdmin, controller.updateProgrammeOrder);
router.get("/programmes/stats", requireAuth, requireAdmin, controller.getProgrammeStats);

// Programme purchases management (must come before /programmes/:id)
router.get("/programmes/purchases", requireAuth, requireAdmin, controller.getProgrammePurchases);
router.get("/programmes/purchases/:id", requireAuth, requireAdmin, controller.getProgrammePurchaseById);
router.patch("/programmes/purchases/:id", requireAuth, requireAdmin, controller.updateProgrammePurchase);
router.patch("/programmes/purchases/:id/status", requireAuth, requireAdmin, controller.updateProgrammePurchaseStatus);

// Coupon usage management
router.get("/coupons/usage-stats", requireAuth, requireAdmin, controller.getAllCouponsWithUsageStats);
router.get("/coupons/:couponId/usage-stats", requireAuth, requireAdmin, controller.getCouponUsageStats);
router.post("/coupons/:couponId/sync-usage", requireAuth, requireAdmin, controller.syncCouponUsageStats);

// Programme individual management (must come after specific routes)
router.get("/programmes/:id", requireAuth, requireAdmin, controller.getProgrammeById);
router.put("/programmes/:id", requireAuth, requireAdmin, controller.updateProgramme);
router.delete("/programmes/:id", requireAuth, requireAdmin, controller.deleteProgramme);

// Payment management
router.get("/payments", requireAuth, requireAdmin, controller.getPayments);
router.get("/payments/:id", requireAuth, requireAdmin, controller.getPaymentById);
router.patch("/payments/:id", requireAuth, requireAdmin, controller.updatePayment);

// Coupon management
router.get("/coupons", requireAuth, requireAdmin, controller.getCoupons);
router.get("/coupons/:id", requireAuth, requireAdmin, controller.getCouponById);
router.post("/coupons", requireAuth, requireAdmin, controller.createCoupon);
router.patch("/coupons/:id", requireAuth, requireAdmin, controller.updateCoupon);
router.delete("/coupons/:id", requireAuth, requireAdmin, controller.deleteCoupon);

// CMS management - handled by /api/cms routes


// Analytics
router.get("/analytics/trends", requireAuth, requireAdmin, controller.getAnalyticsTrends);
router.get("/analytics/top-selling", requireAuth, requireAdmin, controller.getTopSelling);
router.get("/analytics/recent-activity", requireAuth, requireAdmin, controller.getRecentActivity);

export default router;

