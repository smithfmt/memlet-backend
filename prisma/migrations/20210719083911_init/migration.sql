/*
  Warnings:

  - You are about to drop the `Wordlist_Item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test_Answer" DROP CONSTRAINT "Test_Answer_wordlistItemId_fkey";

-- DropForeignKey
ALTER TABLE "Wordlist_Item" DROP CONSTRAINT "Wordlist_Item_wordlistId_fkey";

-- DropTable
DROP TABLE "Wordlist_Item";

-- CreateTable
CREATE TABLE "Wordlist_item" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "wordlistId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wordlist_item" ADD FOREIGN KEY ("wordlistId") REFERENCES "Wordlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_Answer" ADD FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
