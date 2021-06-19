-- AlterTable
ALTER TABLE `slot_vehicles` ADD COLUMN `typeId` INTEGER;

-- CreateTable
CREATE TABLE `slot_vehicles_master` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `length` DOUBLE NOT NULL,
    `breadth` DOUBLE NOT NULL,
    `height` DOUBLE NOT NULL,
    `area` DOUBLE NOT NULL,
    `type` ENUM('BIKE', 'MINI', 'SEDAN', 'VAN', 'SUV') NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `slot_vehicles` ADD FOREIGN KEY (`slotId`) REFERENCES `slot_vehicles_master`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
