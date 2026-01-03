import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // In production with Turso, we need to use libsql adapter
  // But due to build issues, we'll use a workaround
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN && typeof window === 'undefined') {
    try {
      // Dynamic require to avoid build issues
      const { createClient } = require("@libsql/client/web");
      const { PrismaLibSQL } = require("@prisma/adapter-libsql");
      
      const libsql = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.log("Falling back to regular Prisma client:", e);
      return new PrismaClient();
    }
  }
  
  return new PrismaClient();
}

export const prisma = global.cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}
