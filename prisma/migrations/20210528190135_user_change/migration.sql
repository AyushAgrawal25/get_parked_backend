/*
  Warnings:

  - Made the column `accessToken` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `accessToken` VARCHAR(255) NOT NULL;
