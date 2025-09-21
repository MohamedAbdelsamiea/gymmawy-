import crypto from "crypto";
import { getPrismaClient } from "../../config/db.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { sendEmail } from "../../utils/email.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { 
  getEmailVerificationTemplate, 
  getPasswordResetTemplate, 
  getEmailChangeVerificationTemplate 
} from "../../utils/emailTemplates.js";

const prisma = getPrismaClient();

function normalizeLoginIdentifier(identifier) {
  if (!identifier) return null;
  const value = String(identifier).trim().toLowerCase();
  // Only email login is supported now
  return value;
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function createAndEmailToken(user, type, subject, template, newEmail = null) {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const ttlMinutes = type === "EMAIL_VERIFICATION" ? 60 * 24 : 30; // 24h for verify, 30m for reset
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await prisma.verificationToken.create({
    data: { 
      userId: user.id, 
      tokenHash, 
      type, 
      expiresAt,
      newEmail: type === "EMAIL_CHANGE" ? newEmail : null
    },
  });
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  let linkPath;
  if (type === "EMAIL_VERIFICATION") {
    linkPath = "/auth/verify-email";
  } else if (type === "EMAIL_CHANGE") {
    linkPath = "/auth/verify-email-change";
  } else {
    linkPath = "/auth/reset-password";
  }
  // Use new email for EMAIL_CHANGE, otherwise use user's current email
  const emailToUse = type === "EMAIL_CHANGE" && newEmail ? newEmail : user.email;
  const link = `${frontendUrl}${linkPath}?token=${token}&email=${encodeURIComponent(emailToUse)}`;
  
  // Generate email content based on type using templates
  let html, text;
  const userLanguage = user.language || 'en'; // Default to English if no language preference
  
  if (type === "EMAIL_VERIFICATION") {
    html = getEmailVerificationTemplate({
      firstName: user.firstName || user.email,
      email: emailToUse,
      verificationLink: link
    }, userLanguage);
    text = `Hi ${user.firstName || user.email}, please verify your email by clicking this link: ${link}`;
  } else if (type === "EMAIL_CHANGE") {
    html = getEmailChangeVerificationTemplate({
      firstName: user.firstName || user.email,
      email: user.email,
      newEmail: newEmail,
      verificationLink: link
    }, userLanguage);
    text = `Hi ${user.firstName || user.email}, please verify your new email address by clicking this link: ${link}`;
  } else {
    // PASSWORD_RESET
    html = getPasswordResetTemplate({
      firstName: user.firstName || user.email,
      email: emailToUse,
      resetLink: link
    }, userLanguage);
    text = `Hi ${user.firstName || user.email}, you requested a password reset. Click this link to reset your password: ${link}`;
  }
  
  await sendEmail({
    to: emailToUse,
    subject,
    html,
    text,
  });
}

export async function registerUser({ 
  email, 
  password, 
  firstName, 
  lastName, 
  mobileNumber, 
  birthDate, 
  building, 
  street, 
  city, 
  country, 
  postcode,
  language = 'en'
}) {
  email = String(email || "").toLowerCase().trim();
  mobileNumber = String(mobileNumber || "").trim();
  
  if (!email || !password || !mobileNumber) {
    const error = new Error("Email, password, and mobile number are required");
    error.status = 400;
    error.expose = true;
    throw error;
  }
  
  // Check if user already exists (verified)
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("User with email already exists");
    error.status = 409;
    error.expose = true;
    throw error;
  }
  
  // Check if there's already a pending verification for this email
  const existingPending = await prisma.pendingUserVerification.findUnique({ where: { email } });
  if (existingPending) {
    // Delete the old pending verification
    await prisma.pendingUserVerification.delete({ where: { id: existingPending.id } });
  }
  
  const passwordHash = await hashPassword(password);
  const verificationToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Create pending user verification record
  const pendingUser = await prisma.pendingUserVerification.create({
    data: {
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      mobileNumber: mobileNumber,
      birthDate: birthDate ? new Date(birthDate) : null,
      building: building || null,
      street: street || null,
      city: city || null,
      country: country || null,
      postcode: postcode || null,
      verificationToken,
      expiresAt,
    },
  });
  
  // Send verification email using template
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  
  // Use the new email template with the provided language
  const html = getEmailVerificationTemplate({
    firstName: firstName || email,
    email: email,
    verificationLink: link
  }, language); // Use the language from registration
  
  await sendEmail({
    to: email,
    subject: "Welcome to Gymmawy - Verify Your Email",
    html: html,
    text: `Hi ${firstName || email}, please verify your email by clicking this link: ${link}`,
  });
  
  return { id: pendingUser.id, email: pendingUser.email };
}

