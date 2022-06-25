-- CreateTable
CREATE TABLE "readers" (
    "id" SERIAL NOT NULL,
    "readerName" VARCHAR(255) NOT NULL,
    "accountId" INTEGER NOT NULL,
    "lastMessageId" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "readers_accountId_key" ON "readers"("accountId");

-- AddForeignKey
ALTER TABLE "readers" ADD CONSTRAINT "readers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
