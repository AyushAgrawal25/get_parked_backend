const fs = require('fs');
const path = require('path');

const profilePicsPath="public/uploads/images/profilePics";
async function initProfilePics(){
    try {
        const profilePicsCreate=fs.mkdirSync(path.resolve(profilePicsPath));
    } catch (error) {
        // console.log(error);
    }

    initProfilePicsOrg();
    initProfilePicsThmb();
    initProfilePicsTemp();
}

const profilePicsOrgPath="public/uploads/images/profilePics/orginals";
async function initProfilePicsOrg(){
    try {
        const profilePicsOrgCreate=fs.mkdirSync(path.resolve(profilePicsOrgPath));
    } catch (error) {
        // console.log(error);
    }
}

const profilePicsThmbPath="public/uploads/images/profilePics/thumbnails";
async function initProfilePicsThmb(){
    try {
        const profilePicsThmbCreate=fs.mkdirSync(path.resolve(profilePicsThmbPath));
        console.log(profilePicsThmbCreate)
    } catch (error) {
        // console.log(error);
    }
}

const profilePicsTempPath="public/uploads/images/profilePics/temp";
async function initProfilePicsTemp(){
    try {
        const profilePicsTempCreate=fs.mkdirSync(path.resolve(profilePicsTempPath));
    } catch (error) {
        // console.log(error);
    }
}

module.exports = {
    orgRoute: "/images/profilePics/orgPic",
    thumbnailRoute: "/images/profilePics/thmb",
    initProfilePics
}