/*
  Warnings:

  - Made the column `typeId` on table `slot_vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `slot_vehicles` MODIFY `typeId` INTEGER NOT NULL;
