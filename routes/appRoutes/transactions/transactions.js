require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const slotUtils = require('./../slots/slotUtils');
const userUtils = require('./../users/userUtils');
const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const transactionUtils = require('./transactionUtils');
const transactionSocketUtils=require('./../../../services/sockets/transactions/transactionSocketUtils');
const notificationUtils = require('../notifications/notificationUtils');
const fcmUtils=require('./../../../services/notifications/FCM-Notifications/fcmUtils');
const domain = require('../../../services/domain');

const router = express.Router();
const prisma = new PrismaClient();

const Razorpay= require('razorpay');
const adminUtils = require('../../../services/admin/adminUtils');

router.get("/", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const txns=await prisma.transaction.findMany({
            where:{
                userId:parseInt(userData.id)
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

router.post("/addMoneyToWalletCode", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        // Now transaction code requires amount.
        const encryptedCode=await transactionUtils.getTransactionCode({
            userId:userData.id, amount:req.body.amount
        });
        res.statusCode = realTxnCodeGetStatus.success.code;
        res.json({
            message: realTxnCodeGetStatus.success.message,
            code: encryptedCode
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

router.post("/addMoneyToWallet", tokenUtils.verify, async (req, res) => {
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

        let txnStatus=1;
        if(decryptedTxnData.status==2){
            txnStatus=2;
        }
        else if(transactionUtils.verifyRealTransaction({
            orderId:decryptedTxnData.orderId,
            paymentId:decryptedTxnData.paymentId,
            signature:decryptedTxnData.signature
        })==false){
            txnStatus=2;
        }

        const txn = await prisma.transaction.create({
            data: {
                accountType: req.body.accountType,
                amount: parseFloat(req.body.amount),
                status: txnStatus,
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
                paymentRef: decryptedTxnData.paymentId,
                userId: parseInt(decryptedTxnData.userId),
                txnCode: decryptedTxnData.code,
                status: txnStatus,
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
        
        transactionSocketUtils.updateUser(txn.userId, txn.id);
        
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

router.post('/vaultTransferToWallet', tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const amount=req.body.amount;
        const vaultAmount=await transactionUtils.vaultBalance(userData.id);
        if(vaultAmount<amount){
            res.statusCode=vaultTransferToWalletStatus.success.code;
            res.json({
                message:vaultTransferToWalletStatus.success.message
            });
            return;
        }

        const slotToAppTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Slot,
                transferType: MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                amount:amount,
                status:1,
                userId:parseInt(userData.id)
            }
        });

        const appToSlotTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Admin,
                transferType: MoneyTransferType.Add,
                type:TransactionType.NonReal,
                amount:amount,
                status:1,
                userId:parseInt(adminUtils.details.id)
            }
        });       

        const appToUserTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.Admin,
                transferType: MoneyTransferType.Remove,
                type:TransactionType.NonReal,
                amount:amount,
                status:1,
                userId:parseInt(adminUtils.details.id)
            }
        });       

        const userToAppTxnCreate=prisma.transaction.create({
            data:{
                accountType:UserAccountType.User,
                transferType: MoneyTransferType.Add,
                type:TransactionType.NonReal,
                amount:amount,
                status:1,
                userId:parseInt(userData.id)
            }
        });
         
        let txnsCreate;
        try {
            txnsCreate=await prisma.$transaction([
                slotToAppTxnCreate,
                appToSlotTxnCreate,
                appToUserTxnCreate,
                userToAppTxnCreate
            ]);
        } catch (error) {
            console.log("Vault to Wallet Transfer : Transactions Create Block");
            console.log(error);
        }

        if(!txnsCreate){
            res.statusCode=vaultTransferToWalletStatus.serverError.code;
            res.json({
                message:vaultTransferToWalletStatus.serverError.message
            });
            return;
        }

        const slotToAppTxn=txnsCreate[0];
        const appToSlotTxn=txnsCreate[1];
        const appToUserTxn=txnsCreate[2];
        const userToAppTxn=txnsCreate[3];

        const slotAppRefCode=transactionUtils.generateTransactionRefId();
        const slotToAppNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:amount,
                fromAccountType:UserAccountType.Slot,
                fromUserId:parseInt(userData.id),
                txnCode:slotAppRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.TransactionRequests,
                withAccountType:UserAccountType.Admin,
                withUserId:parseInt(adminUtils.details.id),
                transactionId:slotToAppTxn.id,
                status:1
            }
        });

        const appToSlotNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:amount,
                fromAccountType:UserAccountType.Admin,
                fromUserId:parseInt(adminUtils.details.id),
                txnCode:slotAppRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.TransactionRequests,
                withAccountType:UserAccountType.Slot,
                withUserId:parseInt(userData.id),
                transactionId:appToSlotTxn.id,
                status:1
            }
        });

        const userAppRefCode=transactionUtils.generateTransactionRefId();
        const appToUserNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:amount,
                fromAccountType:UserAccountType.Admin,
                fromUserId:parseInt(adminUtils.details.id),
                txnCode:userAppRefCode,
                transferType:MoneyTransferType.Remove,
                type:TransactionNonRealType.TransactionRequests,
                withAccountType:UserAccountType.User,
                withUserId:parseInt(userData.id),
                transactionId:appToUserTxn.id,
                status:1
            }
        });

        const userToAppNonRealTxnCreate=prisma.transactionNonReal.create({
            data:{
                amount:amount,
                fromAccountType:UserAccountType.User,
                fromUserId:parseInt(userData.id),
                txnCode:userAppRefCode,
                transferType:MoneyTransferType.Add,
                type:TransactionNonRealType.TransactionRequests,
                withAccountType:UserAccountType.Admin,
                withUserId:parseInt(adminUtils.details.id),
                transactionId:userToAppTxn.id,
                status:1
            }
        });

        let nonRealTxns;
        try{
            nonRealTxns=await prisma.$transaction([
                slotToAppNonRealTxnCreate,
                appToSlotNonRealTxnCreate,
                appToUserNonRealTxnCreate,
                userToAppNonRealTxnCreate,
            ]);
        }
        catch(error){
            console.log("Vault to Wallet Transfer : Non Real Transactions Create Block");
            console.log(error);
        }

        if(!nonRealTxns){
            // Deleting Txns
            const delTxns=await prisma.transaction.deleteMany({
                where:{
                    OR:[
                        {
                            id:slotToAppTxn.id
                        },
                        {
                            id:appToSlotTxn.id
                        },
                        {
                            id:appToUserTxn.id
                        },
                        {
                            id:userToAppTxn.id
                        },
                    ]
                }
            });

            transactionSocketUtils.updateUser(userData.id, slotToAppTxn.id);
            transactionSocketUtils.updateUser(userData.id, userToAppTxn.id);

            res.statusCode=vaultTransferToWalletStatus.serverError.code;
            res.json({
                message:vaultTransferToWalletStatus.serverError.message
            });
            return;
        }

        res.statusCode=vaultTransferToWalletStatus.success.code;
        res.json({
            data:nonRealTxns,
            message:vaultTransferToWalletStatus.success.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=vaultTransferToWalletStatus.serverError.code;
        res.json({
            message:vaultTransferToWalletStatus.serverError.message
        });
    }
});

