const crypto=require('crypto');
const slotUtils = require("../slots/slotUtils");

const algorithm = 'aes-256-cbc';
const cryptionIV = Buffer.alloc(16, 0);
const cryptionKey= Buffer.from((process.env.ENCRYPTION_KEY).substring(0, 32), "utf-8");

function  encryptUserToken(userToken){
    try {
        let cipher = crypto.createCipheriv(algorithm, cryptionKey, cryptionIV);
        let encrypted = cipher.update(userToken);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    } catch (error) {
        console.log(error);
        return "";
    }
}

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

    encryptUserToken
}