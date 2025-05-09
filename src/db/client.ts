import { Prisma } from "@prisma/client"

/**
 * Prisma client instance for database operations.
 * Automatically handles connection pooling.
 */
export const prisma = new Prisma.PrismaClient()
