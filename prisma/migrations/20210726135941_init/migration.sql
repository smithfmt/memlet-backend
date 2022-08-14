/*
  Warnings:

  - You are about to drop the column `translation` on the `Test_answer` table. All the data in the column will be lost.
  - Added the required column `correct_answer` to the `Test_answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correct_percentage` to the `Test_answer` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `correct` on the `Test_answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Test_answer" DROP COLUMN "translation",
ADD COLUMN     "correct_answer" TEXT NOT NULL,
ADD COLUMN     "correct_percentage" INTEGER NOT NULL,
DROP COLUMN "correct",
ADD COLUMN     "correct" BOOLEAN NOT NULL;
