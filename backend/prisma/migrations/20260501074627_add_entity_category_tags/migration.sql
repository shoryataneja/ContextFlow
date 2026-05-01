-- AlterTable
ALTER TABLE "Context" ADD COLUMN     "category" TEXT,
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
