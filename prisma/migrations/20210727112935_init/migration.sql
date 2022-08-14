/*
  Warnings:

  - You are about to drop the column `userId` on the `Test_answer` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Test_answer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Test_answer" DROP CONSTRAINT "Test_answer_userId_fkey";

-- AlterTable
ALTER TABLE "Test_answer" DROP COLUMN "userId",
ADD COLUMN     "authorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
