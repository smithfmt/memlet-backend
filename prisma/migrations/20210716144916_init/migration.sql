/*
  Warnings:

  - You are about to drop the column `wordlist` on the `Wordlist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wordlist" DROP COLUMN "wordlist";

-- CreateTable
CREATE TABLE "Wordlist_Item" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "wordlistId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_Answer" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "translation" BOOLEAN NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "wordlistItemId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wordlist_Item" ADD FOREIGN KEY ("wordlistId") REFERENCES "Wordlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Answer" ADD FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
