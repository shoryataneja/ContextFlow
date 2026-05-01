-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('IMMEDIATE', 'HISTORICAL', 'TEMPORAL', 'EXPERIENTIAL');

-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL,
    "type" "ContextType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("id")
);
