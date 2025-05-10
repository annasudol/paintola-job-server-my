/**
 * Prisma client setup compatible with Node.js v22.x and Prisma 6
 */

// Ensure NODE_ENV is defined for conditional logic
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Import Prisma directly - this pattern works with modern Node.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prismaPackage = require('@prisma/client');

// Initialize a global instance of Prisma client
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: any | undefined;
}

// Create Prisma client with logging configuration
const createPrismaClient = () => {
  // Access the PrismaClient constructor directly from the package
  // This works regardless of how Prisma exports its client
  const PrismaClientConstructor = prismaPackage.PrismaClient || prismaPackage.default;
  
  if (!PrismaClientConstructor) {
    throw new Error('Could not find PrismaClient in @prisma/client package');
  }
  
  return new PrismaClientConstructor({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });
};

// Export a singleton instance of Prisma client
export const prisma = global.cachedPrisma || createPrismaClient();

// Cache the client to prevent connection issues in development
if (process.env.NODE_ENV !== 'production') global.cachedPrisma = prisma;
