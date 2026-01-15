import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  })
}

export const prisma = globalForPrisma.prisma
