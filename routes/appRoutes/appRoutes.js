const express=require('express');
const router=express.Router();

const users = require('./users/users.js');
const notifications = require('./notifications/notifications');

router.use('/users', users);
router.use('/notifications', notifications);

module.exports=router;