const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const mailerUtils=require('./../../../../services/notifications/mailer/mailerUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const userUtils = require('../../users/userUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const userQuery=await prisma.userQuery.create({
            data:{
                query:req.body.query,
                description:req.body.description,
                userId:parseInt(userData.id),
                status:0
            },
            include:{
                user:{
                    select:userUtils.selection
                }
            }
        });

        if(!userQuery){
            res.statusCode=userQueryPostStatus.serverError.code,
            res.json({
                message:userQueryPostStatus.serverError.message
            });

            return;
        }

        mailerUtils.customerQuery({
            description:(userQuery.description) ? userQuery.description:"",
            displayName:userQuery.user.userDetails.firstName+" "+userQuery.user.userDetails.lastName,
            query:userQuery.query,
            queryId:userQuery.id
        });

        res.statusCode=userQueryPostStatus.success.code;
        res.json({
            message:userQueryPostStatus.success.message,
            data:userQuery,
        });
    } catch (error) {
        console.log(error);
        res.statusCode=userQueryPostStatus.serverError.code,
        res.json({
            error:error,
            message:userQueryPostStatus.serverError.message
        });
        return;
    }
});

const userQueryPostStatus={
    success:{
        code:200,
        message:"User Query Post Successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;