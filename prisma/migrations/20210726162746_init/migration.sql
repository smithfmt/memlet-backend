/*
  Warnings:

  - Added the required column `userId` to the `Test_answer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Test_answer" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
