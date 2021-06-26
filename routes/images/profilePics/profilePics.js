const express=require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const profilePicUtils=require('./../../../services/imagesUtils/profilePics/profilePicUtils');
const tokenUtils=require('./../../../services/tokenUtils/tokenUtils');
const imgCompUtils=require('./../../../services/imagesUtils/imageCompressionUtils/imageCompressionUtils');

const router = express.Router();
const prisma = new PrismaClient();

const profilePicsOrgPath=path.resolve('public/uploads/images/profilePics/orginals');
const profilePicsThmbPath=path.resolve('public/uploads/images/profilePics/thumbnails');
const profilePicsTempPath=path.resolve('public/uploads/images/profilePics/temp');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilePicsTempPath);
    },
    filename: function (req, file, cb) {
        var fileNameParts = file.originalname.split('.');
        var fileExt = fileNameParts[fileNameParts.length - 1];
        cb(null, Date.now() + "." + fileExt);
    }
});

const upload = multer({
    storage: storage
});

router.get('/', async (req, res) => {
    res.json({
        msg: "Enter name",
        path: path.resolve('public/uploads')
    });
});

router.post('/upload', tokenUtils.verify, upload.any(), async(req, res)=>{
    const userData = req.tokenData;
    try {
        const uDResp=await prisma.userDetails.findFirst({
            where:{
                userId:userData.id
            }
        });
        let imgOldName=req.files[0].filename;
        if(!uDResp){
            // Deleted all the image.
            fs.unlinkSync(profilePicsTempPath+"/"+imgOldName);
            res.statusCode=profilePicUploadStatus.userDetailsNotFound.code;
            res.json({
                message:profilePicUploadStatus.userDetailsNotFound.message
            });
            return;
        }

        // if file is already present delete the old one before creating new.
        if(uDResp.picUrl!=null){
            const prevImgName=uDResp.picUrl.split('/')[uDResp.picUrl.split('/').length-1];
            try {
                fs.unlinkSync(profilePicsOrgPath+'/'+prevImgName);
                fs.unlinkSync(profilePicsThmbPath+'/'+prevImgName);
            } catch (error) {
                console.log(error);
                res.statusCode=profilePicUploadStatus.serverError.code;
                res.json({
                    message:profilePicUploadStatus.serverError.message,
                    error:error
                });
                return;
            }
        }
        
        let oldImgParts=imgOldName.split('.');
        let fileExt=oldImgParts[oldImgParts.length-1];
        let imgNewName=uDResp.userId+"."+fileExt;
        
        // Changing the file name to userId.
        fs.renameSync(profilePicsTempPath+'/'+imgOldName, profilePicsTempPath+'/'+imgNewName);
        req.files[0]=imgNewName;

        // Compression and thumbnail creations.
        let imgPath=profilePicsTempPath+'/'+imgNewName;
        const imgThmbRes= await imgCompUtils.compress(imgPath, profilePicsThmbPath+'/', 100, 90);
        if(imgThmbRes.status==0){
            console.log(imgThmbRes.error);
            try {
                const imgCpyFile=await imgCompUtils.copyImgFile(imgPath, profilePicsThmbPath+"/"+imgNewName);
            } catch (excp) {
                console.log(excp);
                // Delete all the files 
                fs.unlinkSync(profilePicsTempPath+"/"+imgNewName);                  
                res.statusCode=profilePicUploadStatus.serverError.code;
                res.json({
                    message:profilePicUploadStatus.serverError.message,
                    error:excp
                });
                return;
            }
        }

        // Main Image File Compression
        const imgCompRes=await imgCompUtils.compress(imgPath, profilePicsOrgPath+'/', 2048, 2000);
        fs.unlinkSync(profilePicsTempPath+'/'+imgNewName);

        const uDUpdate=await prisma.userDetails.update({
            where:{
                id:uDResp.id
            },
            data:{
                picThumbnailUrl:profilePicUtils.thumbnailPath+"/"+imgNewName,
                picUrl:profilePicUtils.orgPath+"/"+imgNewName
            }
        });
        if(uDUpdate){
            res.statusCode=profilePicUploadStatus.success.code;
            res.json({
                message:profilePicUploadStatus.success.message,
                data:uDUpdate
            });
            return;
        }

        // If fails delete all files from profile pics and thumbnails.
        try {
            fs.unlinkSync(profilePicsThmbPath+"/"+imgNewName);
            fs.unlinkSync(profilePicsOrgPath+"/"+imgNewName);
        } catch (error) {
            console.log(error);
        }
        
        res.statusCode=profilePicUploadStatus.serverError.code;
        res.json({
            message:profilePicUploadStatus.serverError.message
        });
    } catch (excp) {
        res.statusCode=profilePicUploadStatus.serverError.code;
        res.json({
            message:profilePicUploadStatus.serverError.message,
            error:excp
        });
    }
});

const profilePicUploadStatus={
    success:{
        code:200,
        message:"Profile Pic Successfully Uploaded..."
    },
    userDetailsNotFound:{
        code:400,
        message:"User Details not found..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.get('/orgPic/:fileName', async (req, res) => {
    res.sendFile(profilePicsOrgPath+'/'+req.params.fileName);
});

router.get('/thmb/:fileName', async (req, res) => {
    res.sendFile(profilePicsOrgPath+'/'+req.params.fileName);
});

module.exports=router;