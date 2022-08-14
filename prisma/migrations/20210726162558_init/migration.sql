/*
  Warnings:

  - You are about to drop the column `userId` on the `Test_answer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Test_answer" DROP CONSTRAINT "Test_answer_userId_fkey";

-- AlterTable
ALTER TABLE "Test_answer" DROP COLUMN "userId";
