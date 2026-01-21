-- Add lastLoginAt and isDisabled to User table
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false;

