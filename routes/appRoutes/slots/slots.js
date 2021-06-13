const express = require('express');
const crypto = require('crypto');
const { PrismaClient, SlotSpaceType } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const stringUtils = require('./../../../services/operations/stringUtils');
const vehiclesDetails = require('../../../services/vehicles/vehiclesDetails');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const userDetails = await prisma.userDetails.findFirst({
            where: {
                userId: parseInt(userData.id),
            }
        });
        if (!userDetails) {
            res.statusCode = slotCreateStatus.userDetailsNotFound.code;
            res.json({
                message: slotCreateStatus.userDetailsNotFound.message
            });
            return;
        }

        let reqSlotData = req.body.slotData;
        reqSlotData["spaceType"] = (reqSlotData["spaceType"] == 'Sheded') ? SlotSpaceType.Sheded : SlotSpaceType.Open;
        reqSlotData["status"] = 1;
        reqSlotData["token"] = crypto.randomBytes(40).toString('base64');
        reqSlotData["userId"] = userData.id;
        const slot = await prisma.slot.create({
            data: reqSlotData
        });
        if (slot) {
            let vehiclesData = [];
            for (var i = 0; i < req.body.vehicles.length; i++) {
                let vehicleData = req.body.vehicles[i];
                vehicleData["slotId"] = slot.id;
                vehicleData["status"] = 1;
                vehiclesData.push(vehicleData);
            }

            const vehicles = await prisma.slotVehicle.createMany({
                data: vehiclesData
            });
            if ((vehicles) && (vehicles.count > 0)) {
                res.statusCode = slotCreateStatus.success.code;
                res.json({
                    message: slotCreateStatus.success.message,
                    slot: slot
                });
            }
            return;
        }
        res.statusCode = slotCreateStatus.serverError.code;
        res.json({
            message: slotCreateStatus.serverError.message,
        });
    }
    catch (excp) {
        console.log(excp);
        res.statusCode = slotCreateStatus.serverError.code;
        res.json({
            message: slotCreateStatus.serverError.message,
            error: excp
        });
    }
});

