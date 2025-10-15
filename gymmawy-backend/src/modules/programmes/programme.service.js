import { getPrismaClient } from "../../config/db.js";
import { generateProgrammePurchaseNumber } from "../../utils/idGenerator.js";
import { generateUserFriendlyPaymentReference } from "../../utils/paymentReference.js";
import { Decimal } from "@prisma/client/runtime/library";
import * as notificationService from "../notifications/notification.service.js";

const prisma = getPrismaClient();

export async function listProgrammes({ skip, take, q, sortBy, sortOrder, currency, hasLoyaltyPoints }) {
  const where = {
    AND: [
      { isActive: true },
      { deletedAt: null },
      q ? { name: { contains: q, mode: 'insensitive' } } : {},
      hasLoyaltyPoints === 'true' ? { loyaltyPointsRequired: { gt: 0 } } : {},
    ],
  };
  const orderBy = sortBy ? { [sortBy]: sortOrder || "desc" } : { order: "asc" };
  const [items, total] = await Promise.all([
    prisma.programme.findMany({ where, skip, take, orderBy }),
    prisma.programme.count({ where }),
  ]);

  // Add price information based on currency if specified
  if (currency) {
    const itemsWithPrices = items.map(item => {
      let price = null;
      switch (currency) {
        case 'AED':
          price = item.priceAED ? { amount: item.priceAED, currency: 'AED' } : null;
          break;
        case 'EGP':
          price = item.priceEGP ? { amount: item.priceEGP, currency: 'EGP' } : null;
          break;
        case 'SAR':
          price = item.priceSAR ? { amount: item.priceSAR, currency: 'SAR' } : null;
          break;
        case 'USD':
          price = item.priceUSD ? { amount: item.priceUSD, currency: 'USD' } : null;
          break;
      }
      
      return {
        ...item,
        price
      };
    });

    return { items: itemsWithPrices, total };
  }

  return { items, total };
}

export async function getProgrammes(query = {}) {
  const { page = 1, pageSize = 10, lang = 'en' } = query;
  const skip = (page - 1) * pageSize;

  const [allProgrammes, total] = await Promise.all([
    prisma.programme.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { order: 'asc' }
    }),
    prisma.programme.count({
      where: {
        isActive: true,
        deletedAt: null
      }
    })
  ]);

  // Apply pagination (programmes are already sorted by order field)
  const programmes = allProgrammes.slice(skip, skip + pageSize);

  // Transform data for frontend
  const transformedProgrammes = programmes.map(programme => {
    const name = programme.name[lang] || programme.name.en || programme.name.ar || 'Unnamed Programme';
    
    // Get prices from the programme's individual price fields
    const priceEGP = programme.priceEGP || 0;
    const priceSAR = programme.priceSAR || 0;
    const priceAED = programme.priceAED || 0;
    const priceUSD = programme.priceUSD || 0;
    
    // Calculate discounts for all currencies
    const discountAmountEGP = (parseFloat(priceEGP) * programme.discountPercentage) / 100;
    const discountAmountSAR = (parseFloat(priceSAR) * programme.discountPercentage) / 100;
    const discountAmountAED = (parseFloat(priceAED) * programme.discountPercentage) / 100;
    const discountAmountUSD = (parseFloat(priceUSD) * programme.discountPercentage) / 100;
    
    const finalPriceEGP = parseFloat(priceEGP) - discountAmountEGP;
    const finalPriceSAR = parseFloat(priceSAR) - discountAmountSAR;
    const finalPriceAED = parseFloat(priceAED) - discountAmountAED;
    const finalPriceUSD = parseFloat(priceUSD) - discountAmountUSD;
    
    return {
      id: programme.id,
      name: { [lang]: name },
      image: programme.imageUrl,
      imageUrl: programme.imageUrl,
      priceEGP: {
        amount: finalPriceEGP,
        originalAmount: parseFloat(priceEGP),
        currency: 'EGP',
        currencySymbol: 'L.E',
        discountPercentage: programme.discountPercentage
      },
      priceSAR: {
        amount: finalPriceSAR,
        originalAmount: parseFloat(priceSAR),
        currency: 'SAR',
        currencySymbol: 'ر.س',
        discountPercentage: programme.discountPercentage
      },
      priceAED: {
        amount: finalPriceAED,
        originalAmount: parseFloat(priceAED),
        currency: 'AED',
        currencySymbol: 'د.إ',
        discountPercentage: programme.discountPercentage
      },
      priceUSD: {
        amount: finalPriceUSD,
        originalAmount: parseFloat(priceUSD),
        currency: 'USD',
        currencySymbol: '$',
        discountPercentage: programme.discountPercentage
      },
      discountPercentage: programme.discountPercentage,
      loyaltyPointsAwarded: programme.loyaltyPointsAwarded,
      loyaltyPointsRequired: programme.loyaltyPointsRequired,
      order: programme.order,
      createdAt: programme.createdAt,
      updatedAt: programme.updatedAt
    };
  });

  return { items: transformedProgrammes, total, page, pageSize };
}

