require('dotenv').config();

const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const prisma = new PrismaClient();

const userUtils = require('../users/userUtils');
const vehicleUtils = require('../vehicles/vehicleUtils');

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
                    status:status
                }
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

        // TODO: Update Notification Sockets.

    } catch (error) {
        console.log(error);
    }
}   

async function updateReferenceTable({notification, refId, type}){
    switch (type) {
        case NotificationType.ParkingRequest:
        await prisma.slotParkingRequest.update({
            where:{
                id:refId
            },
            data:{
                requestNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.ParkingRequestResponse:
        await prisma.slotParkingRequest.update({
            where:{
                id:refId
            },
            data:{
                responseNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.Booking_ForUser:
        await prisma.slotBooking.update({
            where:{
                id:refId
            },
            data:{
                forUser_BookingNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.Booking_ForSlot:
        await prisma.slotBooking.update({
            where:{
                id:refId
            },
            data:{
                forSlot_BookingNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.BookingCancellation_ForSlot:
        await prisma.slotBooking.update({
            where:{
                id:refId
            },
            data:{
                forSlot_CancellationNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.BookingCancellation_ForUser:
        await prisma.slotBooking.update({
            where:{
                id:refId
            },
            data:{
                forUser_CancellationNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.Parking_ForSlot:
        await prisma.slotParking.update({
            where:{
                id:refId
            },
            data:{
                forSlot_ParkingNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.Parking_ForUser:
        await prisma.slotParking.update({
            where:{
                id:refId
            },
            data:{
                forUser_ParkingNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.ParkingWithdraw_ForSlot:
        await prisma.slotParking.update({
            where:{
                id:refId
            },
            data:{
                forSlot_WithdrawNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.ParkingWithdraw_ForUser:
        await prisma.slotParking.update({
            where:{
                id:refId
            },
            data:{
                forUser_WithdrawNotificationId:notification.id
            }
        });
        break;
        
        case NotificationType.Transaction:
        await prisma.transaction.update({
            where:{
                id:refId
            },
            data:{
                notificationId:notification.id
            }
        });
        break;
        
        case NotificationType.TransactionRequest:
        await prisma.transactionRequests.update({
            where:{
                id:refId
            },
            data:{
                requestNotificationId:notificationId
            }
        });
        break;
        
        case NotificationType.TransactionRequestResponse:
        await prisma.transactionRequests.update({
            where:{
                id:refId
            },
            data:{
                responseNotificationId:notification.id
            }
        });
        break;
    }
}

module.exports={
    sendNotification,
    titles:nofiticationTitles,
    selection:{
        id:true,
        recieverUserId:true,
        recieverAccountType:true,
        senderUserId:true,
        senderAccountType:true,
        senderUser:{
            select:userUtils.selectionWithSlot
        },
        type:true,
        time:true,
        status:true,

        // It includes txns of slots.
        bookingCancellation_ForSlot:{
            include:{
                fromSlotToAppTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                fromSlotToUserTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                parking:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // It includes of txns of user only.
        bookingCancellation_ForUser:{
            include:{
                fromUserToSlotTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                parking:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // It includes txns of slot only.
        booking_ForSlot:{
            include:{
                fromSlotToAppTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                fromSlotToUserTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                parking:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // it includes txns of user only.
        booking_ForUser:{
            include:{
                fromUserToSlotTransaction:{
                    include:{
                        transactionNonReal:true,
                        transactionReal:true
                    }
                },
                parking:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // This is recieved by slot 
        // It includes slot txns only.
        parkingRequest:{
            include:{
                booking:{
                    include:{
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true,
                    }
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                },
            },
        },
        // This is recieved by user 
        // It includes user txns only.
        parkingRequest_withResponse:{
            include:{
                booking:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true        
                    }
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // This includes booking and slot txns only.
        parking_ForSlot:{
            include:{
                booking:{
                    include:{
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },        
                    }
                },
                slotRatingReview:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // This is recieved by user and includes only user txns
        parking_ForUser:{
            include:{
                booking:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },        
                    }
                },
                slotRatingReview:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // This is recieved by slot booking and txns.
        parkingWithdraw_ForSlot:{
            include:{
                booking:{
                    include:{
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },        
                    }
                },
                slotRatingReview:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        // This is recieved by user and includes booking user txns
        parkingWithdraw_ForUser:{
            include:{
                booking:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },        
                    }
                },
                slotRatingReview:true,
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        },
        transaction:{
            include:{
                user:{
                    select:userUtils.selectionWithSlot,
                },
                transactionNonReal:{
                    include:{
                        withUser:{
                            select:userUtils.selectionWithSlot,
                        }
                    }
                },
                transactionReal:true,
            }
        },
        transactionRequest:{
            include:{
                requestedFromTransaction:true,
                requestedFromUser:{
                    select:userUtils.selectionWithSlot
                },
                requesterTransaction:true,
                requesterUser:{
                    select:userUtils.selectionWithSlot
                },
            }
        },
        transactionRequest_withResponse:{
            include:{
                requestedFromTransaction:true,
                requestedFromUser:{
                    select:userUtils.selectionWithSlot
                },
                requesterTransaction:true,
                requesterUser:{
                    select:userUtils.selectionWithSlot
                },
            }
        }
    }
}