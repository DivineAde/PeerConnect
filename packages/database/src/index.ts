import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev, and across
// modules in prod, to avoid exhausting the Postgres connection pool.
declare global {
  // eslint-disable-next-line no-var
  var __peerconnectPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__peerconnectPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__peerconnectPrisma = prisma;
}

export * from "@prisma/client";
