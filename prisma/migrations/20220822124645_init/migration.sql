-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT E'NA',
    "avatar" TEXT NOT NULL DEFAULT E'none',

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wordlist" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "langs" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "upvoted" JSONB NOT NULL DEFAULT E'[]',
    "copied" INTEGER NOT NULL DEFAULT 0,
    "length" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wordlist_item" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "langs" TEXT NOT NULL DEFAULT E'latin-english',
    "wordlistId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_answer" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "correct_percentage" INTEGER NOT NULL,
    "wordlistItemId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "upvoted" JSONB NOT NULL DEFAULT E'[]',
    "copied" INTEGER NOT NULL DEFAULT 0,
    "length" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.username_unique" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User.hash_unique" ON "User"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "User.salt_unique" ON "User"("salt");

-- AddForeignKey
ALTER TABLE "Wordlist" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wordlist" ADD FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wordlist_item" ADD FOREIGN KEY ("wordlistId") REFERENCES "Wordlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
