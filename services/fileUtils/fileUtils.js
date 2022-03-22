const fs = require('fs');
const path = require('path');
const imagesUtils=require('./../imagesUtils/imagesUtils');

const uploadsPath="public/uploads";
async function initUploads(){
    try {
        const uploadCreate=fs.mkdirSync(path.resolve(uploadsPath));
    } catch (error) {
        // console.log(error);
    }

    imagesUtils.initImages();
}


module.exports={
    initUploads
}