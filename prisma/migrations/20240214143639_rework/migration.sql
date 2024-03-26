/*
  Warnings:

  - The values [PENDING,FINISHED] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MatchToParty` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[partyId]` on the table `Queue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[steamId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('CREATING', 'WAIT_FOR_JOIN', 'IN_PROGRESS');
ALTER TABLE "Match" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "MatchStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Queue" DROP CONSTRAINT "Queue_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "_MatchToParty" DROP CONSTRAINT "_MatchToParty_A_fkey";

-- DropForeignKey
ALTER TABLE "_MatchToParty" DROP CONSTRAINT "_MatchToParty_B_fkey";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'CREATING';

-- AlterTable
ALTER TABLE "PartyMember" ADD COLUMN     "connectedServerId" TEXT,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "steamId" TEXT;

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "_MatchToParty";

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "pterodactylId" INTEGER NOT NULL,
    "pterodactylUuid" TEXT NOT NULL,
    "connectionString" TEXT,
    "connectedPlayerIds" TEXT[],
    "matchId" TEXT NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Server_pterodactylId_key" ON "Server"("pterodactylId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_pterodactylUuid_key" ON "Server"("pterodactylUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Server_matchId_key" ON "Server"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_partyId_key" ON "Queue"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_connectedServerId_fkey" FOREIGN KEY ("connectedServerId") REFERENCES "Server"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
