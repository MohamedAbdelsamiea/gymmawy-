import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory({ name }) {
  return prisma.category.create({ data: { name } });
}

export async function listProducts({ skip, take, q, categoryId, currency, isActive = true }) {
  const where = {
    AND: [
      categoryId ? { categoryId } : {},
      isActive !== undefined ? { isActive } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: [
        { order: 'asc' }, // Order by the 'order' field first
        { createdAt: "desc" } // Then by creation date
      ], 
      include: { 
        images: true 
      } 
    }),
    prisma.product.count({ where }),
  ]);

  // Fetch prices for all products if currency is specified
  if (currency) {
    const productIds = items.map(item => item.id);
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'PRODUCT',
        purchasableId: { in: productIds },
        currency: currency
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        purchasableId: true
      }
    });

    // Create a map of productId to price
    const priceMap = new Map();
    prices.forEach(price => {
      priceMap.set(price.purchasableId, price);
    });

    // Add prices to products
    const itemsWithPrices = items.map(item => ({
      ...item,
      price: priceMap.get(item.id) || null
    }));

    return { items: itemsWithPrices, total };
  }

  return { items, total };
}

export async function getProductById(id) {
  const product = await prisma.product.findUnique({ 
    where: { id }, 
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

  // Fetch prices for the product
  const prices = await prisma.price.findMany({
    where: {
      purchasableId: id,
      purchasableType: 'PRODUCT'
    }
  });

  return { ...product, prices };
}

export async function getRelatedProducts(productId, limit = 4) {
  // Get related products, excluding the current product
  const relatedProducts = await prisma.product.findMany({
    where: {
      AND: [
        { id: { not: productId } }, // Exclude current product
        { isActive: true },
        { deletedAt: null }
      ]
    },
    take: limit,
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' }
    ],
    include: {
      images: true
    }
  });

  // Fetch prices for each related product
  const relatedProductsWithPrices = await Promise.all(
    relatedProducts.map(async (product) => {
      const prices = await prisma.price.findMany({
        where: {
          purchasableId: product.id,
          purchasableType: 'PRODUCT'
        }
      });
      return { ...product, prices };
    })
  );

  return relatedProductsWithPrices;
}

export async function createProduct(data) {
  const { name, description, categoryId, loyaltyPointsAwarded, loyaltyPointsRequired, variants } = data;
  return prisma.product.create({
    data: {
      name,
      description,
      categoryId,
      loyaltyPointsAwarded: loyaltyPointsAwarded || 0,
      loyaltyPointsRequired: loyaltyPointsRequired || 0,
      variants: variants?.length ? { create: variants } : undefined,
    },
    include: { variants: true, images: true },
  });
}

export async function updateProduct(id, data) {
  const { variants, carouselImages, ...rest } = data;
  const updated = await prisma.product.update({ where: { id }, data: rest });
  
  if (Array.isArray(variants)) {
    // naive sync: delete and recreate
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.productVariant.createMany({ data: variants.map(v => ({ ...v, productId: id })) });
  }
  
  if (Array.isArray(carouselImages)) {
    // Handle carousel images: delete and recreate
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productImage.createMany({ 
      data: carouselImages.map((url, index) => ({ 
        productId: id, 
        url, 
        isPrimary: false 
      })) 
    });
  }
  
  return getProductById(id);
}

export async function deleteProduct(id) {
  await prisma.product.delete({ where: { id } });
}

// Get new arrivals (products added in the last 30 days)
export async function getNewArrivals({ limit = 8, currency }) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const where = {
    AND: [
      { isActive: true },
      { createdAt: { gte: thirtyDaysAgo } }
    ]
  };

  const items = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: [
      { order: 'asc' }, // Order by the 'order' field first
      { createdAt: "desc" } // Then by creation date (newest first)
    ],
    include: {
      images: true
    }
  });

  // Fetch prices for all products if currency is specified
  if (currency) {
    const productIds = items.map(item => item.id);
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'PRODUCT',
        purchasableId: { in: productIds },
        currency: currency
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        purchasableId: true
      }
    });

    // Create a map of productId to price
    const priceMap = new Map();
    prices.forEach(price => {
      priceMap.set(price.purchasableId, price);
    });

    // Add prices to products
    const itemsWithPrices = items.map(item => ({
      ...item,
      price: priceMap.get(item.id) || null
    }));

    return { items: itemsWithPrices, total: items.length };
  }

  return { items, total: items.length };
}

// Get all active products for shop-all page
export async function getAllProducts({ skip = 0, take = 20, categoryId, currency, search }) {
  const where = {
    AND: [
      { isActive: true },
      categoryId ? { categoryId } : {},
      search ? { 
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: [
        { order: 'asc' }, // Order by the 'order' field first
        { createdAt: "desc" } // Then by creation date
      ],
      include: {
        images: true
      }
    }),
    prisma.product.count({ where })
  ]);

  // Fetch prices for all products if currency is specified
  if (currency) {
    const productIds = items.map(item => item.id);
    const prices = await prisma.price.findMany({
      where: {
        purchasableType: 'PRODUCT',
        purchasableId: { in: productIds },
        currency: currency
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        purchasableId: true
      }
    });

    // Create a map of productId to price
    const priceMap = new Map();
    prices.forEach(price => {
      priceMap.set(price.purchasableId, price);
    });

    // Add prices to products
    const itemsWithPrices = items.map(item => ({
      ...item,
      price: priceMap.get(item.id) || null
    }));

    return { items: itemsWithPrices, total };
  }

  return { items, total };
}


