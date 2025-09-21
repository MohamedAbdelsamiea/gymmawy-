import { verifyAccessToken } from "../utils/jwt.js";
import { getPrismaClient } from "../config/db.js";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: { message: "Unauthorized" } });
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: { message: "Unauthorized" } });
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: { message: "Forbidden" } });
  next();
}

export async function attachUser(req, _res, next) {
  try {
    if (!req.user?.id) return next();
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    req.currentUser = user || null;
    next();
  } catch (e) {
    next(e);
  }
}

