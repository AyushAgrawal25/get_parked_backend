require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType } = require('@prisma/client');

const slotUtils = require('./../slots/slotUtils');
const userUtils = require('./../users/userUtils');
const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const transactionUtils = require('./transactionUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", tokenUtils.verify, async (req, res) => {
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
                        },
                        fromUser:{
                            select:userUtils.selectionWithSlot
                        }
                    }
                }
            }
        });

        const walletBalance=await transactionUtils.walletBalance(userData.id);
        const vaultBalance=await transactionUtils.vaultBalance(userData.id);

        res.statusCode=txnsGetStatus.success.code;
        res.json({
            walletBalance:walletBalance,
            vaultBalance:vaultBalance,
            transactions:txns,
            message:txnsGetStatus.success.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=txnsGetStatus.serverError.code;
        res.json({
            message:txnsGetStatus.serverError.message,
            error:error
        });
    }
});

const txnsGetStatus={
    success:{
        code:200,
        message:"Transactions fetched successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

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
                userId: parseInt(decryptedTxnData.userId)
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
        
        // TODO: create like this...
        // const tmpData={
        //     walletAmout:await transactionUtils.walletBalance(userData.id),
        //     vaultAmount:await transactionUtils.vaultBalance(userData.id)
        // }
        // ioUtils.get().to("user_"+userData.id).emit("transaction-update", tmpData);

        // TODO: Update Transactions Sockets.
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

router.post('/respondRequest', tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const txnReqData=await prisma.transactionRequests.findFirst({
            where:{
                id:parseInt(req.body.requestId),
                withUserId:parseInt(userData.id)
            }
        });
        if((!txnReqData)||(txnReqData.status!=0)){
            res.statusCode=txnReqResponseStatus.cannotBeProceed.code;
            res.json({
                message:txnReqResponseStatus.cannotBeProceed.message
            });
            return;
        }

        // Wallet balance of the acceptor must be greater than amount.
        let walletBalance=await transactionUtils.walletBalance(userData.id);
        if(walletBalance<txnReqData.amount){
            res.statusCode=txnReqResponseStatus.lowBalance.code;
            res.json({
                message:txnReqResponseStatus.lowBalance.message
            });
            return;
        }
        
        if(req.body.response==2){
            // Reject response.
            const updateRequest=await prisma.transactionRequests.update({
                where:{
                    id:txnReqData.id
                },
                data:{
                    status:2
                }
            });
            if(updateRequest){
                res.statusCode=txnReqResponseStatus.success.code;
                res.json({
                    message:txnReqResponseStatus.success.message,
                    data:updateRequest
                });
                return;
            }
        
            res.statusCode=txnReqResponseStatus.serverError.code;
            res.json({
                message:txnReqResponseStatus.serverError.message
            });
            return;
        }

        // TODO: work on security deposit and wallet balance.

        // The man who sent the request must get the money.
        // Thats why money transfer type remains same here.
        const fromTxnCreate=prisma.transaction.create({
            data:{
                accountType:txnReqData.fromAccountType,
                transferType: txnReqData.transferType,
                type:TransactionType.NonReal,
                amount:txnReqData.amount,
                status:1,
                userId:txnReqData.fromUserId
            }
        });
        const withTxnCreate=prisma.transaction.create({
            data:{
                accountType:txnReqData.withAccountType,
                transferType: (txnReqData.transferType==MoneyTransferType.Add) ? MoneyTransferType.Remove:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                amount:txnReqData.amount,
                status:1,
                userId:txnReqData.withUserId
            }
        });

        let txnCreate;
        try {
            txnCreate=await prisma.$transaction([
                fromTxnCreate, withTxnCreate
            ]);
        } catch (error) {
            console.log("Transaction Request Respond : Transactions Create Block...");
            console.log(error);
        }

        if(!txnCreate){
            res.statusCode=txnReqResponseStatus.serverError.code;
            res.json({
                message:txnReqResponseStatus.serverError.message
            });
            return;
        }
        const fromTxnData=txnCreate[0];
        const withTxnData=txnCreate[1];
        
        const txnRefCode=transactionUtils.generateTransactionRefId();
        // From is the same of transaction request in this case.
        const fromTxnNonRealCreate=prisma.transactionNonReal.create({
            data:{
                fromUserId:txnReqData.fromUserId,
                fromAccountType: txnReqData.fromAccountType,
                amount: txnReqData.amount,
                refCode:txnRefCode,
                transferType: fromTxnData.transferType,
                withAccountType:txnReqData.withAccountType,
                withUserId:txnReqData.withUserId,
                status:1,
                type:TransactionNonRealType.TransactionRequests,
                transactionId:fromTxnData.id,
            }
        });

        const withTxnNonRealCreate=prisma.transactionNonReal.create({
            data:{
                fromUserId:txnReqData.withUserId,
                fromAccountType: txnReqData.withAccountType,
                amount: txnReqData.amount,
                refCode:txnRefCode,
                transferType: withTxnData.transferType,
                withAccountType:txnReqData.fromAccountType,
                withUserId:txnReqData.fromUserId,
                status:1,
                type:TransactionNonRealType.TransactionRequests,
                transactionId:withTxnData.id,
            }
        });

        let nonRealTxnCreate;
        try {
            nonRealTxnCreate=await prisma.$transaction([
                fromTxnNonRealCreate, withTxnNonRealCreate
            ]);
        } catch (error) {
            console.log("Transaction Request Respond : Non Real Transactions Create...");
            console.log(error);
        }
        if(!nonRealTxnCreate){
            // Delete the txns also and show.
            const delTxn=await prisma.transaction.deleteMany({
                where:{
                    OR:[
                        {
                            id:fromTxnData.id
                        },
                        {
                            id:withTxnData.id
                        }
                    ]
                }
            });
            res.statusCode=txnReqResponseStatus.serverError.code;
            res.json({
                message:txnReqResponseStatus.serverError.message
            });
            return;
        }
        const updateRequest=await prisma.transactionRequests.update({
            where:{
                id:txnReqData.id
            },
            data:{
                status:1,
                fromUserTransactionId:fromTxnData.id,
                wihtUserTransactionId:withTxnData.id
            }
        });
        if(!updateRequest){
            const delTxn=await prisma.transaction.deleteMany({
                where:{
                    OR:[
                        {
                            id:fromTxnData.id
                        },
                        {
                            id:withTxnData.id
                        }
                    ]
                }
            });

            const delNonRealTxn=await prisma.transactionNonReal.deleteMany({
                where:{
                    OR:[
                        {
                            id:nonRealTxnCreate[0].id,
                        },
                        {
                            id:nonRealTxnCreate[1].id,
                        }
                    ]
                }
            });
            
            // TODO: Update Transactions Sockets.
            
            res.statusCode=txnReqResponseStatus.serverError.code;
            res.json({
                message:txnReqResponseStatus.serverError.message
            });
            return;
        }
        res.statusCode=txnReqResponseStatus.success.code;
        res.json({
            message:txnReqResponseStatus.success.message,
            data:updateRequest
        });
        return;
    } catch (error) {
        console.log(error);
        res.statusCode=txnReqResponseStatus.serverError.code;
        res.json({
            message:txnReqResponseStatus.serverError.message,
            error:error
        });
        return;
    }
});

const txnReqResponseStatus={
    success:{
        code:200,
        message:"Transaction Request Responded Successfully..."
    },
    cannotBeProceed:{
        code:422,
        message:"Cannot process this request..."
    },
    lowBalance:{
        code:400,
        message:"Low Balance..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports = router;