const slotUtils = require("../slots/slotUtils");

module.exports = {
    selection: {
        email: true,
        id: true,
        status: true,
        signUpStatus: true,
        userDetails: true,
        userNotification: true
    },
    selectionWithSlot: {
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
    },
}