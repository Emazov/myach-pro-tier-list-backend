/*
  Warnings:

  - You are about to drop the column `user_id` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_id` on the `telegram_users` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_user_id_fkey";

-- DropForeignKey
ALTER TABLE "telegram_users" DROP CONSTRAINT "telegram_users_avatar_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_fkey";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "user_id",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "telegram_users" DROP COLUMN "avatar_id";

-- DropTable
DROP TABLE "users";
