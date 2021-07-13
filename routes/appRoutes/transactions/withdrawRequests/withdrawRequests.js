require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType, WithdrawRequestType } = require('@prisma/client');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const userUtils = require('./../../users/userUtils');
const transactionUtils=require('../transactionUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/forVault', tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const pendingRequest=await prisma.withdrawRequests.findMany({
            where:{
                userId:parseInt(userData.id),
                accountType:UserAccountType.Slot,
                type:WithdrawRequestType.Vault,
                status:0
            }
        });

        if(pendingRequest.length>0){
            res.statusCode=withdrawRequestsCreateStatus.pendingRequestExists.code;
            res.json({
                message:withdrawRequestsCreateStatus.pendingRequestExists.message
            });
            return;
        }

        const beneficiary=await prisma.userBeneficiary.findFirst({
            where:{
                userId:parseInt(userData.id)
            }
        });

        if(!beneficiary){
            res.statusCode=withdrawRequestsCreateStatus.beneficiaryDetailsNotPresent.code;
            res.json({
                message:withdrawRequestsCreateStatus.beneficiaryDetailsNotPresent.message
            });
            return;
        }

        const withdrawRequestCreate=await prisma.withdrawRequests.create({
            data:{
                userId:parseInt(userData.id),
                accountType:UserAccountType.Slot,
                type:WithdrawRequestType.Vault,
                status:0,
            }
        });

        if(!withdrawRequestCreate){
            res.statusCode=withdrawRequestsCreateStatus.serverError.code;
            res.json({
                message:withdrawRequestsCreateStatus.serverError.message
            });
            return;
        }

        // TODO: Add mailing to it.
        res.statusCode=withdrawRequestsCreateStatus.success.code;
        res.json({
            message:withdrawRequestsCreateStatus.success.message,
            data:withdrawRequestCreate
        });
        return;
    
    } catch (error) {
        console.log(error);
        res.statusCode=withdrawRequestsCreateStatus.serverError.code;
        res.json({
            message:withdrawRequestsCreateStatus.serverError.message
        });
        return;
    }
});

const withdrawRequestsCreateStatus={
    success:{
        code:200,
        message:"Withdraw Request Created Successfully..."
    },
    pendingRequestExists:{
        code:403,
        message:"A Pending Request Already Exists..."
    },
    beneficiaryDetailsNotPresent:{
        code:404,
        message:"Beneficiary does not exists..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.get('/forVault', tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const pendingRequest=await prisma.withdrawRequests.findMany({
            where:{
                userId:parseInt(userData.id),
                accountType:UserAccountType.Slot,
                type:WithdrawRequestType.Vault,
                status:0
            }
        });

        if(pendingRequest.length==0){
            res.statusCode=withdrawRequestsGetStatus.noPendingRequests.code;
            res.json({
                message:withdrawRequestsGetStatus.noPendingRequests.message
            });
            return;
        }
        
        res.statusCode=withdrawRequestsGetStatus.success.code;
        res.json({
            message:withdrawRequestsGetStatus.success.message,
            data:pendingRequest
        });
    } catch (error) {
        console.log(error);    
        res.statusCode=withdrawRequestsGetStatus.serverError.code;
        res.json({
            message:withdrawRequestsGetStatus.serverError.message,
            error:error
        });
        return;
    }
});

const withdrawRequestsGetStatus={
    success:{
        code:200,
        message:"Withdraw Request Fetched Successfully..."
    },
    noPendingRequests:{
        code:204,
        message:"No pending Routes Exists..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

// TODO: Make this API only for Admin and not for normal user
// Thats why commented.
// router.post('/forVaultResponse', tokenUtils.verify, async(req, res)=>{
//     const userData = req.tokenData;
//     try {
//         const withdrawRequest=await prisma.withdrawRequests.findFirst({
//             where:{
//                 id:parseInt(req.body.withdrawRequestId),
//                 status:0
//             }
//         });

//         if(!withdrawRequests){
//             res.statusCode=withdrawRequestRespondStatus.notFoundORAlreadyResponded.code;
//             res.json({
//                 message:withdrawRequestRespondStatus.notFoundORAlreadyResponded.message,
//             });
//             return;
//         }
//         if(req.body.response==2){
//             const withdrawRequestUpdate=await prisma.withdrawRequests.update({
//                 where:{
//                     id:parseInt(req.body.withdrawRequestId)
//                 },
//                 data:{
//                     respondedAt:(new Date()).toISOString(),
//                     status:2
//                 }
//             });
//             res.statusCode=withdrawRequestRespondStatus.success.code;
//             res.json({
//                 message:withdrawRequestRespondStatus.success.message,
//                 data:withdrawRequestUpdate
//             });
//             return;
//         }

//         const txnRefCode=transactionUtils.generateTransactionRefId();
//         const txnCreate=await prisma.transaction.create({
//             data:{
//                 userId:parseInt(withdrawRequest.userId),
//                 accountType:UserAccountType.Slot,
//                 amount:parseFloat(req.body.amount),
//                 transferType:MoneyTransferType.Remove,
//                 type:TransactionType.Real,
//                 transactionReal:{
//                     create:{
//                         accountType:UserAccountType.Slot,
//                         amount:parseFloat(req.body.amount),
//                         transferType:MoneyTransferType.Remove,
//                         txnCode:txnRefCode,
//                         paymentRef:req.body.paymentRef,
//                         userId:parseInt(withdrawRequest.userId),
//                         status:1
//                     }
//                 },
//                 status:1,
//             }
//         });

//         if(!txnCreate){
//             res.statusCode=withdrawRequestRespondStatus.serverError.code;
//             res.json({
//                 message:withdrawRequestRespondStatus.serverError.message
//             });
//             return;
//         }

//         // TODO: send a notification
//         // TODO: send a mail regarding this.
        
//         const withdrawRequestUpdate=await prisma.withdrawRequests.update({
//             where:{
//                 id:parseInt(req.body.withdrawRequestId)
//             },
//             data:{
//                 respondedAt:(new Date()).toISOString(),
//                 transactionId:txnCreate.id,
//                 status:1
//             }
//         })
//         res.statusCode=withdrawRequestRespondStatus.success.code;
//         res.json({
//             message:withdrawRequestRespondStatus.success.message,
//             data:withdrawRequestUpdate
//         });
//     } catch (error) {
//         console.log(error);
//         res.statusCode=withdrawRequestRespondStatus.serverError.code;
//         res.json({
//             message:withdrawRequestRespondStatus.serverError.message,
//             error:error
//         });
//         return;
//     }
// });

// const withdrawRequestRespondStatus={
//     success:{
//         code:200,
//         message:"Withdraw Request Responded Successfully..."
//     },
//     notFoundORAlreadyResponded:{
//         code:422,
//         message:"Withdraw Request is not present or already responded..."
//     },
//     serverError:{
//         code:500,
//         message:"Internal Server Error..."
//     }
// }
module.exports=router;