export async function getProgrammeById(id) {
  return prisma.programme.findUnique({ 
    where: { id },
    include: { purchases: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } } }
  });
}

export async function createProgramme(data) {
  // Validate loyalty points required
  if (data.loyaltyPointsRequired !== undefined && data.loyaltyPointsRequired !== null && data.loyaltyPointsRequired <= 0) {
    const error = new Error("Loyalty points required must be greater than 0");
    error.status = 400;
    error.expose = true;
    throw error;
  }
  
  // Extract prices from data if provided and map to individual price fields
  const { prices, ...programmeData } = data;
  
  // Map prices to individual currency fields
  if (prices && Array.isArray(prices) && prices.length > 0) {
    prices.forEach(price => {
      switch (price.currency) {
        case 'AED':
          programmeData.priceAED = new Decimal(price.amount);
          break;
        case 'EGP':
          programmeData.priceEGP = new Decimal(price.amount);
          break;
        case 'SAR':
          programmeData.priceSAR = new Decimal(price.amount);
          break;
        case 'USD':
          programmeData.priceUSD = new Decimal(price.amount);
          break;
      }
    });
  }
  
  return prisma.programme.create({ data: programmeData });
}

export async function updateProgramme(id, data) {
  // Validate loyalty points required
  if (data.loyaltyPointsRequired !== undefined && data.loyaltyPointsRequired !== null && data.loyaltyPointsRequired <= 0) {
    const error = new Error("Loyalty points required must be greater than 0");
    error.status = 400;
    error.expose = true;
    throw error;
  }
  
  // Extract prices from data if provided and map to individual price fields
  const { prices, ...programmeData } = data;
  
  // Map prices to individual currency fields
  if (prices && Array.isArray(prices) && prices.length > 0) {
    prices.forEach(price => {
      switch (price.currency) {
        case 'AED':
          programmeData.priceAED = new Decimal(price.amount);
          break;
        case 'EGP':
          programmeData.priceEGP = new Decimal(price.amount);
          break;
        case 'SAR':
          programmeData.priceSAR = new Decimal(price.amount);
          break;
        case 'USD':
          programmeData.priceUSD = new Decimal(price.amount);
          break;
      }
    });
  }
  
  return prisma.programme.update({ where: { id }, data: programmeData });
}

export async function deleteProgramme(id) {
  return prisma.programme.update({ 
    where: { id }, 
    data: { isActive: false } 
  });
}

export async function getUserProgrammes(userId) {
  const purchases = await prisma.programmePurchase.findMany({
    where: { userId },
    include: {
      programme: true
    },
    orderBy: { purchasedAt: 'desc' }
  });

  return purchases.map(purchase => ({
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    programme: purchase.programme,
    price: purchase.price,
    currency: purchase.currency,
    discountPercentage: purchase.discountPercentage,
    status: purchase.status,
    purchasedAt: purchase.purchasedAt
  }));
}

