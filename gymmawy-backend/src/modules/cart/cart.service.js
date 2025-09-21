import { getPrismaClient } from "../../config/db.js";

const prisma = getPrismaClient();

export async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { productVariant: true } } } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: { items: true } });
  }
  return cart;
}

export async function addItem(userId, { productVariantId, quantity }) {
  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findUnique({ where: { cartId_productVariantId: { cartId: cart.id, productVariantId } } });
  if (existing) {
    return prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + quantity } });
  }
  return prisma.cartItem.create({ data: { cartId: cart.id, productVariantId, quantity } });
}

export async function updateQuantity(userId, { productVariantId, quantity }) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findUnique({ where: { cartId_productVariantId: { cartId: cart.id, productVariantId } } });
  if (!item) return null;
  return prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
}

export async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) return;
  await prisma.cartItem.delete({ where: { id: item.id } });
}

export async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null }
  });
}

export async function applyCoupon(userId, code) {
  const cart = await getOrCreateCart(userId);
  
  // Find the coupon
  const coupon = await prisma.coupon.findFirst({
    where: { 
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { gt: new Date() }
    }
  });

  if (!coupon) {
    const e = new Error("Invalid or expired coupon");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Check if coupon is already applied
  if (cart.couponId === coupon.id) {
    const e = new Error("Coupon already applied");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Update cart with coupon
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id }
  });

  return {
    success: true,
    message: "Coupon applied successfully",
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      discountAmount: coupon.discountAmount
    }
  };
}

export async function removeCoupon(userId) {
  const cart = await getOrCreateCart(userId);
  
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null }
  });

  return { success: true };
}


