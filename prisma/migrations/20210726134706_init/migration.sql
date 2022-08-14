/*
  Warnings:

  - Changed the type of `correct` on the `Test_answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Test_answer" ALTER COLUMN "translation" SET DATA TYPE TEXT,
DROP COLUMN "correct",
ADD COLUMN     "correct" INTEGER NOT NULL;
