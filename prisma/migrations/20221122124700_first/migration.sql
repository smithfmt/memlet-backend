-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'NA',
    "avatar" TEXT NOT NULL DEFAULT 'none',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wordlist" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "langs" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "upvoted" JSONB NOT NULL DEFAULT '[]',
    "copied" INTEGER NOT NULL DEFAULT 0,
    "length" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folderId" INTEGER,

    CONSTRAINT "Wordlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wordlist_item" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "langs" TEXT NOT NULL DEFAULT 'latin-english',
    "wordlistId" INTEGER NOT NULL,

    CONSTRAINT "Wordlist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test_answer" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "correct_percentage" INTEGER NOT NULL,
    "wordlistItemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Test_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "upvoted" JSONB NOT NULL DEFAULT '[]',
    "copied" INTEGER NOT NULL DEFAULT 0,
    "length" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT true,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_hash_key" ON "User"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "User_salt_key" ON "User"("salt");

-- AddForeignKey
ALTER TABLE "Wordlist" ADD CONSTRAINT "Wordlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wordlist" ADD CONSTRAINT "Wordlist_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wordlist_item" ADD CONSTRAINT "Wordlist_item_wordlistId_fkey" FOREIGN KEY ("wordlistId") REFERENCES "Wordlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD CONSTRAINT "Test_answer_wordlistItemId_fkey" FOREIGN KEY ("wordlistItemId") REFERENCES "Wordlist_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test_answer" ADD CONSTRAINT "Test_answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
