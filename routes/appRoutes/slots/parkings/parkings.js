require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType } = require('@prisma/client');

const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const stringUtils = require('../../../../services/operations/stringUtils');
const bookingUtils = require('./../bookings/bookingUtils');
const transactionUtils = require('./../../transactions/transactionUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/park", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const bookingData=await prisma.slotBooking.findUnique({
            where:{
                id:parseInt(req.body.bookingId)
            },
            include:{
                parkingRequest:true,
                slot:{
                    select:slotUtils.selection
                },
                user:{
                    select:userUtils.selection
                },
                vehicle:true
            }
        });

        if(!bookingData){
            // send error
            res.statusCode=parkingStatus.cannotBeProcessed.code;
            res.json({
                message:parkingStatus.cannotBeProcessed.message
            });
            return;
        }
        if(bookingData.status!=1){
            // send error
            res.statusCode=parkingStatus.cannotBeProcessed.code;
            res.json({
                message:parkingStatus.cannotBeProcessed.message
            });
            return;
        }

        const withdrawOTP=stringUtils.generateOTP();
        const parkingCreate=await prisma.slotParking.create({
            data:{
                slotId:bookingData.slotId,
                userId:bookingData.userId,
                parkingHours:bookingData.parkingHours,
                spaceType:bookingData.spaceType,
                bookingId:bookingData.id,
                vehicleId:bookingData.vehicleId,
                withdrawOTP:withdrawOTP,
                status:1
            }
        });
        if(!parkingCreate){
            res.statusCode=parkingStatus.serverError.code;
            res.json({
                message:parkingStatus.serverError.message
            });
            return;
        }

        const bookingUpdate=await prisma.slotBooking.update({
            where:{
                id:bookingData.id
            },
            data:{
                status:3
            }
        });

        if(!bookingUpdate){
            const delParking=await prisma.slotBooking.delete({
                where:{
                    id:parkingCreate.id
                }
            });

            res.statusCode=parkingStatus.serverError.code;
            res.json({
                message:parkingStatus.serverError.message
            });
            return;
        }

        res.json(parkingCreate);
    } catch (error) {
        console.log(error);
        res.statusCode=parkingStatus.serverError.code;
        res.json({
            message:parkingStatus.serverError.message
        });
        return;
    }
});

