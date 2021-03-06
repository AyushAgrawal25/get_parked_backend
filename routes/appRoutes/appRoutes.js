const express=require('express');
const router=express.Router();

const users = require('./users/users.js');
const notifications = require('./notifications/notifications');
const transactions = require('./transactions/transactions');
const slots=require('./slots/slots');
const vehicles=require('./vehicles/vehicles');
const queries=require('./queries/queries');

router.use('/users', users);
router.use('/notifications', notifications);
router.use('/transactions', transactions);
router.use('/slots', slots);
router.use('/vehicles', vehicles);
router.use('/queries', queries);

module.exports=router;