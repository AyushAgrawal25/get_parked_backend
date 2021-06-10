const express = require('express');
const crypto=require('crypto');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try{
        let reqSlotData=req.body.slotData;
        reqSlotData["status"]=1;
        reqSlotData["token"]=await crypto.randomBytes(40).toString('base64');
        reqSlotData["userId"]=userData.id;    
        const slot=await prisma.slot.create({
            data:reqSlotData
        });
        if(slot){
            let vehiclesData=[];
            for(var i=0; i<req.body.vehicles.length; i++){
                let vehicleData=req.body.vehicles[i];
                vehicleData["slotId"]=slot.id;
                vehicleData["status"]=1;
                vehiclesData.push(vehicleData);
            }
            
            const vehicles=await prisma.slotVehicle.createMany({
                data:vehiclesData
            });
            if((vehicles)&&(vehicles.count>0)){
                res.statusCode=slotCreateStatus.success.code;
                res.json({
                    message:slotCreateStatus.success.message,
                    slot:slot
                });
            }
            return;
        }
        res.statusCode=slotCreateStatus.serverError.code;
        res.json({
            message:slotCreateStatus.serverError.message,
        });
    }
    catch(excp){
        console.log(excp);
        res.statusCode=slotCreateStatus.serverError.code;
        res.json({
            message:slotCreateStatus.serverError.message,
            error:excp
        });
    }
});

const slotCreateStatus={
    success:{
        code:200,
        message:"Slot Created successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

// TODO: get parking lord function.
router.get("/parkingLord", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        let slot=await prisma.slot.findFirst({
            where:{
                userId:userData.id
            },
            include:{
                vehicles:true,
                SlotRatingReview:true,
                SlotImages:true
            }
        });

        if(slot){
            //TODO: Add Ratings..
            const ratings=slot["SlotRatingReview"];
            let totalRating=0;
            let overallRating=null;
            if(ratings.length>0){
                ratings.forEach((rating)=>{
                    totalRating+=rating.ratingValue;
                });
                overallRating=totalRating/ratings.length;
            }
            slot["SlotRatingReview"]=undefined;
            slot["rating"]=overallRating;

            slot["images"]=slot["SlotImages"];
            slot["SlotImages"]=undefined;

            res.statusCode=parkingLordGetStatus.success.code;
            res.json({
                message:parkingLordGetStatus.success.message,
                data:slot,
            });
            return;
        }
        
        res.statusCode=parkingLordGetStatus.notFound.code;
        res.json({
            message:parkingLordGetStatus.notFound.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=parkingLordGetStatus.serverError.code;
        res.json({
            error:error,
            message:parkingLordGetStatus.serverError.message
        });
    }
});

const parkingLordGetStatus={
    success:{
        code:200,
        message:"Parking Lord fetched sucessfully..."
    },
    notFound:{
        code:400,
        message:"No Parking Lord Found..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.put('/details', tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const slot=await prisma.slot.findFirst({
            where:{
                userId:userData.id,
            }
        });
        if(!slot){
            res.statusCode=slotDetailsUpdateStatus.notFound.code;
            res.json({
                message:slotDetailsUpdateStatus.notFound.message
            });
            return;
        }

        const slotUpdate=await prisma.slot.update({
            data:{
                name:req.body.name
            },
            where:{
                id:slot.id
            }
        });

        if(slotUpdate){
            res.statusCode=slotDetailsUpdateStatus.success.code;
            res.json({
                message:slotDetailsUpdateStatus.success.message,
                data:slotUpdate
            });
            return;
        }

        res.statusCode=slotDetailsUpdateStatus.serverError.code;
        res.json({
            message:slotDetailsUpdateStatus.serverError.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotDetailsUpdateStatus.serverError.code;
        res.json({
            error:error,
            message:slotDetailsUpdateStatus.serverError.message
        });
    }
});

const slotDetailsUpdateStatus={
    success:{
        code:200,
        message: "Parking Lord Details Update Successfully..."
    },
    notFound:{
        code:400,
        message:"Parking Lord not found..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error.."
    }
};

module.exports = router;