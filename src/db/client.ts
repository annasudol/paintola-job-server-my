// Import Prisma client with ES module syntax to work consistently in all environments
import { PrismaClient } from "@prisma/client"

/**
 * Prisma client instance for database operations.
 * Automatically handles connection pooling.
 */
// Add logging in production to help diagnose issues
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })
}

// Use global object to store Prisma instance to prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
