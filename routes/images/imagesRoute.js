const express=require('express');
const router=express.Router();

const slotImages=require('./slotImages/slotImages');
const profilePics=require('./profilePics/profilePics');

router.use('/slotImages', slotImages);
router.use('/profilePics', profilePics);

module.exports=router;