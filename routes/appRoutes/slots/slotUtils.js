const userUtils = require("../users/userUtils");

module.exports={
    selection:{
        address:true,
        breadth:true,
        city:true, 
        country:true,
        endTime:true,
        height:true,
        id:true,
        isoCountryCode:true,
        landmark:true,
        latitude:true,
        length:true,
        locationName:true,
        longitude:true,
        name:true,
        pincode:true,
        securityDepositTime:true,
        spaceType:true,
        startTime:true,
        state:true,
        status:true,
        userId:true,
        slotImages:true,
        user:{
            select:userUtils.selection
        }
    }
}