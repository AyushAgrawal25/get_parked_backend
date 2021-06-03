const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');

const router = express.Router();
const prisma = new PrismaClient();

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