export async function loginUser({ identifier, password }) {
  const value = normalizeLoginIdentifier(identifier);
  if (!value || !password) {
    const e = new Error("Email and password required");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  const user = await prisma.user.findUnique({ where: { email: value } });
  if (!user) {
    const e = new Error("Invalid credentials");
    e.status = 401;
    e.expose = true;
    throw e;
  }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const e = new Error("Account locked. Try later");
    e.status = 423;
    e.expose = true;
    throw e;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      updates.failedLoginAttempts = 0;
    }
    await prisma.user.update({ where: { id: user.id }, data: updates });
    const e = new Error("Invalid credentials");
    e.status = 401;
    e.expose = true;
    throw e;
  }

  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const refreshHash = hashToken(refreshToken);
  
  // Only delete very old refresh tokens (older than 7 days) to prevent table bloat
  // This allows multiple active sessions but prevents indefinite token accumulation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      revoked: false,
      createdAt: { lt: sevenDaysAgo }
    }
  });
  
  // Create new refresh token
  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + (Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000)),
    },
  });
  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
}

export async function logoutUser({ refreshToken }) {
  if (!refreshToken) return;
  const refreshHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash: refreshHash, revoked: false }, data: { revoked: true, revokedAt: new Date() } });
}

export async function verifyEmailToken({ token, email }) {
  if (!token || !email) {
    const e = new Error("Token and email required");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  
  // Find pending user verification
  const pendingUser = await prisma.pendingUserVerification.findUnique({ 
    where: { 
      email: email.toLowerCase(),
      verificationToken: token 
    } 
  });
  
  if (!pendingUser) {
    // Check if user already exists (might have been verified already)
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const e = new Error("User already exists and is verified");
      e.status = 409;
      e.expose = true;
      throw e;
    }
    
    const e = new Error("Invalid verification token or email. The link may have expired or been used already.");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  
  if (pendingUser.expiresAt < new Date()) {
    // Clean up expired pending user
    await prisma.pendingUserVerification.delete({ where: { id: pendingUser.id } });
    const e = new Error("Verification token has expired. Please register again.");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  
  // Check if user already exists (race condition protection)
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    // Clean up pending user since user already exists
    await prisma.pendingUserVerification.delete({ where: { id: pendingUser.id } });
    const e = new Error("User already exists and is verified");
    e.status = 409;
    e.expose = true;
    throw e;
  }
  
  // Create the actual user record
  const user = await prisma.user.create({
    data: {
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      mobileNumber: pendingUser.mobileNumber,
      birthDate: pendingUser.birthDate,
      building: pendingUser.building,
      street: pendingUser.street,
      city: pendingUser.city,
      country: pendingUser.country,
      postcode: pendingUser.postcode,
    },
  });
  
  // Clean up pending user verification
  await prisma.pendingUserVerification.delete({ where: { id: pendingUser.id } });
  
  return { success: true, user: { id: user.id, email: user.email } };
}

export async function verifyEmailChangeToken({ token, email }) {
  if (!token || !email) {
    const e = new Error("Token and email required");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  
  const tokenHash = hashToken(token);
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      tokenHash,
      type: "EMAIL_CHANGE",
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });
  
  if (!verificationToken) {
    const e = new Error("Invalid or expired token");
    e.status = 400;
    e.expose = true;
    throw e;
  }
  
  // For EMAIL_CHANGE, check if the provided email matches the stored new email
  if (verificationToken.type === "EMAIL_CHANGE") {
    if (!verificationToken.newEmail || verificationToken.newEmail !== email.toLowerCase()) {
      const e = new Error("Email mismatch");
      e.status = 400;
      e.expose = true;
      throw e;
    }
  } else {
    // For other token types, check if the email matches the user's current email
    if (verificationToken.user.email !== email.toLowerCase()) {
      const e = new Error("Email mismatch");
      e.status = 400;
      e.expose = true;
      throw e;
    }
  }
  
  // Update user's email
  const updatedUser = await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { email: email.toLowerCase() }
  });
  
  // Mark token as consumed
  await prisma.verificationToken.update({
    where: { id: verificationToken.id },
    data: { consumedAt: new Date() }
  });
  
  return { 
    success: true, 
    message: "Email address updated successfully",
    user: { id: updatedUser.id, email: updatedUser.email }
  };
}

export async function startPasswordReset({ email }) {
  if (!email) { const e = new Error("Email required"); e.status = 400; e.expose = true; throw e; }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return; // do not reveal
  
  // Delete any existing password reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { 
      userId: user.id, 
      type: "PASSWORD_RESET",
      consumedAt: null 
    }
  });
  
  await createAndEmailToken(
    user,
    "PASSWORD_RESET",
    "Reset your Gymmawy password",
    ({ user: u, link }) => `<p>Hi ${u.firstName || u.email},</p><p>Reset password: <a href="${link}">Reset</a></p>`
  );
}

