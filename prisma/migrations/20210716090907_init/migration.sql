/*
  Warnings:

  - Added the required column `langs` to the `Wordlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wordlist" ADD COLUMN     "langs" TEXT NOT NULL,
ALTER COLUMN "title" SET DATA TYPE TEXT;
