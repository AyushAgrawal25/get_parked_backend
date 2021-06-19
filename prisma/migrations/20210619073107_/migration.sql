-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255),
    `userToken` VARCHAR(255) NOT NULL,
    `signUpStatus` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `users.email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `email` VARCHAR(255),
    `picUrl` VARCHAR(255),
    `picThumbnailUrl` VARCHAR(255),
    `firstName` VARCHAR(100),
    `lastName` VARCHAR(100),
    `dialCode` VARCHAR(10),
    `phoneNumber` VARCHAR(15),
    `gender` ENUM('Male', 'Female', 'Others') NOT NULL,
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `user_details_userId_unique`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `user_notifications_userId_unique`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(1000) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(200) NOT NULL,
    `state` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `pincode` VARCHAR(20) NOT NULL,
    `landmark` VARCHAR(200) NOT NULL,
    `locationName` VARCHAR(100) NOT NULL,
    `country` VARCHAR(50) NOT NULL,
    `isoCountryCode` VARCHAR(10) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `length` DOUBLE NOT NULL,
    `breadth` DOUBLE NOT NULL,
    `height` DOUBLE NOT NULL,
    `startTime` INTEGER NOT NULL,
    `endTime` INTEGER NOT NULL,
    `spaceType` ENUM('Sheded', 'Open') NOT NULL,
    `securityDepositTime` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `slots_userId_unique`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `type` ENUM('BIKE', 'MINI', 'SEDAN', 'VAN', 'SUV') NOT NULL,
    `fair` DOUBLE NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_parking_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `spaceType` ENUM('Sheded', 'Open') NOT NULL,
    `parkingHours` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `parkingRequestId` INTEGER NOT NULL,
    `parkingOTP` VARCHAR(191) NOT NULL DEFAULT '0000',
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `spaceType` ENUM('Sheded', 'Open') NOT NULL,
    `parkingHours` INTEGER NOT NULL,
    `duration` INTEGER NOT NULL,
    `exceedDuration` INTEGER NOT NULL DEFAULT 0,
    `fromUserToSlotTransactionId` INTEGER,
    `fromSlotToUserTransactionId` INTEGER,
    `fromSlotToAppTransactionId` INTEGER,
    `fromAppToSlotTransactionId` INTEGER,
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `slot_bookings_parkingRequestId_unique`(`parkingRequestId`),
    UNIQUE INDEX `slot_bookings_fromUserToSlotTransactionId_unique`(`fromUserToSlotTransactionId`),
    UNIQUE INDEX `slot_bookings_fromSlotToUserTransactionId_unique`(`fromSlotToUserTransactionId`),
    UNIQUE INDEX `slot_bookings_fromSlotToAppTransactionId_unique`(`fromSlotToAppTransactionId`),
    UNIQUE INDEX `slot_bookings_fromAppToSlotTransactionId_unique`(`fromAppToSlotTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_parkings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `bookingId` INTEGER NOT NULL,
    `withdrawOTP` VARCHAR(191) NOT NULL DEFAULT '0000',
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `spaceType` ENUM('Sheded', 'Open') NOT NULL,
    `parkingHours` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `slot_parkings_bookingId_unique`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_ratings_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `parkingId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `ratingValue` DOUBLE NOT NULL,
    `review` VARCHAR(1000),
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `slot_ratings_reviews_parkingId_unique`(`parkingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slot_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slotId` INTEGER NOT NULL,
    `type` ENUM('Main', 'Others') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191),
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `accountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `transferType` ENUM('Add', 'Remove') NOT NULL,
    `type` ENUM('Real', 'NonReal') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions_real` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `transactionId` INTEGER NOT NULL,
    `accountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `transferType` ENUM('Add', 'Remove') NOT NULL,
    `ref` VARCHAR(191) NOT NULL,
    `refCode` VARCHAR(191) NOT NULL,
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `transactions_real_transactionId_unique`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions_non_real` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `type` ENUM('SlotBookings', 'TransactionRequests') NOT NULL,
    `fromUserId` INTEGER NOT NULL,
    `fromAccountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `withUserId` INTEGER NOT NULL,
    `withAccountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `refCode` VARCHAR(191) NOT NULL,
    `transferType` ENUM('Add', 'Remove') NOT NULL,
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `transactions_non_real_transactionId_unique`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fromUserId` INTEGER NOT NULL,
    `fromAccountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `withUserId` INTEGER NOT NULL,
    `withAccountType` ENUM('User', 'Slot', 'Admin') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `transferType` ENUM('Add', 'Remove') NOT NULL,
    `fromUserTransactionId` INTEGER,
    `wihtUserTransactionId` INTEGER,
    `time` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `transaction_requests_fromUserTransactionId_unique`(`fromUserTransactionId`),
    UNIQUE INDEX `transaction_requests_wihtUserTransactionId_unique`(`wihtUserTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_details` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slots` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_vehicles` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parking_requests` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parking_requests` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parking_requests` ADD FOREIGN KEY (`vehicleId`) REFERENCES `slot_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`vehicleId`) REFERENCES `slot_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`parkingRequestId`) REFERENCES `slot_parking_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`fromUserToSlotTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`fromSlotToUserTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`fromSlotToAppTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_bookings` ADD FOREIGN KEY (`fromAppToSlotTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parkings` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parkings` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parkings` ADD FOREIGN KEY (`vehicleId`) REFERENCES `slot_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_parkings` ADD FOREIGN KEY (`bookingId`) REFERENCES `slot_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_ratings_reviews` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_ratings_reviews` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_ratings_reviews` ADD FOREIGN KEY (`parkingId`) REFERENCES `slot_parkings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_ratings_reviews` ADD FOREIGN KEY (`vehicleId`) REFERENCES `slot_vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slot_images` ADD FOREIGN KEY (`slotId`) REFERENCES `slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions_real` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions_real` ADD FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions_non_real` ADD FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions_non_real` ADD FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions_non_real` ADD FOREIGN KEY (`withUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_requests` ADD FOREIGN KEY (`fromUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_requests` ADD FOREIGN KEY (`withUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_requests` ADD FOREIGN KEY (`fromUserTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_requests` ADD FOREIGN KEY (`wihtUserTransactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
