const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const userUtils = require('../users/userUtils');
const vehicleUtils = require('../vehicles/vehicleUtils');
const notificationUtils = require('./notificationUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        // TODO: add limit to it.
        const notifications=await prisma.notifications.findMany({
            where:{
                recieverUserId:parseInt(userData.id)
            },
            select:notificationUtils.selection
        });

        res.statusCode=notificationGetStatus.success.code;
        res.json({
            message:notificationGetStatus.success.message,
            data:notifications
        });

    } catch (error) {
        console.log(error);
        res.statusCode=notificationGetStatus.serverError.code;
        res.json({
            message:notificationGetStatus.serverError.message,
            error:error
        });
    }
});

const notificationGetStatus={
    success:{
        code:200,
        message:"Notifications fetched successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server error..."
    }
}

router.put("/fcmToken", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const unData=await prisma.user.findFirst({
            where:{
                id:userData.id
            },
            include:{
                userNotification:true
            }
        });
        const upResp = await prisma.userNotification.update({
            data: {
                token: req.body.fcmToken
            },
            where:{
                id:unData.userNotification.id
            }
        });
        // console.log(upResp);
        res.statusCode=fcmTokenUpdate.success.code;
        res.json({
            data: upResp,
            message:fcmTokenUpdate.success.message
        });
        return;
    } catch (error) {
        res.statusCode=fcmTokenUpdate.serverError.code;
        res.json({
            error: error,
            message:fcmTokenUpdate.serverError.message
        });
        return;
    }
});

const fcmTokenUpdate={
    success:{
        code:200,
        message:"FCM Token updated successfully.."
    },
    serverError:{
        code:500,
        message:"Internal Server error..."
    }
}

module.exports = router;