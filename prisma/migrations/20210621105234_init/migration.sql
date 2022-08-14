/*
  Warnings:

  - Added the required column `reference` to the `Wordlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wordlist" ADD COLUMN     "reference" TEXT NOT NULL;