export async function getProgrammeStats() {
  const [
    totalProgrammes,
    totalPurchases,
    activePurchases,
    pendingPurchases,
    totalRevenue,
    recentPurchases
  ] = await Promise.all([
    prisma.programme.count(),
    prisma.programmePurchase.count(),
    prisma.programmePurchase.count({
      where: { status: 'COMPLETE' }
    }),
    prisma.programmePurchase.count({
      where: { status: 'PENDING' }
    }),
    prisma.programmePurchase.aggregate({
      _sum: { price: true },
      where: { status: 'COMPLETE' }
    }),
    prisma.programmePurchase.findMany({
      take: 10,
      where: { status: 'COMPLETE' },
      include: {
        programme: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } }
      },
      orderBy: { purchasedAt: 'desc' }
    })
  ]);

  return {
    totalProgrammes,
    totalPurchases: activePurchases, // Only count active purchases
    monthlyPurchases: activePurchases, // For consistency with frontend
    pendingPurchases,
    totalRevenue: totalRevenue._sum.price || 0,
    monthlyRevenue: totalRevenue._sum.price || 0, // Use total revenue as monthly revenue for now
    recentPurchases
  };
}

export async function approveProgrammePurchase(id) {
  const existingPurchase = await prisma.programmePurchase.findUnique({ where: { id } });
  if (!existingPurchase) {
    throw new Error("Programme purchase not found");
  }

  if (existingPurchase.status !== "PENDING") {
    throw new Error("Programme purchase is not pending approval");
  }

  const purchase = await prisma.programmePurchase.update({
    where: { id },
    data: {
      status: "COMPLETE",
      approvedAt: new Date()
    },
    include: {
      programme: true,
      user: true
    }
  });

  // Award loyalty points for programme purchase completion
  if (purchase.programme.loyaltyPointsAwarded > 0) {
    await prisma.user.update({
      where: { id: purchase.userId },
      data: {
        loyaltyPoints: {
          increment: purchase.programme.loyaltyPointsAwarded
        }
      }
    });

    await prisma.loyaltyTransaction.create({
      data: {
        userId: purchase.userId,
        points: purchase.programme.loyaltyPointsAwarded,
        type: 'EARNED',
        source: 'PROGRAMME_PURCHASE',
        sourceId: purchase.id
      }
    });

    console.log(`Awarded ${purchase.programme.loyaltyPointsAwarded} loyalty points for programme purchase ${purchase.id}`);
  }

  return purchase;
}

export async function rejectProgrammePurchase(id, reason = null) {
  const purchase = await prisma.programmePurchase.findUnique({ where: { id } });
  if (!purchase) {
    throw new Error("Programme purchase not found");
  }

  if (purchase.status !== "PENDING") {
    throw new Error("Programme purchase is not pending approval");
  }

  return prisma.programmePurchase.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: reason
    }
  });
}

export async function getPendingProgrammePurchases() {
  return prisma.programmePurchase.findMany({
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
      programme: true,
      payments: {
        where: { status: "PENDING" }
      }
    },
    orderBy: { pendingAt: 'desc' }
  });
}

export async function purchaseProgramme(userId, programmeId, country = 'EG') {
  const programme = await prisma.programme.findUnique({ where: { id: programmeId } });
  if (!programme) {
    throw new Error("Programme not found");
  }
  if (!programme.isActive) {
    throw new Error("Programme is not available for purchase");
  }

  return prisma.$transaction(async (tx) => {
    // Check if user already purchased
    const existing = await tx.programmePurchase.findUnique({
      where: { userId_programmeId: { userId, programmeId } }
    });
    if (existing) {
      const error = new Error("Programme already purchased");
      error.status = 400;
      error.expose = true;
      throw error;
    }

    // Create purchase record
    const price = country === 'SA' ? programme.priceSAR : programme.priceEGP;
    const currency = country === 'SA' ? 'SAR' : 'EGP';
    
    const purchase = await tx.programmePurchase.create({
      data: {
        userId,
        programmeId,
        price: price,
        currency: currency,
        discountPercentage: programme.discountPercentage,
      }
    });

    // Generate purchase number after creation
    const purchaseNumber = generateProgrammePurchaseNumber();
    const updatedPurchase = await tx.programmePurchase.update({
      where: { id: purchase.id },
      data: { purchaseNumber }
    });

    return updatedPurchase;
  });
}

