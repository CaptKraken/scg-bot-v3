-- CreateTable
CREATE TABLE "day_counts" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "dayCount" INTEGER NOT NULL DEFAULT 0,
    "schedule" VARCHAR(255) NOT NULL DEFAULT E'0 0 * * *',
    "message" VARCHAR(255) NOT NULL DEFAULT E'ថ្ងៃទី {day_count}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_counts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "day_counts" ADD CONSTRAINT "day_counts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
