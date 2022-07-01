-- AlterTable
ALTER TABLE "day_counts" ALTER COLUMN "dayCount" DROP NOT NULL,
ALTER COLUMN "schedule" DROP NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;

-- AlterTable
ALTER TABLE "readers" ALTER COLUMN "lastMessageId" DROP NOT NULL,
ALTER COLUMN "readCount" DROP NOT NULL;
