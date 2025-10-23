import { getPrismaClient } from "../../config/db.js";
import { generateProgrammePurchaseNumber } from "../../utils/idGenerator.js";
import { generateUserFriendlyPaymentReference } from "../../utils/paymentReference.js";
import { Decimal } from "@prisma/client/runtime/library";
import { sendEmail } from "../../utils/email.js";
import { getProgrammeDeliveryTemplate } from "../../utils/emailTemplates.js";

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
  // Validate Gymmawy Coins required
  if (data.loyaltyPointsRequired !== undefined && data.loyaltyPointsRequired !== null && data.loyaltyPointsRequired <= 0) {
    const error = new Error("Gymmawy Coins required must be greater than 0");
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
  // Validate Gymmawy Coins required
  if (data.loyaltyPointsRequired !== undefined && data.loyaltyPointsRequired !== null && data.loyaltyPointsRequired <= 0) {
    const error = new Error("Gymmawy Coins required must be greater than 0");
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

  if (existingPurchase.status !== "PENDING" && existingPurchase.status !== "PAID") {
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
      user: true,
      coupon: true
    }
  });

  // Record coupon usage only when payment is completed and purchase is approved
  if (purchase.couponId) {
    try {
      // Check if user has already redeemed this coupon
      const existingRedemption = await prisma.userCouponRedemption.findUnique({
        where: {
          userId_couponId: {
            userId: purchase.userId,
            couponId: purchase.couponId
          }
        }
      });

      if (!existingRedemption) {
        // Create user redemption record only if it doesn't exist
        await prisma.userCouponRedemption.create({ 
          data: { userId: purchase.userId, couponId: purchase.couponId } 
        });
        
        // Increment total redemptions only for new redemptions
        await prisma.coupon.update({ 
          where: { id: purchase.couponId }, 
          data: { totalRedemptions: { increment: 1 } } 
        });
        
        console.log('✅ Coupon redeemed successfully for completed programme purchase:', purchase.id);
      } else {
        // Update usage count for existing redemption
        await prisma.userCouponRedemption.update({
          where: {
            userId_couponId: {
              userId: purchase.userId,
              couponId: purchase.couponId
            }
          },
          data: {
            usageCount: { increment: 1 }
          }
        });
        
        console.log('✅ Coupon usage count incremented for completed programme purchase:', purchase.id);
      }
    } catch (error) {
      console.error('❌ Error recording coupon usage for programme purchase:', error);
      // Don't fail the approval process if coupon recording fails
    }
  }

  // Award Gymmawy Coins for programme purchase completion
  if (purchase.programme.loyaltyPointsAwarded > 0) {
    await prisma.user.update({
      where: { id: purchase.userId },
      data: {
        loyaltyPoints: {
          increment: purchase.programme.loyaltyPointsAwarded
        }
      }
    });

    console.log(`Awarded ${purchase.programme.loyaltyPointsAwarded} Gymmawy Coins for programme purchase ${purchase.id}`);
  }

  // Send programme delivery email
  try {
    const { sendProgrammeDeliveryEmail } = await import('./programmeEmail.service.js');
    await sendProgrammeDeliveryEmail(purchase);
    console.log(`Programme delivery email sent successfully for purchase ${purchase.id}`);
  } catch (emailError) {
    console.error('Failed to send programme delivery email:', emailError);
    // Don't throw error here as the main operation succeeded
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

export async function purchaseFreeProgramme(userId, programmeId, currency, programme) {
  try {
    console.log('🆓 Processing free programme delivery (email only):', {
      userId,
      programmeId,
      currency,
      programmeName: programme.name
    });

    // Get user information for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create a mock purchase object for email service compatibility
    const mockPurchase = {
      id: `free-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchaseNumber: `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: user.id,
      programmeId: programme.id,
      price: 0,
      currency: currency,
      discountPercentage: 0,
      purchasedAt: new Date(),
      status: 'COMPLETE',
      user: user,
      programme: {
        id: programme.id,
        name: programme.name,
        pdfUrl: programme.pdfUrl
      }
    };

    console.log('✅ Mock purchase object created for email:', {
      purchaseId: mockPurchase.id,
      purchaseNumber: mockPurchase.purchaseNumber,
      userEmail: user.email,
      programmeName: programme.name
    });

    // Send programme delivery email
    try {
      const { sendProgrammeDeliveryEmail } = await import('./programmeEmail.service.js');
      await sendProgrammeDeliveryEmail(mockPurchase);
      console.log(`Free programme delivery email sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send free programme delivery email:', emailError);
      throw new Error(`Failed to send programme email: ${emailError.message}`);
    }

    // Return success response without creating database records
    return {
      success: true,
      message: 'Free programme sent via email successfully',
      purchaseNumber: mockPurchase.purchaseNumber,
      email: user.email
    };
  } catch (error) {
    console.error('❌ Failed to process free programme delivery:', error);
    throw error;
  }
}

export async function purchaseProgrammeWithPayment(userId, programmeId, paymentData) {
  try {
    console.log('🔍 Programme purchase creation started:', {
      userId,
      programmeId,
      paymentData
    });

    const {
      paymentMethod,
      paymentProof,
      currency,
      programmeName,
      programmeDescription,
      couponId
    } = paymentData;

    console.log('🔍 Extracted payment data:', {
      paymentMethod,
      currency,
      couponId
    });

    // Get programme from database
    const programme = await prisma.programme.findUnique({ 
      where: { id: programmeId }
    });
    
    if (!programme) {
      console.error('❌ Programme not found:', programmeId);
      throw new Error("Programme not found");
    }
    if (!programme.isActive) {
      console.error('❌ Programme is not active:', programmeId);
      throw new Error("Programme is not available for purchase");
    }

    console.log('✅ Programme found and active:', {
      programmeId: programme.id,
      programmeName: programme.name,
      isActive: programme.isActive
    });

    // Get programme price for the requested currency from individual price fields
    let programmePrice = null;
    console.log('🔍 Programme prices:', {
      priceAED: programme.priceAED,
      priceEGP: programme.priceEGP,
      priceSAR: programme.priceSAR,
      priceUSD: programme.priceUSD,
      requestedCurrency: currency
    });

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
    
    console.log('🔍 Selected programme price:', programmePrice);
    
    if (!programmePrice) {
      console.error('❌ Price not available for currency:', currency);
      throw new Error(`Price not available for currency: ${currency}`);
    }

    // Calculate server-side price with programme discount
    const originalPrice = parseFloat(programmePrice.amount);
    const programmeDiscountPercentage = programme.discountPercentage || 0;
    const programmeDiscountAmount = (originalPrice * programmeDiscountPercentage) / 100;
    let finalPrice = originalPrice - programmeDiscountAmount;

    // Check if this is a free programme (price = 0)
    if (finalPrice <= 0) {
      console.log('🆓 Free programme detected, processing without payment');
      return await purchaseFreeProgramme(userId, programmeId, currency, programme);
    }

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
    
    // All payments start as PENDING until actually confirmed
    let initialStatus = 'PENDING';

    console.log('🔍 Creating programme purchase with data:', {
      purchaseNumber,
      userId,
      programmeId,
      finalPrice,
      currency,
      programmeDiscountPercentage,
      couponId: validatedCoupon?.id || null,
      couponDiscountAmount,
      initialStatus
    });

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
        status: initialStatus // Set based on payment method
      }
    });

    console.log('✅ Programme purchase created successfully:', {
      purchaseId: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      status: purchase.status,
      price: purchase.price.toString(),
      currency: purchase.currency
    });

    // Note: Coupon usage will be recorded only when payment is completed and purchase is approved
    // This prevents counting coupon usage for failed or cancelled payments

    // Create payment record if payment method is provided
    if (paymentMethod && paymentProof) {
      
      // Generate user-friendly payment reference
      const paymentReference = await generateUserFriendlyPaymentReference();
      
      // Determine payment status based on payment method
      let paymentStatus = 'PENDING';
      if (initialStatus === 'COMPLETE') {
        paymentStatus = 'SUCCESS';
      }
      
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
          status: paymentStatus,
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

    // Note: Email will be sent when payment is confirmed and purchase is approved/completed
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

    // Handle status changes that affect Gymmawy Coins and coupons
    if (previousStatus !== status) {
      // If changing from COMPLETE to CANCELLED, reverse Gymmawy Coins
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

          await tx.payment.create({
            data: {
              userId: currentPurchase.userId,
              amount: -currentPurchase.programme.loyaltyPointsAwarded,
              status: 'SUCCESS',
              method: 'GYMMAWY_COINS',
              currency: 'GYMMAWY_COINS',
              paymentReference: `LOYALTY-SPENT-PROGRAMME-${currentPurchase.id}`,
              paymentableType: 'PROGRAMME',
              paymentableId: currentPurchase.id,
              metadata: {
                type: 'SPENT',
                source: 'PROGRAMME_PURCHASE',
                sourceId: currentPurchase.id
              }
            }
          });

          console.log(`Reversed ${currentPurchase.programme.loyaltyPointsAwarded} Gymmawy Coins for programme purchase status change from ${previousStatus} to ${status}`);
        }

        // Remove coupon usage if purchase had a coupon
        if (currentPurchase.couponId) {
          try {
            const { removeCouponUsage } = await import('../coupons/coupon.service.js');
            await removeCouponUsage(currentPurchase.userId, currentPurchase.couponId, 'PROGRAMME_PURCHASE', currentPurchase.id);
            console.log('Coupon usage removed for programme purchase status change:', currentPurchase.id);
          } catch (error) {
            console.error('Failed to remove coupon usage for programme purchase status change:', error);
          }
        }
      }
      // If changing from CANCELLED to COMPLETE, award Gymmawy Coins
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

          console.log(`Awarded ${currentPurchase.programme.loyaltyPointsAwarded} Gymmawy Coins for programme purchase status change from ${previousStatus} to ${status}`);
        }

        // Apply coupon usage if purchase had a coupon
        if (currentPurchase.couponId) {
          try {
            const { applyCouponUsage } = await import('../coupons/coupon.service.js');
            await applyCouponUsage(currentPurchase.userId, currentPurchase.couponId, 'PROGRAMME_PURCHASE', currentPurchase.id);
            console.log('Coupon usage applied for programme purchase status change:', currentPurchase.id);
          } catch (error) {
            console.error('Failed to apply coupon usage for programme purchase status change:', error);
          }
        }
      }
    }

    // Send programme delivery email when status changes to COMPLETE
    if (status === 'COMPLETE' && previousStatus !== 'COMPLETE') {
      try {
        // Get the updated purchase with all related data for email
        const purchaseForEmail = await tx.programmePurchase.findUnique({
          where: { id },
          include: {
            user: true,
            programme: true,
            coupon: true
          }
        });
        
        if (purchaseForEmail) {
          // Send email asynchronously (don't wait for it in transaction)
          setImmediate(async () => {
            try {
              const { sendProgrammeDeliveryEmail } = await import('./programmeEmail.service.js');
              await sendProgrammeDeliveryEmail(purchaseForEmail);
            } catch (emailError) {
              console.error('Failed to send programme delivery email:', emailError);
              // Don't throw error here as the main operation succeeded
            }
          });
        }
      } catch (error) {
        console.error('Error preparing programme delivery email:', error);
        // Don't throw error here as the main operation succeeded
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
