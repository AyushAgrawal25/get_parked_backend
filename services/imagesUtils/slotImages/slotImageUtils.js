const fs = require('fs');
const path = require('path');

const slotImagesPath="public/uploads/images/slotImages";
async function initSlotImages(){
    try {
        const slotImagesCreate=fs.mkdirSync(path.resolve(slotImagesPath));
    } catch (error) {
        // console.log(error);
    }

    initSlotImagesOrg();
    initSlotImagesThmb();
    initSlotImagesTemp();
}

const slotImageOrgPath="public/uploads/images/slotImages/orginals";
async function initSlotImagesOrg(){
    try {
        const slotImageOrgCreate=fs.mkdirSync(path.resolve(slotImageOrgPath));
    } catch (error) {
        // console.log(error);
    }
}

const slotImageThmbPath="public/uploads/images/slotImages/thumbnails";
async function initSlotImagesThmb(){
    try {
        const slotImageThmbCreate=fs.mkdirSync(path.resolve(slotImageThmbPath));
    } catch (error) {
        // console.log(error);
    }
}

const slotImageTempPath="public/uploads/images/slotImages/temp";
async function initSlotImagesTemp(){
    try {
        const slotImageTempCreate=fs.mkdirSync(path.resolve(slotImageTempPath));
    } catch (error) {
        // console.log(error);
    }
}

module.exports={
    orgRoute:"/images/slotImages/orgPic",
    thumbnailRoute:"/images/slotImages/thmb",
    initSlotImages
}