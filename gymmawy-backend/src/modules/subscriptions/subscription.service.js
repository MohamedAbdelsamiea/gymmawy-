import { getPrismaClient } from "../../config/db.js";
import { generateSubscriptionNumber, generateUniqueId } from "../../utils/idGenerator.js";
import { generateUserFriendlyPaymentReference } from "../../utils/paymentReference.js";
import * as couponService from "../coupons/coupon.service.js";
import { Decimal } from "decimal.js";

const prisma = getPrismaClient();

// Payment validation function
// Handles different payment method requirements:
// - CARD/TABBY/TAMARA: require transactionId (online payment gateway response)
// - INSTA_PAY/VODAFONE_CASH: require paymentProofUrl (manual payment proof)
// - GYMMAWY_COINS: no additional validation required (loyalty points payment)
function validatePaymentData(paymentMethod, transactionId, paymentProofUrl) {
  const errors = [];
  
  // Online payment methods (CARD, TABBY, TAMARA) require transaction ID from payment gateway
  if (['CARD', 'TABBY', 'TAMARA'].includes(paymentMethod)) {
    if (!transactionId || transactionId.trim() === '') {
      errors.push(`Transaction ID is required for online payment method: ${paymentMethod}`);
    }
  }
  
  // Manual payment methods (INSTA_PAY, VODAFONE_CASH) require payment proof URL
  if (['INSTA_PAY', 'VODAFONE_CASH'].includes(paymentMethod)) {
    if (!paymentProofUrl || paymentProofUrl.trim() === '') {
      errors.push(`Payment proof URL is required for manual payment method: ${paymentMethod}`);
    }
  }
  
  // GYMMAWY_COINS payment method doesn't require transaction ID or payment proof
  if (paymentMethod === 'GYMMAWY_COINS') {
    // No additional validation required for coin payments
  }
  
  // Validate that we have a recognized payment method
  const validMethods = ['CARD', 'TABBY', 'TAMARA', 'INSTA_PAY', 'VODAFONE_CASH', 'GYMMAWY_COINS'];
  if (!validMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method: ${paymentMethod}. Must be one of: ${validMethods.join(', ')}`);
  }
  
  if (errors.length > 0) {
    const error = new Error(`Payment validation failed: ${errors.join(', ')}`);
    error.status = 400;
    error.expose = true;
    throw error;
  }
}

export async function listPlans(req) {
  const { lang = 'en', hasLoyaltyPoints } = req.query;
  
  // Build where clause
  const whereClause = {
    deletedAt: null,
    isActive: true
  };
  
  // Filter by loyalty points if requested
  if (hasLoyaltyPoints === 'true') {
    whereClause.loyaltyPointsRequired = { gt: 0 };
  }
  
  // Get all active subscription plans
  const plans = await prisma.subscriptionPlan.findMany({
    where: whereClause,
    include: {
      benefits: {
        where: {
          benefit: {
            deletedAt: null
          }
        },
        include: {
          benefit: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      order: 'asc'
    }
  });

  // Process plans with price data from direct fields
  const processedPlans = plans.map((plan) => {
    // Extract regular prices from direct fields
    const regularPrices = {};
    if (plan.priceAED) regularPrices.AED = parseFloat(plan.priceAED);
    if (plan.priceEGP) regularPrices.EGP = parseFloat(plan.priceEGP);
    if (plan.priceSAR) regularPrices.SAR = parseFloat(plan.priceSAR);
    if (plan.priceUSD) regularPrices.USD = parseFloat(plan.priceUSD);
    
    // Extract medical prices from direct fields
    const medicalPrices = {};
    if (plan.medicalPriceAED) medicalPrices.AED = parseFloat(plan.medicalPriceAED);
    if (plan.medicalPriceEGP) medicalPrices.EGP = parseFloat(plan.medicalPriceEGP);
    if (plan.medicalPriceSAR) medicalPrices.SAR = parseFloat(plan.medicalPriceSAR);
    if (plan.medicalPriceUSD) medicalPrices.USD = parseFloat(plan.medicalPriceUSD);
    
    // Process benefits
    const processedBenefits = (plan.benefits || []).map(benefitRelation => {
      const benefit = benefitRelation.benefit;
      
      return {
        id: benefit.id,
        description: benefit.description,
        order: benefitRelation.order
      };
    });
    
    return {
      ...plan,
      benefits: processedBenefits,
      allPrices: {
        regular: regularPrices,
        medical: medicalPrices
      }
    };
  });

  return processedPlans;
}

export async function subscribeToPlan(userId, planId) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) { const e = new Error("Invalid plan"); e.status = 400; e.expose = true; throw e; }
  
  // Generate unique subscription number
  const subscriptionNumber = await generateUniqueId(
    generateSubscriptionNumber,
    async (number) => {
      const existing = await prisma.subscription.findUnique({ where: { subscriptionNumber: number } });
      return !existing;
    }
  );
  
  const start = new Date();
  const totalDays = plan.subscriptionPeriodDays + plan.giftPeriodDays;
  const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
  return prisma.subscription.create({ 
    data: { 
      subscriptionNumber,
      userId, 
      subscriptionPlanId: planId, 
      startDate: start, 
      endDate: end, 
      status: "ACTIVE" 
    } 
  });
}

export async function createSubscriptionWithPayment(userId, subscriptionData) {
  const {
    planId,
    paymentMethod,
    paymentProof,
    transactionId,
    isMedical = false,
    currency = 'EGP',
    couponId,
    reason
  } = subscriptionData;

  // Get plan from database
  const plan = await prisma.subscriptionPlan.findUnique({ 
    where: { id: planId }
  });
  
  if (!plan) { 
    const e = new Error("Invalid plan"); 
    e.status = 400; 
    e.expose = true; 
    throw e; 
  }

  // Debug: Log plan data
  console.log('Plan data:', {
    id: plan.id,
    subscriptionPeriodDays: plan.subscriptionPeriodDays,
    giftPeriodDays: plan.giftPeriodDays,
    discountPercentage: plan.discountPercentage
  });

  // Validate plan data
  if (!plan.subscriptionPeriodDays && plan.subscriptionPeriodDays !== 0) {
    console.error('Plan missing subscriptionPeriodDays:', plan);
    throw new Error('Plan is missing subscriptionPeriodDays field');
  }
  if (!plan.giftPeriodDays && plan.giftPeriodDays !== 0) {
    console.error('Plan missing giftPeriodDays:', plan);
    throw new Error('Plan is missing giftPeriodDays field');
  }

  // Get plan price from direct fields
  let originalPrice = null;
  
  if (isMedical) {
    // Get medical price for the requested currency
    switch (currency) {
      case 'AED':
        originalPrice = plan.medicalPriceAED ? parseFloat(plan.medicalPriceAED) : null;
        break;
      case 'EGP':
        originalPrice = plan.medicalPriceEGP ? parseFloat(plan.medicalPriceEGP) : null;
        break;
      case 'SAR':
        originalPrice = plan.medicalPriceSAR ? parseFloat(plan.medicalPriceSAR) : null;
        break;
      case 'USD':
        originalPrice = plan.medicalPriceUSD ? parseFloat(plan.medicalPriceUSD) : null;
        break;
    }
  } else {
    // Get regular price for the requested currency
    switch (currency) {
      case 'AED':
        originalPrice = plan.priceAED ? parseFloat(plan.priceAED) : null;
        break;
      case 'EGP':
        originalPrice = plan.priceEGP ? parseFloat(plan.priceEGP) : null;
        break;
      case 'SAR':
        originalPrice = plan.priceSAR ? parseFloat(plan.priceSAR) : null;
        break;
      case 'USD':
        originalPrice = plan.priceUSD ? parseFloat(plan.priceUSD) : null;
        break;
    }
  }
  
  if (originalPrice === null) {
    throw new Error(`Price not available for currency: ${currency} and type: ${isMedical ? 'MEDICAL' : 'REGULAR'}`);
  }

  // Calculate server-side price with plan discount
  const planDiscountPercentage = plan.discountPercentage || 0;
  const planDiscountAmount = (originalPrice * planDiscountPercentage) / 100;
  let finalPrice = originalPrice - planDiscountAmount;

  // Calculate coupon discount if coupon is provided
  let couponDiscountAmount = 0;
  let couponDiscountPercentage = 0;
  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      const e = new Error("Invalid coupon"); 
      e.status = 400; 
      e.expose = true; 
      throw e; 
    }

    // Validate coupon redemption limits
    try {
      await couponService.validateCoupon(coupon.code, userId);
    } catch (error) {
      const e = new Error(error.message);
      e.status = error.status || 400;
      e.expose = true;
      throw e;
    }

    // Calculate coupon discount
    if (coupon.discountType === 'PERCENTAGE' || coupon.discountPercentage) {
      // If discountType is PERCENTAGE or if only discountPercentage exists (legacy support)
      couponDiscountPercentage = coupon.discountPercentage;
      couponDiscountAmount = (finalPrice * coupon.discountPercentage) / 100;
    } else if (coupon.discountType === 'FIXED') {
      // For fixed amount discounts, calculate the percentage for storage
      couponDiscountAmount = Math.min(coupon.discountAmount, finalPrice);
      couponDiscountPercentage = finalPrice > 0 ? (couponDiscountAmount / finalPrice) * 100 : 0;
    }
    finalPrice = Math.max(0, finalPrice - couponDiscountAmount);
  }

  console.log('Subscription purchase - server calculated price:', {
    planId,
    originalPrice: originalPrice,
    planDiscount: planDiscountAmount,
    couponDiscount: couponDiscountAmount,
    finalPrice: finalPrice,
    currency: currency,
    isMedical: isMedical
  });


  // Generate unique subscription number
  const subscriptionNumber = await generateUniqueId(
    generateSubscriptionNumber,
    async (number) => {
      const existing = await prisma.subscription.findUnique({ where: { subscriptionNumber: number } });
      return !existing;
    }
  );

  // Calculate subscription dates using plan data from database
  const start = new Date();
  const totalDays = plan.subscriptionPeriodDays + plan.giftPeriodDays;
  const end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
  
  console.log('Subscription period calculation:', {
    planSubscriptionDays: plan.subscriptionPeriodDays,
    planGiftDays: plan.giftPeriodDays,
    totalDays
  });

  // Determine initial subscription status based on payment method
  let initialStatus = "PENDING";
  if (paymentMethod && ['TABBY', 'TAMARA', 'PAYMOB'].includes(paymentMethod)) {
    // Gateway payments will be updated to PAID when payment is successful
    initialStatus = "PENDING";
  } else if (paymentMethod && ['INSTAPAY', 'VODAFONECASH'].includes(paymentMethod)) {
    // Manual payments stay PENDING until admin approval
    initialStatus = "PENDING";
  }

  // Create subscription and redeem coupon in a transaction to prevent race conditions
  const subscription = await prisma.$transaction(async (tx) => {
    // Create subscription
    const newSubscription = await tx.subscription.create({
      data: {
        subscriptionNumber,
        userId,
        subscriptionPlanId: planId,
        startDate: null, // Will be set when activated by admin
        endDate: null, // Will be set when activated by admin
        status: initialStatus, // Set based on payment method
        isMedical: isMedical || false,
        price: new Decimal(finalPrice), // Use server-calculated price
        currency: currency || 'EGP',
        paymentMethod: paymentMethod || null,
        discountPercentage: planDiscountPercentage, // Use server-calculated plan discount
        couponId: couponId || null,
        couponDiscount: couponDiscountPercentage, // Store coupon discount percentage instead of amount
        totalPeriodDays: totalDays, // Store the total subscription period used
        reason: reason || null // User's reason for subscribing
      }
    });

    // Redeem coupon if couponId is provided (within the same transaction)
    if (couponId) {
      try {
        await couponRedemptionService.redeemCoupon(
          userId, 
          couponId, 
          'SUBSCRIPTION', 
          newSubscription.id
        );
        console.log('Coupon redeemed successfully for subscription:', newSubscription.id);
      } catch (error) {
        console.error('Failed to redeem coupon for subscription:', error.message);
        throw error;
      }
    }

    return newSubscription;
  });

  // Log created subscription data for verification
  console.log('Subscription created with coupon data:', {
    subscriptionId: subscription.id,
    subscriptionNumber: subscription.subscriptionNumber,
    couponId: subscription.couponId,
    couponDiscountPercentage: subscription.couponDiscount, // Now stores percentage
    couponDiscountAmount: couponDiscountAmount, // Log the calculated amount for reference
    discountPercentage: subscription.discountPercentage,
    price: subscription.price
  });

  // Create payment record if payment method is provided
  if (paymentMethod) {
    // Validate payment data based on payment method
    validatePaymentData(paymentMethod, transactionId, paymentProof);
    
    // Generate user-friendly payment reference
    const paymentReference = await generateUserFriendlyPaymentReference();

    // Determine payment status based on method
    let paymentStatus = 'PENDING';
    if (paymentMethod === 'INSTA_PAY' || paymentMethod === 'VODAFONE_CASH') {
      // Manual payments start as PENDING, will become PENDING_VERIFICATION when proof is uploaded
      paymentStatus = 'PENDING';
    } else if (paymentMethod === 'CARD' || paymentMethod === 'TABBY' || paymentMethod === 'TAMARA') {
      // Online payments can be processed immediately
      paymentStatus = 'PENDING';
    }

    await prisma.payment.create({
      data: {
        user: { connect: { id: userId } },
        amount: new Decimal(finalPrice), // Use server-calculated price
        currency: currency || 'EGP',
        method: paymentMethod,
        status: paymentStatus,
        paymentReference,
        transactionId: transactionId, // Add transaction ID
        paymentProofUrl: paymentProof, // Store proof URL
        paymentableId: subscription.id,
        paymentableType: 'SUBSCRIPTION',
        metadata: {
          subscriptionNumber: subscription.subscriptionNumber,
          planName: plan.name?.en || plan.name || 'Unknown Plan',
          isMedical: isMedical,
          discount: planDiscountAmount + couponDiscountAmount,
          originalPrice: originalPrice
        }
      }
    });
  }


  return subscription;
}

export async function listUserSubscriptions(userId) {
  // First, update any expired subscriptions using Prisma
  const now = new Date();
  await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        lt: now
      }
    },
    data: {
      status: 'EXPIRED'
    }
  });
  
  return prisma.subscription.findMany({ 
    where: { userId }, 
    include: { 
      subscriptionPlan: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function cancelSubscription(userId, id) {
  const sub = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!sub) return null;
  if (sub.status !== "ACTIVE") return sub;
  
  // Cancel coupon redemption if subscription had a coupon
  if (sub.couponId) {
    try {
      await couponRedemptionService.cancelCouponRedemption(
        userId,
        sub.couponId,
        'SUBSCRIPTION',
        id
      );
      console.log('Coupon redemption cancelled for subscription:', id);
    } catch (error) {
      console.error('Failed to cancel coupon redemption for subscription:', error.message);
      // Don't throw error here, just log it - we still want to cancel the subscription
    }
  }
  
  return prisma.subscription.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
}

export async function activateSubscription(id) {
  const subscription = await prisma.subscription.findUnique({ 
    where: { id },
    include: {
      subscriptionPlan: true
    }
  });
  
  if (!subscription) {
    const e = new Error("Subscription not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (subscription.status !== "PAID") {
    const e = new Error("Subscription must be in PAID status to be activated");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Calculate start and end dates when activated using stored subscription data or plan data
  const startDate = new Date();
  
  // Use stored total period data if available, otherwise calculate from plan data
  const totalDays = subscription.totalPeriodDays !== null ? subscription.totalPeriodDays : (subscription.subscriptionPlan.subscriptionPeriodDays + subscription.subscriptionPlan.giftPeriodDays);
  const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
  
  console.log('Subscription activation period calculation:', {
    storedTotalDays: subscription.totalPeriodDays,
    planSubscriptionDays: subscription.subscriptionPlan.subscriptionPeriodDays,
    planGiftDays: subscription.subscriptionPlan.giftPeriodDays,
    calculatedTotalDays: subscription.subscriptionPlan.subscriptionPeriodDays + subscription.subscriptionPlan.giftPeriodDays,
    finalTotalDays: totalDays
  });

  const updatedSubscription = await prisma.subscription.update({
    where: { id },
    data: {
      status: "ACTIVE",
      startDate,
      endDate
    }
  });

  // Award loyalty points for subscription completion
  if (subscription.subscriptionPlan.loyaltyPointsAwarded > 0) {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: {
        loyaltyPoints: {
          increment: subscription.subscriptionPlan.loyaltyPointsAwarded
        }
      }
    });

    // Create loyalty points payment record
    await prisma.payment.create({
      data: {
        userId: subscription.userId,
        amount: new Decimal(subscription.subscriptionPlan.loyaltyPointsAwarded),
        currency: 'GYMMAWY_COINS',
        method: 'GYMMAWY_COINS',
        status: 'SUCCESS',
        paymentReference: `LOYALTY-${subscription.id}-${Date.now()}`,
        paymentableId: subscription.id,
        paymentableType: 'SUBSCRIPTION',
        metadata: {
          type: 'LOYALTY_POINTS_EARNED',
          source: 'SUBSCRIPTION',
          sourceId: subscription.id
        }
      }
    });

    console.log(`Awarded ${subscription.subscriptionPlan.loyaltyPointsAwarded} loyalty points for subscription ${subscription.id}`);
  }


  return updatedSubscription;
}

export async function rejectSubscription(id, reason = null) {
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    const e = new Error("Subscription not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  if (subscription.status !== "PENDING") {
    const e = new Error("Subscription is not pending approval");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: reason
    }
  });
}

export async function getPendingSubscriptions() {
  return prisma.subscription.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      subscriptionPlan: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function expireSubscriptions() {
  const now = new Date();
  
  // Find all ACTIVE subscriptions that have passed their end date
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now }
    },
    select: { id: true, userId: true, subscriptionNumber: true }
  });

  if (expiredSubscriptions.length === 0) {
    return { expiredCount: 0, message: "No subscriptions to expire" };
  }

  // Update all expired subscriptions to EXPIRED status
  const result = await prisma.subscription.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now }
    },
    data: {
      status: "EXPIRED"
    }
  });

  return {
    expiredCount: result.count,
    message: `Successfully expired ${result.count} subscription(s)`,
    expiredSubscriptions: expiredSubscriptions.map(sub => ({
      id: sub.id,
      subscriptionNumber: sub.subscriptionNumber
    }))
  };
}

export async function adminUpdateSubscriptionStatus(id, status) {
  // Get the current subscription with all related data
  const currentSubscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: true,
      subscriptionPlan: true,
      coupon: true
    }
  });

  if (!currentSubscription) {
    const e = new Error("Subscription not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const previousStatus = currentSubscription.status;

  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Update the subscription status
    const updatedSubscription = await tx.subscription.update({
      where: { id },
      data: { 
        status,
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
        ...(status === 'ACTIVE' && !currentSubscription.startDate && { startDate: new Date() })
      }
    });

    // Handle status changes that affect loyalty points and coupons
    if (previousStatus !== status) {
      // If changing from ACTIVE to CANCELLED/EXPIRED, reverse loyalty points
      if (previousStatus === 'ACTIVE' && (status === 'CANCELLED' || status === 'EXPIRED')) {
        if (currentSubscription.subscriptionPlan.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: currentSubscription.userId },
            data: {
              loyaltyPoints: {
                decrement: currentSubscription.subscriptionPlan.loyaltyPointsAwarded
              }
            }
          });

          // Create loyalty points reversal payment record
          await tx.payment.create({
            data: {
              userId: currentSubscription.userId,
              amount: new Decimal(-currentSubscription.subscriptionPlan.loyaltyPointsAwarded),
              currency: 'GYMMAWY_COINS',
              method: 'GYMMAWY_COINS',
              status: 'SUCCESS',
              paymentReference: `LOYALTY-REVERSAL-${currentSubscription.id}-${Date.now()}`,
              paymentableId: currentSubscription.id,
              paymentableType: 'SUBSCRIPTION',
              metadata: {
                type: 'LOYALTY_POINTS_REVERSED',
                source: 'SUBSCRIPTION',
                sourceId: currentSubscription.id
              }
            }
          });

          console.log(`Reversed ${currentSubscription.subscriptionPlan.loyaltyPointsAwarded} loyalty points for subscription status change from ${previousStatus} to ${status}`);
        }

        // Remove coupon usage if subscription had a coupon
        if (currentSubscription.couponId) {
          try {
            const { removeCouponUsage } = couponService;
            await removeCouponUsage(currentSubscription.userId, currentSubscription.couponId, 'SUBSCRIPTION', currentSubscription.id);
            console.log('Coupon usage removed for subscription status change:', currentSubscription.id);
          } catch (error) {
            console.error('Failed to remove coupon usage for subscription status change:', error);
          }
        }
      }
      // If changing from CANCELLED/EXPIRED to ACTIVE, award loyalty points
      else if ((previousStatus === 'CANCELLED' || previousStatus === 'EXPIRED') && status === 'ACTIVE') {
        if (currentSubscription.subscriptionPlan.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: currentSubscription.userId },
            data: {
              loyaltyPoints: {
                increment: currentSubscription.subscriptionPlan.loyaltyPointsAwarded
              }
            }
          });

          // Create loyalty points payment record
          await tx.payment.create({
            data: {
              userId: currentSubscription.userId,
              amount: new Decimal(currentSubscription.subscriptionPlan.loyaltyPointsAwarded),
              currency: 'GYMMAWY_COINS',
              method: 'GYMMAWY_COINS',
              status: 'SUCCESS',
              paymentReference: `LOYALTY-${currentSubscription.id}-${Date.now()}`,
              paymentableId: currentSubscription.id,
              paymentableType: 'SUBSCRIPTION',
              metadata: {
                type: 'LOYALTY_POINTS_EARNED',
                source: 'SUBSCRIPTION',
                sourceId: currentSubscription.id
              }
            }
          });

          console.log(`Awarded ${currentSubscription.subscriptionPlan.loyaltyPointsAwarded} loyalty points for subscription status change from ${previousStatus} to ${status}`);
        }

        // Apply coupon usage if subscription had a coupon
        if (currentSubscription.couponId) {
          try {
            const { applyCouponUsage } = couponService;
            await applyCouponUsage(currentSubscription.userId, currentSubscription.couponId, 'SUBSCRIPTION', currentSubscription.id);
            console.log('Coupon usage applied for subscription status change:', currentSubscription.id);
          } catch (error) {
            console.error('Failed to apply coupon usage for subscription status change:', error);
          }
        }
      }
    }

    return updatedSubscription;
  });
}

