/*
  Warnings:

  - You are about to drop the column `loginStatus` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `loginStatus`,
    ADD COLUMN `signUpStatus` INTEGER;
