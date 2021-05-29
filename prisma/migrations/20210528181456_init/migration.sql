/*
  Warnings:

  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - Added the required column `loginStatus` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `name`,
    ADD COLUMN `accessToken` VARCHAR(191),
    ADD COLUMN `loginStatus` INTEGER NOT NULL,
    ADD COLUMN `status` INTEGER NOT NULL;
