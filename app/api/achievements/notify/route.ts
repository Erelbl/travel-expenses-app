import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAchievementNotified } from '@/lib/achievements/evaluate'
import { AchievementKey } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, level } = body

    if (!key || !level) {
      return NextResponse.json({ error: 'Missing key or level' }, { status: 400 })
    }

    // Validate achievement key
    if (!Object.values(AchievementKey).includes(key)) {
      return NextResponse.json({ error: 'Invalid achievement key' }, { status: 400 })
    }

    await markAchievementNotified(session.user.id, key as AchievementKey, level)

    // Return deterministic contract: success + unlocked array (empty when nothing new)
    return NextResponse.json({ 
      success: true,
      unlocked: [] // This endpoint only marks as notified, doesn't unlock new achievements
    })
  } catch (error) {
    console.error('Failed to mark achievement as notified:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

