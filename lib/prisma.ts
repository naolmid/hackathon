import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

async function createPrismaClient(): Promise<PrismaClient> {
  // Use Turso in production (when TURSO_DATABASE_URL is set)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const { createClient } = await import("@libsql/client");
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  // Use local SQLite for development
  return new PrismaClient();
}

// For synchronous access, we initialize with regular PrismaClient
// The actual Turso connection happens on first use in API routes
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export async getter for production use
let _prismaAsync: PrismaClient | null = null;

export async function getPrisma(): Promise<PrismaClient> {
  if (_prismaAsync) return _prismaAsync;
  _prismaAsync = await createPrismaClient();
  return _prismaAsync;
}