const slotCreateStatus = {
    success: {
        code: 200,
        message: "Slot Created successfully..."
    },
    userDetailsNotFound: {
        code: 400,
        message: "User Details should be completed..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

// TODO: get parking lord function.
router.get("/parkingLord", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        let slot = await prisma.slot.findFirst({
            where: {
                userId: userData.id
            },
            include: {
                vehicles: true,
                SlotImages: true
            },
        });

        if (slot) {
            //TODO: Add Ratings..
            const ratings = await prisma.slotRatingReview.aggregate({
                _avg: {
                    ratingValue: true,
                },
            });

            slot["rating"] = ratings._avg.ratingValue;

            slot["images"] = slot["SlotImages"];
            slot["SlotImages"] = undefined;

            // Important when u send vehicles data.
            slot["vehicles"].forEach((vehicle) => {
                vehiclesDetails.parse(vehicle);
            });

            res.statusCode = parkingLordGetStatus.success.code;
            res.json({
                message: parkingLordGetStatus.success.message,
                data: slot,
            });
            return;
        }

        res.statusCode = parkingLordGetStatus.notFound.code;
        res.json({
            message: parkingLordGetStatus.notFound.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode = parkingLordGetStatus.serverError.code;
        res.json({
            error: error,
            message: parkingLordGetStatus.serverError.message
        });
    }
});

const parkingLordGetStatus = {
    success: {
        code: 200,
        message: "Parking Lord fetched sucessfully..."
    },
    notFound: {
        code: 400,
        message: "No Parking Lord Found..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.put('/details', tokenUtils.verify, async (req, res) => {
    let userData = req.tokenData;
    try {
        const slot = await prisma.slot.findFirst({
            where: {
                userId: userData.id,
            }
        });
        if (!slot) {
            res.statusCode = slotDetailsUpdateStatus.notFound.code;
            res.json({
                message: slotDetailsUpdateStatus.notFound.message
            });
            return;
        }

        const slotUpdate = await prisma.slot.update({
            data: {
                name: req.body.name
            },
            where: {
                id: slot.id
            }
        });

        if (slotUpdate) {
            res.statusCode = slotDetailsUpdateStatus.success.code;
            res.json({
                message: slotDetailsUpdateStatus.success.message,
                data: slotUpdate
            });
            return;
        }

        res.statusCode = slotDetailsUpdateStatus.serverError.code;
        res.json({
            message: slotDetailsUpdateStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode = slotDetailsUpdateStatus.serverError.code;
        res.json({
            error: error,
            message: slotDetailsUpdateStatus.serverError.message
        });
    }
});

const slotDetailsUpdateStatus = {
    success: {
        code: 200,
        message: "Parking Lord Details Update Successfully..."
    },
    notFound: {
        code: 400,
        message: "Parking Lord not found..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error.."
    }
};

router.post('/parkingRequest', tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        // Status 0 means the request is pending.
        const parkingReq = await prisma.slotParkingRequest.create({
            data: {
                slotId: parseInt(req.body.slotId),
                userId: parseInt(userData.id),
                vehicleId: parseInt(req.body.vehicleId),
                spaceType: req.body.spaceType,
                parkingHours: parseInt(req.body.parkingHours),
                status: 0
            },
            include: {
                slot: {
                    include: {
                        user: true,
                    }
                },
                user: true
            }
        });

        if (parkingReq) {
            //TODO: Update Sockets Using this Data.
            //TODO: Send notifications.

            let respData = parkingReq;
            respData["slot"] = undefined;
            respData["user"] = undefined;
            res.statusCode = parkingRequestStatus.success.code;
            res.json({
                data: respData,
                message: parkingRequestStatus.success.message
            });
            return;
        }

        res.statusCode = parkingRequestStatus.serverError.code;
        res.json({
            message: parkingRequestStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode = parkingRequestStatus.serverError.code;
        res.json({
            message: parkingRequestStatus.serverError.message
        });
    }
});

const parkingRequestStatus = {
    success: {
        code: 200,
        message: "Parking sent to Lord Successfully..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.post("/parkingRequestResponse", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        let reqResp = (req.body.response == 1) ? 1 : 2;
        const parkingReq=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(req.body.parkingRequestId)
            }
        });

        if(!parkingReq){
            res.statusCode=parkingRequestResponseStatus.cannotBeAccepted.code;
            res.json({
                message:parkingRequestResponseStatus.cannotBeAccepted.message
            });
            return;
        }

        // Checking current status.
        if(parkingReq.status!=0){
            res.statusCode=parkingRequestResponseStatus.cannotBeAccepted.code;
            res.json({
                message:parkingRequestResponseStatus.cannotBeAccepted.message
            });
            return;
        }

        // Checking is expired..
        const timeDiff=Date.now()-Date.parse(parkingReq.time);
        if(timeDiff>3600000){
            // Time should be less than 1 hr.
            res.statusCode=parkingRequestResponseStatus.expired.code;
            res.json({
                message:parkingRequestResponseStatus.expired.message
            });
            return;
        }
        
        const parkingReqUpdate = await prisma.slotParkingRequest.update({
            where: {
                id:parseInt(req.body.parkingRequestId)
            },
            data: {
                status: reqResp
            },
            include: {
                slot: {
                    include: {
                        user: true,
                    }
                },
                user: true
            }
        });

        if (parkingReqUpdate) {
            //TODO: Update Sockets Using this Data.
            //TODO: Send notifications.
            
            let respData=parkingReqUpdate;
            respData["slot"]=undefined;
            respData["user"]=undefined;

            res.statusCode=parkingRequestResponseStatus.success.code;
            res.json({
                data:respData,
                message:parkingRequestResponseStatus.success.message
            });
            return;
        }

        res.statusCode=parkingRequestResponseStatus.serverError.code;
        res.json({
            message:parkingRequestResponseStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=parkingRequestResponseStatus.serverError.code;
        res.json({
            message:parkingRequestResponseStatus.serverError.message
        });
    }
});

const parkingRequestResponseStatus = {
    success: {
        code: 200,
        message: "Parking Request Responded Successfully..."
    },
    cannotBeAccepted:{
        code:400,
        message:"Parking Request cannot be accepted..."
    },
    expired: {
        code: 498,
        message: "Parking Request Expired..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.post("/booking", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const parkingRequestData=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(req.body.parkingRequestId)
            },
            include:{
                slot:{
                    include:{
                        SlotBooking:{
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

        // TODO: check balance and security deposits also before booking.

        // Check space availablity.
        let bookingVehicle=vehiclesDetails.parse(parkingRequestData.vehicle);
        let bookedVehicles=[];
        parkingRequestData.slot.SlotBooking.forEach((bookingData)=>{
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
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}
module.exports = router;