export async function purchaseProgrammeWithPayment(userId, programmeId, paymentData) {
  try {
    const {
      paymentMethod,
      paymentProof,
      currency,
      programmeName,
      programmeDescription,
      couponId
    } = paymentData;

    // Get programme from database
    const programme = await prisma.programme.findUnique({ 
      where: { id: programmeId }
    });
    
    if (!programme) {
      throw new Error("Programme not found");
    }
    if (!programme.isActive) {
      throw new Error("Programme is not available for purchase");
    }

    // Get programme price for the requested currency from individual price fields
    let programmePrice = null;
    switch (currency) {
      case 'AED':
        programmePrice = programme.priceAED ? { amount: programme.priceAED, currency: 'AED' } : null;
        break;
      case 'EGP':
        programmePrice = programme.priceEGP ? { amount: programme.priceEGP, currency: 'EGP' } : null;
        break;
      case 'SAR':
        programmePrice = programme.priceSAR ? { amount: programme.priceSAR, currency: 'SAR' } : null;
        break;
      case 'USD':
        programmePrice = programme.priceUSD ? { amount: programme.priceUSD, currency: 'USD' } : null;
        break;
    }
    
    if (!programmePrice) {
      throw new Error(`Price not available for currency: ${currency}`);
    }

    // Calculate server-side price with programme discount
    const originalPrice = parseFloat(programmePrice.amount);
    const programmeDiscountPercentage = programme.discountPercentage || 0;
    const programmeDiscountAmount = (originalPrice * programmeDiscountPercentage) / 100;
    let finalPrice = originalPrice - programmeDiscountAmount;

    // Handle coupon discount if provided
    let couponDiscountAmount = 0;
    let validatedCoupon = null;
    
    if (couponId) {
      validatedCoupon = await prisma.coupon.findUnique({ where: { id: couponId } });
      if (!validatedCoupon) {
        throw new Error("Invalid coupon");
      }

      // Validate coupon
      try {
        const { validateCoupon } = await import('../coupons/coupon.service.js');
        await validateCoupon(validatedCoupon.code, userId);
      } catch (error) {
        throw new Error(error.message);
      }

      // Calculate coupon discount
      if (validatedCoupon.discountType === 'PERCENTAGE' || validatedCoupon.discountPercentage) {
        // If discountType is PERCENTAGE or if only discountPercentage exists (legacy support)
        couponDiscountAmount = (finalPrice * validatedCoupon.discountPercentage) / 100;
      } else if (validatedCoupon.discountType === 'FIXED') {
        couponDiscountAmount = Math.min(validatedCoupon.discountAmount, finalPrice);
      }
      finalPrice = Math.max(0, finalPrice - couponDiscountAmount);
    }

    console.log('Programme purchase - server calculated price:', {
      programmeId,
      originalPrice: originalPrice,
      programmeDiscount: programmeDiscountAmount,
      couponDiscount: couponDiscountAmount,
      finalPrice: finalPrice,
      currency: currency,
      couponCode: validatedCoupon?.code
    });

  return prisma.$transaction(async (tx) => {
    // Allow multiple purchases of the same programme
    // Generate unique purchase number with retry logic
    let purchaseNumber;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      attempts++;
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9).toUpperCase();
      purchaseNumber = `PROG-${timestamp}-${randomSuffix}`;
      
      // Check if this purchase number already exists
      const existing = await tx.programmePurchase.findUnique({
        where: { purchaseNumber }
      });
      
      if (!existing) break;
      
      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique purchase number after multiple attempts");
      }
    } while (attempts < maxAttempts);
    
    // Create purchase record with server-calculated price
    const purchase = await tx.programmePurchase.create({
      data: {
        purchaseNumber,
        userId,
        programmeId,
        price: new Decimal(finalPrice), // Use server-calculated price
        currency: currency,
        discountPercentage: programmeDiscountPercentage, // Programme discount only
        couponId: validatedCoupon?.id || null,
        couponDiscount: couponDiscountAmount,
        purchasedAt: new Date(),
        status: 'PENDING' // Will be updated to ACTIVE when payment is verified
      }
    });

    // Redeem coupon if used (within the same transaction)
    if (validatedCoupon) {
      // Check if user has already redeemed this coupon
      const existingRedemption = await tx.userCouponRedemption.findUnique({
        where: {
          userId_couponId: {
            userId: userId,
            couponId: validatedCoupon.id
          }
        }
      });

      if (!existingRedemption) {
        // Create user redemption record only if it doesn't exist
        await tx.userCouponRedemption.create({ 
          data: { userId, couponId: validatedCoupon.id } 
        });
        
        // Increment total redemptions only for new redemptions
        await tx.coupon.update({ 
          where: { id: validatedCoupon.id }, 
          data: { totalRedemptions: { increment: 1 } } 
        });
        
        console.log('Coupon redeemed successfully for programme purchase:', purchase.id);
      } else {
        // Update usage count for existing redemption
        await tx.userCouponRedemption.update({
          where: {
            userId_couponId: {
              userId: userId,
              couponId: validatedCoupon.id
            }
          },
          data: {
            usageCount: { increment: 1 }
          }
        });
        
        console.log('Coupon usage count incremented for programme purchase:', purchase.id);
      }
    }

    // Create payment record if payment method is provided
    if (paymentMethod && paymentProof) {
      
      // Generate user-friendly payment reference
      const paymentReference = await generateUserFriendlyPaymentReference();
      
      const payment = await tx.payment.create({
        data: {
          paymentReference,
          amount: new Decimal(finalPrice), // Use server-calculated price
          currency: currency,
          method: paymentMethod.toUpperCase(),
          paymentableId: purchase.id,
          paymentableType: 'PROGRAMME',
          userId: userId,
          paymentProofUrl: paymentProof,
          status: 'PENDING',
          metadata: {
            programmeName,
            programmeDescription,
            originalPrice,
            programmeDiscountAmount,
            programmeDiscountPercentage: programmeDiscountPercentage,
            couponDiscountAmount,
            couponCode: validatedCoupon?.code || null,
            couponDiscountPercentage: validatedCoupon?.discountPercentage || null
          }
        }
      });
    }

    // Create notification for programme purchase
    try {
      await notificationService.notifyProgrammePurchased(purchase);
    } catch (error) {
      console.error('Failed to create programme purchase notification:', error);
      // Don't fail the purchase if notification fails
    }

    return purchase;
  });
  
  } catch (error) {
    throw error;
  }
}

