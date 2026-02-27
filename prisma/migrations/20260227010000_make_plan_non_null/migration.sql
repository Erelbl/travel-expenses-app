-- Make plan non-nullable with default "free", backfilling any NULLs first
UPDATE "User" SET "plan" = 'free' WHERE "plan" IS NULL;
ALTER TABLE "User" ALTER COLUMN "plan" SET NOT NULL;
