import app from "./express.js";
import { getPrismaClient } from "./config/db.js";

// initialize Prisma once on boot to catch DB issues early
getPrismaClient();

export default app;

