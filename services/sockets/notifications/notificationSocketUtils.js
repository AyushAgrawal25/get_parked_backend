const { PrismaClient } = require('@prisma/client');
const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const userUtils = require('../../../routes/appRoutes/users/userUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');
const ioUtils = require('../ioUtils');
const notificationUtils=require('./../../../routes/appRoutes/notifications/notificationUtils');
const notificationSelectionModel=require('./../../../routes/appRoutes/notifications/notificationSelectionModel');

const tokenUtils = require('../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function updateUser(notificationId){
    try {
        if((!notificationId)||(notificationId==null)){
            return;
        }
        const notificationData=await prisma.notifications.findUnique({
            where:{
                id:parseInt(notificationId)
            },
            select:notificationSelectionModel.selection
        });

        if(notificationData){
            ioUtils.emitter().to("user_"+notificationData.recieverUserId).emit("notification-update", [notificationData]);
        }        
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    updateUser
}