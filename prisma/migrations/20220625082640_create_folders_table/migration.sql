-- CreateTable
CREATE TABLE "folders" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FolderToGroup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_key" ON "folders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_FolderToGroup_AB_unique" ON "_FolderToGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_FolderToGroup_B_index" ON "_FolderToGroup"("B");

-- AddForeignKey
ALTER TABLE "_FolderToGroup" ADD CONSTRAINT "_FolderToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderToGroup" ADD CONSTRAINT "_FolderToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
