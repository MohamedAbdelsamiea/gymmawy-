import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export async function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  
  // Check password requirements: at least 8 characters with uppercase, lowercase, and number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(plain)) {
    throw new Error("Password must be at least 8 characters with uppercase, lowercase, and number");
  }
  
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

