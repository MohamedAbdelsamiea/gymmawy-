import { getPrismaClient } from "../../config/db.js";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = getPrismaClient();


export async function dashboardStats() {
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [
    totalUsers,
    usersThisWeek,
    totalOrders, 
    ordersThisWeek, 
    activeSubscriptions, 
    activeSubscriptionsThisWeek, 
    programPurchases, 
    programPurchasesThisWeek,
    // All successful payments - EGP
    totalRevenueEGP,
    revenueThisWeekEGP,
    // All successful payments - SAR
    totalRevenueSAR,
    revenueThisWeekSAR,
    // All successful payments - AED
    totalRevenueAED,
    revenueThisWeekAED,
    // All successful payments - USD
    totalRevenueUSD,
    revenueThisWeekUSD,
    // Loyalty points
    totalLoyaltyPointsRewarded,
    loyaltyPointsRewardedThisWeek,
    totalLoyaltyPointsRedeemed,
    loyaltyPointsRedeemedThisWeek
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ 
      where: { 
        status: 'ACTIVE',
        createdAt: { gte: startOfWeek } 
      } 
    }),
    prisma.programmePurchase.count({ where: { status: 'COMPLETE' } }),
    prisma.programmePurchase.count({ 
      where: { 
        status: 'COMPLETE',
        purchasedAt: { gte: startOfWeek } 
      } 
    }),
    
    // All successful payments - EGP
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'EGP'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'EGP',
        createdAt: { gte: startOfWeek }
      }
    }),
    
    // All successful payments - SAR
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'SAR'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'SAR',
        createdAt: { gte: startOfWeek }
      }
    }),
    
    // All successful payments - AED
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'AED'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'AED',
        createdAt: { gte: startOfWeek }
      }
    }),
    
    // All successful payments - USD
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'USD'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'SUCCESS',
        currency: 'USD',
        createdAt: { gte: startOfWeek }
      }
    }),
    
    // Loyalty points rewarded (from loyalty transactions)
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { 
        type: 'EARNED',
        points: { gt: 0 }
      }
    }),
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { 
        type: 'EARNED',
        points: { gt: 0 },
        createdAt: { gte: startOfWeek }
      }
    }),
    
    // Loyalty points redeemed (from loyalty transactions)
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { 
        type: 'REDEEMED',
        points: { lt: 0 }
      }
    }),
    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { 
        type: 'REDEEMED',
        points: { lt: 0 },
        createdAt: { gte: startOfWeek }
      }
    })
  ]);
  
  // Revenue is directly from successful payments
  const finalTotalRevenueEGP = Number(totalRevenueEGP._sum.amount || 0);
  const finalRevenueThisWeekEGP = Number(revenueThisWeekEGP._sum.amount || 0);
  const finalTotalRevenueSAR = Number(totalRevenueSAR._sum.amount || 0);
  const finalRevenueThisWeekSAR = Number(revenueThisWeekSAR._sum.amount || 0);
  const finalTotalRevenueAED = Number(totalRevenueAED._sum.amount || 0);
  const finalRevenueThisWeekAED = Number(revenueThisWeekAED._sum.amount || 0);
  const finalTotalRevenueUSD = Number(totalRevenueUSD._sum.amount || 0);
  const finalRevenueThisWeekUSD = Number(revenueThisWeekUSD._sum.amount || 0);

  return { 
    users: {
      total: totalUsers,
      week: usersThisWeek
    },
    orders: {
      total: totalOrders,
      week: ordersThisWeek
    },
    revenueEGP: {
      total: finalTotalRevenueEGP,
      week: finalRevenueThisWeekEGP
    },
    revenueSAR: {
      total: finalTotalRevenueSAR,
      week: finalRevenueThisWeekSAR
    },
    revenueAED: {
      total: finalTotalRevenueAED,
      week: finalRevenueThisWeekAED
    },
    revenueUSD: {
      total: finalTotalRevenueUSD,
      week: finalRevenueThisWeekUSD
    },
    activeSubscriptions: {
      total: activeSubscriptions,
      week: activeSubscriptionsThisWeek
    },
    programPurchases: {
      total: programPurchases,
      week: programPurchasesThisWeek
    },
    loyaltyPointsRewarded: {
      total: Number(totalLoyaltyPointsRewarded._sum.points || 0),
      week: Number(loyaltyPointsRewardedThisWeek._sum.points || 0)
    },
    loyaltyPointsRedeemed: {
      total: Math.abs(Number(totalLoyaltyPointsRedeemed._sum.points || 0)),
      week: Math.abs(Number(loyaltyPointsRedeemedThisWeek._sum.points || 0))
    }
  };
}

export async function exportOrders() {
  const orders = await prisma.order.findMany({ include: { items: true, user: true } });
  return orders;
}

export async function exportLeads() {
  const leads = await prisma.lead.findMany();
  return leads;
}

export async function getAnalytics(query = {}) {
  const { period = '30d' } = query;
  
  const now = new Date();
  const startDate = new Date(now.getTime() - (period === '7d' ? 7 : period === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalOrders,
    totalRevenue,
    totalProducts,
    totalSubscriptions,
    revenueByDay,
    ordersByDay
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startDate } } }),
    prisma.order.count(),
    prisma.payment.aggregate({ 
      _sum: { amount: true }, 
      where: { status: "COMPLETED" } 
    }),
    prisma.product.count(),
    prisma.subscription.count(),
    prisma.payment.groupBy({
      by: ['createdAt'],
      _sum: { amount: true },
      where: { 
        status: "COMPLETED",
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.order.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { 
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  return {
    overview: {
      totalUsers,
      newUsers,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      totalProducts,
      totalSubscriptions
    },
    charts: {
      revenueByDay: revenueByDay.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        amount: Number(item._sum.amount || 0)
      })),
      ordersByDay: ordersByDay.map(item => ({
        date: item.createdAt.toISOString().split('T')[0],
        count: item._count.id
      }))
    }
  };
}

// User management
export async function getUsers(query = {}) {
  const { page = 1, pageSize = 10, search } = query;
  const skip = (page - 1) * pageSize;
  
  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobileNumber: true,
        birthDate: true,
        role: true,
        loyaltyPoints: true,
        building: true,
        street: true,
        city: true,
        country: true,
        postcode: true,
        createdAt: true,
        lastLoginAt: true
      }
    }),
    prisma.user.count({ where })
  ]);

  return { items: users, total, page, pageSize };
}

export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      mobileNumber: true,
      loyaltyPoints: true,
      building: true,
      street: true,
      city: true,
      country: true,
      postcode: true,
      createdAt: true,
      lastLoginAt: true
    }
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      mobileNumber: data.mobileNumber,
      building: data.building,
      street: data.street,
      city: data.city,
      country: data.country,
      postcode: data.postcode
    }
  });
}

