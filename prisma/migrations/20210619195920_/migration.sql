-- DropForeignKey
ALTER TABLE `slot_vehicles` DROP FOREIGN KEY `slot_vehicles_ibfk_2`;

-- AddForeignKey
ALTER TABLE `slot_vehicles` ADD FOREIGN KEY (`typeId`) REFERENCES `slot_vehicles_master`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
