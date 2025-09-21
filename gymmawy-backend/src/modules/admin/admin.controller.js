import * as service from "./admin.service.js";

export async function dashboard(_req, res, next) {
  try { const stats = await service.dashboardStats(); res.json({ stats }); } catch (e) { next(e); }
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")].concat(rows.map(r => headers.map(h => escape(r[h])).join(",")));
  return lines.join("\n");
}

export async function exportOrders(_req, res, next) {
  try {
    const orders = await service.exportOrders();
    const flat = orders.map(o => ({ id: o.id, userEmail: o.user.email, status: o.status, createdAt: o.createdAt.toISOString() }));
    const csv = toCsv(flat);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.send(csv);
  } catch (e) { next(e); }
}

export async function exportLeads(_req, res, next) {
  try {
    const leads = await service.exportLeads();
    const flat = leads.map(l => ({ id: l.id, email: l.email, mobileNumber: l.mobileNumber, status: l.status, createdAt: l.createdAt.toISOString() }));
    const csv = toCsv(flat);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
    res.send(csv);
  } catch (e) { next(e); }
}

export async function getAnalytics(req, res, next) {
  try {
    const analytics = await service.getAnalytics(req.query);
    res.json({ analytics });
  } catch (e) { next(e); }
}

export async function getMonthlyTrends(req, res, next) {
  try {
    const trends = await service.getMonthlyTrends(req.query);
    res.json({ trends });
  } catch (e) { next(e); }
}

// User management
export async function getUsers(req, res, next) {
  try {
    const users = await service.getUsers(req.query);
    res.json(users);
  } catch (e) { next(e); }
}

export async function getUserById(req, res, next) {
  try {
    const user = await service.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: { message: "User not found" } });
    res.json({ user });
  } catch (e) { next(e); }
}

export async function updateUser(req, res, next) {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (e) { next(e); }
}

export async function deleteUser(req, res, next) {
  try {
    await service.deleteUser(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

// Order management
export async function getOrders(req, res, next) {
  try {
    const orders = await service.getOrders(req.query);
    res.json({ orders });
  } catch (e) { next(e); }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await service.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: { message: "Order not found" } });
    res.json({ order });
  } catch (e) { next(e); }
}

export async function updateOrder(req, res, next) {
  try {
    const order = await service.updateOrder(req.params.id, req.body);
    res.json({ order });
  } catch (e) { next(e); }
}

