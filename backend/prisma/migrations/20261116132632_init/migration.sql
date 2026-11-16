-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV');

-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('FAVORITE', 'WATCH_LATER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "preferredLang" TEXT NOT NULL DEFAULT 'pt-BR',
    "region" TEXT NOT NULL DEFAULT 'BR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedMedia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'MOVIE',
    "listType" "ListType" NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "releaseYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SavedMedia_userId_listType_idx" ON "SavedMedia"("userId", "listType");

-- CreateIndex
CREATE UNIQUE INDEX "SavedMedia_userId_tmdbId_mediaType_listType_key" ON "SavedMedia"("userId", "tmdbId", "mediaType", "listType");

-- AddForeignKey
ALTER TABLE "SavedMedia" ADD CONSTRAINT "SavedMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
