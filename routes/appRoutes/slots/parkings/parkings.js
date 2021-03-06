require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const stringUtils = require('../../../../services/operations/stringUtils');
const bookingUtils = require('./../bookings/bookingUtils');
const transactionUtils = require('./../../transactions/transactionUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');
const adminUtils = require('../../../../services/admin/adminUtils');
const parkingSocketUtils = require('./../../../../services/sockets/parkings/parkingSocketUtils');
const slotSocketUtils = require('./../../../../services/sockets/slots/slotSocketUtils');
const notificationUtils = require('../../notifications/notificationUtils');
const fcmUtils=require('./../../../../services/notifications/FCM-Notifications/fcmUtils');
const domain = require('../../../../services/domain');
const transactionSocketUtils=require('./../../../../services/sockets/transactions/transactionSocketUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/park", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        //TODO: Check the slot status before sending request.

        const bookingData = await prisma.slotBooking.findUnique({
            where: {
                id: parseInt(req.body.bookingId)
            },
            include: {
                parkingRequest: true,
                slot: {
                    select: slotUtils.selection
                },
                user: {
                    select: userUtils.selection
                },
                vehicle: {
                    select: vehicleUtils.selectionWithTypeData
                }
            }
        });

        if (!bookingData) {
            // send error
            res.statusCode = parkingStatus.cannotBeProcessed.code;
            res.json({
                message: parkingStatus.cannotBeProcessed.message
            });
            return;
        }
        if (bookingData.status != 1) {
            // send error
            res.statusCode = parkingStatus.cannotBeProcessed.code;
            res.json({
                message: parkingStatus.cannotBeProcessed.message
            });
            return;
        }

        const withdrawOTP = stringUtils.generateOTP();
        let parkingCreate;
        try {
            parkingCreate = await prisma.slotParking.create({
                data: {
                    slotId: bookingData.slotId,
                    userId: bookingData.userId,
                    parkingHours: bookingData.parkingHours,
                    spaceType: bookingData.spaceType,
                    bookingId: bookingData.id,
                    vehicleId: bookingData.vehicleId,
                    withdrawOTP: withdrawOTP,
                    status: 1
                }
            });
        } catch (excp) {
            console.log("Parkings : Parking Create Block...");
        }
        if (!parkingCreate) {
            res.statusCode = parkingStatus.serverError.code;
            res.json({
                message: parkingStatus.serverError.message
            });
            return;
        }

        let bookingUpdate;
        try {
            bookingUpdate = await prisma.slotBooking.update({
                where: {
                    id: bookingData.id
                },
                data: {
                    status: 3
                }
            });
        } catch (error) {
            console.log("Parkings : Bookings Update Block...");
        }

        if (!bookingUpdate) {
            const delParking = await prisma.slotBooking.delete({
                where: {
                    id: parkingCreate.id
                }
            });

            res.statusCode = parkingStatus.serverError.code;
            res.json({
                message: parkingStatus.serverError.message
            });
            return;
        }

        // For Slot
        notificationUtils.sendNotification({
            recieverAccountType:UserAccountType.Slot,
            recieverUserId:bookingData.slot.userId,
            refData:parkingCreate,
            refId:parkingCreate.id,
            senderAccountType:UserAccountType.User,
            senderUserId:bookingData.userId,
            type:NotificationType.Parking_ForSlot,
            status:1
        });

        // For User
        notificationUtils.sendNotification({
            recieverAccountType:UserAccountType.User,
            recieverUserId:bookingData.userId,
            refData:parkingCreate,
            refId:parkingCreate.id,
            senderAccountType:UserAccountType.Slot,
            senderUserId:bookingData.slot.userId,
            type:NotificationType.Parking_ForUser,
            status:1
        });

        // Update Parking Sockets.
        parkingSocketUtils.updateParkingLord(bookingData.slot.userId, bookingData.parkingRequestId);
        parkingSocketUtils.updateUser(bookingData.userId, bookingData.parkingRequestId);

        // Update Slots Sockets.
        slotSocketUtils.updateSlotOnMap(bookingData.slotId);

        // For Slot
        try {
            fcmUtils.sendTo({
                body:bookingData.user.userDetails.firstName+" "+bookingData.user.userDetails.lastName,
                data:parkingCreate,
                imgUrl:(bookingData.user.userDetails.picThumbnailUrl!=null) ? domain.domainName+bookingData.user.userDetails.picThumbnailUrl:null,
                title:notificationUtils.titles.parking.forSlot,
                token:bookingData.slot.user.userNotification.token
            });
        } catch (error) {
            console.log("FCM notifications Block...");
            console.log(error);
        }

        // For User
        try {
            fcmUtils.sendTo({
                body:bookingData.slot.name,
                data:parkingCreate,
                imgUrl:(bookingData.slot.slotImages.length>0) ? domain.domainName+bookingData.slot.slotImages[0].thumbnailUrl: null,
                title:notificationUtils.titles.parking.forUser,
                token:bookingData.user.userNotification.token
            });
        } catch (error) {
            console.log("FCM notifications Block...");
            console.log(error);
        }

        res.statusCode = parkingStatus.success.code;
        res.json({
            message: parkingStatus.success.message,
            data: parkingCreate
        });
    } catch (error) {
        console.log(error);
        res.statusCode = parkingStatus.serverError.code;
        res.json({
            message: parkingStatus.serverError.message
        });
        return;
    }
});