const parkingStatus={
    success:{
        code:200,
        message:"Parked Succesfully"
    },
    cannotBeProcessed:{
        code:422,
        message:"Parking cannot be processed..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.post("/withdraw", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const parkingData=await prisma.slotParking.findUnique({
            where:{
                id:parseInt(req.body.parkingId)
            },
            include:{
                booking:{
                    include:{
                        parkingRequest:true,
                    }
                },
                slot:{
                    select:slotUtils.selection
                },
                user:{
                    select:userUtils.selection
                },
                vehicle:true,
            }
        });

        if(!parkingData){
            // send entity error.
            res.statusCode=parkingWithdrawStatus.cannotBeProcessed.code;
            res.json({
                message:parkingWithdrawStatus.cannotBeProcessed.message,
            });
            return;
        }

        if(parkingData.status!=1){
            // send entity error.
            res.statusCode=parkingWithdrawStatus.cannotBeProcessed.code;
            res.json({
                message:parkingWithdrawStatus.cannotBeProcessed.message,
            });
            return;
        }   

        const totalAmt=bookingUtils.getTotalAmt(req.body.duration, req.body.exceedDuration, parkingData.vehicle.fair);

        const userToSlotTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.User,
                amount:totalAmt.userToSlot,
                transferType:MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                userId:parkingData.user.id,
                status:1
            }
        });

        const slotToUserTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Slot,
                amount:totalAmt.userToSlot,
                transferType:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                userId:parkingData.slot.userId,
                status:1
            }
        });

        const slotToAppTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Slot,
                amount:totalAmt.slotToApp,
                transferType:MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                userId:parkingData.slot.userId,
                status:1
            }
        });

        const appToSlotTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Admin,
                amount:totalAmt.slotToApp,
                transferType:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                // TODO: Change Admin User Id value
                userId: 2,
                status:1
            }
        });

        const txnsCreate=await prisma.$transaction([userToSlotTxnCreate, slotToUserTxnCreate, slotToAppTxnCreate, appToSlotTxnCreate]);
        if(!txnsCreate){
            res.statusCode=parkingWithdrawStatus.serverError.code;
            res.json({
                message:parkingWithdrawStatus.serverError.message,
            });
            return;
        }
        
        const userToSlotTxn=txnsCreate[0];
        const slotToUserTxn=txnsCreate[1];
        const slotToAppTxn=txnsCreate[2];
        const appToSlotTxn=txnsCreate[3];

        const userSlotRefCode=transactionUtils.generateTransactionRefId();

        const userToSlotNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.userToSlot,
                fromAccountType:UserAccountType.User,
                fromUserId:parkingData.user.id,
                refCode:userSlotRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Slot,
                withUserId:parkingData.slot.userId,
                transactionId:userToSlotTxn.id,
                status:1
            }
        });

        const slotToUserNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.userToSlot,
                fromAccountType:UserAccountType.Slot,
                fromUserId:parkingData.slot.userId,
                refCode:userSlotRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.User,
                withUserId:parkingData.user.id,
                transactionId:slotToUserTxn.id,
                status:1
            }
        });

        const slotAppRefCode=transactionUtils.generateTransactionRefId();
        
        const slotToAppNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.slotToApp,
                fromAccountType:UserAccountType.Slot,
                fromUserId:parkingData.slot.userId,
                refCode:slotAppRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Admin,
                // TODO: Change Admin User Id value
                withUserId:2,
                transactionId:slotToAppTxn.id,
                status:1
            }
        });

        const appToSlotNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.slotToApp,
                fromAccountType:UserAccountType.Admin,
                // TODO: Change Admin User Id value
                fromUserId:2,
                refCode:slotAppRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Slot,
                withUserId:parkingData.slot.userId,
                transactionId:appToSlotTxn.id,
                status:1,
            }
        });

        const nonRealTxns=await prisma.$transaction([
            userToSlotNonRealTxnCreate,
            slotToUserNonRealTxnCreate,
            slotToAppNonRealTxnCreate,
            appToSlotNonRealTxnCreate,
        ]);

        if(!nonRealTxns){
            // Deleting Txns 
            const delTxns=await prisma.transaction.deleteMany({
                where:{
                    OR:[
                        {
                            id:userToSlotTxn.id
                        },
                        {
                            id:slotToUserTxn.id
                        },
                        {
                            id:slotToAppTxn.id
                        },
                        {
                            id:appToSlotTxn.id
                        },
                    ]
                }
            });
            
        
            res.statusCode=parkingWithdrawStatus.serverError.code;
            res.json({
                message:parkingWithdrawStatus.serverError.message,
            });
            return;
        }

        const updateBooking=prisma.slotBooking.update({
            where:{
                id:parkingData.booking.id
            },
            data:{
                status:4,
                fromUserToSlotTransactionId:userToSlotTxn.id,
                fromSlotToUserTransactionId:slotToUserTxn.id,
                fromSlotToAppTransactionId:slotToAppTxn.id,
                fromAppToSlotTransactionId:appToSlotTxn.id,
                duration:req.body.duration,
                exceedDuration:req.body.exceedDuration,
            }
        });

        
        const updateParking=prisma.slotParking.update({
            where:{
                id:parkingData.id
            },
            data:{
                status:0
            }
        });

        const updateBookingParking=await prisma.$transaction([
            updateBooking, updateParking
        ]);
        if(!updateBookingParking){
            // Deleting Txns 
            const delTxns=await prisma.transaction.deleteMany({
                where:{
                    OR:[
                        {
                            id:userToSlotTxn.id
                        },
                        {
                            id:slotToUserTxn.id
                        },
                        {
                            id:slotToAppTxn.id
                        },
                        {
                            id:appToSlotTxn.id
                        },
                    ]
                }
            });

            res.statusCode=parkingWithdrawStatus.serverError.code;
            res.json({
                message:parkingWithdrawStatus.serverError.message,
            });
            return;
        }
        
        res.statusCode=parkingWithdrawStatus.success.code;
        res.json({
            message:parkingWithdrawStatus.success.message,
            data:updateBookingParking[1]
        });
    } catch (error) {
        console.log(error);
        res.statusCode=parkingWithdrawStatus.serverError.code;
        res.json({
            message:parkingWithdrawStatus.serverError.message,
            error:error
        });
    }
});

const parkingWithdrawStatus={
    success:{
        code:200,
        message:"Parking completed, vehicle withdrawn successfully..."
    },
    cannotBeProcessed:{
        code:422,
        message:"Vehicle Withdrawn cannot be processed..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error...."
    }
}

module.exports=router;