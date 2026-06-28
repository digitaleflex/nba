/*
  Warnings:

  - You are about to drop the column `asset` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `entry_price` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `stop_loss` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `target_price` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `signals` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `signals` table. All the data in the column will be lost.
  - Added the required column `content` to the `signals` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "signals_asset_idx";

-- DropIndex
DROP INDEX "signals_type_idx";

-- AlterTable
ALTER TABLE "signals" DROP COLUMN "asset",
DROP COLUMN "confidence",
DROP COLUMN "description",
DROP COLUMN "entry_price",
DROP COLUMN "stop_loss",
DROP COLUMN "target_price",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "image_url" TEXT;

-- DropEnum
DROP TYPE "SignalConfidence";

-- DropEnum
DROP TYPE "SignalType";