export async function adminUpdateProgrammePurchaseStatus(id, status) {
  // Get the current programme purchase with all related data
  const currentPurchase = await prisma.programmePurchase.findUnique({
    where: { id },
    include: {
      user: true,
      programme: true,
      coupon: true
    }
  });

  if (!currentPurchase) {
    const e = new Error("Programme purchase not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const previousStatus = currentPurchase.status;

  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Update the programme purchase status
    const updatedPurchase = await tx.programmePurchase.update({
      where: { id },
      data: { 
        status,
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
        ...(status === 'REJECTED' && { rejectedAt: new Date() })
      }
    });

    // Handle status changes that affect loyalty points and coupons
    if (previousStatus !== status) {
      // If changing from COMPLETE to CANCELLED, reverse loyalty points
      if (previousStatus === 'COMPLETE' && status === 'CANCELLED') {
        if (currentPurchase.programme.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: currentPurchase.userId },
            data: {
              loyaltyPoints: {
                decrement: currentPurchase.programme.loyaltyPointsAwarded
              }
            }
          });

          await tx.loyaltyTransaction.create({
            data: {
              userId: currentPurchase.userId,
              points: currentPurchase.programme.loyaltyPointsAwarded,
              type: 'SPENT',
              source: 'PROGRAMME_PURCHASE',
              sourceId: currentPurchase.id
            }
          });

          console.log(`Reversed ${currentPurchase.programme.loyaltyPointsAwarded} loyalty points for programme purchase status change from ${previousStatus} to ${status}`);
        }

        // Remove coupon usage if purchase had a coupon
        if (currentPurchase.couponId) {
          try {
            const { removeCouponUsage } = await import('../coupons/couponUsage.service.js');
            await removeCouponUsage(currentPurchase.userId, currentPurchase.couponId, 'PROGRAMME_PURCHASE', currentPurchase.id);
            console.log('Coupon usage removed for programme purchase status change:', currentPurchase.id);
          } catch (error) {
            console.error('Failed to remove coupon usage for programme purchase status change:', error);
          }
        }
      }
      // If changing from CANCELLED to COMPLETE, award loyalty points
      else if (previousStatus === 'CANCELLED' && status === 'COMPLETE') {
        if (currentPurchase.programme.loyaltyPointsAwarded > 0) {
          await tx.user.update({
            where: { id: currentPurchase.userId },
            data: {
              loyaltyPoints: {
                increment: currentPurchase.programme.loyaltyPointsAwarded
              }
            }
          });

          await tx.loyaltyTransaction.create({
            data: {
              userId: currentPurchase.userId,
              points: currentPurchase.programme.loyaltyPointsAwarded,
              type: 'EARNED',
              source: 'PROGRAMME_PURCHASE',
              sourceId: currentPurchase.id
            }
          });

          console.log(`Awarded ${currentPurchase.programme.loyaltyPointsAwarded} loyalty points for programme purchase status change from ${previousStatus} to ${status}`);
        }

        // Apply coupon usage if purchase had a coupon
        if (currentPurchase.couponId) {
          try {
            const { applyCouponUsage } = await import('../coupons/couponUsage.service.js');
            await applyCouponUsage(currentPurchase.userId, currentPurchase.couponId, 'PROGRAMME_PURCHASE', currentPurchase.id);
            console.log('Coupon usage applied for programme purchase status change:', currentPurchase.id);
          } catch (error) {
            console.error('Failed to apply coupon usage for programme purchase status change:', error);
          }
        }
      }
    }

    // Refresh programme stats after status change
    try {
      await refreshProgrammeStats(currentPurchase.programmeId);
    } catch (error) {
      console.error('Failed to refresh programme stats after status change:', error);
      // Don't throw error here as the main operation succeeded
    }

    return updatedPurchase;
  });
}




/**
 * Refresh programme stats after purchase status changes
 * This ensures the admin dashboard shows consistent data
 */
export async function refreshProgrammeStats(programmeId) {
  try {
    // Get updated purchase counts for the specific programme
    const activePurchases = await prisma.programmePurchase.count({
      where: {
        programmeId: programmeId,
        status: "COMPLETE"
      }
    });

    const pendingPurchases = await prisma.programmePurchase.count({
      where: {
        programmeId: programmeId,
        status: "PENDING"
      }
    });

    console.log(`Programme ${programmeId} stats refreshed - Active: ${activePurchases}, Pending: ${pendingPurchases}`);
    
    return {
      programmeId,
      activePurchases,
      pendingPurchases
    };
  } catch (error) {
    console.error("Failed to refresh programme stats:", error);
    throw error;
  }
}