export async function resetPassword({ token, email, newPassword }) {
  if (!token || !email || !newPassword) { const e = new Error("Invalid request"); e.status = 400; e.expose = true; throw e; }
  const tokenHash = hashToken(token);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) { const e = new Error("Invalid token"); e.status = 400; e.expose = true; throw e; }
  const record = await prisma.verificationToken.findFirst({ where: { userId: user.id, tokenHash, type: "PASSWORD_RESET", consumedAt: null } });
  if (!record || record.expiresAt < new Date()) { const e = new Error("Token expired or invalid"); e.status = 400; e.expose = true; throw e; }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
  ]);
}

export async function refreshToken({ refreshToken }) {
  if (!refreshToken) {
    const e = new Error("Refresh token required");
    e.status = 401;
    e.expose = true;
    throw e;
  }

  const tokenHash = hashToken(refreshToken);
  
  // Use findUnique with a more specific query to avoid race conditions
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: { 
      tokenHash, 
      revoked: false,
      expiresAt: { gt: new Date() } // Only get non-expired tokens
    },
    include: { user: true }
  });

  if (!tokenRecord) {
    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    e.expose = true;
    throw e;
  }

  // Generate new tokens
  const accessToken = signAccessToken({ sub: tokenRecord.user.id, role: tokenRecord.user.role });
  let newRefreshToken = signRefreshToken({ sub: tokenRecord.user.id, role: tokenRecord.user.role });
  let newRefreshHash = hashToken(newRefreshToken);

  // Try to create the new token with retry logic for race conditions
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // First, try to revoke the old token atomically
      const updateResult = await prisma.refreshToken.updateMany({
        where: { 
          id: tokenRecord.id, 
          revoked: false // Only update if not already revoked
        },
        data: { 
          revoked: true, 
          revokedAt: new Date() 
        }
      });
      
      // If no rows were updated, the token was already revoked by another request
      if (updateResult.count === 0) {
        const e = new Error("Invalid or expired refresh token");
        e.status = 401;
        e.expose = true;
        throw e;
      }
      
      // Only delete very old refresh tokens (older than 7 days) to prevent table bloat
      // This is less aggressive and won't interfere with active sessions
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await prisma.refreshToken.deleteMany({
        where: {
          userId: tokenRecord.user.id,
          revoked: false,
          createdAt: { lt: sevenDaysAgo }
        }
      });
      
      // Now create the new token
      await prisma.refreshToken.create({
        data: {
          tokenHash: newRefreshHash,
          userId: tokenRecord.user.id,
          expiresAt: new Date(Date.now() + (Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000)),
        }
      });
      
      // Success - break out of retry loop
      break;
      
    } catch (error) {
      // Handle unique constraint violation (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('tokenHash')) {
        retryCount++;
        if (retryCount >= maxRetries) {
          // This means the token was already used - treat as invalid
          const e = new Error("Invalid or expired refresh token");
          e.status = 401;
          e.expose = true;
          throw e;
        }
        // Generate a new token hash and retry
        newRefreshToken = signRefreshToken({ sub: tokenRecord.user.id, role: tokenRecord.user.role });
        newRefreshHash = hashToken(newRefreshToken);
        continue;
      }
      // Re-throw other errors
      throw error;
    }
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: { id: tokenRecord.user.id, email: tokenRecord.user.email, role: tokenRecord.user.role }
  };
}

export async function resendVerificationEmail({ email, language = 'en' }) {
  if (!email) {
    const e = new Error("Email required");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Check if user already exists (verified)
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existingUser) {
    const e = new Error("User already exists and is verified");
    e.status = 400;
    e.expose = true;
    throw e;
  }

  // Find pending user verification
  const pendingUser = await prisma.pendingUserVerification.findUnique({ where: { email: email.toLowerCase() } });
  if (!pendingUser) {
    const e = new Error("No pending verification found for this email");
    e.status = 404;
    e.expose = true;
    throw e;
  }

  // Generate new verification token
  const verificationToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update pending user with new token
  await prisma.pendingUserVerification.update({
    where: { id: pendingUser.id },
    data: { verificationToken, expiresAt }
  });

  // Send verification email using template
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  
  // Use the new email template with the provided language
  const html = getEmailVerificationTemplate({
    firstName: pendingUser.firstName || email,
    email: email,
    verificationLink: link
  }, language); // Use the language from request
  
  await sendEmail({
    to: email,
    subject: "Welcome to Gymmawy - Verify Your Email",
    html: html,
    text: `Hi ${pendingUser.firstName || email}, please verify your email by clicking this link: ${link}`,
  });

  return { success: true };
}

export { createAndEmailToken };

