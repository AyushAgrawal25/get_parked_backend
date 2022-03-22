const fs = require('fs');
const path = require('path');
const profilePicUtils = require('./profilePics/profilePicUtils');
const slotImageUtils = require('./slotImages/slotImageUtils');

const imagesPath="public/uploads/images";
async function initImages(){
    try {
        const imagesCreate=fs.mkdirSync(path.resolve(imagesPath));
    } catch (error) {
        // console.log(error);
    }

    slotImageUtils.initSlotImages();
    profilePicUtils.initProfilePics();
}

module.exports={
    initImages
};