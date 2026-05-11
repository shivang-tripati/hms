/*
  Warnings:

  - You are about to drop the column `isInstalled` on the `holdings` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "HoldingStatus" ADD VALUE 'UNINSTALLED';

-- AlterTable
ALTER TABLE "holdings" DROP COLUMN "isInstalled",
ALTER COLUMN "status" SET DEFAULT 'UNINSTALLED';
