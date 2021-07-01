require('dotenv').config();

const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const prisma = new PrismaClient();

const userUtils = require('../users/userUtils');
const vehicleUtils = require('../vehicles/vehicleUtils');
const notificationSocketUtils=require('./../../../services/sockets/notifications/notificationSocketUtils');

const nofiticationTitles={
    parkingRequest:{
        forSlot:"You have a Parking Request from"
    },
    parkingRequestResponse:{
        forUser: (responseType)=>{
            return "Your Requested had been "+((responseType==1) ? "Accepted" : "Rejected")+" by";
        }
    },
    booking:{
        forUser:(responseType)=>{
            return (responseType == 1) ? "Slot Successfully Booked" : "Slot Booking Failed due to Unavailability of Space";
        },
        forSlot:(responseType)=>{
            return (responseType == 1) ? "Slot Successfully Booked by" : "Slot Booking Failed due to Unavailability of Space";
        },
    },
    bookingCancellation:{
        forUser:"Slot Booking Cancelled Successfully",
        forSlot:"Slot Booking Successfully Cancelled by"
    },
    parking:{
        forUser:"Vehicle Successfully Parked in",
        forSlot:"Vehicle Successfully Parked by"   
    },
    parkingWithdraw:{
        forUser:"Parking Completed",
        forSlot:"Parking Completed"
    },
    transactionRequest:{
        forRequestee:(amount)=>{
            return "You have a Money Request of ₹ " + amount + " From";
        }
    },
    transactionRequestResponse:{
        forRequestee:(amount)=>{
            return "Payment Requested Accepted ₹ "+amount+" Credited.";
        },
        forRequester:(amount)=>{
            return "Payment Successfull ₹ " + amount + " Debited.";
        }
    }
}

async function sendNotification({
    recieverUserId, 
    recieverAccountType, 
    senderUserId,
    senderAccountType,
    type,
    refId,
    refData,
    status=1
}){
    try {
        let notification;
        try {
            notification=await prisma.notifications.create({
                data:{
                    senderUserId:senderUserId,
                    senderAccountType:senderAccountType,
                    recieverUserId:recieverUserId,
                    recieverAccountType:recieverAccountType,
                    type:type,
                    status:status,
                    parkingRequest:{

                    }
                },
            });
        } catch (error) {
            console.log(error);
        }

        if(!notification){
            return;
        }

        await updateReferenceTable({
            refId:refId,
            notification:notification,
            type:type
        });
    } catch (error) {
        console.log(error);
    }
}   

function updateParkingReqs(parkingReqData){
    notificationSocketUtils.updateUser(parkingReqData.requestNotificationId);           
    notificationSocketUtils.updateUser(parkingReqData.responseNotificationId);
}   

function updateBookings(bookingData){
    notificationSocketUtils.updateUser(bookingData.forSlot_BookingNotificationId);
    notificationSocketUtils.updateUser(bookingData.forSlot_CancellationNotificationId);
    notificationSocketUtils.updateUser(bookingData.forUser_BookingNotificationId);
    notificationSocketUtils.updateUser(bookingData.forUser_CancellationNotificationId);

    updateParkingReqs(bookingData.parkingRequest);
}   

function updateParkings(parkingData){
    notificationSocketUtils.updateUser(parkingData.forSlot_ParkingNotificationId);
    notificationSocketUtils.updateUser(parkingData.forSlot_WithdrawNotificationId);
    notificationSocketUtils.updateUser(parkingData.forUser_ParkingNotificationId);
    notificationSocketUtils.updateUser(parkingData.forUser_WithdrawNotificationId);

    updateBookings(parkingData.booking);
} 

function updateTransactionReqs(transactionReqData){
    notificationSocketUtils.updateUser(transactionReqData.requestNotificationId);
    notificationSocketUtils.updateUser(transactionReqData.responseNotificationId);
}

function updateTransactions(transactionData){
    notificationSocketUtils(transactionData.notificationId);
}

const parkingReqsSelection={
    requestNotificationId:true,
    responseNotificationId:true
};

const bookingsSelection={
    forSlot_BookingNotificationId:true,
    forSlot_CancellationNotificationId:true,
    forUser_BookingNotificationId:true,
    forUser_CancellationNotificationId:true,
    parkingRequest:{
        select:parkingReqsSelection
    }
}

