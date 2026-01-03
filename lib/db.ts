import { createClient } from "@libsql/client/web";

// Direct Turso client for production
export function getTursoClient() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Turso not configured");
  }
  
  return createClient({
    url: process.env.TURSO_DATABASE_URL.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN.trim(),
  });
}

// Helper to check if we're using Turso
export function isTursoEnabled() {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

