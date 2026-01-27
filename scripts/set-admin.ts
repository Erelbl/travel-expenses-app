/**
 * Script to set admin flag for specific users
 * Run with: npx tsx scripts/set-admin.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ADMIN_EMAILS = [
  "blerelbl@gmail.com",
]

async function setAdminUsers() {
  console.log("Setting admin flags for designated users...\n")
  
  for (const email of ADMIN_EMAILS) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, isAdmin: true, plan: true },
      })

      if (!user) {
        console.log(`⚠️  User not found: ${email}`)
        continue
      }

      if (user.isAdmin) {
        console.log(`✓ Already admin: ${email} (plan: ${user.plan || "free"})`)
        continue
      }

      // Set admin flag
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true },
      })

      console.log(`✓ Set admin flag: ${email} (plan: ${user.plan || "free"})`)
    } catch (error) {
      console.error(`✗ Error processing ${email}:`, error)
    }
  }

  console.log("\n✅ Admin setup complete!")
}

setAdminUsers()
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

