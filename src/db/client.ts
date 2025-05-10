/**
 * Prisma client using CommonJS require to work with Prisma 6
 * This pattern works reliably for both local and deployed environments
 */

// Ensure NODE_ENV is defined for conditional logic
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Use require for Prisma 6 compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: PrismaClient } = require('@prisma/client');

// Initialize a global instance of Prisma client
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: any | undefined;
}

// Create Prisma client with appropriate logging
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });
};

// Export a singleton instance of Prisma client
export const prisma = global.cachedPrisma || createPrismaClient();

// Cache the client to prevent connection issues in development
if (process.env.NODE_ENV !== 'production') global.cachedPrisma = prisma;
