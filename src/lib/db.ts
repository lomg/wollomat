import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  "file:./dev.db";

const isPostgres = 
  process.env.PRISMA_PROVIDER === "postgres" ||
  databaseUrl.startsWith("postgresql://") || 
  databaseUrl.startsWith("postgres://");

if (isPostgres) {
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl,
  });
  prismaInstance = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