const parkingsSelection={
    forSlot_ParkingNotificationId:true,
    forSlot_WithdrawNotificationId:true,
    forUser_ParkingNotificationId:true,
    forUser_WithdrawNotificationId:true,
    booking:{
        select:bookingsSelection
    }
}

const transactionRequestsSelection={
    requestNotificationId:true,
    responseNotificationId:true,
};

async function updateReferenceTable({notification, refId, type}){
    switch (type) {
        case NotificationType.ParkingRequest:{
            const parkingReqData=await prisma.slotParkingRequest.update({
                where:{
                    id:refId
                },
                data:{
                    requestNotificationId:notification.id
                },
                select:parkingReqsSelection
            });

            updateParkingReqs(parkingReqData);
            break;
        }
        
        case NotificationType.ParkingRequestResponse:{
            const parkingReqData=await prisma.slotParkingRequest.update({
                where:{
                    id:refId
                },
                data:{
                    responseNotificationId:notification.id
                },
                select:parkingReqsSelection
            });

            updateParkingReqs(parkingReqData);
            break;
        }
        
        case NotificationType.Booking_ForUser:{
            const bookingData=await prisma.slotBooking.update({
                where:{
                    id:refId
                },
                data:{
                    forUser_BookingNotificationId:notification.id
                },
                select:bookingsSelection
            });
            
            updateBookings(bookingData);
            break;
        }
        
        case NotificationType.Booking_ForSlot:{
            const bookingData= await prisma.slotBooking.update({
                where:{
                    id:refId
                },
                data:{
                    forSlot_BookingNotificationId:notification.id
                },
                select:bookingsSelection
            });
            
            updateBookings(bookingData);
            break;
        }
        
        case NotificationType.BookingCancellation_ForSlot:{
            const bookingData=await prisma.slotBooking.update({
                where:{
                    id:refId
                },
                data:{
                    forSlot_CancellationNotificationId:notification.id
                },
                select:bookingsSelection
            });
            
            updateBookings(bookingData);
            break;
        }
        
        case NotificationType.BookingCancellation_ForUser:{
            const bookingData=await prisma.slotBooking.update({
                where:{
                    id:refId
                },
                data:{
                    forUser_CancellationNotificationId:notification.id
                },
                select:bookingsSelection
            });
            
            updateBookings(bookingData);
            break;
        }
        
        case NotificationType.Parking_ForSlot:{
            const parkingData=await prisma.slotParking.update({
                where:{
                    id:refId
                },
                data:{
                    forSlot_ParkingNotificationId:notification.id
                },
                select:parkingsSelection
            });

            updateParkings(parkingData);
            break;
        }
        
        case NotificationType.Parking_ForUser:{
            const parkingData=await prisma.slotParking.update({
                where:{
                    id:refId
                },
                data:{
                    forUser_ParkingNotificationId:notification.id
                },
                select:parkingsSelection
            });

            updateParkings(parkingData);
            break;
        }
        
        case NotificationType.ParkingWithdraw_ForSlot:{
            const parkingData=await prisma.slotParking.update({
                where:{
                    id:refId
                },
                data:{
                    forSlot_WithdrawNotificationId:notification.id
                },
                select:parkingsSelection
            });

            updateParkings(parkingData);
            break;
        }
        
        case NotificationType.ParkingWithdraw_ForUser:{
            const parkingData=await prisma.slotParking.update({
                where:{
                    id:refId
                },
                data:{
                    forUser_WithdrawNotificationId:notification.id
                },
                select:parkingsSelection
            });

            updateParkings(parkingData);
            break;
        }
        
        case NotificationType.Transaction:{
            const transactionData=await prisma.transaction.update({
                where:{
                    id:refId
                },
                data:{
                    notificationId:notification.id
                }
            });
            
            updateTransactions(transactionData);
            break;
        }
        
        case NotificationType.TransactionRequest:{
            const transactionReqData=await prisma.transactionRequests.update({
                where:{
                    id:refId
                },
                data:{
                    requestNotificationId:notification.id
                },
                select:transactionRequestsSelection
            });
            updateTransactionReqs(transactionReqData);
            break;
        }
        
        case NotificationType.TransactionRequestResponse:{
            const transactionReqData=await prisma.transactionRequests.update({
                where:{
                    id:refId
                },
                data:{
                    responseNotificationId:notification.id
                },
                select:transactionRequestsSelection
            });

            updateTransactionReqs(transactionReqData);
            break;
        }
    }
}

module.exports={
    sendNotification,
    titles:nofiticationTitles,
}