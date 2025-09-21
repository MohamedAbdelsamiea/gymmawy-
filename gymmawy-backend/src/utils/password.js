import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export async function hashPassword(plain) {
  if (typeof plain !== "string" || plain.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

