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

router.post('/upvote', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const upVoteCreate=await prisma.fAQUpVotes.create({
            data:{
                userId:parseInt(userData.id),
                faqId:parseInt(req.body.faqId),
                status:1
            },
            select:{
                faq:true
            }
        });

        if(!upVoteCreate){
            res.statusCode=faqUpVoteStatus.serverError.code;
            res.json({
                message:faqUpVoteStatus.serverError.message
            });
        }

        const faqUpdate=await prisma.fAQS.update({
            where:{
                id:upVoteCreate.faq.id,
            },
            data:{
                upVotesCount:upVoteCreate.faq.upVotesCount+1
            }
        });

        res.statusCode=faqUpVoteStatus.success.code;
        res.json({
            message:faqUpVoteStatus.success.message,
            data:faqUpdate
        });
    } catch (error) {
        console.log(error);
        res.statusCode=faqUpVoteStatus.serverError.code;
        res.json({
            message:faqUpVoteStatus.serverError.message,
            error:error
        });
    }
});

const faqUpVoteStatus={
    success:{
        code:200,
        message:"FAQ upvoted Successfully..."
    },
    alreadyUpVoted:{
        code:422,
        message:"Already UpVoted"
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;