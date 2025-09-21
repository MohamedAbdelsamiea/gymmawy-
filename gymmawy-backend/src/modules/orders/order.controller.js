import * as service from "./order.service.js";
import { z } from "zod";

export async function createOrder(req, res, next) {
  try {
    const schema = z.object({
      couponId: z.string().optional(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']).optional().default('EGP')
    });
    const orderData = schema.parse(req.body || {});
    const order = await service.createOrderFromCart(req.user.id, orderData);
    res.status(201).json({ order });
  } catch (e) { next(e); }
}

export async function listOrders(req, res, next) {
  try {
    const orders = await service.listOrders(req.user.id);
    res.json({ items: orders });
  } catch (e) { next(e); }
}

export async function getOrder(req, res, next) {
  try {
    const order = await service.getOrderById(req.user.id, req.params.id);
    if (!order) return res.status(404).json({ error: { message: "Not found" } });
    res.json({ order });
  } catch (e) { next(e); }
}

export async function updateOrder(req, res, next) {
  try {
    const schema = z.object({
      shippingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        postcode: z.string().optional()
      }).optional(),
      notes: z.string().optional()
    });
    const data = schema.parse(req.body || {});
    const order = await service.updateOrder(req.user.id, req.params.id, data);
    res.json({ order });
  } catch (e) { next(e); }
}

export async function cancelOrder(req, res, next) {
  try {
    const order = await service.cancelOrder(req.user.id, req.params.id);
    res.json({ order });
  } catch (e) { next(e); }
}

export async function getOrderTracking(req, res, next) {
  try {
    const tracking = await service.getOrderTracking(req.user.id, req.params.id);
    res.json({ tracking });
  } catch (e) { next(e); }
}

export async function adminUpdateStatus(req, res, next) {
  try {
    const schema = z.object({ status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "REFUNDED", "CANCELLED"]) });
    const { status } = schema.parse(req.body || {});
    const order = await service.adminUpdateStatus(req.params.id, status);
    res.json({ order });
  } catch (e) { next(e); }
}

export async function activateOrder(req, res, next) {
  try {
    const result = await service.activateOrder(req.params.id, req.user.id);
    res.json({ message: "Order activated successfully", order: result.order, subscription: result.subscription });
  } catch (e) { next(e); }
}

export async function rejectOrder(req, res, next) {
  try {
    const schema = z.object({ reason: z.string().optional() });
    const { reason } = schema.parse(req.body || {});
    const result = await service.rejectOrder(req.params.id, req.user.id, reason || null);
    res.json({ message: "Order rejected successfully", order: result.order });
  } catch (e) { next(e); }
}

export async function adminListOrders(req, res, next) {
  try {
    const orders = await service.adminListOrders(req.query);
    res.json(orders);
  } catch (e) { next(e); }
}

