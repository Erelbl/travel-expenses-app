-- CreateEnum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AchievementKey') THEN
    CREATE TYPE "AchievementKey" AS ENUM ('FIRST_EXPENSE_LOGGED', 'EXPENSES_ON_3_DAYS', 'TEN_EXPENSES_LOGGED', 'FIRST_TRIP_COMPLETED', 'THREE_TRIPS_LOGGED', 'EXPENSES_IN_2_COUNTRIES');
  END IF;
END $$;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" "AchievementKey" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- Add level column if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'UserAchievement' AND column_name = 'level'
  ) THEN
    ALTER TABLE "UserAchievement" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- CreateIndex (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'UserAchievement_userId_idx') THEN
    CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
  END IF;
END $$;

-- CreateIndex (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'UserAchievement_userId_key_level_key') THEN
    CREATE UNIQUE INDEX "UserAchievement_userId_key_level_key" ON "UserAchievement"("userId", "key", "level");
  END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserAchievement_userId_fkey'
  ) THEN
    ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

