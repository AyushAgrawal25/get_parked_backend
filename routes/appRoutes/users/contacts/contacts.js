require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const userUtils = require('../userUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        let userSelection=userUtils.selection;
        userSelection["userNotification"]=false;
        const users=await prisma.user.findMany({
            where:{
                OR:JSON.parse(req.body.phoneNumbers)
            },
            select:userSelection
        });

        res.statusCode=getUserContactsStatus.success.code;
        res.json({
            message:getUserContactsStatus.success.message,
            users:users
        });
    } catch (error) {
        console.log(error);
        res.statusCode=getUserContactsStatus.serverError.code;
        res.json({
            error:error,
            message:getUserContactsStatus.serverError.message
        });
    }
});

const getUserContactsStatus={
    success:{
        code:200,
        message:"User Contacts fetched successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;