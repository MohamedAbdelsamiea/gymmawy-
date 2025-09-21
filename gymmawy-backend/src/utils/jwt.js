import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "1h";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "30d";

function getSecretOrThrow(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not configured`);
  return value;
}

export function signAccessToken(payload) {
  return jwt.sign(payload, getSecretOrThrow("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: "gymmawy",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecretOrThrow("JWT_ACCESS_SECRET"), { issuer: "gymmawy" });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, getSecretOrThrow("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_TTL,
    issuer: "gymmawy",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getSecretOrThrow("JWT_REFRESH_SECRET"), { issuer: "gymmawy" });
}

