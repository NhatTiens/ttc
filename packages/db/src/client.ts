import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prismaByUrl?: Map<string, PrismaClient> };

export function getDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for database operations.");
  }
  const store = globalForPrisma.prismaByUrl ?? new Map<string, PrismaClient>();
  globalForPrisma.prismaByUrl = store;
  const existing = store.get(connectionString);
  if (existing) return existing;
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  store.set(connectionString, client);
  return client;
}

export async function disconnectDb() {
  const store = globalForPrisma.prismaByUrl;
  if (!store) return;
  await Promise.all([...store.values()].map((client) => client.$disconnect()));
  store.clear();
}
