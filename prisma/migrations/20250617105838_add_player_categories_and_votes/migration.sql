-- CreateTable
CREATE TABLE "player_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "max_places" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_votes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "player_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "player_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_categories_name_key" ON "player_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "player_votes_player_id_user_id_key" ON "player_votes"("player_id", "user_id");

-- AddForeignKey
ALTER TABLE "player_votes" ADD CONSTRAINT "player_votes_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_votes" ADD CONSTRAINT "player_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "telegram_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_votes" ADD CONSTRAINT "player_votes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "player_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
