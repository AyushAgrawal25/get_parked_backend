const slotUtils = require("../slots/slotUtils");

module.exports = {
    get selection(){
        let userSelection={
            email: true,
            id: true,
            status: true,
            signUpStatus: true,
            userDetails: true,
            userNotification: true
        };
        return userSelection;
    },
    get selectionWithSlot(){
        let userSelectionWithSlot={
            email: true,
            id: true,
            status: true,
            signUpStatus: true,
            userDetails: true,
            userNotification: true,
            slot: {
                select: {
                    address: true,
                    breadth: true,
                    city: true,
                    country: true,
                    endTime: true,
                    height: true,
                    id: true,
                    isoCountryCode: true,
                    landmark: true,
                    latitude: true,
                    length: true,
                    locationName: true,
                    longitude: true,
                    name: true,
                    pincode: true,
                    securityDepositTime: true,
                    spaceType: true,
                    startTime: true,
                    state: true,
                    status: true,
                    userId: true,
                    slotImages: true,
                }
            }
        };

        return userSelectionWithSlot;
    },
}