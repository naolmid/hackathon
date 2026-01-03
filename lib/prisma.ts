import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Always use regular PrismaClient
  // Turso adapter has compatibility issues with Next.js build
  return new PrismaClient();
}

export const prisma = global.cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}
