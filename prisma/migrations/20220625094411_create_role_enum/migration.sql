/*
  Warnings:

  - Added the required column `role` to the `people` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "role" "Role" NOT NULL;
