require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType } = require('@prisma/client');

const slotUtils = require('./../slots/slotUtils');
const userUtils = require('./../users/userUtils');
const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const vehiclesDetails = require('../../../services/vehicles/vehiclesDetails');
const stringUtils = require('../../../services/operations/stringUtils');

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
                        bookings:{
                            where:{
                                OR:[
                                    {
                                        status:{
                                            equals:1
                                        }
                                    },
                                    {
                                        status:{
                                            equals:3
                                        }
                                    }
                                ]
                            },

                            include:{
                                vehicle:true
                            }
                        }
                    }
                },
                vehicle:true
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

        // TODO: check balance and security deposits also before booking.

        // Check space availablity.
        let bookingVehicle=vehiclesDetails.parse(parkingRequestData.vehicle);
        let bookedVehicles=[];
        parkingRequestData.slot.bookings.forEach((bookingData)=>{
            let vehicleData=bookingData.vehicle;
            vehicleData=vehiclesDetails.parse(vehicleData);
            bookedVehicles.push(vehicleData);
        });

        let totalSpaceBooked=0;
        bookedVehicles.forEach((vehicle)=>{
            totalSpaceBooked+=(vehicle.length*vehicle.breadth);
        });
        let totalSpaceofSlot=parkingRequestData.slot.length*parkingRequestData.slot.breadth;
        let availableSpace=totalSpaceofSlot-totalSpaceBooked;
        let requiredSpace=bookingVehicle.length*bookingVehicle.breadth;
        
        if(availableSpace<requiredSpace){
            // TODO: send notification
            // TODO: update sockets
            
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

        // Rechecking bookings before sending update.
        const bookingsBefore=await prisma.slotBooking.findMany({
            where:{
                AND:[
                    {
                        slotId:parkingRequestData.slotId,
                    },
                    {
                        time:{
                            lt:bookingResp.time,
                        }
                    },
                    {
                        OR:[
                            {
                                status:1
                            },
                            {
                                status:1
                            }
                        ]
                    }
                ]
            },
            include:{
                vehicle:true
            }
        });
        
        // Checking for space again.
        bookedVehicles=[];
        bookingsBefore.forEach((bookingData)=>{
            let vehicleData=bookingData.vehicle;
            vehicleData=vehiclesDetails.parse(vehicleData);
            bookedVehicles.push(vehicleData);
        });

        totalSpaceBooked=0;
        bookedVehicles.forEach((vehicle)=>{
            totalSpaceBooked+=(vehicle.length*vehicle.breadth);
        });
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
            // TODO: update sockets

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
        // TODO: update sockets
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

module.exports=router;