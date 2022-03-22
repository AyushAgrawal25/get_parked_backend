const { PrismaClient } = require('@prisma/client');
const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const userUtils = require('../../../routes/appRoutes/users/userUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');
const ioUtils = require('../ioUtils');

const tokenUtils = require('../../tokenUtils/tokenUtils');
const parkingRequestUtils = require('../../../routes/appRoutes/slots/parkingRequests/parkingRequestUtils');

const prisma = new PrismaClient();

async function updateUser(userId, parkingRequestId){
    try {
        const parkingReqData=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(parkingRequestId)
            },
            include:parkingRequestUtils.userInclude
        });

        // console.log("user_"+userId);
        ioUtils.emitter().to("user_"+userId).emit('user-parking-update', [parkingReqData]);
    } catch (error) {
        console.log(error);
    }
}

async function updateParkingLord(userId, parkingRequestId){
    try {
        const parkingReqData=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(parkingRequestId)
            },
            include:parkingRequestUtils.slotInclude
        });
        console.log("user_"+userId);
        ioUtils.emitter().to("user_"+userId).emit('slot-parking-update', [parkingReqData]);
        // console.log([parkingReqData]);
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    updateUser,
    updateParkingLord   
}