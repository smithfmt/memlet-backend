/*
  Warnings:

  - Added the required column `wordlistItemId` to the `Test_answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Test_answer" ADD COLUMN     "wordlistItemId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
