-- DropForeignKey
ALTER TABLE "day_counts" DROP CONSTRAINT "day_counts_groupId_fkey";

-- DropForeignKey
ALTER TABLE "readers" DROP CONSTRAINT "readers_accountId_fkey";

-- AddForeignKey
ALTER TABLE "readers" ADD CONSTRAINT "readers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_counts" ADD CONSTRAINT "day_counts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
