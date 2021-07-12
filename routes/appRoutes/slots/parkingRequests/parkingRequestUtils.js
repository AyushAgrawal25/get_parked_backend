const userUtils = require("../../users/userUtils")
const vehicleUtils = require("../../vehicles/vehicleUtils")
const slotUtils = require("../slotUtils")

let userParkingRequestInclude={
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

let slotParkingRequestInclude={
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
        let uInc=Object.assign({}, userParkingRequestInclude);
        uInc.slot.select.user.select.userNotification=false;
        return uInc;
    },

    get slotInclude(){
        let sInc=Object.assign({}, slotParkingRequestInclude);
        sInc.user.select.userNotification=false;
        return sInc;
    }
}