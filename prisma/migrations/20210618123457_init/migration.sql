/*
  Warnings:

  - You are about to drop the column `word` on the `Wordlist` table. All the data in the column will be lost.
  - Added the required column `wordlist` to the `Wordlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wordlist" DROP COLUMN "word",
ADD COLUMN     "wordlist" TEXT NOT NULL;
