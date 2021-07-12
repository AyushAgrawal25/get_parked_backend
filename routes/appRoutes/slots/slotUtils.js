const userUtils = require("../users/userUtils");

module.exports={
    get selection(){
        let slotSelection={
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
        };

        return slotSelection;
    },
    get selectionWithoutUser(){
        let slotSelectionWithoutUser={
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
            user:false
        }

        return slotSelectionWithoutUser;
    }
}