const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/forUser", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
});


module.exports = router;