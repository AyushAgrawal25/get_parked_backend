require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType } = require('@prisma/client');

const slotUtils = require('./../slots/slotUtils');
const userUtils = require('./../users/userUtils');
const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const transactionUtils = require('./transactionUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/forUser", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const txns=await prisma.transaction.findMany({
            where:{
                userId:userData.id
            },
            include:{
                transactionReal:{
                    include:{
                        user:{
                            select:userUtils.selectionWithSlot
                        }
                    }
                },
                transactionNonReal:{
                    include:{
                        withUser:{
                            select:userUtils.selectionWithSlot
                        }
                    }
                }
            }
        });

        res.json(txns);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

router.get("/realTransactionCode", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        res.statusCode = realTxnCodeGetStatus.success.code;
        res.json({
            message: realTxnCodeGetStatus.success.message,
            code: transactionUtils.getTransactionCode({
                userId: userData.id
            })
        });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});
const realTxnCodeGetStatus = {
    success: {
        code: 200,
        message: "Real Transaction Code fetched successfully..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.post("/realTransaction", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        if (!req.body.code) {
            res.statusCode = realTxnPostStatus.invalidTxn.code;
            res.json({
                message: realTxnPostStatus.invalidTxn.message
            });
            return;
        }
        const decryptedTxnData = transactionUtils.getTransactionData(req.body.code);
        if (!decryptedTxnData) {
            res.statusCode = realTxnPostStatus.invalidTxn.code;
            res.json({
                message: realTxnPostStatus.invalidTxn.message
            });
            return;
        }
        if (decryptedTxnData.userId != userData.id) {
            res.statusCode = realTxnPostStatus.invalidTxn.code;
            res.json({
                message: realTxnPostStatus.invalidTxn.message
            });
            return;
        }

        if (!decryptedTxnData.ref) {
            res.statusCode = realTxnPostStatus.invalidTxn.code;
            res.json({
                message: realTxnPostStatus.invalidTxn.message
            });
            return;
        }

        const txn = await prisma.transaction.create({
            data: {
                accountType: req.body.accountType,
                amount: parseFloat(req.body.amount),
                status: decryptedTxnData.status,
                transferType: req.body.moneyTransferType,
                type: TransactionType.Real,
                userId: decryptedTxnData.status
            }
        });
        if (!txn) {
            res.statusCode = realTxnPostStatus.serverError.code;
            res.json({
                message: realTxnPostStatus.serverError.message
            });
            return;
        }

        const realTxn = await prisma.transactionReal.create({
            data: {
                accountType: req.body.accountType,
                transferType: req.body.moneyTransferType,
                amount: parseFloat(req.body.amount),
                ref: decryptedTxnData.ref,
                userId: parseInt(decryptedTxnData.userId),
                refCode: decryptedTxnData.code,
                status: decryptedTxnData.status,
                transactionId: txn.id
            },
            include: {
                transaction: true
            }
        });

        if (!realTxn) {
            const delTxn = await prisma.transaction.delete({
                where: {
                    id: txn.id
                }
            });
            res.statusCode = realTxnPostStatus.serverError.code;
            res.json({
                message: realTxnPostStatus.serverError.message
            });
            return;
        }

        res.statusCode = realTxnPostStatus.success.code;
        res.json({
            message: realTxnPostStatus.success.message,
            data: realTxn
        });
    } catch (error) {
        console.log(error);
        res.statusCode = realTxnPostStatus.serverError.code;
        res.json({
            message: realTxnPostStatus.serverError.message
        });
        return;
    }
});

const realTxnPostStatus = {
    success: {
        code: 200,
        message: "Transaction Made successfully..."
    },
    invalidTxn: {
        code: 422,
        message: "Invalid Transaction Data..."
    },
    serverError: {
        code: 500,
        message: "Internal Server Error..."
    }
}

router.post('/request', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const txnReq=await prisma.transactionRequests.create({
            data:{
                amount:parseFloat(req.body.amount),
                fromAccountType:req.body.fromAccountType,
                fromUserId:parseInt(userData.id),
                transferType:req.body.transferType,
                withAccountType:req.body.withAccountType,
                withUserId:parseInt(req.body.withUserId),
                note:req.body.note,
                status:0
            }
        });

        if(txnReq){
            res.statusCode=txnReqPostStatus.success.code;
            res.json({
                message:txnReqPostStatus.success.message,
                data:txnReq
            });
            return;
        }
        
        res.statusCode=txnReqPostStatus.serverError.code;
        res.json({
            message:txnReqPostStatus.serverError.message
        });
    } catch (error) {
        res.statusCode=txnReqPostStatus.serverError.code;
        res.json({
            message:txnReqPostStatus.serverError.message
        });
    }
});

const txnReqPostStatus={
    success:{
        code:200,
        message:"Transaction Request Sent Successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

// TODO: Accept transaction request and all.
router.post('/');

module.exports = router;