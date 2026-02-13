/**
 * One-time migration script: Update users with plan="traveler" to plan="plus"
 * 
 * Usage:
 *   npx tsx scripts/migrate-traveler-to-plus.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[Migration] Starting: traveler → plus')

  // Find all users with plan="traveler" (case-insensitive)
  const usersToMigrate = await prisma.user.findMany({
    where: {
      plan: {
        in: ['traveler', 'Traveler', 'TRAVELER'],
      },
    },
    select: {
      id: true,
      email: true,
      plan: true,
    },
  })

  if (usersToMigrate.length === 0) {
    console.log('[Migration] No users with "traveler" plan found. ✅')
    return
  }

  console.log(`[Migration] Found ${usersToMigrate.length} users to migrate:`)
  usersToMigrate.forEach((user) => {
    console.log(`  - ${user.email || user.id}: ${user.plan} → plus`)
  })

  // Update all in a transaction
  const result = await prisma.user.updateMany({
    where: {
      plan: {
        in: ['traveler', 'Traveler', 'TRAVELER'],
      },
    },
    data: {
      plan: 'plus',
    },
  })

  console.log(`[Migration] Successfully migrated ${result.count} users to "plus" plan. ✅`)
}

main()
  .catch((error) => {
    console.error('[Migration] Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

