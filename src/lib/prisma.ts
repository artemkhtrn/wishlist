import { PrismaLibSql } from "@prisma/adapter-libsql";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../generated/prisma/client");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any };

function createPrisma() {
  const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter, log: ["error"] } as any);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
