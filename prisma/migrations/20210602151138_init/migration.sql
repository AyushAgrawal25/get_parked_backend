-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
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
    `firstName` VARCHAR(255),
    `lastName` VARCHAR(255),
    `dialCode` VARCHAR(10),
    `phoneNumber` VARCHAR(15),
    `gender` VARCHAR(2),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `user_details_userId_unique`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_pics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `url` VARCHAR(191),
    `thumbnail` VARCHAR(191),
    `status` INTEGER NOT NULL,

    UNIQUE INDEX `profile_pics_userId_unique`(`userId`),
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

-- AddForeignKey
ALTER TABLE `profile_pics` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_details` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
