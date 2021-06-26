const { PrismaClient } = require('@prisma/client');
const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const userUtils = require('../../../routes/appRoutes/users/userUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');
const ioUtils = require('../ioUtils');

const tokenUtils = require('../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function updateUser(userId, parkingRequestId){
    try {
        const parkingReqData=await prisma.slotParkingRequest.findUnique({
            where:{
                id:parseInt(parkingRequestId)
            },
            include:{
                booking:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true
                            }
                        },
                        parking:{
                            include:{
                                slotRatingReview:true
                            }
                        }
                    }
                },
                slot:{
                    select:slotUtils.selection
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
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
            include:{
                booking:{
                    include:{
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true
                            }
                        },
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true
                            }
                        },
                        parking:{
                            include:{
                                slotRatingReview:true
                            }
                        }
                    }
                },
                user:{
                    select:userUtils.selection
                },
                vehicle:{
                    select:vehicleUtils.selectionWithTypeData
                }
            }
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