/*
  Warnings:

  - The primary key for the `groups` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_FolderToGroup" DROP CONSTRAINT "_FolderToGroup_B_fkey";

-- DropForeignKey
ALTER TABLE "day_counts" DROP CONSTRAINT "day_counts_groupId_fkey";

-- AlterTable
ALTER TABLE "_FolderToGroup" ALTER COLUMN "B" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "day_counts" ALTER COLUMN "groupId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "groups" DROP CONSTRAINT "groups_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "day_counts" ADD CONSTRAINT "day_counts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToGroup" ADD CONSTRAINT "_FolderToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
