-- CreateTable
CREATE TABLE "dc_skips" (
    "id" SERIAL NOT NULL,
    "dayCountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "dc_skips_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dc_skips" ADD CONSTRAINT "dc_skips_dayCountId_fkey" FOREIGN KEY ("dayCountId") REFERENCES "day_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
