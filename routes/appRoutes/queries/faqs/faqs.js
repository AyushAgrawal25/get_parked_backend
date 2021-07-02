const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const mailerUtils=require('./../../../../services/notifications/mailer/mailerUtils');
const tokenUtils =require('./../../../../services/tokenUtils/tokenUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const faqs=await prisma.fAQS.findMany({
            orderBy:{
                upVotesCount:'desc'
            },
            take:20,
            include:{
                upVotes:true
            }
        });

        res.statusCode=faqsGetStatus.success.code;
        res.json({
            message:faqsGetStatus.success.message,
            data:faqs
        });
    } catch (error) {
        console.log(error);
        res.statusCode=faqsGetStatus.serverError.code;
        res.json({
            error:error,
            message:faqsGetStatus.serverError.message
        });
    }
});

const faqsGetStatus={
    success:{
        code:200,
        message:"FAQs Successfully fetched...",
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;