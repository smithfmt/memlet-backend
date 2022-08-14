/*
  Warnings:

  - You are about to drop the column `authorId` on the `Test_answer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test_answer" DROP CONSTRAINT "Test_answer_authorId_fkey";

-- AlterTable
ALTER TABLE "Test_answer" DROP COLUMN "authorId";