export async function deleteUser(id) {
  return prisma.user.update({
    where: { id },
    data: { 
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${id}@deleted.com`
    }
  });
}

// Order management
export async function getOrders(query = {}) {
  const { page = 1, pageSize = 10, status, search, date } = query;
  const skip = (page - 1) * pageSize;
  
  // Build where clause
  const where = {};
  
  if (status && status !== 'all') {
    where.status = status;
  }
  
  if (date && date !== 'all') {
    const now = new Date();
    switch (date) {
      case 'today':
        where.createdAt = {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.createdAt = { gte: monthAgo };
        break;
    }
  }
  
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobileNumber: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            size: true,
            totalPrice: true,
            discountPercentage: true,
            product: {
              select: {
                id: true,
                name: true,
                stock: true
              }
            }
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountPercentage: true
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  // Get payment information for each order
  const ordersWithPayments = await Promise.all(
    orders.map(async (order) => {
      const payment = await prisma.payment.findFirst({
        where: {
          paymentableId: order.id,
          paymentableType: 'ORDER'
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return {
        ...order,
        payment
      };
    })
  );

  // Transform the data for frontend
    const transformedOrders = ordersWithPayments.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      price: order.price,
      currency: order.currency,
      status: order.status,
      paymentMethod: order.payment?.method || null,
      paymentProof: order.payment?.paymentProofUrl || null,
      couponDiscount: order.couponDiscount,
      discountPercentage: order.discountPercentage,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      // User information
      user: order.user,

      // Order items with product details
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        totalPrice: item.totalPrice,
        discountPercentage: item.discountPercentage,
        product: item.product
      })),

      // Shipping details
      shippingBuilding: order.shippingBuilding,
      shippingStreet: order.shippingStreet,
      shippingCity: order.shippingCity,
      shippingCountry: order.shippingCountry,
      shippingPostcode: order.shippingPostcode,

      // Coupon information
      coupon: order.coupon,

      // Payment information
      payment: order.payment,

      // Metadata for original price tracking
      metadata: {
        originalPrice: order.metadata?.originalPrice || order.price
      }
    }));

  return { items: transformedOrders, total, page, pageSize };
}

export async function getOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: { include: { product: true } },
      payments: true
    }
  });
}

export async function updateOrder(id, data) {
  return prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      notes: data.notes,
      shippingAddress: data.shippingAddress
    }
  });
}

export async function deleteOrder(id) {
  return prisma.order.delete({ where: { id } });
}

// Product management
export async function getProducts(query = {}) {
  const { page = 1, pageSize = 10, search } = query;
  const skip = (page - 1) * pageSize;
  
  const where = {
    deletedAt: null, // Exclude soft-deleted products
    isActive: true, // Only show active products in admin
    ...(search ? {
      name: { contains: search, mode: 'insensitive' }
    } : {})
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [
        { order: 'asc' }, // Order by the new 'order' field first
        { createdAt: 'desc' } // Then by creation date
      ],
      include: {
        images: true,
        _count: {
          select: {
            orderItems: true
          }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  // Fetch prices for each product
  const productsWithPrices = await Promise.all(
    products.map(async (product) => {
      const prices = await prisma.price.findMany({
        where: {
          purchasableId: product.id,
          purchasableType: 'PRODUCT'
        }
      });
      return { ...product, prices };
    })
  );

  return { items: productsWithPrices, total, page, pageSize };
}

export async function createProduct(data) {
  console.log('Backend - Received product data:', JSON.stringify(data, null, 2));
  console.log('Backend - Prices data:', data.prices);
  console.log('Backend - Image URL:', data.imageUrl);
  console.log('Backend - Loyalty points:', {
    awarded: data.loyaltyPointsAwarded,
    required: data.loyaltyPointsRequired
  });

  const product = await prisma.product.create({
    data: {
      name: data.name || { en: 'New Product', ar: 'منتج جديد' },
      description: data.description || { en: '', ar: '' },
      discountPercentage: data.discountPercentage || 0,
      loyaltyPointsAwarded: data.loyaltyPointsAwarded || 0,
      loyaltyPointsRequired: data.loyaltyPointsRequired || 0,
      stock: data.stock || 0,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });

  // Handle prices if provided
  if (data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
    console.log('Backend - Creating prices:', data.prices);
    const priceData = data.prices.map(price => ({
      id: `${product.id}-${price.currency}`,
      amount: price.amount,
      currency: price.currency,
      purchasableId: product.id,
      purchasableType: 'PRODUCT',
      updatedAt: new Date()
    }));
    console.log('Backend - Price data to insert:', priceData);
    
    await prisma.price.createMany({
      data: priceData
    });
    console.log('Backend - Prices created successfully');
  } else {
    console.log('Backend - No prices to create');
  }

  // Handle main image if provided
  if (data.imageUrl && data.imageUrl.trim() !== '') {
    console.log('Backend - Creating main product image:', data.imageUrl);
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: data.imageUrl,
        isPrimary: true
      }
    });
    console.log('Backend - Main product image created successfully');
  } else {
    console.log('Backend - No main image URL provided');
  }

  // Handle carousel images if provided
  if (data.carouselImages && Array.isArray(data.carouselImages) && data.carouselImages.length > 0) {
    console.log('Backend - Creating carousel images:', data.carouselImages);
    await prisma.productImage.createMany({
      data: data.carouselImages.map(imageUrl => ({
        productId: product.id,
        url: imageUrl,
        isPrimary: false
      }))
    });
    console.log('Backend - Carousel images created successfully');
  } else {
    console.log('Backend - No carousel images provided');
  }

  const productWithPrices = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      images: true
    }
  });

  const prices = await prisma.price.findMany({
    where: {
      purchasableId: product.id,
      purchasableType: 'PRODUCT'
    }
  });

  console.log('Backend - Final product with prices:', { ...productWithPrices, prices });
  return { ...productWithPrices, prices };
}

export async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { 
      id,
      deletedAt: null // Exclude soft-deleted products
    },
    include: {
      images: true,
      _count: {
        select: {
          orderItems: true
        }
      }
    }
  });

  if (!product) return null;

  const prices = await prisma.price.findMany({
    where: {
      purchasableId: id,
      purchasableType: 'PRODUCT'
    }
  });

  return { ...product, prices };
}

export async function updateProduct(id, data) {
  // Update the product
  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      discountPercentage: data.discountPercentage,
      loyaltyPointsAwarded: data.loyaltyPointsAwarded,
      loyaltyPointsRequired: data.loyaltyPointsRequired,
      stock: data.stock,
      isActive: data.isActive
    }
  });

  // Handle prices if provided
  if (data.prices !== undefined) {
    // Delete existing prices for this product
    await prisma.price.deleteMany({
      where: {
        purchasableId: id,
        purchasableType: 'PRODUCT'
      }
    });

    // Create new prices if any
    if (Array.isArray(data.prices) && data.prices.length > 0) {
      await prisma.price.createMany({
        data: data.prices.map(price => ({
          id: `${id}-${price.currency}`,
          amount: price.amount,
          currency: price.currency,
          purchasableId: id,
          purchasableType: 'PRODUCT',
          updatedAt: new Date()
        }))
      });
    }
  }

  // Handle images if provided
  if (data.imageUrl !== undefined || data.carouselImages !== undefined) {
    // Get existing images before deleting them
    const existingImages = await prisma.productImage.findMany({
      where: {
        productId: id
      },
      select: { url: true }
    });

    // Delete existing images for this product
    await prisma.productImage.deleteMany({
      where: {
        productId: id
      }
    });

    // Delete old images from filesystem
    for (const image of existingImages) {
      try {
        const { deleteProductImage } = await import('../uploads/upload.service.js');
        await deleteProductImage(image.url);
      } catch (error) {
        console.error('Error deleting old product image:', error);
        // Don't throw error here - we still want to update the product even if image deletion fails
      }
    }

    // Create new main image if provided
    if (data.imageUrl && data.imageUrl.trim() !== '') {
      await prisma.productImage.create({
        data: {
          productId: id,
          url: data.imageUrl,
          isPrimary: true
        }
      });
    }

    // Create new carousel images if provided
    if (data.carouselImages && Array.isArray(data.carouselImages) && data.carouselImages.length > 0) {
      await prisma.productImage.createMany({
        data: data.carouselImages.map(imageUrl => ({
          productId: id,
          url: imageUrl,
          isPrimary: false
        }))
      });
    }
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true
    }
  });

  const prices = await prisma.price.findMany({
    where: {
      purchasableId: id,
      purchasableType: 'PRODUCT'
    }
  });

  return { ...product, prices };
}

export async function deleteProduct(id) {
  // Get the product with images before soft-deleting
  const product = await prisma.product.findUnique({ 
    where: { id }, 
    select: { 
      images: {
        select: { url: true, isPrimary: true }
      }
    } 
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Delete the main product image if it exists
  const mainImage = product.images?.find(img => img.isPrimary);
  if (mainImage?.url) {
    try {
      const { deleteProductImage } = await import('../uploads/upload.service.js');
      await deleteProductImage(mainImage.url);
    } catch (error) {
      console.error('Error deleting product main image:', error);
      // Don't throw error here - we still want to delete the product even if image deletion fails
    }
  }
  
  // Delete all product images
  for (const image of product.images) {
    try {
      const { deleteProductImage } = await import('../uploads/upload.service.js');
      await deleteProductImage(image.url);
    } catch (error) {
      console.error('Error deleting product image:', error);
      // Don't throw error here - we still want to delete the product even if image deletion fails
    }
  }
  
  // Use soft deletion instead of hard deletion to avoid foreign key constraint violations
  return prisma.product.update({ 
    where: { id }, 
    data: { 
      deletedAt: new Date(),
      isActive: false 
    } 
  });
}

export async function updateProductOrder(productOrders) {
  console.log('Backend - Received product orders:', productOrders);
  
  // Validate that all products exist before updating
  const productIds = productOrders.map(p => p.id);
  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true }
  });
  
  const existingIds = existingProducts.map(p => p.id);
  const missingIds = productIds.filter(id => !existingIds.includes(id));
  
  if (missingIds.length > 0) {
    console.error('Missing product IDs:', missingIds);
    throw new Error(`Products not found: ${missingIds.join(', ')}`);
  }
  
  // Update multiple products' order in a transaction
  return await prisma.$transaction(
    productOrders.map(({ id, order }) =>
      prisma.product.update({
        where: { id },
        data: { order }
      })
    )
  );
}

// Additional service functions for missing endpoints
export async function getSubscriptionStats() {
  // First, update any expired subscriptions
  const now = new Date();
  await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now }
    },
    data: {
      status: 'EXPIRED'
    }
  });
  
  const [totalSubscriptions, activeSubscriptions, pendingSubscriptions, expiredSubscriptions] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'PENDING' } }),
    prisma.subscription.count({ where: { status: 'EXPIRED' } })
  ]);

  // Calculate monthly revenue
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get monthly revenue for all currencies from payments
  const [monthlyRevenueEGP, monthlyRevenueSAR, monthlyRevenueAED, monthlyRevenueUSD] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'EGP',
        paymentableType: 'SUBSCRIPTION',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'SAR',
        paymentableType: 'SUBSCRIPTION',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'AED',
        paymentableType: 'SUBSCRIPTION',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'USD',
        paymentableType: 'SUBSCRIPTION',
        createdAt: { gte: startOfMonth }
      }
    })
  ]);

  // Calculate total revenue for all currencies from payments
  const [totalRevenueEGP, totalRevenueSAR, totalRevenueAED, totalRevenueUSD] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'EGP',
        paymentableType: 'SUBSCRIPTION'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'SAR',
        paymentableType: 'SUBSCRIPTION'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'AED',
        paymentableType: 'SUBSCRIPTION'
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'USD',
        paymentableType: 'SUBSCRIPTION'
      }
    })
  ]);

  return {
    totalSubscriptions,
    activeSubscriptions,
    pendingSubscriptions,
    expiredSubscriptions,
    monthlyRevenue: {
      EGP: Number(monthlyRevenueEGP._sum.amount || 0),
      SAR: Number(monthlyRevenueSAR._sum.amount || 0),
      AED: Number(monthlyRevenueAED._sum.amount || 0),
      USD: Number(monthlyRevenueUSD._sum.amount || 0)
    },
    totalRevenue: {
      EGP: Number(totalRevenueEGP._sum.amount || 0),
      SAR: Number(totalRevenueSAR._sum.amount || 0),
      AED: Number(totalRevenueAED._sum.amount || 0),
      USD: Number(totalRevenueUSD._sum.amount || 0)
    }
  };
}

export async function getSubscriptionPlans(query = {}) {
  const { page = 1, pageSize = 10 } = query;
  const skip = (page - 1) * pageSize;
  
  const [allPlans, total] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: {
        deletedAt: null
      },
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
        },
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    }),
    prisma.subscriptionPlan.count({
      where: {
        deletedAt: null
      }
    })
  ]);

  // Process plans with price data
  const processedPlans = await Promise.all(allPlans.map(async (plan) => {
    // Get prices for this plan
    const prices = await prisma.price.findMany({
      where: {
        purchasableId: plan.id,
        purchasableType: 'SUBSCRIPTION'
      }
    });
    
    // Separate regular and medical prices
    const regularPrices = {};
    const medicalPrices = {};
    
    prices.forEach(price => {
      if (price.id.endsWith('-NORMAL')) {
        regularPrices[price.currency] = parseFloat(price.amount);
      } else if (price.id.endsWith('-MEDICAL')) {
        medicalPrices[price.currency] = parseFloat(price.amount);
      }
    });
    
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
      // Replace benefits with processed benefits
      benefits: processedBenefits,
      // Add subscription count for frontend
      _aggr_count_subscriptions: plan._count?.subscriptions || 0,
      // Add prices in the format frontend expects
      allPrices: {
        regular: regularPrices,
        medical: medicalPrices
      }
    };
  }));

  // Sort by order field (ascending)
  const sortedPlans = processedPlans.sort((a, b) => {
    return a.order - b.order;
  });

  // Apply pagination after sorting
  const plans = sortedPlans.slice(skip, skip + pageSize);
  
  return { items: plans, total, page, pageSize };
}

export async function getSubscriptionPlanById(id) {
  const plan = await prisma.subscriptionPlan.findUnique({ 
    where: { id },
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
          benefit: {
            createdAt: 'asc'
          }
        }
      }
    }
  });

  if (!plan) return null;
  
  // Get prices for this plan
  const prices = await prisma.price.findMany({
    where: {
      purchasableId: plan.id,
      purchasableType: 'SUBSCRIPTION'
    }
  });
  
  // Separate regular and medical prices
  const regularPrices = {};
  const medicalPrices = {};
  
  prices.forEach(price => {
    if (price.id.endsWith('-NORMAL')) {
      regularPrices[price.currency] = parseFloat(price.amount);
    } else if (price.id.endsWith('-MEDICAL')) {
      medicalPrices[price.currency] = parseFloat(price.amount);
    }
  });
  
  // Process benefits
  const processedBenefits = plan.benefits.map(benefitRelation => {
    const benefit = benefitRelation.benefit;
    
    return {
      id: benefit.id,
      description: benefit.description,
      order: benefitRelation.order
    };
  });

  return {
    ...plan,
    // Replace benefits with processed benefits
    benefits: processedBenefits,
    // Add prices in the format frontend expects
    allPrices: {
      regular: regularPrices,
      medical: medicalPrices
    }
  };
}

export async function createSubscriptionPlan(data) {
  const { benefits, prices, ...planData } = data;
  
  // Remove any fields that shouldn't be passed to Prisma
  const { priceEGP, priceSAR, priceAED, priceUSD, medicalEGP, medicalSAR, medicalAED, medicalUSD, medicalPrices, ...cleanPlanData } = planData;
  
  // Remove order field if it exists since it's not in the schema
  delete cleanPlanData.order;
  
  // Debug logs removed for production
  
  // Create the subscription plan
  const plan = await prisma.subscriptionPlan.create({ 
    data: cleanPlanData
  });
  
  // Handle benefits if provided
  if (benefits && benefits.length > 0) {
    await handlePlanBenefits(plan.id, benefits);
  }
  
  // Handle prices if provided
  if (prices && prices.length > 0) {
    await handlePlanPrices(plan.id, prices);
  }
  
  // Return the plan with benefits and prices
  return prisma.subscriptionPlan.findUnique({ 
    where: { id: plan.id },
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
          benefit: {
            createdAt: 'asc'
          }
        }
      },
    }
  });
}

export async function updateSubscriptionPlan(id, data) {
  const { benefits, prices, ...planData } = data;
  
  // Remove any fields that shouldn't be passed to Prisma
  const { priceEGP, priceSAR, priceAED, priceUSD, medicalEGP, medicalSAR, medicalAED, medicalUSD, medicalPrices, ...cleanPlanData } = planData;
  
  // No order validation needed - allow any order value for drag and drop
  
  // Debug logs removed for production
  
  // Check if image is being replaced and delete old image
  if (cleanPlanData.imageUrl !== undefined) {
    // Get current plan to access old image URL
    const currentPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    // If there's an old image and it's different from the new one, delete the old image
    if (currentPlan?.imageUrl && currentPlan.imageUrl !== cleanPlanData.imageUrl) {
      try {
        const { deleteSubscriptionPlanImage } = await import('../uploads/upload.service.js');
        await deleteSubscriptionPlanImage(currentPlan.imageUrl);
      } catch (error) {
        console.error('Error deleting old subscription plan image:', error);
        // Don't throw error here - we still want to update the plan even if old image deletion fails
      }
    }
  }
  
  // Update the subscription plan
  const plan = await prisma.subscriptionPlan.update({ 
    where: { id }, 
    data: cleanPlanData 
  });
  
  // Handle benefits if provided
  if (benefits !== undefined) {
    // Get current benefits to compare
    const currentBenefits = await prisma.subscriptionPlanBenefit.findMany({
      where: { subscriptionPlanId: id },
      select: { benefitId: true, order: true }
    });
    
    // Normalize current benefits for comparison
    const currentBenefitData = currentBenefits.map(b => ({
      id: b.benefitId,
      order: b.order
    })).sort((a, b) => a.id.localeCompare(b.id));
    
    // Normalize new benefits for comparison
    const newBenefitData = benefits.map(benefit => {
      if (typeof benefit === 'string') {
        return { id: benefit, description: null };
      } else if (benefit.id && benefit.description) {
        return { id: benefit.id, description: benefit.description };
      } else {
        return { id: benefit.id || benefit, description: null };
      }
    }).sort((a, b) => a.id.localeCompare(b.id));
    
    console.log('🔍 Backend - Current benefit data:', currentBenefitData);
    console.log('🔍 Backend - New benefit data:', newBenefitData);
    console.log('🔍 Backend - Benefits changed:', JSON.stringify(currentBenefitData) !== JSON.stringify(newBenefitData));
    
    // Only update if benefits have actually changed
    if (JSON.stringify(currentBenefitData) !== JSON.stringify(newBenefitData)) {
      console.log('🔄 Backend - Updating benefits...');
      // First, remove all existing benefit relationships
      await prisma.subscriptionPlanBenefit.deleteMany({
        where: { subscriptionPlanId: id }
      });
      
      // Then add the new benefit relationships
      if (benefits && benefits.length > 0) {
        await handlePlanBenefits(id, benefits);
      }
    } else {
      console.log('✅ Backend - Benefits unchanged, skipping update');
    }
  }
  
  // Handle prices if provided
  if (prices !== undefined) {
    await handlePlanPrices(id, prices);
  }
  
  // Return the plan with benefits and prices
  return prisma.subscriptionPlan.findUnique({ 
    where: { id },
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
          benefit: {
            createdAt: 'asc'
          }
        }
      },
    }
  });
}

export async function deleteSubscriptionPlan(id) {
  // First, get the plan to access its image URL
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    select: { imageUrl: true }
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // Delete the associated image file if it exists
  if (plan.imageUrl) {
    try {
      const { deleteSubscriptionPlanImage } = await import('../uploads/upload.service.js');
      await deleteSubscriptionPlanImage(plan.imageUrl);
    } catch (error) {
      console.error('Error deleting subscription plan image:', error);
      // Don't throw error here - we still want to delete the plan even if image deletion fails
    }
  }

  // Soft delete the subscription plan
  return prisma.subscriptionPlan.update({ 
    where: { id }, 
    data: { deletedAt: new Date() } 
  });
}

export async function updateSubscriptionPlanBenefitOrder(planId, benefits) {
  // Update benefit order for a specific subscription plan
  const updates = benefits.map((benefit, index) => 
    prisma.subscriptionPlanBenefit.update({
      where: {
        subscriptionPlanId_benefitId: {
          subscriptionPlanId: planId,
          benefitId: benefit.id
        }
      },
      data: {
        order: index + 1
      }
    })
  );

  await Promise.all(updates);

  // Return updated plan with ordered benefits (use the same processing as getSubscriptionPlanById)
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
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
          benefit: {
            createdAt: 'asc'
          }
        }
      }
    }
  });

  if (!plan) return null;
  
  // Process benefits to use custom descriptions when available
  const processedBenefits = plan.benefits.map(benefitRelation => {
    const benefit = benefitRelation.benefit;
    
    return {
      id: benefit.id,
      description: benefit.description,
      order: benefitRelation.order // Include the order field
    };
  });

  return {
    ...plan,
    // Replace benefits with processed benefits
    benefits: processedBenefits
  };
}

export async function getProgrammeStats() {
  const [totalPurchases, monthlyPurchases, pendingPurchases] = await Promise.all([
    prisma.programmePurchase.count(),
    prisma.programmePurchase.count({
      where: {
        purchasedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.programmePurchase.count({ where: { status: 'PENDING' } })
  ]);

  // Calculate monthly revenue
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get revenue for all currencies from payments
  const [monthlyRevenueEGP, monthlyRevenueSAR, monthlyRevenueAED, monthlyRevenueUSD] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'EGP',
        paymentableType: 'PROGRAMME',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'SAR',
        paymentableType: 'PROGRAMME',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'AED',
        paymentableType: 'PROGRAMME',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        currency: 'USD',
        paymentableType: 'PROGRAMME',
        createdAt: { gte: startOfMonth }
      }
    })
  ]);

  return {
    totalPurchases,
    monthlyPurchases,
    pendingPurchases,
    monthlyRevenue: {
      EGP: Number(monthlyRevenueEGP._sum.amount || 0),
      SAR: Number(monthlyRevenueSAR._sum.amount || 0),
      AED: Number(monthlyRevenueAED._sum.amount || 0),
      USD: Number(monthlyRevenueUSD._sum.amount || 0)
    }
  };
}

export async function getPayments(query = {}) {
  const { page = 1, pageSize = 10, status, method } = query;
  const skip = (page - 1) * pageSize;
  
  const where = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  if (method && method !== 'all') {
    where.method = method;
  }
  
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
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
    prisma.payment.count({ where })
  ]);

  // Fetch related entities for each payment based on paymentableType and paymentableId
  const paymentsWithDetails = await Promise.all(
    payments.map(async (payment) => {
      let relatedEntity = null;
      
      if (payment.paymentableType === 'SUBSCRIPTION' && payment.paymentableId) {
        relatedEntity = await prisma.subscription.findUnique({
          where: { id: payment.paymentableId },
          select: {
            id: true,
            subscriptionNumber: true,
            status: true,
            subscriptionPlan: {
              select: {
                name: true
              }
            }
          }
        });
      } else if (payment.paymentableType === 'PRODUCT' && payment.paymentableId) {
        relatedEntity = await prisma.order.findUnique({
          where: { id: payment.paymentableId },
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        });
      } else if (payment.paymentableType === 'PROGRAMME' && payment.paymentableId) {
        relatedEntity = await prisma.programmePurchase.findUnique({
          where: { id: payment.paymentableId },
          select: {
            id: true,
            purchaseNumber: true,
            status: true,
            programme: {
              select: {
                name: true
              }
            }
          }
        });
      }

      return {
        ...payment,
        // Add the related entity based on its type
        ...(payment.paymentableType === 'SUBSCRIPTION' && relatedEntity && { subscription: relatedEntity }),
        ...(payment.paymentableType === 'PRODUCT' && relatedEntity && { order: relatedEntity }),
        ...(payment.paymentableType === 'PROGRAMME' && relatedEntity && { programmePurchase: relatedEntity })
      };
    })
  );
  
  return { items: paymentsWithDetails, total, page, pageSize };
}


export async function getLeads(query = {}) {
  const { page = 1, pageSize = 10, status } = query;
  const skip = (page - 1) * pageSize;
  
  const where = status ? { status } : {};
  
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lead.count({ where })
  ]);
  
  return { items: leads, total, page, pageSize };
}

export async function getLeadsStats() {
  const [total, newLeads, contacted] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.count({ where: { status: 'CONTACTED' } })
  ]);
  
  return { total, newLeads, contacted };
}

export async function getLeadById(id) {
  return prisma.lead.findUnique({ where: { id } });
}

export async function updateLeadStatus(id, status) {
  return prisma.lead.update({ where: { id }, data: { status } });
}

export async function deleteLead(id) {
  return prisma.lead.delete({ where: { id } });
}

export async function getProgrammes(query = {}) {
  const { page = 1, pageSize = 10 } = query;
  const skip = (page - 1) * pageSize;
  
  const [programmes, total] = await Promise.all([
    prisma.programme.findMany({
      where: {
        deletedAt: null
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                status: 'COMPLETE'
              }
            }
          }
        }
      }
    }),
    prisma.programme.count({
      where: {
        deletedAt: null
      }
    })
  ]);
  
  return { items: programmes, total, page, pageSize };
}

export async function getProgrammeById(id) {
  return prisma.programme.findUnique({ 
    where: { 
      id,
      deletedAt: null
    },
    include: {
      Price: true
    }
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
  
  // Check if programme exists and is not soft-deleted
  const existingProgramme = await prisma.programme.findUnique({ 
    where: { 
      id,
      deletedAt: null
    } 
  });
  
  if (!existingProgramme) {
    const error = new Error("Programme not found");
    error.status = 404;
    error.expose = true;
    throw error;
  }
  
  // Extract prices from data if provided and map to individual price fields
  const { prices, ...programmeData } = data;
  
  // Handle image replacement - delete old image if new one is provided
  if (programmeData.imageUrl !== undefined) {
    const currentProgramme = await prisma.programme.findUnique({ 
      where: { id }, 
      select: { imageUrl: true } 
    });
    
    if (currentProgramme?.imageUrl && currentProgramme.imageUrl !== programmeData.imageUrl) {
      try {
        const { deleteProgrammeImage } = await import('../uploads/upload.service.js');
        await deleteProgrammeImage(currentProgramme.imageUrl);
      } catch (error) {
        console.error('Error deleting old programme image:', error);
        // Don't throw error here - we still want to update the programme even if image deletion fails
      }
    }
  }
  
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
  // Get the programme with imageUrl before soft-deleting
  const programme = await prisma.programme.findUnique({ 
    where: { id }, 
    select: { imageUrl: true } 
  });
  
  if (!programme) {
    throw new Error('Programme not found');
  }
  
  // Delete the programme image if it exists
  if (programme.imageUrl) {
    try {
      const { deleteProgrammeImage } = await import('../uploads/upload.service.js');
      await deleteProgrammeImage(programme.imageUrl);
    } catch (error) {
      console.error('Error deleting programme image:', error);
      // Don't throw error here - we still want to delete the programme even if image deletion fails
    }
  }
  
  return prisma.programme.update({ 
    where: { id }, 
    data: { 
      deletedAt: new Date(),
      isActive: false 
    } 
  });
}

export async function updateProgrammeOrder(programmes) {
  return prisma.$transaction(
    programmes.map((programme, index) =>
      prisma.programme.update({
        where: { id: programme.id },
        data: { order: index + 1 }
      })
    )
  );
}

// Programme Purchases
export async function getProgrammePurchases(query = {}) {
  const { page = 1, pageSize = 10 } = query;
  const skip = (page - 1) * pageSize;
  
  const [purchases, total] = await Promise.all([
    prisma.programmePurchase.findMany({
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        programme: {
          select: {
            id: true,
            name: true,
            discountPercentage: true
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountPercentage: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    }),
    prisma.programmePurchase.count()
  ]);

  // Fetch payments for each purchase separately
  const purchasesWithPayments = await Promise.all(
    purchases.map(async (purchase) => {
      const payments = await prisma.payment.findMany({
        where: {
          paymentableType: 'PROGRAMME',
          paymentableId: purchase.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        ...purchase,
        payments: payments
      };
    })
  );
  
  return { items: purchasesWithPayments, total, page, pageSize };
}

export async function getProgrammePurchaseById(id) {
  return prisma.programmePurchase.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      programme: {
        select: {
          id: true,
          name: true
        }
      },
      coupon: {
        select: {
          id: true,
          code: true,
          discountPercentage: true
        }
      },
      payments: {
        where: {
          paymentableType: 'PROGRAMME_PURCHASE'
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          paymentReference: true,
          paymentProofUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
}

export async function updateProgrammePurchase(id, data) {
  return prisma.programmePurchase.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      programme: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}



export async function getPaymentById(id) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      order: true
    }
  });
}

export async function updatePayment(id, data) {
  return prisma.payment.update({ where: { id }, data });
}

export async function getCoupons(query = {}) {
  const { page = 1, pageSize = 10 } = query;
  const skip = (page - 1) * pageSize;
  
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.coupon.count()
  ]);
  
  // Transform database fields to frontend field names
  const transformedCoupons = coupons.map(coupon => ({
    ...coupon,
    discountValue: coupon.discountPercentage,
    maxRedemptionsPerUser: coupon.maxRedemptionsPerUser,
    maxRedemptions: coupon.maxRedemptions,
    totalRedemptions: coupon.totalRedemptions
  }));
  
  return { items: transformedCoupons, total, page, pageSize };
}

export async function getCouponById(id) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return null;
  
  // Transform database fields to frontend field names
  return {
    ...coupon,
    discountValue: coupon.discountPercentage,
    maxRedemptionsPerUser: coupon.maxRedemptionsPerUser,
    totalRedemptions: coupon.totalRedemptions
  };
}

export async function createCoupon(data) {
  return prisma.coupon.create({ data });
}

export async function updateCoupon(id, data) {
  return prisma.coupon.update({ where: { id }, data });
}

export async function deleteCoupon(id) {
  return prisma.coupon.delete({ where: { id } });
}

export async function getTransformations(query = {}) {
  const { page = 1, pageSize = 10 } = query;
  const skip = (page - 1) * pageSize;
  
  const [transformations, total] = await Promise.all([
    prisma.transformation.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transformation.count()
  ]);
  
  return { items: transformations, total, page, pageSize };
}

export async function getTransformationById(id) {
  return prisma.transformation.findUnique({ where: { id } });
}

export async function createTransformation(data) {
  return prisma.transformation.create({ data });
}

export async function updateTransformation(id, data) {
  return prisma.transformation.update({ where: { id }, data });
}

export async function deleteTransformation(id) {
  return prisma.transformation.delete({ where: { id } });
}


export async function getAnalyticsTrends(query = {}) {
  // Return mock data for now
  return {
    revenue: [
      { month: 'Jan', value: 1000 },
      { month: 'Feb', value: 1200 },
      { month: 'Mar', value: 1100 },
      { month: 'Apr', value: 1300 },
      { month: 'May', value: 1400 },
      { month: 'Jun', value: 1500 }
    ],
    users: [
      { month: 'Jan', value: 50 },
      { month: 'Feb', value: 60 },
      { month: 'Mar', value: 55 },
      { month: 'Apr', value: 65 },
      { month: 'May', value: 70 },
      { month: 'Jun', value: 75 }
    ]
  };
}

export async function getMonthlyTrends(query = {}) {
  const { months = 12 } = query;
  
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  
  // Fetch exchange rates once for all calculations
  let exchangeRates = {
    EGP: 0.032,
    SAR: 0.27,
    AED: 0.27,
    USD: 1
  };
  
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      exchangeRates = {
        EGP: data.rates.EGP ? 1 / data.rates.EGP : 0.032,
        SAR: data.rates.SAR ? 1 / data.rates.SAR : 0.27,
        AED: data.rates.AED ? 1 / data.rates.AED : 0.27,
        USD: 1
      };
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates, using fallback rates:', error);
  }
  
  // Get monthly data for the last N months
  const monthlyData = [];
  
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - months + 1 + i + 1, 0, 23, 59, 59);
    
    const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
    const year = monthStart.getFullYear();
    
    // Get revenue data for this month (all currencies) for each category
    const [
      // Overall revenue
      egpRevenue, 
      sarRevenue, 
      aedRevenue,
      usdRevenue,
      // Subscription data
      subscriptions, 
      subscriptionEgpRevenue, 
      subscriptionSarRevenue,
      subscriptionAedRevenue,
      subscriptionUsdRevenue,
      // Order data
      orders, 
      orderEgpRevenue, 
      orderSarRevenue,
      orderAedRevenue,
      orderUsdRevenue,
      // Programme data
      programmes, 
      programmeEgpRevenue, 
      programmeSarRevenue,
      programmeAedRevenue,
      programmeUsdRevenue
    ] = await Promise.all([
      // Overall EGP Revenue from payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'EGP',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Overall SAR Revenue from payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'SAR',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Overall AED Revenue from payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'AED',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Overall USD Revenue from payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'USD',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Subscriptions count for this month
      prisma.subscription.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Subscription revenue (EGP)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'EGP',
          paymentableType: 'SUBSCRIPTION',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Subscription revenue (SAR)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'SAR',
          paymentableType: 'SUBSCRIPTION',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Subscription revenue (AED)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'AED',
          paymentableType: 'SUBSCRIPTION',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Subscription revenue (USD)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'USD',
          paymentableType: 'SUBSCRIPTION',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Orders count for this month
      prisma.order.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Order revenue (EGP)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'EGP',
          paymentableType: 'PRODUCT',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Order revenue (SAR)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'SAR',
          paymentableType: 'PRODUCT',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Order revenue (AED)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'AED',
          paymentableType: 'PRODUCT',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Order revenue (USD)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'USD',
          paymentableType: 'PRODUCT',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Programme purchases count for this month
      prisma.programmePurchase.count({
        where: {
          purchasedAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Programme revenue (EGP)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'EGP',
          paymentableType: 'PROGRAMME',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Programme revenue (SAR)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'SAR',
          paymentableType: 'PROGRAMME',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Programme revenue (AED)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'AED',
          paymentableType: 'PROGRAMME',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      // Programme revenue (USD)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          currency: 'USD',
          paymentableType: 'PROGRAMME',
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);
    
    monthlyData.push({
      month: monthName,
      year: year,
      // Overall revenue
      egpRevenue: Number((Number(egpRevenue._sum.amount || 0)).toFixed(2)),
      sarRevenue: Number((Number(sarRevenue._sum.amount || 0)).toFixed(2)),
      aedRevenue: Number((Number(aedRevenue._sum.amount || 0)).toFixed(2)),
      usdRevenue: Number((Number(usdRevenue._sum.amount || 0)).toFixed(2)),
      totalRevenue: Number(egpRevenue._sum.amount || 0) + (Number(sarRevenue._sum.amount || 0) * 7.5) + (Number(aedRevenue._sum.amount || 0) * 7.5) + (Number(usdRevenue._sum.amount || 0) * 30), // Convert to EGP
      totalRevenueUSD: Number(((Number(egpRevenue._sum.amount || 0) * exchangeRates.EGP) + (Number(sarRevenue._sum.amount || 0) * exchangeRates.SAR) + (Number(aedRevenue._sum.amount || 0) * exchangeRates.AED) + (Number(usdRevenue._sum.amount || 0) * exchangeRates.USD)).toFixed(2)), // Convert to USD using live rates
      // Counts
      subscriptions: subscriptions,
      orders: orders,
      programmes: programmes,
      // Category-specific revenue (flattened for Recharts)
      subscriptionRevenueEgp: Number((Number(subscriptionEgpRevenue._sum.amount || 0)).toFixed(2)),
      subscriptionRevenueSar: Number((Number(subscriptionSarRevenue._sum.amount || 0)).toFixed(2)),
      subscriptionRevenueAed: Number((Number(subscriptionAedRevenue._sum.amount || 0)).toFixed(2)),
      subscriptionRevenueUsd: Number((Number(subscriptionUsdRevenue._sum.amount || 0)).toFixed(2)),
      subscriptionRevenueTotal: Number(subscriptionEgpRevenue._sum.amount || 0) + (Number(subscriptionSarRevenue._sum.amount || 0) * 7.5) + (Number(subscriptionAedRevenue._sum.amount || 0) * 7.5) + (Number(subscriptionUsdRevenue._sum.amount || 0) * 30),
      orderRevenueEgp: Number((Number(orderEgpRevenue._sum.amount || 0)).toFixed(2)),
      orderRevenueSar: Number((Number(orderSarRevenue._sum.amount || 0)).toFixed(2)),
      orderRevenueAed: Number((Number(orderAedRevenue._sum.amount || 0)).toFixed(2)),
      orderRevenueUsd: Number((Number(orderUsdRevenue._sum.amount || 0)).toFixed(2)),
      orderRevenueTotal: Number(orderEgpRevenue._sum.amount || 0) + (Number(orderSarRevenue._sum.amount || 0) * 7.5) + (Number(orderAedRevenue._sum.amount || 0) * 7.5) + (Number(orderUsdRevenue._sum.amount || 0) * 30),
      programmeRevenueEgp: Number((Number(programmeEgpRevenue._sum.amount || 0)).toFixed(2)),
      programmeRevenueSar: Number((Number(programmeSarRevenue._sum.amount || 0)).toFixed(2)),
      programmeRevenueAed: Number((Number(programmeAedRevenue._sum.amount || 0)).toFixed(2)),
      programmeRevenueUsd: Number((Number(programmeUsdRevenue._sum.amount || 0)).toFixed(2)),
      programmeRevenueTotal: Number(programmeEgpRevenue._sum.amount || 0) + (Number(programmeSarRevenue._sum.amount || 0) * 7.5) + (Number(programmeAedRevenue._sum.amount || 0) * 7.5) + (Number(programmeUsdRevenue._sum.amount || 0) * 30)
    });
  }
  
  return {
    monthlyData,
    summary: {
      totalEgpRevenue: Number(monthlyData.reduce((sum, month) => sum + month.egpRevenue, 0).toFixed(2)),
      totalSarRevenue: Number(monthlyData.reduce((sum, month) => sum + month.sarRevenue, 0).toFixed(2)),
      totalAedRevenue: Number(monthlyData.reduce((sum, month) => sum + month.aedRevenue, 0).toFixed(2)),
      totalUsdRevenue: Number(monthlyData.reduce((sum, month) => sum + month.usdRevenue, 0).toFixed(2)),
      totalRevenue: monthlyData.reduce((sum, month) => sum + month.totalRevenue, 0),
      totalRevenueUSD: Number(((monthlyData.reduce((sum, month) => sum + month.egpRevenue, 0) * exchangeRates.EGP) + 
                       (monthlyData.reduce((sum, month) => sum + month.sarRevenue, 0) * exchangeRates.SAR) + 
                       (monthlyData.reduce((sum, month) => sum + month.aedRevenue, 0) * exchangeRates.AED) + 
                       (monthlyData.reduce((sum, month) => sum + month.usdRevenue, 0) * exchangeRates.USD)).toFixed(2)),
      totalSubscriptions: monthlyData.reduce((sum, month) => sum + month.subscriptions, 0),
      totalOrders: monthlyData.reduce((sum, month) => sum + month.orders, 0),
      totalProgrammes: monthlyData.reduce((sum, month) => sum + month.programmes, 0)
    }
  };
}

export async function getTopSelling(query = {}) {
  const { type = 'programmes', limit = 10 } = query;
  
  if (type === 'programmes') {
    return getTopSellingProgrammes(limit);
  } else if (type === 'subscriptions') {
    return getTopSellingSubscriptions(limit);
  } else if (type === 'products') {
    return getTopSellingProducts(limit);
  }
  
  return [];
}

async function getTopSellingProgrammes(limit = 10) {
  // Get programmes with their purchase counts and revenue
  const programmes = await prisma.programme.findMany({
    include: {
      _count: {
        select: {
          purchases: true
        }
      }
    }
  });

  // Calculate revenue for each programme
  const programmesWithStats = await Promise.all(
    programmes.map(async (programme) => {
      const revenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          paymentableType: 'PROGRAMME',
          paymentableId: programme.id
        }
      });

      return {
        id: programme.id,
        name: programme.name,
        sales: programme._count.purchases,
        revenue: Number(revenue._sum.amount || 0)
      };
    })
  );

  // Sort by sales and return top N
  return programmesWithStats
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

async function getTopSellingSubscriptions(limit = 10) {
  // Get subscription plans with their subscription counts and revenue
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: true
        }
      }
    }
  });

  // Calculate revenue for each plan
  const plansWithStats = await Promise.all(
    plans.map(async (plan) => {
      // Get subscriptions for this plan and calculate revenue from their payments
      const subscriptions = await prisma.subscription.findMany({
        where: {
          subscriptionPlanId: plan.id
        },
        include: {
          user: true
        }
      });

      // Calculate total revenue from successful payments for these subscriptions
      const subscriptionIds = subscriptions.map(sub => sub.id);
      const revenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          paymentableType: 'SUBSCRIPTION',
          paymentableId: { in: subscriptionIds }
        }
      });

      return {
        id: plan.id,
        name: plan.name,
        sales: plan._count.subscriptions,
        revenue: Number(revenue._sum.amount || 0)
      };
    })
  );

  // Sort by sales and return top N
  return plansWithStats
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

async function getTopSellingProducts(limit = 10) {
  // Get products with their variant counts
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: {
          images: true,
          cartItems: true,
          orderItems: true
        }
      }
    }
  });

  // Calculate sales and revenue for each product through its variants
  const productsWithStats = await Promise.all(
    products.map(async (product) => {
      // Get order items for this product through its variants
      const orderItems = await prisma.orderItem.findMany({
        where: {
          productId: product.id,
          order: {
            status: 'PAID'
          }
        },
        select: {
          quantity: true,
          totalPrice: true
        }
      });

      const sales = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      return {
        id: product.id,
        name: product.name,
        sales: sales,
        revenue: revenue
      };
    })
  );

  // Sort by sales and return top N
  return productsWithStats
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

export async function getRecentActivity(query = {}) {
  const { limit = 10 } = query;
  
  try {
    // Get recent activities from different sources
    const [
      recentOrders,
      recentSubscriptions,
      recentPayments,
      recentUsers,
      recentProgrammePurchases,
      recentLoyaltyTransactions
    ] = await Promise.all([
      // Recent orders
      prisma.order.findMany({
        take: Math.ceil(limit / 3),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      
      // Recent subscriptions
      prisma.subscription.findMany({
        take: Math.ceil(limit / 3),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobileNumber: true
            }
          },
          subscriptionPlan: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Recent successful payments
      prisma.payment.findMany({
        take: Math.ceil(limit / 3),
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      
      // Recent user registrations
      prisma.user.findMany({
        take: Math.ceil(limit / 4),
        where: { role: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      }),
      
      // Recent programme purchases
      prisma.programmePurchase.findMany({
        take: Math.ceil(limit / 3),
        orderBy: { purchasedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          programme: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Recent loyalty transactions
      prisma.loyaltyTransaction.findMany({
        take: Math.ceil(limit / 4),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    // Transform data into a unified activity format
    const activities = [];

    // Add orders
    recentOrders.forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'New Order',
        description: `Order #${order.orderNumber} by ${order.user.firstName} ${order.user.lastName}`,
        user: order.user,
        amount: order.currency === 'EGP' ? `EGP ${order.total || 0}` : `SAR ${order.total || 0}`,
        status: order.status,
        timestamp: order.createdAt,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          currency: order.currency
        }
      });
    });

    // Add subscriptions
    recentSubscriptions.forEach(subscription => {
      activities.push({
        id: `subscription-${subscription.id}`,
        type: 'subscription',
        title: 'Subscription Activity',
        description: `${subscription.status} subscription for ${subscription.user.firstName} ${subscription.user.lastName}`,
        user: subscription.user,
        plan: subscription.subscriptionPlan?.name || 'Unknown Plan',
        status: subscription.status,
        timestamp: subscription.createdAt,
        metadata: {
          subscriptionId: subscription.id,
          subscriptionNumber: subscription.subscriptionNumber
        }
      });
    });

    // Add payments
    recentPayments.forEach(payment => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title: 'Payment Received',
        description: `Payment of ${payment.currency} ${payment.amount} from ${payment.user?.firstName || 'Unknown'} ${payment.user?.lastName || 'User'}`,
        user: payment.user,
        amount: `${payment.currency} ${payment.amount}`,
        method: payment.method,
        timestamp: payment.createdAt,
        metadata: {
          paymentId: payment.id,
          paymentReference: payment.paymentReference
        }
      });
    });

    // Add user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User Registration',
        description: `${user.firstName} ${user.lastName} joined the platform`,
        user: user,
        timestamp: user.createdAt,
        metadata: {
          userId: user.id
        }
      });
    });

    // Add programme purchases
    recentProgrammePurchases.forEach(purchase => {
      // Handle programme name - it might be an object with en/ar properties or a string
      const programmeName = purchase.programme?.name?.en || 
                           purchase.programme?.name || 
                           'Unknown Programme';
      
      activities.push({
        id: `programme-${purchase.id}`,
        type: 'programme',
        title: 'Programme Purchase',
        description: `${purchase.user.firstName} ${purchase.user.lastName} purchased ${programmeName}`,
        user: purchase.user,
        amount: `${purchase.currency} ${purchase.price}`,
        status: purchase.status,
        timestamp: purchase.purchasedAt,
        metadata: {
          programmePurchaseId: purchase.id,
          programmeId: purchase.programmeId
        }
      });
    });

    // Add loyalty transactions
    recentLoyaltyTransactions.forEach(transaction => {
      const isEarned = transaction.points > 0;
      activities.push({
        id: `loyalty-${transaction.id}`,
        type: 'loyalty',
        title: isEarned ? 'Loyalty Points Earned' : 'Loyalty Points Redeemed',
        description: `${transaction.user.firstName} ${transaction.user.lastName} ${isEarned ? 'earned' : 'redeemed'} ${Math.abs(transaction.points)} points`,
        user: transaction.user,
        points: transaction.points,
        reason: transaction.reason,
        source: transaction.source,
        timestamp: transaction.createdAt,
        metadata: {
          transactionId: transaction.id,
          type: transaction.type,
          source: transaction.source
        }
      });
    });

    // Sort all activities by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

