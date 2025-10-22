import { PrismaClient } from '@prisma/client';

let prisma;
let isInitialized = false;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    
    // Test the connection
    prisma.$connect().then(() => {
      isInitialized = true;
      console.log('✅ Prisma client connected successfully');
    }).catch((error) => {
      console.error('❌ Prisma client connection failed:', error);
      isInitialized = false;
    });
  }
  return prisma;
}

export function isPrismaInitialized() {
  return isInitialized && prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    isInitialized = false;
  }
}