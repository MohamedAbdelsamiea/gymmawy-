import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

// Create a notification
export async function createNotification(notificationData) {
  const { type, title, message, metadata = {}, userId = null, adminId = null } = notificationData;
  
  return prisma.notification.create({
    data: {
      type,
      title,
      message,
      metadata,
      userId,
      adminId
    }
  });
}

// Get admin notifications
export async function getAdminNotifications(query = {}) {
  const { page = 1, pageSize = 20, status = 'UNREAD', type } = query;
  const skip = (page - 1) * pageSize;
  
  const where = {
    adminId: { not: null }, // Only admin notifications
    ...(status && { status }),
    ...(type && { type })
  };
  
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.notification.count({ where })
  ]);
  
  return {
    notifications,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

// Mark notification as read
export async function markAsRead(notificationId, adminId) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      adminId
    },
    data: {
      status: 'READ',
      readAt: new Date()
    }
  });
}

// Mark all notifications as read
export async function markAllAsRead(adminId) {
  return prisma.notification.updateMany({
    where: {
      adminId,
      status: 'UNREAD'
    },
    data: {
      status: 'READ',
      readAt: new Date()
    }
  });
}

// Archive notification
export async function archiveNotification(notificationId, adminId) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      adminId
    },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date()
    }
  });
}

// Get notification counts
export async function getNotificationCounts(adminId) {
  const [unread, total] = await Promise.all([
    prisma.notification.count({
      where: {
        adminId,
        status: 'UNREAD'
      }
    }),
    prisma.notification.count({
      where: {
        adminId,
        status: { in: ['UNREAD', 'READ'] }
      }
    })
  ]);
  
  return { unread, total };
}

// Notification creation helpers for specific events
export async function notifySubscriptionCreated(subscription) {
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: subscription.subscriptionPlanId },
    select: { name: true }
  });
  
  const planName = typeof plan.name === 'object' ? plan.name.en || plan.name.ar : plan.name;
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
  
  return createNotification({
    type: 'SUBSCRIPTION_CREATED',
    title: 'New Subscription Request',
    message: `${userName} has requested a ${planName} subscription (${subscription.subscriptionNumber})`,
    metadata: {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      userId: subscription.userId,
      planName,
      price: subscription.price,
      currency: subscription.currency
    },
    adminId: null // Will be sent to all admins
  });
}

export async function notifySubscriptionApproved(subscription) {
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
  
  return createNotification({
    type: 'SUBSCRIPTION_APPROVED',
    title: 'Subscription Approved',
    message: `Subscription ${subscription.subscriptionNumber} for ${userName} has been approved`,
    metadata: {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      userId: subscription.userId,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    },
    userId: subscription.userId
  });
}

export async function notifyProgrammePurchased(purchase) {
  const user = await prisma.user.findUnique({
    where: { id: purchase.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  const programme = await prisma.programme.findUnique({
    where: { id: purchase.programmeId },
    select: { name: true }
  });
  
  const programmeName = typeof programme.name === 'object' ? programme.name.en || programme.name.ar : programme.name;
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
  
  return createNotification({
    type: 'PROGRAMMED',
    title: 'New Programme Purchase',
    message: `${userName} has purchased ${programmeName} (${purchase.purchaseNumber})`,
    metadata: {
      purchaseId: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      userId: purchase.userId,
      programmeName,
      price: purchase.price,
      currency: purchase.currency
    },
    adminId: null // Will be sent to all admins
  });
}

export async function notifyLeadSubmitted(lead) {
  return createNotification({
    type: 'LEAD_SUBMITTED',
    title: 'New Lead Submission',
    message: `New lead from ${lead.name || 'Unknown'} (${lead.email || 'No email'})`,
    metadata: {
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      mobileNumber: lead.mobileNumber,
      message: lead.message
    },
    adminId: null // Will be sent to all admins
  });
}

export async function notifySubscriptionExpiring(subscription, daysUntilExpiry) {
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
  
  return createNotification({
    type: 'SUBSCRIPTION_EXPIRING',
    title: 'Subscription Expiring Soon',
    message: `Subscription ${subscription.subscriptionNumber} for ${userName} expires in ${daysUntilExpiry} days`,
    metadata: {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      userId: subscription.userId,
      endDate: subscription.endDate,
      daysUntilExpiry
    },
    adminId: null // Will be sent to all admins
  });
}

export async function notifySubscriptionExpired(subscription) {
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
  
  return createNotification({
    type: 'SUBSCRIPTION_EXPIRED',
    title: 'Subscription Expired',
    message: `Subscription ${subscription.subscriptionNumber} for ${userName} has expired`,
    metadata: {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      userId: subscription.userId,
      endDate: subscription.endDate
    },
    adminId: null // Will be sent to all admins
  });
}

// Check for expiring subscriptions and create notifications
export async function checkExpiringSubscriptions() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Find subscriptions expiring in 3 days
  const expiringIn3Days = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: threeDaysFromNow
      }
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });
  
  // Find subscriptions expiring in 7 days
  const expiringIn7Days = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: threeDaysFromNow,
        lte: sevenDaysFromNow
      }
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });
  
  const notifications = [];
  
  // Create notifications for 3-day expirations
  for (const subscription of expiringIn3Days) {
    const daysUntilExpiry = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));
    notifications.push(await notifySubscriptionExpiring(subscription, daysUntilExpiry));
  }
  
  // Create notifications for 7-day expirations
  for (const subscription of expiringIn7Days) {
    const daysUntilExpiry = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));
    notifications.push(await notifySubscriptionExpiring(subscription, daysUntilExpiry));
  }
  
  return notifications;
}

// Payment proof uploaded notification for admin
export async function notifyPaymentProofUploaded(payment) {
  const user = payment.user;
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email;

  return createNotification({
    type: 'PAYMENT_PROOF_UPLOADED',
    title: 'Payment Proof Uploaded',
    message: `${userName} has uploaded payment proof for ${payment.amount} ${payment.currency} via ${payment.method}`,
    metadata: {
      paymentId: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      proofUrl: payment.paymentProofUrl
    },
    adminId: null // Admin notifications will be handled separately
  });
}

// Payment approved notification for user
export async function notifyPaymentApproved(payment, subscription) {
  const planName = subscription?.subscriptionPlan?.name?.en || subscription?.subscriptionPlan?.name || 'Subscription';
  
  return createNotification({
    type: 'PAYMENT_APPROVED',
    title: 'Payment Approved',
    message: `Your payment of ${payment.amount} ${payment.currency} has been approved. Your ${planName} subscription is now active!`,
    metadata: {
      paymentId: payment.id,
      subscriptionId: subscription?.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method
    },
    userId: payment.userId
  });
}

// Payment rejected notification for user
export async function notifyPaymentRejected(payment, subscription, reason) {
  const planName = subscription?.subscriptionPlan?.name?.en || subscription?.subscriptionPlan?.name || 'Subscription';
  
  return createNotification({
    type: 'PAYMENT_REJECTED',
    title: 'Payment Rejected',
    message: `Your payment proof for ${payment.amount} ${payment.currency} was rejected. Reason: ${reason}. Please upload a valid proof or contact support.`,
    metadata: {
      paymentId: payment.id,
      subscriptionId: subscription?.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      rejectionReason: reason
    },
    userId: payment.userId
  });
}
