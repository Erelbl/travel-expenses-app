-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "TripInvitation" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "invitedUserId" TEXT,
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "token" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "TripInvitation_token_key" ON "TripInvitation"("token");

-- CreateIndex
CREATE INDEX "TripInvitation_token_idx" ON "TripInvitation"("token");

-- CreateIndex
CREATE INDEX "TripInvitation_invitedUserId_idx" ON "TripInvitation"("invitedUserId");

-- AddForeignKey
ALTER TABLE "TripInvitation" ADD CONSTRAINT "TripInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

