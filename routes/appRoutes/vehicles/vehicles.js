const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const vehicleDetails=require('./../../../services/vehicles/vehiclesDetails');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/types", tokenUtils.verify, async(req, res)=>{
    try {
        const typesData=vehicleDetails.getTypesData();
        res.statusCode=getTypesStatus.success.code;
        res.json({
            data:typesData,
            message:getTypesStatus.success.message
        });
        return;
    } catch (error) {
        console.log(error);
        res.statusCode=getTypesStatus.severError.code;
        res.json({
            error:error,
            message:getTypesStatus.severError.message
        });
    }
});
const getTypesStatus={
    success:{
        code:200,
        message:"Vehilces Type Data Fetched..."
    },
    severError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;