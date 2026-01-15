-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('SOLO', 'COUPLE', 'FAMILY', 'FRIENDS');

-- CreateEnum
CREATE TYPE "TravelStyle" AS ENUM ('BUDGET', 'BALANCED', 'COMFORT', 'LUXURY');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "tripType" "TripType",
ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "travelStyle" "TravelStyle";

