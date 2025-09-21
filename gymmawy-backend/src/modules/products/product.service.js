import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory({ name }) {
  return prisma.category.create({ data: { name } });
}

export async function listProducts({ skip, take, q, categoryId, currency }) {
  const where = {
    AND: [
      categoryId ? { categoryId } : {},
    ],
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { createdAt: "desc" }, 
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
  return prisma.product.findUnique({ where: { id }, include: { variants: true, category: true, images: true } });
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
  const { variants, ...rest } = data;
  const updated = await prisma.product.update({ where: { id }, data: rest });
  if (Array.isArray(variants)) {
    // naive sync: delete and recreate
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.productVariant.createMany({ data: variants.map(v => ({ ...v, productId: id })) });
  }
  return getProductById(id);
}

export async function deleteProduct(id) {
  await prisma.product.delete({ where: { id } });
}