const vaultTransferToWalletStatus={
    success:{
        code:200,
        message:"Transfer Successful..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.post('/request', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const txnReq=await prisma.transactionRequests.create({
            data:{
                amount:parseFloat(req.body.amount),
                requesterAccountType:req.body.requesterAccountType,
                requesterUserId:parseInt(userData.id),
                transferType:req.body.transferType,
                requestedFromAccountType:req.body.requestedFromAccountType,
                requestedFromUserId:parseInt(req.body.requestedFromUserId),
                note:req.body.note,
                status:0
            },
            include:{
                requesterUser:{
                    select:userUtils.selectionWithSlot
                },
                requestedFromUser:{
                    select:userUtils.selectionWithSlot
                }
            }
        });

        if(!txnReq){
            res.statusCode=txnReqPostStatus.serverError.code;
            res.json({
                message:txnReqPostStatus.serverError.message
            });
            return;
        }

        notificationUtils.sendNotification({
            refId:txnReq.id,
            recieverAccountType:txnReq.requestedFromAccountType,
            recieverUserId:txnReq.requestedFromUserId,
            refData:txnReq,
            senderAccountType:txnReq.requesterAccountType,
            senderUserId:txnReq.requestedFromUserId,
            type:NotificationType.TransactionRequest,
            status:0
        });

        try {
            fcmUtils.sendTo({
                body:txnReq.requesterUser.userDetails.firstName+" "+txnReq.requesterUser.userDetails.lastName,
                data:txnReq,
                imgUrl:(txnReq.requesterUser.userDetails.picThumbnailUrl!=null) ? domain.domainName+txnReq.requesterUser.userDetails.picThumbnailUrl:null,
                title:notificationUtils.titles.transactionRequest.forRequestedFrom(txnReq.amount),
                token:txnReq.requestedFromUser.userNotification.token
            });
        } catch (error) {
            console.log("FCM notification block");
            console.log(error);
        }

        res.statusCode=txnReqPostStatus.success.code;
        res.json({
            message:txnReqPostStatus.success.message,
            data:txnReq
        });
    } catch (error) {
        console.log(error);
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
                requestedFromUserId:parseInt(userData.id)
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
                },
                include:{
                    requesterUser:{
                        select:userUtils.selectionWithSlot
                    },
                    requestedFromUser:{
                        select:userUtils.selectionWithSlot
                    }
                }
            });
            if(updateRequest){
                notificationUtils.sendNotification({
                    refId:updateRequest.id,
                    recieverAccountType:updateRequest.requesterAccountType,
                    recieverUserId:updateRequest.requesterUserId,
                    refData:updateRequest,
                    senderAccountType:updateRequest.requestedFromAccountType,
                    senderUserId:updateRequest.requestedFromUserId,
                    type:NotificationType.TransactionRequestResponse,
                    status:0
                });

                try {
                    fcmUtils.sendTo({
                        body:updateRequest.requestedFromUser.userDetails.firstName+" "+updateRequest.requesterUser.userDetails.lastName,
                        data:updateRequest,
                        imgUrl:(updateRequest.requestedFromUser.userDetails.picThumbnailUrl!=null) ? domain.domainName+updateRequest.requestedFromUser.userDetails.picThumbnailUrl:null,
                        title:notificationUtils.titles.transactionRequestResponse.forRequester(updateRequest.amount),
                        token:updateRequest.requesterUser.userNotification.token
                    });
                } catch (error) {
                    console.log("FCM notification block");
                    console.log(error);
                }

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
                accountType:txnReqData.requesterAccountType,
                transferType: txnReqData.transferType,
                type:TransactionType.NonReal,
                amount:txnReqData.amount,
                status:1,
                userId:txnReqData.requesterUserId
            }
        });
        const withTxnCreate=prisma.transaction.create({
            data:{
                accountType:txnReqData.requestedFromAccountType,
                transferType: (txnReqData.transferType==MoneyTransferType.Add) ? MoneyTransferType.Remove:MoneyTransferType.Add,
                type:TransactionType.NonReal,
                amount:txnReqData.amount,
                status:1,
                userId:txnReqData.requestedFromUserId
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
                fromUserId:txnReqData.requesterUserId,
                fromAccountType: txnReqData.requesterAccountType,
                amount: txnReqData.amount,
                txnCode:txnRefCode,
                transferType: fromTxnData.transferType,
                withAccountType:txnReqData.requestedFromAccountType,
                withUserId:txnReqData.requestedFromUserId,
                status:1,
                type:TransactionNonRealType.TransactionRequests,
                transactionId:fromTxnData.id,
            }
        });

        const withTxnNonRealCreate=prisma.transactionNonReal.create({
            data:{
                fromUserId:txnReqData.requestedFromUserId,
                fromAccountType: txnReqData.requestedFromAccountType,
                amount: txnReqData.amount,
                txnCode:txnRefCode,
                transferType: withTxnData.transferType,
                withAccountType:txnReqData.requesterAccountType,
                withUserId:txnReqData.requesterUserId,
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
        // TODO: Make changes according to new prisma scheme
        const updateRequest=await prisma.transactionRequests.update({
            where:{
                id:txnReqData.id
            },
            data:{
                status:1,
                requesterTransactionId:fromTxnData.id,
                requestedFromTransactionId:withTxnData.id
            },
            include:{
                requesterUser:{
                    select:userUtils.selectionWithSlot
                },
                requestedFromUser:{
                    select:userUtils.selectionWithSlot
                }
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

            res.statusCode=txnReqResponseStatus.serverError.code;
            res.json({
                message:txnReqResponseStatus.serverError.message
            });
            return;
        }

        transactionSocketUtils.updateUser(fromTxnData.userId, fromTxnData.id);
        transactionSocketUtils.updateUser(withTxnData.userId, withTxnData.id);

        notificationUtils.sendNotification({
            refId:updateRequest.id,
            recieverAccountType:updateRequest.requesterAccountType,
            recieverUserId:updateRequest.requesterUserId,
            refData:updateRequest,
            senderAccountType:updateRequest.requestedFromAccountType,
            senderUserId:updateRequest.requestedFromUserId,
            type:NotificationType.TransactionRequestResponse,
            status:0
        });

        try {
            fcmUtils.sendTo({
                body:updateRequest.requestedFromUser.userDetails.firstName+" "+updateRequest.requesterUser.userDetails.lastName,
                data:updateRequest,
                imgUrl:(updateRequest.requestedFromUser.userDetails.picThumbnailUrl!=null) ? domain.domainName+updateRequest.requestedFromUser.userDetails.picThumbnailUrl:null,
                title:notificationUtils.titles.transactionRequestResponse.forRequester(updateRequest.amount),
                token:updateRequest.requesterUser.userNotification.token
            });
        } catch (error) {
            console.log("FCM notification block");
            console.log(error);
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