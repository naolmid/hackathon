import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

// Check if we're in production with Turso
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Use dynamic import for Turso in production
  const { createClient } = require("@libsql/client/web");
  const { PrismaLibSQL } = require("@prisma/adapter-libsql");
  
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  });
  const adapter = new PrismaLibSQL(libsql);
  prismaInstance = new PrismaClient({ adapter } as any);
} else {
  // Use regular Prisma for local development
  prismaInstance = global.cachedPrisma ?? new PrismaClient();
  
  if (process.env.NODE_ENV !== "production") {
    global.cachedPrisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
