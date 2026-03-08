import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var prismaPoolSchema: string | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL nao configurada");
}

const databaseUrl = new URL(connectionString);
const dbSchema = databaseUrl.searchParams.get("schema") || "public";

const shouldReusePool = global.prismaPool && global.prismaPoolSchema === dbSchema;

if (global.prismaPool && !shouldReusePool) {
  global.prismaPool.end().catch(() => {
    // Ignore shutdown race errors during hot reload.
  });
}

const pool =
  (shouldReusePool ? global.prismaPool : undefined) ||
  new Pool({
    connectionString,
    // Prisma 7 + adapter-pg ignores ?schema=... from URL; enforce schema in runtime connection.
    options: `-c search_path=${dbSchema}`,
  });
const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
  global.prismaPool = pool;
  global.prismaPoolSchema = dbSchema;
}
