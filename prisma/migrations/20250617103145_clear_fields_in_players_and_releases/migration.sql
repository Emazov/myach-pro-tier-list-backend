/*
  Warnings:

  - You are about to drop the column `description` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `releases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "description",
DROP COLUMN "number",
DROP COLUMN "position";

-- AlterTable
ALTER TABLE "releases" DROP COLUMN "description";
