require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType } = require('@prisma/client');

const transactionUtils = require('./../../transactions/transactionUtils');
const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');
const stringUtils = require('../../../../services/operations/stringUtils');
const bookingUtils = require('./bookingUtils');
const adminUtils = require('../../../../services/admin/adminUtils');
const parkingSocketUtils=require('./../../../../services/sockets/parkings/parkingSocketUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/book", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const parkingRequestData=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(req.body.parkingRequestId)
            },
            include:{
                slot:{
                    include:{
                        user:{
                            select:userUtils.selection
                        }
                    }
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        });

        if(!parkingRequestData){
            res.statusCode=bookingStatus.requestNotFound.code;
            res.json({
                message:bookingStatus.requestNotFound.message
            });
            return;
        }

        if(parkingRequestData.status!=1){
            // If parking request is not accepted.
            res.statusCode=bookingStatus.requestNotAccepted.code;
            res.json({
                message:bookingStatus.requestNotAccepted.message
            });
            return;
        }
        const bookingVehicle=parkingRequestData.vehicle.typeData;

        // TODO: check balance and security deposits also before booking.

        // Check space availablity.

        let totalSpaceBooked=await vehicleUtils.getAllotedArea(parkingRequestData.slotId);
        let totalSpaceofSlot=parkingRequestData.slot.length*parkingRequestData.slot.breadth;
        let availableSpace=totalSpaceofSlot-totalSpaceBooked;
        let requiredSpace=bookingVehicle.length*bookingVehicle.breadth;
        
        if((availableSpace<requiredSpace)&&(parkingRequestData.slot.height>=bookingVehicle.height)){
            // TODO: send notification
            
            res.statusCode=bookingStatus.spaceUnavailable.code;
            res.json({
                message:bookingStatus.spaceUnavailable.message
            });
            return;
        }

        let parkingOTP=stringUtils.generateOTP();
        const bookingResp=await prisma.slotBooking.create({
            data:{
                parkingRequestId:parseInt(req.body.parkingRequestId),   
                duration: 0,
                spaceType: parkingRequestData.spaceType,
                parkingHours:parkingRequestData.parkingHours,
                parkingOTP:parkingOTP,
                slotId:parkingRequestData.slotId,
                userId:parkingRequestData.userId,
                vehicleId:parkingRequestData.vehicleId,
                status: 1
            }
        });

        // Checking for space again.
        totalSpaceBooked=await vehicleUtils.getAllotedArea(parkingRequestData.slotId, bookingResp.time);
        availableSpace=totalSpaceofSlot-totalSpaceBooked;
        if(availableSpace<requiredSpace){
            // If Space is less than booking has been made before that.
            // cancel this one to prevent from conflict.
            const bookingDel=await prisma.slotBooking.delete({
                where:{
                    id:bookingResp.id
                }
            });

            // TODO: send notification

            res.statusCode=bookingStatus.spaceUnavailable.code;
            res.json({
                message:bookingStatus.spaceUnavailable.message
            });
            return;
        }
        
        const parkingRequestUpdate=await prisma.slotParkingRequest.update({
            where:{
                id:parkingRequestData.id,
            },
            data:{
                status:3
            }
        });        

        // TODO: send notification
        
        // Update sockets
        parkingSocketUtils.updateParkingLord(parkingRequestData.slot.userId, parkingRequestData.id);
        parkingSocketUtils.updateUser(parkingRequestData.userId, parkingRequestData.id);

        // TODO: Update slot sockets too.

        res.statusCode=bookingStatus.success.code;
        res.json({
            data:bookingResp,
            message:bookingStatus.success.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=bookingStatus.serverError.code;
        res.json({
            message:bookingStatus.serverError.message,
            error:error
        });
    }
});

