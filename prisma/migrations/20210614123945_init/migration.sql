/*
  Warnings:

  - You are about to drop the `wordlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "wordlist" DROP CONSTRAINT "wordlist_userId_fkey";

-- DropTable
DROP TABLE "wordlist";

-- CreateTable
CREATE TABLE "Wordlist" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wordlist" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
