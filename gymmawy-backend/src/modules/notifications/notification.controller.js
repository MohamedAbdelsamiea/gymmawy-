import * as service from "./notification.service.js";
import { z } from "zod";
import { parseOrThrow } from "../../utils/validation.js";

// Get admin notifications
export async function getAdminNotifications(req, res, next) {
  try {
    const result = await service.getAdminNotifications(req.query);
    res.json(result);
  } catch (e) { next(e); }
}

// Get notification counts
export async function getNotificationCounts(req, res, next) {
  try {
    const counts = await service.getNotificationCounts(req.user.id);
    res.json(counts);
  } catch (e) { next(e); }
}

// Mark notification as read
export async function markAsRead(req, res, next) {
  try {
    const schema = z.object({
      notificationId: z.string().uuid()
    });
    const { notificationId } = parseOrThrow(schema, req.params);
    
    const result = await service.markAsRead(notificationId, req.user.id);
    res.json({ success: true, updated: result.count });
  } catch (e) { next(e); }
}

// Mark all notifications as read
export async function markAllAsRead(req, res, next) {
  try {
    const result = await service.markAllAsRead(req.user.id);
    res.json({ success: true, updated: result.count });
  } catch (e) { next(e); }
}

// Archive notification
export async function archiveNotification(req, res, next) {
  try {
    const schema = z.object({
      notificationId: z.string().uuid()
    });
    const { notificationId } = parseOrThrow(schema, req.params);
    
    const result = await service.archiveNotification(notificationId, req.user.id);
    res.json({ success: true, updated: result.count });
  } catch (e) { next(e); }
}

// Check for expiring subscriptions (admin only)
export async function checkExpiringSubscriptions(req, res, next) {
  try {
    const notifications = await service.checkExpiringSubscriptions();
    res.json({ 
      success: true, 
      notificationsCreated: notifications.length,
      notifications 
    });
  } catch (e) { next(e); }
}
