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
        // TODO: Add validation.
        const userBeneficiary=await prisma.userBeneficiary.create({
            data:{
                upiId:req.body.upiId,
                userId:parseInt(userData.id),
                accountNumber:req.body.accountNumber,
                bankName:req.body.bankName,
                beneficiaryName:req.body.beneficiaryName,
                ifscCode:req.body.ifscCode,
                status:1
            }
        });
        
        res.statusCode=beneficiaryCreateStatus.success.code;
        res.json({
            message:beneficiaryCreateStatus.success.message,
            data:userBeneficiary
        });
    } catch (error) {
        console.log(error);
        res.statusCode=beneficiaryCreateStatus.serverError.code;
        res.json({
            message:beneficiaryCreateStatus.serverError.message,
            error:error
        });
    }
});

const beneficiaryCreateStatus={
    success:{
        code:200,
        message:"Beneficiary Created Successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.put('/', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        if(!req.body.beneficiaryId){
            res.statusCode=beneficiaryUpdateStatus.invalidBeneficiary.code;
            res.json({
                message:beneficiaryUpdateStatus.invalidBeneficiary.message
            });
            return;
        }

        let updateData={};
        if(req.body.ifscCode){
            updateData.ifscCode=req.body.ifscCode;
        }
        if(req.body.beneficiaryName){
            updateData.beneficiaryName=req.body.beneficiaryName;
        }
        if(req.body.accountNumber){
            updateData.accountNumber=req.body.accountNumber;
        }
        if(req.body.upiId){
            updateData.upiId=req.body.upiId;
        }
        if(req.body.bankName){
            updateData.bankName=req.body.bankName;
        }

        // TODO: verify each data.
        const beneficiaryUpdate=await prisma.userBeneficiary.update({
            where:{
                id:parseInt(req.body.beneficiaryId)
            },
            data:updateData
        });

        if(!beneficiaryUpdate){
            res.statusCode=beneficiaryUpdateStatus.serverError.code;
            res.json({
                message:beneficiaryUpdateStatus.serverError.message
            });
            return;
        }
        
        res.statusCode=beneficiaryUpdateStatus.success.code;
        res.json({
            message:beneficiaryUpdateStatus.success.message,
            data:beneficiaryUpdate
        });
        return;
    } catch (error) {
        console.log(error);
        res.statusCode=beneficiaryUpdateStatus.serverError.code;
        res.json({
            message:beneficiaryUpdateStatus.serverError.message
        });
        return;
    }
});

const beneficiaryUpdateStatus={
    success:{
        code:200,
        message:"Beneficiary Created Successfully..."
    },
    invalidBeneficiary:{
        code:422,
        message:"Invalid Beneficiary Id...."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.get('/', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const beneficiaryData=await prisma.userBeneficiary.findFirst({
            where:{
                userId:parseInt(userData.id)
            }
        });

        if(!beneficiaryData){
            res.statusCode=beneficiaryGetStatus.notExist.code;
            res.json({
                message:beneficiaryGetStatus.notExist.message
            });
            return;
        }

        res.statusCode=beneficiaryGetStatus.success.code;
        res.json({
            message:beneficiaryGetStatus.success.message,
            data:beneficiaryData
        });
    } catch (error) {
        console.log(error);
        res.statusCode=beneficiaryGetStatus.serverError.code;
        res.json({
            message:beneficiaryGetStatus.serverError.message,
            error:error
        });
    }
});

const beneficiaryGetStatus={
    success:{
        code:200,
        message:"Beneficiary Fetched Successfully..."
    },
    notExist:{
        code:404,
        message:"Beneficiary Details does not exists...."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports=router;