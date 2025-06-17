/*
  Warnings:

  - A unique constraint covering the columns `[release_logo_id]` on the table `files` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[player_photo_id]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "files" ADD COLUMN     "player_photo_id" INTEGER,
ADD COLUMN     "release_logo_id" INTEGER;

-- CreateTable
CREATE TABLE "releases" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "number" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "release_id" INTEGER NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_release_logo_id_key" ON "files"("release_logo_id");

-- CreateIndex
CREATE UNIQUE INDEX "files_player_photo_id_key" ON "files"("player_photo_id");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_release_logo_id_fkey" FOREIGN KEY ("release_logo_id") REFERENCES "releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_player_photo_id_fkey" FOREIGN KEY ("player_photo_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
