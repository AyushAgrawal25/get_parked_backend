const express=require('express');
const router=express.Router();

const users = require('./users/users.js');
const notifications = require('./notifications/notifications');
const slots=require('./slots/slots');
const vehicles=require('./vehicles/vehicles');

router.use('/users', users);
router.use('/notifications', notifications);
router.use('/slots', slots);
router.use('/vehicles', vehicles);

module.exports=router;