const parkingStatus = {
    success: {
        code: 200,
        message: "Parked Succesfully"
    },
    inactiveSlot:{
        code:421,
        message:"Slot is inactive..."
    },
    cannotBeProcessed: {
        code: 422,
        message: "Parking cannot be processed..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.post("/withdraw", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const parkingData = await prisma.slotParking.findUnique({
            where: {
                id: parseInt(req.body.parkingId)
            },
            include: {
                booking: {
                    include: {
                        parkingRequest: true,
                    }
                },
                slot: {
                    select: slotUtils.selection
                },
                user: {
                    select: userUtils.selection
                },
                vehicle: {
                    select: vehicleUtils.selectionWithTypeData
                },
            }
        });

        if (!parkingData) {
            // send entity error.
            res.statusCode = parkingWithdrawStatus.cannotBeProcessed.code;
            res.json({
                message: parkingWithdrawStatus.cannotBeProcessed.message,
            });
            return;
        }

        if (parkingData.status != 1) {
            // send entity error.
            res.statusCode = parkingWithdrawStatus.cannotBeProcessed.code;
            res.json({
                message: parkingWithdrawStatus.cannotBeProcessed.message,
            });
            return;
        }

        const totalAmt = bookingUtils.getTotalAmt(req.body.duration, req.body.exceedDuration, parkingData.vehicle.fair);

        const userToSlotTxnCreate = prisma.transaction.create({
            data: {
                accountType: UserAccountType.User,
                amount: totalAmt.userToSlot,
                transferType: MoneyTransferType.Remove,
                type: TransactionType.NonReal,
                userId: parkingData.user.id,
                status: 1
            }
        });

        const slotToUserTxnCreate = prisma.transaction.create({
            data: {
                accountType: UserAccountType.Slot,
                amount: totalAmt.userToSlot,
                transferType: MoneyTransferType.Add,
                type: TransactionType.NonReal,
                userId: parkingData.slot.userId,
                status: 1
            }
        });

        const slotToAppTxnCreate = prisma.transaction.create({
            data: {
                accountType: UserAccountType.Slot,
                amount: totalAmt.slotToApp,
                transferType: MoneyTransferType.Remove,
                type: TransactionType.NonReal,
                userId: parkingData.slot.userId,
                status: 1
            }
        });

        const appToSlotTxnCreate = prisma.transaction.create({
            data: {
                accountType: UserAccountType.Admin,
                amount: totalAmt.slotToApp,
                transferType: MoneyTransferType.Add,
                type: TransactionType.NonReal,
                userId: adminUtils.details.id,
                status: 1
            }
        });

        let txnsCreate;
        try {
            txnsCreate = await prisma.$transaction([
                userToSlotTxnCreate, 
                slotToUserTxnCreate, 
                slotToAppTxnCreate, 
                appToSlotTxnCreate
            ]);
        } catch (error) {
            console.log("Parking Withdraw : Transactions Create Block...");
            console.log(error);
        }
        if (!txnsCreate) {
            res.statusCode = parkingWithdrawStatus.serverError.code;
            res.json({
                message: parkingWithdrawStatus.serverError.message,
            });
            return;
        }

        const userToSlotTxn = txnsCreate[0];
        const slotToUserTxn = txnsCreate[1];
        const slotToAppTxn = txnsCreate[2];
        const appToSlotTxn = txnsCreate[3];

        const userSlotRefCode = transactionUtils.generateTransactionRefId();

        const userToSlotNonRealTxnCreate = prisma.transactionNonReal.create({
            data: {
                amount: totalAmt.userToSlot,
                fromAccountType: UserAccountType.User,
                fromUserId: parkingData.user.id,
                txnCode: userSlotRefCode,
                transferType: MoneyTransferType.Remove,
                type: TransactionNonRealType.SlotBookings,
                withAccountType: UserAccountType.Slot,
                withUserId: parkingData.slot.userId,
                transactionId: userToSlotTxn.id,
                status: 1
            }
        });

        const slotToUserNonRealTxnCreate = prisma.transactionNonReal.create({
            data: {
                amount: totalAmt.userToSlot,
                fromAccountType: UserAccountType.Slot,
                fromUserId: parkingData.slot.userId,
                txnCode: userSlotRefCode,
                transferType: MoneyTransferType.Add,
                type: TransactionNonRealType.SlotBookings,
                withAccountType: UserAccountType.User,
                withUserId: parkingData.user.id,
                transactionId: slotToUserTxn.id,
                status: 1
            }
        });

        const slotAppRefCode = transactionUtils.generateTransactionRefId();

        const slotToAppNonRealTxnCreate = prisma.transactionNonReal.create({
            data: {
                amount: totalAmt.slotToApp,
                fromAccountType: UserAccountType.Slot,
                fromUserId: parkingData.slot.userId,
                txnCode: slotAppRefCode,
                transferType: MoneyTransferType.Remove,
                type: TransactionNonRealType.SlotBookings,
                withAccountType: UserAccountType.Admin,
                withUserId: adminUtils.details.id,
                transactionId: slotToAppTxn.id,
                status: 1
            }
        });

        const appToSlotNonRealTxnCreate = prisma.transactionNonReal.create({
            data: {
                amount: totalAmt.slotToApp,
                fromAccountType: UserAccountType.Admin,
                fromUserId: adminUtils.details.id,
                txnCode: slotAppRefCode,
                transferType: MoneyTransferType.Add,
                type: TransactionNonRealType.SlotBookings,
                withAccountType: UserAccountType.Slot,
                withUserId: parkingData.slot.userId,
                transactionId: appToSlotTxn.id,
                status: 1,
            }
        });

        let nonRealTxns;
        try {
            nonRealTxns = await prisma.$transaction([
                userToSlotNonRealTxnCreate,
                slotToUserNonRealTxnCreate,
                slotToAppNonRealTxnCreate,
                appToSlotNonRealTxnCreate,
            ]);
        } catch (error) {
            console.log("Parking Withdraw : Non Real Transactions Block..");
            console.log(error);
        }

        if (!nonRealTxns) {
            // Deleting Txns 
            const delTxns = await prisma.transaction.deleteMany({
                where: {
                    OR: [
                        {
                            id: userToSlotTxn.id
                        },
                        {
                            id: slotToUserTxn.id
                        },
                        {
                            id: slotToAppTxn.id
                        },
                        {
                            id: appToSlotTxn.id
                        },
                    ]
                }
            });


            res.statusCode = parkingWithdrawStatus.serverError.code;
            res.json({
                message: parkingWithdrawStatus.serverError.message,
            });
            return;
        }

        const updateBooking = prisma.slotBooking.update({
            where: {
                id: parkingData.booking.id
            },
            data: {
                status: 4,
                fromUserToSlotTransactionId: userToSlotTxn.id,
                fromSlotToUserTransactionId: slotToUserTxn.id,
                fromSlotToAppTransactionId: slotToAppTxn.id,
                fromAppToSlotTransactionId: appToSlotTxn.id,
                duration: req.body.duration,
                exceedDuration: req.body.exceedDuration,
            }
        });

        const updateParking = prisma.slotParking.update({
            where: {
                id: parkingData.id
            },
            data: {
                status: 0
            }
        });

        let updateBookingParking;
        try {
            updateBookingParking = await prisma.$transaction([
                updateBooking, updateParking
            ]);
        } catch (error) {
            console.log("Parking Withdraw : Booking And Parking Update");
            console.log(error);
        }
        if (!updateBookingParking) {
            // Deleting Txns 
            const delTxns = await prisma.transaction.deleteMany({
                where: {
                    OR: [
                        {
                            id: userToSlotTxn.id
                        },
                        {
                            id: slotToUserTxn.id
                        },
                        {
                            id: slotToAppTxn.id
                        },
                        {
                            id: appToSlotTxn.id
                        },
                    ]
                }
            });

            res.statusCode = parkingWithdrawStatus.serverError.code;
            res.json({
                message: parkingWithdrawStatus.serverError.message,
            });
            return;
        }

        // For Slot
        notificationUtils.sendNotification({
            recieverAccountType:UserAccountType.Slot,
            recieverUserId:parkingData.slot.userId,
            refData:parkingData,
            refId:parkingData.id,
            senderAccountType:UserAccountType.User,
            senderUserId:parkingData.userId,
            type:NotificationType.ParkingWithdraw_ForSlot,
            status:1
        });

        // For User
        notificationUtils.sendNotification({
            recieverAccountType:UserAccountType.User,
            recieverUserId:parkingData.userId,
            refData:parkingData,
            refId:parkingData.id,
            senderAccountType:UserAccountType.Slot,
            senderUserId:parkingData.slot.userId,
            type:NotificationType.ParkingWithdraw_ForUser,
            status:1
        });

        //Update Sockets Using this Data.
        parkingSocketUtils.updateParkingLord(parkingData.slot.userId, parkingData.booking.parkingRequestId);
        parkingSocketUtils.updateUser(parkingData.userId, parkingData.booking.parkingRequestId);

        transactionSocketUtils.updateUser(parkingData.userId, userToSlotTxn.id);
        transactionSocketUtils.updateUser(parkingData.slot.userId, slotToUserTxn.id);
        transactionSocketUtils.updateUser(parkingData.slot.userId, slotToAppTxn.id);

        // Update Slots Sockets.
        slotSocketUtils.updateSlotOnMap(parkingData.slotId);

        // For Slot
        try {
            fcmUtils.sendTo({
                body:parkingData.user.userDetails.firstName+" "+parkingData.user.userDetails.lastName,
                data:parkingData,
                imgUrl:(parkingData.user.userDetails.picThumbnailUrl!=null)? domain.domainName+parkingData.user.userDetails.picThumbnailUrl:null,
                title:notificationUtils.titles.parkingWithdraw.forSlot,
                token:parkingData.slot.user.userNotification.token
            });
        } catch (error) {
            console.log("FCM notifications block...");
            console.log(error);
        }

        // For User
        try {
            fcmUtils.sendTo({
                body:parkingData.slot.name,
                data:parkingData,
                imgUrl:(parkingData.slot.slotImages.length>0) ? domain.domainName+ parkingData.slot.slotImages[0].thumbnailUrl : null,
                title:notificationUtils.titles.parkingWithdraw.forUser,
                token:parkingData.user.userNotification.token
            });
        } catch (error) {
            console.log("FCM notifications block...");
            console.log(error);
        }

        res.statusCode = parkingWithdrawStatus.success.code;
        res.json({
            message: parkingWithdrawStatus.success.message,
            data: updateBookingParking[1]
        });
    } catch (error) {
        console.log(error);
        res.statusCode = parkingWithdrawStatus.serverError.code;
        res.json({
            message: parkingWithdrawStatus.serverError.message,
            error: error
        });
    }
});

const parkingWithdrawStatus = {
    success: {
        code: 200,
        message: "Parking completed, vehicle withdrawn successfully..."
    },
    cannotBeProcessed: {
        code: 422,
        message: "Vehicle Withdrawn cannot be processed..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error...."
    }
}

module.exports = router;