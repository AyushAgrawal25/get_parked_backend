const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/add", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const slotData=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userData.id),
            },
            include:{
                vehicles:{
                    where:{
                        type:req.body.type,
                        status:1
                    }
                }
            }
        });

        if(!slotData){
            res.statusCode=slotVehicleCreateStatus.slotNotFound.code;
            res.json({
                message:slotVehicleCreateStatus.slotNotFound.message
            });
            return;
        }

        if(slotData.vehicles.length>0){
            res.statusCode=slotVehicleCreateStatus.vehicleAlreadyPresent.code;
            res.json({
                message:slotVehicleCreateStatus.vehicleAlreadyPresent.message
            });
            return;
        }

        const vehicleCreate=await prisma.slotVehicle.create({
            data:{
                fair:parseFloat(req.body.fair),
                type:req.body.type,
                typeId:vehicleUtils.getType(req.body.type).typeId,
                slotId:slotData.id,
                status:1
            }
        });

        if(!vehicleCreate){
            res.statusCode=slotVehicleCreateStatus.serverError.code;
            res.json({
                message:slotVehicleCreateStatus.serverError.message
            });
            return;
        }

        const vehiclesUpdateData=await prisma.slotVehicle.findMany({
            where:{
                slotId:slotData.id,
                status:1
            },
            select:vehicleUtils.selectionWithTypeData
        });

        res.statusCode=slotVehicleCreateStatus.success.code;
        res.json({
            message:slotVehicleCreateStatus.success.message,
            data:vehicleCreate,
            vehicles:vehiclesUpdateData
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotVehicleCreateStatus.serverError.code;
        res.json({
            message:slotVehicleCreateStatus.serverError.message,
            error:error
        });
        return;
    }
});

const slotVehicleCreateStatus={
    success:{
        code:200,
        message:"Vehicle Data successfully created..."
    },
    slotNotFound:{
        code:404,
        message:"Slot not Found..."
    },
    vehicleAlreadyPresent:{
        code:422,
        message:"Vehicle Data Already present...."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.post("/update", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const slotData=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userData.id),
            },
            include:{
                vehicles:{
                    where:{
                        type:req.body.type,
                        status:1
                    }
                },
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
            res.statusCode=slotVehicleUpdateStatus.slotNotFound.code;
            res.json({
                message:slotVehicleUpdateStatus.slotNotFound.message
            });
            return;
        }

        if(slotData.bookings.length>0){
            res.statusCode=slotVehicleUpdateStatus.cannotBeUpdated.code;
            res.json({
                message:slotVehicleUpdateStatus.cannotBeUpdated.message
            });
            return;
        }

        if(slotData.vehicles.length==0){
            res.statusCode=slotVehicleUpdateStatus.vehicleNotFound.code;
            res.json({
                message:slotVehicleUpdateStatus.vehicleNotFound.message
            });
            return;
        }

        const vehicleCreate=await prisma.slotVehicle.create({
            data:{
                fair:parseFloat(req.body.fair),
                type:req.body.type,
                typeId:vehicleUtils.getType(req.body.type).typeId,
                slotId:slotData.id,
                status:1
            }
        });

        if(!vehicleCreate){
            res.statusCode=slotVehicleUpdateStatus.serverError.code;
            res.json({
                message:slotVehicleUpdateStatus.serverError.message
            });
            return;
        }

        let updateVehicleIds=[];
        slotData.vehicles.forEach((vehicle)=>{
            updateVehicleIds.push({
                id:vehicle.id
            });
        });

        const updateVehicles=await prisma.slotVehicle.updateMany({
            where:{
                OR:updateVehicleIds
            },
            data:{
                status:0
            }
        });

        const vehiclesUpdateData=await prisma.slotVehicle.findMany({
            where:{
                slotId:slotData.id,
                status:1
            },
            select:vehicleUtils.selectionWithTypeData
        });

        res.statusCode=slotVehicleUpdateStatus.success.code;
        res.json({
            message:slotVehicleUpdateStatus.success.message,
            data:vehicleCreate,
            vehicles:vehiclesUpdateData
        });            
    } catch (error) {
        console.log(error);    
        res.statusCode=slotVehicleUpdateStatus.serverError.code;
        res.json({
            message:slotVehicleUpdateStatus.serverError.message
        });
        return;
    }
});

const slotVehicleUpdateStatus={
    success:{
        code:200,
        message:"Vehicle Data successfully created..."
    },
    slotNotFound:{
        code:404,
        message:"Slot not Found..."
    },
    vehicleNotFound:{
        code:422,
        message:"Vehicle Data is not present...."
    },
    cannotBeUpdated:{
        code:421,
        message:"Slot Vehilce Cannot be updated as some bookings or parkings are still there..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.put("/uncheck", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const slotData=await prisma.slot.findFirst({
            where:{
                userId:parseInt(userData.id),
            },
            include:{
                vehicles:{
                    where:{
                        type:req.body.type,
                        status:1
                    }
                },
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
            res.statusCode=slotVehicleUncheckStatus.slotNotFound.code;
            res.json({
                message:slotVehicleUncheckStatus.slotNotFound.message
            });
            return;
        }

        if(slotData.bookings.length>0){
            res.statusCode=slotVehicleUncheckStatus.cannotBeUpdated.code;
            res.json({
                message:slotVehicleUncheckStatus.cannotBeUpdated.message
            });
            return;
        }

        if(slotData.vehicles.length==0){
            res.statusCode=slotVehicleUncheckStatus.vehicleNotFound.code;
            res.json({
                message:slotVehicleUncheckStatus.vehicleNotFound.message
            });
            return;
        }

        let updateVehicleIds=[];
        slotData.vehicles.forEach((vehicle)=>{
            updateVehicleIds.push({
                id:vehicle.id
            });
        });

        const vehicleUpdate=await prisma.slotVehicle.updateMany({
            where:{
                OR:updateVehicleIds
            },
            data:{
                status:0
            }
        });

        if(!vehicleUpdate){
            res.statusCode=slotVehicleUncheckStatus.serverError.code;
            res.json({
                message:slotVehicleUncheckStatus.serverError.message
            });
            return;
        }
        
        const vehiclesUpdateData=await prisma.slotVehicle.findMany({
            where:{
                slotId:slotData.id,
                status:1
            },
            select:vehicleUtils.selectionWithTypeData
        });

        res.statusCode=slotVehicleUncheckStatus.success.code;
        res.json({
            message:slotVehicleUncheckStatus.success.message,
            data:vehicleUpdate,
            vehicles:vehiclesUpdateData
        });            
    } catch (error) {
        console.log(error);    
        res.statusCode=slotVehicleUncheckStatus.serverError.code;
        res.json({
            message:slotVehicleUncheckStatus.serverError.message
        });
        return;
    }
});

const slotVehicleUncheckStatus={
    success:{
        code:200,
        message:"Vehicle successfully unchecked..."
    },
    slotNotFound:{
        code:404,
        message:"Slot not Found..."
    },
    vehicleNotFound:{
        code:422,
        message:"Vehicle Data is not present...."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;