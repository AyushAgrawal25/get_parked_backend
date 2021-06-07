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
            
            const vehicles=await prisma.slotVehicles.createMany({
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

module.exports = router;