export async function deleteOrder(req, res, next) {
  try {
    await service.deleteOrder(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

// Product management
export async function getProducts(req, res, next) {
  try {
    const products = await service.getProducts(req.query);
    res.json({ products });
  } catch (e) { next(e); }
}

export async function createProduct(req, res, next) {
  try {
    console.log('Controller - createProduct called with data:', JSON.stringify(req.body, null, 2));
    const product = await service.createProduct(req.body);
    console.log('Controller - createProduct result:', JSON.stringify(product, null, 2));
    res.status(201).json({ product });
  } catch (e) { next(e); }
}

export async function getProductById(req, res, next) {
  try {
    const product = await service.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: { message: "Product not found" } });
    res.json({ product });
  } catch (e) { next(e); }
}

export async function updateProduct(req, res, next) {
  try {
    console.log('Controller - updateProduct called with ID:', req.params.id);
    console.log('Controller - updateProduct data:', JSON.stringify(req.body, null, 2));
    const product = await service.updateProduct(req.params.id, req.body);
    console.log('Controller - updateProduct result:', JSON.stringify(product, null, 2));
    res.json({ product });
  } catch (e) { next(e); }
}

export async function deleteProduct(req, res, next) {
  try {
    await service.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

// Subscription management
export async function getSubscriptions(req, res, next) {
  try {
    const subscriptions = await service.getSubscriptions(req.query);
    res.json(subscriptions);
  } catch (e) { next(e); }
}

export async function getSubscriptionById(req, res, next) {
  try {
    const subscription = await service.getSubscriptionById(req.params.id);
    if (!subscription) return res.status(404).json({ error: { message: "Subscription not found" } });
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function updateSubscription(req, res, next) {
  try {
    const subscription = await service.updateSubscription(req.params.id, req.body);
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function deleteSubscription(req, res, next) {
  try {
    await service.deleteSubscription(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function cancelSubscription(req, res, next) {
  try {
    const subscription = await service.cancelSubscription(req.params.id);
    res.json({ subscription });
  } catch (e) { next(e); }
}

export async function exportSubscriptions(req, res, next) {
  try {
    const subscriptions = await service.exportSubscriptions();
    const flat = subscriptions.map(s => ({
      id: s.id,
      subscriptionNumber: s.subscriptionNumber,
      status: s.status,
      startDate: s.startDate?.toISOString(),
      endDate: s.endDate?.toISOString(),
      price: s.price,
      currency: s.currency,
      paymentMethod: s.paymentMethod,
      medical: s.medical,
      discount: s.discount,
      createdAt: s.createdAt.toISOString(),
      userEmail: s.user?.email,
      userName: s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : '',
      planName: s.subscriptionPlan?.name?.en || s.subscriptionPlan?.name || ''
    }));
    const csv = toCsv(flat);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=subscriptions.csv");
    res.send(csv);
  } catch (e) { next(e); }
}

export async function getBenefits(req, res, next) {
  try {
    const benefits = await service.getBenefits();
    res.json(benefits);
  } catch (e) { next(e); }
}

export async function createBenefit(req, res, next) {
  try {
    const benefit = await service.createBenefit(req.body);
    res.status(201).json(benefit);
  } catch (e) { next(e); }
}

export async function updateBenefit(req, res, next) {
  try {
    const { id } = req.params;
    const benefit = await service.updateBenefit(id, req.body);
    res.json(benefit);
  } catch (e) { next(e); }
}

export async function deleteBenefit(req, res, next) {
  try {
    const { id } = req.params;
    await service.deleteBenefit(id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function getSubscriptionStats(req, res, next) {
  try {
    const stats = await service.getSubscriptionStats();
    res.json({ stats });
  } catch (e) { next(e); }
}

export async function getProgrammeStats(req, res, next) {
  try {
    const stats = await service.getProgrammeStats();
    res.json({ stats });
  } catch (e) { next(e); }
}

export async function getPayments(req, res, next) {
  try {
    const payments = await service.getPayments(req.query);
    res.json(payments);
  } catch (e) { next(e); }
}


// Leads
export async function getLeads(req, res, next) {
  try {
    const leads = await service.getLeads(req.query);
    res.json(leads);
  } catch (e) { next(e); }
}

export async function getLeadsStats(req, res, next) {
  try {
    const stats = await service.getLeadsStats();
    res.json({ stats });
  } catch (e) { next(e); }
}

export async function getLeadById(req, res, next) {
  try {
    const lead = await service.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: { message: "Lead not found" } });
    res.json({ lead });
  } catch (e) { next(e); }
}

export async function updateLeadStatus(req, res, next) {
  try {
    const lead = await service.updateLeadStatus(req.params.id, req.body.status);
    res.json({ lead });
  } catch (e) { next(e); }
}

export async function deleteLead(req, res, next) {
  try {
    await service.deleteLead(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

// Subscription Plans
export async function getSubscriptionPlans(req, res, next) {
  try {
    const result = await service.getSubscriptionPlans(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

export async function getSubscriptionPlanById(req, res, next) {
  try {
    const plan = await service.getSubscriptionPlanById(req.params.id);
    if (!plan) return res.status(404).json({ error: { message: "Subscription plan not found" } });
    res.json({ plan });
  } catch (e) { next(e); }
}

export async function createSubscriptionPlan(req, res, next) {
  try {
    const plan = await service.createSubscriptionPlan(req.body);
    res.status(201).json(plan);
  } catch (e) { next(e); }
}

export async function updateSubscriptionPlan(req, res, next) {
  try {
    const plan = await service.updateSubscriptionPlan(req.params.id, req.body);
    res.json(plan);
  } catch (e) { next(e); }
}

export async function deleteSubscriptionPlan(req, res, next) {
  try {
    await service.deleteSubscriptionPlan(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function updateSubscriptionPlanBenefitOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { benefits } = req.body;
    const plan = await service.updateSubscriptionPlanBenefitOrder(id, benefits);
    res.json(plan);
  } catch (e) { next(e); }
}

// Programmes
export async function getProgrammes(req, res, next) {
  try {
    const programmes = await service.getProgrammes(req.query);
    res.json({ programmes });
  } catch (e) { next(e); }
}

export async function getProgrammeById(req, res, next) {
  try {
    const programme = await service.getProgrammeById(req.params.id);
    if (!programme) return res.status(404).json({ error: { message: "Programme not found" } });
    res.json({ programme });
  } catch (e) { next(e); }
}

export async function createProgramme(req, res, next) {
  try {
    const programme = await service.createProgramme(req.body);
    res.status(201).json({ programme });
  } catch (e) { next(e); }
}

export async function updateProgramme(req, res, next) {
  try {
    const programme = await service.updateProgramme(req.params.id, req.body);
    res.json({ programme });
  } catch (e) { next(e); }
}

export async function deleteProgramme(req, res, next) {
  try {
    await service.deleteProgramme(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function updateProgrammeOrder(req, res, next) {
  try {
    await service.updateProgrammeOrder(req.body);
    res.status(200).json({ message: 'Programme order updated successfully' });
  } catch (e) { next(e); }
}

// Programme Purchases
export async function getProgrammePurchases(req, res, next) {
  try {
    const purchases = await service.getProgrammePurchases(req.query);
    res.json({ purchases });
  } catch (e) { next(e); }
}

export async function getProgrammePurchaseById(req, res, next) {
  try {
    const purchase = await service.getProgrammePurchaseById(req.params.id);
    if (!purchase) return res.status(404).json({ error: { message: "Programme purchase not found" } });
    res.json({ purchase });
  } catch (e) { next(e); }
}

export async function updateProgrammePurchase(req, res, next) {
  try {
    const purchase = await service.updateProgrammePurchase(req.params.id, req.body);
    res.json({ purchase });
  } catch (e) { next(e); }
}

// Payments

export async function getPaymentById(req, res, next) {
  try {
    const payment = await service.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: { message: "Payment not found" } });
    res.json({ payment });
  } catch (e) { next(e); }
}

export async function updatePayment(req, res, next) {
  try {
    const payment = await service.updatePayment(req.params.id, req.body);
    res.json({ payment });
  } catch (e) { next(e); }
}

// Coupons
export async function getCoupons(req, res, next) {
  try {
    const coupons = await service.getCoupons(req.query);
    res.json(coupons);
  } catch (e) { next(e); }
}

export async function getCouponById(req, res, next) {
  try {
    const coupon = await service.getCouponById(req.params.id);
    if (!coupon) return res.status(404).json({ error: { message: "Coupon not found" } });
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function createCoupon(req, res, next) {
  try {
    // Map frontend field names to database field names
    const couponData = {
      code: req.body.code,
      discountPercentage: req.body.discountValue,
      expirationDate: req.body.expirationDate,
      maxRedemptionsPerUser: req.body.maxRedemptionsPerUser || req.body.maxRedemptions,
      isActive: req.body.isActive
    };
    
    const coupon = await service.createCoupon(couponData);
    res.status(201).json({ coupon });
  } catch (e) { next(e); }
}

export async function updateCoupon(req, res, next) {
  try {
    // Map frontend field names to database field names
    const couponData = { ...req.body };
    if (couponData.discountValue !== undefined) {
      couponData.discountPercentage = couponData.discountValue;
      delete couponData.discountValue;
    }
    if (couponData.maxRedemptionsPerUser !== undefined) {
      couponData.maxRedemptionsPerUser = couponData.maxRedemptionsPerUser;
    }
    if (couponData.maxRedemptions !== undefined) {
      couponData.maxRedemptions = couponData.maxRedemptions;
    }
    
    const coupon = await service.updateCoupon(req.params.id, couponData);
    res.json({ coupon });
  } catch (e) { next(e); }
}

export async function deleteCoupon(req, res, next) {
  try {
    await service.deleteCoupon(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}

// CMS
export async function getTransformations(req, res, next) {
  try {
    const transformations = await service.getTransformations(req.query);
    res.json({ transformations });
  } catch (e) { next(e); }
}

export async function getTransformationById(req, res, next) {
  try {
    const transformation = await service.getTransformationById(req.params.id);
    if (!transformation) return res.status(404).json({ error: { message: "Transformation not found" } });
    res.json({ transformation });
  } catch (e) { next(e); }
}

export async function createTransformation(req, res, next) {
  try {
    const transformation = await service.createTransformation(req.body);
    res.status(201).json({ transformation });
  } catch (e) { next(e); }
}

export async function updateTransformation(req, res, next) {
  try {
    const transformation = await service.updateTransformation(req.params.id, req.body);
    res.json({ transformation });
  } catch (e) { next(e); }
}

export async function deleteTransformation(req, res, next) {
  try {
    await service.deleteTransformation(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}


// Analytics
export async function getAnalyticsTrends(req, res, next) {
  try {
    const trends = await service.getAnalyticsTrends(req.query);
    res.json({ trends });
  } catch (e) { next(e); }
}

export async function getTopSelling(req, res, next) {
  try {
    const topSelling = await service.getTopSelling(req.query);
    res.json({ topSelling });
  } catch (e) { next(e); }
}

export async function getRecentActivity(req, res, next) {
  try {
    const activity = await service.getRecentActivity(req.query);
    res.json({ activity });
  } catch (e) { next(e); }
}

// Admin management
export async function createAdmin(req, res, next) {
  try {
    const admin = await service.createAdmin(req.body);
    res.status(201).json({ admin, message: "Admin created successfully" });
  } catch (e) { next(e); }
}

