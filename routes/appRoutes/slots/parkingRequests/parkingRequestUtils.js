const userUtils = require("../../users/userUtils")
const vehicleUtils = require("../../vehicles/vehicleUtils")
const slotUtils = require("../slotUtils")

const userParkingRequestInclude={
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

const slotParkingRequestInclude={
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

module.exports={
    get userInclude(){
        const uInc=userParkingRequestInclude;
        uInc.slot.select.user.select.userNotification=false;
        return uInc;
    },

    get slotInclude(){
        const sInc=slotParkingRequestInclude;
        sInc.user.select.userNotification=false;
        return sInc;
    }
}