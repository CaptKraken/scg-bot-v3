/*
  Warnings:

  - A unique constraint covering the columns `[readerName]` on the table `readers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "readers_readerName_key" ON "readers"("readerName");
