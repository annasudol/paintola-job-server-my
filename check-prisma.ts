// Script to check Prisma exports
import * as prismaClient from '@prisma/client';
import prismaDefault from '@prisma/client';

console.log('Prisma exports:', Object.keys(prismaClient));
console.log('\nDefault export:', prismaDefault);
console.log('\nPrismaClient from exports:', prismaClient.PrismaClient);
console.log('\nType of PrismaClient:', typeof prismaClient.PrismaClient);
console.log('\nIs constructor:', !!prismaClient.PrismaClient?.prototype?.constructor);

// Try importing using require
const requiredPrisma = require('@prisma/client');
console.log('\nRequired Prisma:', Object.keys(requiredPrisma));