const bookingStatus={
    success:{
        code:200,
        message:"Slot Booked Successfully..."
    },
    spaceUnavailable:{
        code:400,
        message:"Space Unavailable..."
    },
    balanceLow:{
        code:402,
        message:"Your Balance is low..."
    },
    requestNotFound:{
        code:422,
        message:"Parking Request Not found..."
    },
    requestNotAccepted:{
        code:423,
        message:"Parking Request Not Accepted yet..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

// TODO: create Cancel booking route.
router.post('/cancel', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const bookingData=await prisma.slotBooking.findUnique({
            where:{
                id:parseInt(req.body.bookingId)
            },
            include:{
                vehicle:true,
                parkingRequest:true,
                slot:{
                    select:slotUtils.selection
                },
                user:{
                    select:userUtils.selection
                },
            }
        }); 
        if(!bookingData){
            res.statusCode=bookingCancellationStatus.cannotBeProceed.code;
            res.json({
                data:bookingData,
                message:bookingCancellationStatus.cannotBeProceed.message
            });
            return;
        }
        if(bookingData.status!=1){
            res.statusCode=bookingCancellationStatus.cannotBeProceed.code;
            res.json({
                data:bookingData,
                message:bookingCancellationStatus.cannotBeProceed.message
            });
            return;
        }
        const totalAmt=bookingUtils.getTotalAmt(req.body.duration, req.body.exceedDuration, bookingData.vehicle.fair);

        const userToSlotTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.User,
                amount:totalAmt.userToSlot,
                transferType:MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                userId:bookingData.user.id,
                status:1
            }
        });

        const slotToUserTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Slot,
                amount:totalAmt.userToSlot,
                transferType:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                userId:bookingData.slot.userId,
                status:1
            }
        });

        const slotToAppTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Slot,
                amount:totalAmt.slotToApp,
                transferType:MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                userId:bookingData.slot.userId,
                status:1
            }
        });

        const appToSlotTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Admin,
                amount:totalAmt.slotToApp,
                transferType:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                userId: adminUtils.details.id,
                status:1
            }
        });

        const txnsCreate=await prisma.$transaction([userToSlotTxnCreate, slotToUserTxnCreate, slotToAppTxnCreate, appToSlotTxnCreate]);
        if(!txnsCreate){
            res.statusCode=bookingCancellationStatus.serverError.code;
            res.json({
                message:bookingCancellationStatus.serverError.message
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
                fromUserId:bookingData.user.id,
                refCode:userSlotRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Slot,
                withUserId:bookingData.slot.userId,
                transactionId:userToSlotTxn.id,
                status:1
            }
        });

        const slotToUserNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.userToSlot,
                fromAccountType:UserAccountType.Slot,
                fromUserId:bookingData.slot.userId,
                refCode:userSlotRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.User,
                withUserId:bookingData.user.id,
                transactionId:slotToUserTxn.id,
                status:1
            }
        });

        const slotAppRefCode=transactionUtils.generateTransactionRefId();
        
        const slotToAppNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.slotToApp,
                fromAccountType:UserAccountType.Slot,
                fromUserId:bookingData.slot.userId,
                refCode:slotAppRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Admin,
                withUserId:adminUtils.details.id,
                transactionId:slotToAppTxn.id,
                status:1
            }
        });

        const appToSlotNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:totalAmt.slotToApp,
                fromAccountType:UserAccountType.Admin,
                fromUserId:adminUtils.details.id,
                refCode:slotAppRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.SlotBookings,
                withAccountType:UserAccountType.Slot,
                withUserId:bookingData.slot.userId,
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
            res.statusCode=bookingCancellationStatus.serverError.code;
            res.json({
                message:bookingCancellationStatus.serverError.message
            });
            return;
        }

        const updateBooking=await prisma.slotBooking.update({
            where:{
                id:bookingData.id
            },
            data:{
                status:2,
                fromUserToSlotTransactionId:userToSlotTxn.id,
                fromSlotToUserTransactionId:slotToUserTxn.id,
                fromSlotToAppTransactionId:slotToAppTxn.id,
                fromAppToSlotTransactionId:appToSlotTxn.id,
                duration:req.body.duration,
                exceedDuration:req.body.exceedDuration,
            }
        });
        if(!updateBooking){
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
            res.statusCode=bookingCancellationStatus.serverError.code;
            res.json({
                message:bookingCancellationStatus.serverError.message
            });
            return;
        }

        // Update sockets
        parkingSocketUtils.updateParkingLord(bookingData.slot.userId, bookingData.parkingRequestId);
        parkingSocketUtils.updateUser(bookingData.userId, bookingData.parkingRequestId);

        // TODO: Update slot sockets too.
        
        res.statusCode=bookingCancellationStatus.success.code;
        res.json({
            message:bookingCancellationStatus.success.message,
            data:updateBooking
        });
    } catch (error) {
        console.log(error);
        res.statusCode=bookingCancellationStatus.serverError.code;
        res.json({
            message:bookingCancellationStatus.serverError.message
        });
    }
});

const bookingCancellationStatus={
    success:{
        code:200,
        message:"Booking Cancellation successful..."
    },
    cannotBeProceed:{
        code:422,
        message:"Booking Cannot be processed..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;