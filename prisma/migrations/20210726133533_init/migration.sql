/*
  Warnings:

  - You are about to drop the `Test_Answer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test_Answer" DROP CONSTRAINT "Test_Answer_wordlistItemId_fkey";

-- DropTable
DROP TABLE "Test_Answer";

-- CreateTable
CREATE TABLE "Test_answer" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "translation" BOOLEAN NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "wordlistItemId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Test_answer" ADD FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
