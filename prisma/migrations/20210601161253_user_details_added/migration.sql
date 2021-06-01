-- CreateTable
CREATE TABLE `UserDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `firstName` VARCHAR(255),
    `lastName` VARCHAR(255),
    `dialCode` VARCHAR(10),
    `phoneNumber` VARCHAR(15),
    `gender` VARCHAR(2),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `UserDetails_userId_unique`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserDetails` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
