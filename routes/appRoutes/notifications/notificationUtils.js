require('dotenv').config();

const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

function getTitle({notificationType, responseType}){
    let title="";
    switch (notificationType) {
        case NotificationType.ParkingRequest:
            title="You have a Parking Request from";
        break;

        case NotificationType.ParkingRequestResponse:
            title="Your Requested had been "+((responseType==1) ? "Accepted" : "Rejected")+" by";
        break;
        case NotificationType.Booking:
            title=(responseType == 1) ? "Slot Successfully Booked" : "Slot Booking Failed due to Unavailability of Space";
        break;
        case NotificationType.BookingCancellation:
            title="Slot Booking Cancelled Successfully"
        break;
        case NotificationType.Parking:
            title="Vehicle Successfully Parked";
        break;
        case NotificationType.ParkingWithdraw:
            title="Parking Completed";
        break;
        case NotificationType.Transaction:

        break;
        case NotificationType.TransactionRequest:
        break;
        case NotificationType.TransactionRequestResponse:
        break;
    }
}

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
    senderUserData,  
    senderAccountType,
    type,
    status=1,
    responseType
}){

}

module.exports={
    sendNotification
}