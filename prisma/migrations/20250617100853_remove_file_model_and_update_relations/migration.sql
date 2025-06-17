/*
  Warnings:

  - You are about to drop the `files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_player_photo_id_fkey";

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_release_logo_id_fkey";

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_telegram_user_id_fkey";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "photo_content_type" TEXT,
ADD COLUMN     "photo_filename" TEXT,
ADD COLUMN     "photo_key" TEXT;

-- AlterTable
ALTER TABLE "releases" ADD COLUMN     "logo_content_type" TEXT,
ADD COLUMN     "logo_filename" TEXT,
ADD COLUMN     "logo_key" TEXT;

-- DropTable
DROP TABLE "files";
