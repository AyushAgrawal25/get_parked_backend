require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const crypto=require('crypto');
const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const transactionUtils = require('./transactionUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/forUser", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    
});

router.get("/realTransactionCode", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        res.statusCode=realTxnCodeGetStatus.success.code;
        res.json({
            message:realTxnCodeGetStatus.success.message,
            code:transactionUtils.getTransactionCode({
                userId:userData.id
            })
        });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});
const realTxnCodeGetStatus={
    success:{
        code:200,
        message:"Real Transaction Code fetched successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

module.exports = router;