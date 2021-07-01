require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const fcmUtils=require('./../../../../services/notifications/FCM-Notifications/fcmUtils');
const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');
const parkingSocketUtils=require('../../../../services/sockets/parkings/parkingSocketUtils');
const notificationUtils=require('./../../notifications/notificationUtils');
const domain = require('../../../../services/domain');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:slotId", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        // TODO: seperate data according vehicle types.
        // TODO: add overall rating of each type.
        const reviews=await prisma.slotRatingReview.findMany({
            where:{
                slotId:parseInt(req.params.slotId)
            },
            include:{
                parking:true,
                user:{
                    select:userUtils.selection
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
        });

        res.json(reviews);
    } catch (error) {
        res.json(error);
    }
});

module.exports=router;