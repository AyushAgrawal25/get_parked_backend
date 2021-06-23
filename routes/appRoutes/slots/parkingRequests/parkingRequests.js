require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType } = require('@prisma/client');

const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');
const parkingSocketUtils=require('../../../../services/sockets/parkings/parkingSocketUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/send', tokenUtils.verify, async (req, res) => {
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
            //Update Sockets Using this Data.
            parkingSocketUtils.updateParkingLord(parkingReq.slot.userId, parkingReq.id);
            parkingSocketUtils.updateUser(parkingReq.userId, parkingReq.id);

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

router.post("/respond", tokenUtils.verify, async (req, res) => {
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
        
        let parkingReqUpdate;
        try {
            parkingReqUpdate = await prisma.slotParkingRequest.update({
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
        } catch (error) {
            console.log("Parking Request Respond : Parking Request Update Status");
            console.log(error);
        }

        if (parkingReqUpdate) {
            //Update Sockets Using this Data.
            parkingSocketUtils.updateParkingLord(parkingReqUpdate.slot.userId, parkingReqUpdate.id);
            parkingSocketUtils.updateUser(parkingReqUpdate.userId, parkingReqUpdate.id);

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

router.get('/forUser', tokenUtils.verify, async(req, res)=>{
    const userdata=req.tokenData;
    try {
        const parkingReqs=await prisma.slotParkingRequest.findMany({
            where:{
                userId:parseInt(userdata.id)
            },
            include:{
                slot:{
                    // select:{
                    //     id:true
                    // }
                    
                    select:slotUtils.selection
                },
                user:{
                    select:userUtils.selection
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                },
                booking:{
                    include:{
                        parking:true,
                        fromUserToSlotTransaction:{
                            include:{
                                fromUserToSlot_booking:true
                            }
                        }
                    }
                }
            }
        });

        if(parkingReqs){
            res.statusCode=parkingReqsGetStatus.success.code;
            res.json({
                data:parkingReqs,
                message:parkingReqsGetStatus.success.message
            });
            return;
        }

        res.statusCode=parkingReqsGetStatus.serverError.code;
        res.json({
            message:parkingReqsGetStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=parkingReqsGetStatus.serverError.code;
        res.json({
            error:error,
            message:parkingReqsGetStatus.serverError.message
        });
    }
});

router.get('/forSlot', tokenUtils.verify, async(req, res)=>{
    const userdata=req.tokenData;
    try {
        const slot=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userdata.id)
            }
        });
        if(!slot){
            res.statusCode=parkingReqsGetStatus.notFound.code;
            res.json({
                message:parkingReqsGetStatus.notFound.message
            });
            return;
        }

        const parkingReqs=await prisma.slotParkingRequest.findMany({
            where:{
                slotId:slot.id
            },
            include:{
                user:{
                    select:userUtils.selection
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                },
                booking:{
                    include:{
                        parking:true,
                        fromSlotToUserTransaction:{
                            include:{
                                fromSlotToUser_booking:true
                            }
                        }
                    }
                }
            }
        });

        if(parkingReqs){
            res.statusCode=parkingReqsGetStatus.success.code;
            res.json({
                data:parkingReqs,
                message:parkingReqsGetStatus.success.message
            });
            return;
        }

        res.statusCode=parkingReqsGetStatus.serverError.code;
        res.json({
            message:parkingReqsGetStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=parkingReqsGetStatus.serverError.code;
        res.json({
            error:error,
            message:parkingReqsGetStatus.serverError.message
        });
    }
});

const parkingReqsGetStatus={
    success:{
        code:200,
        message:"Parking Requests fetched Successfully..."
    },
    notFound:{
        code:400,
        message:"Either slot or user is not found..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error.."
    }
}
module.exports=router;