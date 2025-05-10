// Import Prisma using CommonJS require to avoid TypeScript issues with Prisma v6
const { PrismaClient } = require("@prisma/client")

/**
 * Prisma client instance for database operations.
 * Automatically handles connection pooling.
 */
export const prisma = new PrismaClient()
