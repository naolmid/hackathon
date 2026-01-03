import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Use Turso in production
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL.trim(),
      authToken: process.env.TURSO_AUTH_TOKEN.trim(),
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter } as any);
  }
  
  // Use local SQLite for development
  return new PrismaClient();
}

export const prisma = global.cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}
