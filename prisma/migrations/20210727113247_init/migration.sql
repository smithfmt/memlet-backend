/*
  Warnings:

  - You are about to drop the column `wordlistItemId` on the `Test_answer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test_answer" DROP CONSTRAINT "Test_answer_wordlistItemId_fkey";

-- AlterTable
ALTER TABLE "Test_answer" DROP COLUMN "wordlistItemId";
