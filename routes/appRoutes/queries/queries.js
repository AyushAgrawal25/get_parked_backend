const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const mailerUtils=require('../../../services/notifications/mailer/mailerUtils');

const router=express.Router();
const prisma = new PrismaClient();

const userQueriesRoute=require('./userQueries/userQueries');
const faqsRoute=require('./faqs/faqs');

router.use('/userQueries', userQueriesRoute);
router.use('/faqs', faqsRoute);

module.exports=router;