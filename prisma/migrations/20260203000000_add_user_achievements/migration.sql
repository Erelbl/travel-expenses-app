-- CreateEnum
CREATE TYPE "AchievementKey" AS ENUM ('FIRST_EXPENSE_LOGGED', 'EXPENSES_ON_3_DAYS', 'TEN_EXPENSES_LOGGED', 'FIRST_TRIP_COMPLETED', 'THREE_TRIPS_LOGGED', 'EXPENSES_IN_2_COUNTRIES');

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" "AchievementKey" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_key_level_key" ON "UserAchievement"("userId", "key", "level");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