// Subscription management
export async function getSubscriptions(query = {}) {
  const { page = 1, pageSize = 10, status } = query;
  const skip = (page - 1) * pageSize;
  
  const where = status ? { status } : {};

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, mobileNumber: true } },
        subscriptionPlan: true,
        coupon: { select: { id: true, code: true, discountPercentage: true } }
      }
    }),
    prisma.subscription.count({ where })
  ]);

  // Fetch payments for each subscription separately
  const subscriptionsWithPayments = await Promise.all(
    subscriptions.map(async (subscription) => {
      const payments = await prisma.payment.findMany({
        where: {
          paymentableId: subscription.id,
          paymentableType: 'SUBSCRIPTION'
        },
        select: {
          id: true,
          method: true,
          status: true,
          paymentProofUrl: true,
          paymentReference: true,
          amount: true,
          currency: true,
          paymentableType: true,
          paymentableId: true,
          transactionId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        ...subscription,
        payments
      };
    })
  );

  return { items: subscriptionsWithPayments, total, page, pageSize };
}

export async function getSubscriptionById(id) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, mobileNumber: true } },
      subscriptionPlan: true,
      payments: true
    }
  });
}

export async function updateSubscription(id, data) {
  return prisma.subscription.update({
    where: { id },
    data: {
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate
    }
  });
}

