import { getPrismaClient } from "../../config/db.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { profileUpdateSchema } from "../auth/validators.js";

const prisma = getPrismaClient();

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function updateMe(userId, data) {
  // Validate the data using the same schema as signup
  const validatedData = profileUpdateSchema.parse(data || {});
  
  // Only update fields that are provided and not empty
  const updateData = {};
  Object.keys(validatedData).forEach(key => {
    if (validatedData[key] !== undefined && validatedData[key] !== null && validatedData[key] !== '') {
      updateData[key] = validatedData[key];
    }
  });
  
  // If no valid data to update, return current user
  if (Object.keys(updateData).length === 0) {
    return await getMe(userId);
  }
  
  // Check for duplicate phone number if mobileNumber is being updated
  if (updateData.mobileNumber) {
    const existingUser = await prisma.user.findFirst({
      where: { 
        mobileNumber: updateData.mobileNumber,
        id: { not: userId }
      }
    });
    
    if (existingUser) {
      const error = new Error("Phone number is already in use by another account");
      error.status = 400;
      error.expose = true;
      throw error;
    }
  }
  
  const user = await prisma.user.update({ where: { id: userId }, data: updateData });
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function changeEmail(userId, newEmail) {
  // Check if the new email is already in use by another user
  const existingUser = await prisma.user.findFirst({
    where: { 
      email: newEmail,
      id: { not: userId }
    }
  });
  
  if (existingUser) {
    const error = new Error("Email is already in use by another account");
    error.status = 400;
    error.expose = true;
    throw error;
  }
  
  // Get current user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    error.expose = true;
    throw error;
  }
  
  // If the new email is the same as current email, no need to change
  if (user.email === newEmail) {
    return { message: "Email is already the same" };
  }
  
  // Clean up any existing EMAIL_CHANGE tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId: userId,
      type: "EMAIL_CHANGE",
      consumedAt: null
    }
  });

  // Create email change verification token
  const { createAndEmailToken } = await import("../auth/auth.service.js");
  await createAndEmailToken(
    user, // Use current user data
    "EMAIL_CHANGE",
    "Verify Your New Email Address",
    null, // template parameter (not used)
    newEmail // Pass the new email address
  );
  
  return { message: "Verification email sent to your new email address" };
}

export async function adminGetUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function adminListUsers({ skip, take, q }) {
  const where = q
    ? { email: { contains: q, mode: "insensitive" } }
    : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map(({ passwordHash, ...u }) => u),
    total,
  };
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const e = new Error("Current password and new password are required");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    const e = new Error("Current password is incorrect");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });
}

export async function deleteAccount(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Soft delete - mark as deleted instead of actually deleting
  await prisma.user.update({
    where: { id: userId },
    data: { 
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${user.email}` // Make email unique for soft delete
    }
  });
}

export async function adminCreateUser(userData) {
  const { email, password, firstName, lastName, role = 'MEMBER' } = userData;
  
  if (!email || !password) {
    const e = new Error("Email and password are required");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    const e = new Error("User with this email already exists");
    e.status = 409;
    e.expose = true;
    throw e;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      emailVerified: true // Admin created users are pre-verified
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function adminUpdateUser(userId, userData) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  const allowedFields = ['firstName', 'lastName', 'email', 'role', 'mobileNumber', 'building', 'street', 'city', 'country', 'postcode'];
  const updateData = {};
  
  for (const field of allowedFields) {
    if (userData[field] !== undefined) {
      updateData[field] = userData[field];
    }
  }

  // If email is being updated, check for uniqueness
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await prisma.user.findUnique({ 
      where: { email: updateData.email.toLowerCase() } 
    });
    if (existingUser) {
      const e = new Error("Email already in use");
      e.status = 409;
      e.expose = true;
      throw e;
    }
    updateData.email = updateData.email.toLowerCase();
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}

export async function adminDeleteUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Soft delete for admin users too
  await prisma.user.update({
    where: { id: userId },
    data: { 
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${user.email}`
    }
  });
}


