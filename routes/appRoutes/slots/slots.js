const express = require('express');
const crypto = require('crypto');
const { PrismaClient, SlotSpaceType } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const stringUtils = require('./../../../services/operations/stringUtils');
const vehicleUtils = require('./../vehicles/vehicleUtils');
const slotUtils = require('./slotUtils');
const userUtils=require('./../users/userUtils');

const router = express.Router();
const prisma = new PrismaClient();

const parkingRequestsRoute=require('./parkingRequests/parkingRequests');
const bookingsRoute=require('./bookings/bookings');
const parkingsRoute=require('./parkings/parkings');
const ratingsReviews=require('./ratingsReviews/ratingsReviews');

router.use("/parkingRequests", parkingRequestsRoute);
router.use("/bookings", bookingsRoute);
router.use("/parkings", parkingsRoute);
router.use("/ratingsReviews", ratingsReviews);

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
                vehicleData["typeId"]=vehicleUtils.getType(req.body.vehicles[i].type).typeId;
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

router.get("/parkingLord", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        let slot = await prisma.slot.findFirst({
            where: {
                userId: userData.id
            },
            include: {
                vehicles: {
                    select:vehicleUtils.selectionWithTypeData
                },
                slotImages: true
            },
        });

        if (slot) {
            const ratings = await prisma.slotRatingReview.aggregate({
                _avg: {
                    ratingValue: true,
                },
            });

            slot["rating"] = ratings._avg.ratingValue;

            slot["images"] = slot["SlotImages"];
            slot["SlotImages"] = undefined;

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

router.post("/activate", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const slotData=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userData.id)
            },
        });

        if(!slotData){
            res.statusCode=slotActivateStatus.notFound.code;
            res.json({
                message:slotActivateStatus.notFound.message
            });
            return;
        }

        if(slotData.status==1){
            res.statusCode=slotActivateStatus.alreadyActive.code;
            res.json({
                message:slotActivateStatus.alreadyActive.message,
                data:slotData
            });
            return;
        }

        const slotStatusUpdate=await prisma.slot.update({
            where:{
                id:slotData.id
            },
            data:{
                status:1
            }
        });

        if(!slotStatusUpdate){
            res.statusCode=slotActivateStatus.serverError.code;
            res.json({
                message:slotActivateStatus.serverError.message
            });
            return;
        }
        res.statusCode=slotActivateStatus.success.code;
        res.json({
            message:slotActivateStatus.success.message,
            data:slotStatusUpdate
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotActivateStatus.serverError.code;
        res.json({
            message:slotActivateStatus.serverError.message
        });
        return;
    }
});

const slotActivateStatus={
    success:{
        code:200,
        message:"Slot Activated Successfully..."
    },
    notFound:{
        code:404,
        message:"Slot not found..."
    },
    alreadyActive:{
        code:421,
        message:"Slot is Already Active..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.post("/deactivate", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const slotData=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userData.id)
            },
            include:{
                bookings:{
                    where:{
                        OR:[
                            {
                                status:1
                            },
                            {
                                status:3
                            }
                        ]
                    }
                }
            }
        });

        if(!slotData){
            res.statusCode=slotDeactivateStatus.notFound.code;
            res.json({
                message:slotDeactivateStatus.notFound.message
            });
            return;
        }
        

        if(slotData.status==0){
            res.statusCode=slotDeactivateStatus.alreadyDeactive.code;
            res.json({
                message:slotDeactivateStatus.alreadyDeactive.message,
                data:slotData
            });
            return;
        }

        if(slotData.bookings.length>0){
            res.statusCode=slotDeactivateStatus.cannotBeDeactivate.code;
            res.json({
                message:slotDeactivateStatus.cannotBeDeactivate.message,
                data:slotData
            });
            return;
        }

        const slotStatusUpdate=await prisma.slot.update({
            where:{
                id:slotData.id
            },
            data:{
                status:0
            }
        });

        if(!slotStatusUpdate){
            res.statusCode=slotDeactivateStatus.serverError.code;
            res.json({
                message:slotDeactivateStatus.serverError.message
            });
            return;
        }
        res.statusCode=slotDeactivateStatus.success.code;
        res.json({
            message:slotDeactivateStatus.success.message,
            data:slotStatusUpdate
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotDeactivateStatus.serverError.code;
        res.json({
            message:slotDeactivateStatus.serverError.message
        });
        return;
    }
});

const slotDeactivateStatus={
    success:{
        code:200,
        message:"Slot Deactivated Successfully..."
    },
    notFound:{
        code:404,
        message:"Slot not found..."
    },
    alreadyDeactive:{
        code:421,
        message:"Slot is Already Deactive..."
    },
    cannotBeDeactivate:{
        code:422,
        message:"Slot Cannot be deactivated as some bookings or parkings are still there..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports = router;