export async function deleteSubscription(id) {
  return prisma.subscription.delete({ where: { id } });
}

export async function cancelSubscription(id) {
  return prisma.subscription.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
}

export async function exportSubscriptions() {
  return prisma.subscription.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, mobileNumber: true } },
      subscriptionPlan: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getBenefits() {
  return prisma.benefit.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createBenefit(data) {
  return prisma.benefit.create({
    data: {
      description: data.description
    }
  });
}

export async function updateBenefit(id, data) {
  return prisma.benefit.update({
    where: { id },
    data: {
      description: data.description
    }
  });
}

export async function deleteBenefit(id) {
  return prisma.benefit.delete({
    where: { id }
  });
}

export async function createAdmin(data) {
  // Import the user service function that has proper validation
  const { adminCreateUser } = await import('../users/user.service.js');
  
  // Set role to ADMIN and call the user service function
  const adminData = {
    ...data,
    role: 'ADMIN'
  };
  
  return await adminCreateUser(adminData);
}

// Helper function to handle plan-benefit relationships
async function handlePlanBenefits(planId, benefits) {
  // Handle both simple benefit IDs and benefit objects
  const benefitRelations = benefits.map((benefit, index) => {
    if (typeof benefit === 'string') {
      // Simple benefit ID
      return {
        subscriptionPlanId: planId,
        benefitId: benefit,
        order: index + 1
      };
    } else if (benefit.id) {
      // Benefit object with order
      return {
        subscriptionPlanId: planId,
        benefitId: benefit.id,
        order: benefit.order || index + 1
      };
    } else {
      // Fallback to simple ID
      return {
        subscriptionPlanId: planId,
        benefitId: benefit.id || benefit,
        order: index + 1
      };
    }
  });
  
  if (benefitRelations.length > 0) {
    await prisma.subscriptionPlanBenefit.createMany({
      data: benefitRelations,
      skipDuplicates: true
    });
  }
}

// Helper function to handle plan pricing
async function handlePlanPrices(planId, prices) {
  // Delete existing prices for this plan
  await prisma.price.deleteMany({
    where: {
      purchasableId: planId,
      purchasableType: 'SUBSCRIPTION'
    }
  });
  
  // Create new prices one by one
  for (const price of prices) {
    try {
      await prisma.price.create({
        data: {
          id: `${planId}-${price.currency}-${price.type || 'NORMAL'}`,
          amount: price.amount,
          currency: price.currency,
          purchasableId: planId,
          purchasableType: 'SUBSCRIPTION',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.log('Price creation error:', error.message);
      // Skip if price already exists or foreign key constraint fails
      if (error.code === 'P2002' || error.message.includes('Foreign key constraint')) {
        continue;
      }
      throw error;
    }
  }
}

// Import the service functions from their respective modules
export async function adminUpdateSubscriptionStatus(id, status) {
  const { adminUpdateSubscriptionStatus } = await import('../subscriptions/subscription.service.js');
  return adminUpdateSubscriptionStatus(id, status);
}

export async function adminUpdateProgrammePurchaseStatus(id, status) {
  const { adminUpdateProgrammePurchaseStatus } = await import('../programmes/programme.service.js');
  return adminUpdateProgrammePurchaseStatus(id, status);
}

// Coupon usage management
export async function getCouponUsageStats(couponId) {
  const { getCouponUsageStats } = await import('../coupons/couponUsage.service.js');
  return getCouponUsageStats(couponId);
}

export async function getAllCouponsWithUsageStats() {
  const { getAllCouponsWithUsageStats } = await import('../coupons/couponUsage.service.js');
  return getAllCouponsWithUsageStats();
}

export async function syncCouponUsageStats(couponId) {
  const { syncCouponUsageStats } = await import('../coupons/couponUsage.service.js');
  return syncCouponUsageStats(couponId);
}


