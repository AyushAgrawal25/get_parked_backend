const express=require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient, SlotImageType } = require('@prisma/client');

const slotImageUtils=require('./../../../services/imagesUtils/slotImages/slotImageUtils');
const tokenUtils=require('./../../../services/tokenUtils/tokenUtils');
const imgCompUtils=require('./../../../services/imagesUtils/imageCompressionUtils/imageCompressionUtils');

const router = express.Router();
const prisma = new PrismaClient();

const slotImagesOrgPath=path.resolve('public/uploads/images/slotImages/org');
const slotImagesThmbPath=path.resolve('public/uploads/images/slotImages/thumbnails');
const slotImagesTempPath=path.resolve('public/uploads/images/slotImages/temp');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, slotImagesTempPath);
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

router.post('/', tokenUtils.verify, upload.any(), async(req, res)=>{
    let userData=req.tokenData;
    try {
        const slotResp=await prisma.slot.findFirst({
            where:{
                userId:userData.id
            },
        });
        
        const imgOldName=req.files[0].filename;
        if(!slotResp){
            // Deleting the file
            try {
                fs.unlinkSync(slotImagesTempPath+'/'+imgOldName);
            } catch (error) {
                console.log(error);
            }
            res.statusCode=slotImagePostStatus.notFound.code;
            res.json({
                message:slotImagePostStatus.notFound.message
            });
            return;
        }

        if(req.body.type==SlotImageType.Main){
            const slotImageRes=await prisma.slotImages.findFirst({
                where:{
                    slotId:slotResp.id,
                    type:SlotImageType.Main
                }
            });
            if(slotImageRes){
                // Deleting the file
                try {
                    fs.unlinkSync(slotImagesTempPath+'/'+imgOldName);
                } catch (error) {
                    console.log(error);
                }
                res.statusCode=slotImagePostStatus.alreadyExists.code;
                res.json({
                    message:slotImagePostStatus.alreadyExists.message
                });
                return;
            }
        }

        let imageOrgPathUrl=null;
        let imageThmbPathUrl=null;
        
        let oldImgParts=imgOldName.split('.');
        let fileExt=oldImgParts[oldImgParts.length-1];
        let imgNewName;
        if(req.body.type==SlotImageType.Main){
            // MainImage is named on slotId.
            imgNewName=slotResp.id+"."+fileExt;

            fs.renameSync(slotImagesTempPath+"/"+imgOldName, slotImagesTempPath+"/"+imgNewName);
            req.files[0]=imgNewName;

            // Compression and thumbnail creations.
            let imgPath=slotImagesTempPath+"/"+imgNewName;
            const imgThmbResp=await imgCompUtils.compress(imgPath, slotImagesThmbPath+"/", 100, 100);
            if(imgThmbResp.status==0){
                console.log(imgThmbResp.error);
                try {
                    const imgCpyFile=await imgCompUtils.copyImgFile(imgPath, slotImagesThmbPath+"/"+imgNewName);
                } catch (error) {
                    console.log(error);
                    fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
                    res.statusCode=slotImagePostStatus.serverError.code;
                    res.json({
                        message:slotImagePostStatus.serverError.message,
                        error:excp
                    });
                    return;
                }
            }
            imageThmbPathUrl=slotImageUtils.thumbnailPath+"/"+imgNewName;
        }   
        else{
            // MainImage is named on slotId.+ current time.
            imgNewName=slotResp.id+"_"+Date.now()+"."+fileExt;
            
            fs.renameSync(slotImagesTempPath+"/"+imgOldName, slotImagesTempPath+"/"+imgNewName);
            req.files[0].filename=imgNewName;
        }     
        

        // Compression of Image
        let orgImgPath=slotImagesTempPath+"/"+imgNewName;
        const imgCompRes=await imgCompUtils.compress(orgImgPath, slotImagesOrgPath+"/", 2048, 2000);
        if(imgCompRes.status==0){
            console.log(imgCompRes.error);
            try {
                const imgCpyFile=await imgCompUtils.copyImgFile(imgPath, slotImagesOrgPath+"/"+imgNewName);
            } catch (error) {
                console.log(error);
                fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
                res.statusCode=slotImagePostStatus.serverError.code;
                res.json({
                    message:slotImagePostStatus.serverError.message,
                    error:excp
                });
                return;
            }
        }
        fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
        imageOrgPathUrl=slotImageUtils.orgPath+"/"+imgNewName;

        const slotImageCreate=await prisma.slotImages.create({
            data:{
                url:imageOrgPathUrl,
                thumbnailUrl:imageThmbPathUrl,
                status:1,
                type:req.body.type,
                slotId:slotResp.id
            }
        });

        if(slotImageCreate){
            res.statusCode=slotImagePostStatus.success.code;
            res.json({
                message:slotImagePostStatus.success.message,
                data:slotImageCreate
            });
            return;
        }

        // Delete all file
        try {
            fs.unlinkSync(slotImagesOrgPath+'/'+imgNewName);
            if(req.body.type==SlotImageType.Main){
                fs.unlinkSync(slotImagesThmbPath+'/'+imgNewName);
            }
        } catch (error) {
            console.log(error);
        }
        res.statusCode=slotImagePostStatus.serverError.code;
        res.json({
            message:slotImagePostStatus.serverError.message,
            error:excp
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotImagePostStatus.serverError.code;
        res.json({
            error:error,
            message:slotImagePostStatus.serverError.message
        });
    }
});

const slotImagePostStatus={
    success:{
        code:200,
        message:"Slot Images uploaded successfully..."
    },
    notFound:{
        code:400,
        message:"Parking Lord not found..."
    },
    alreadyExists:{
        code:409,
        message:"Slot Main Image Already Present..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.put('/', tokenUtils.verify, upload.any(), async(req, res)=>{
    let userData=req.tokenData;
    try {
        const slotImageResp=await prisma.slotImages.findUnique({
            where:{
                id:parseInt(req.body.slotImageId),
            }
        });

        if(!slotImageResp){
            res.statusCode=SlotImageUpdateStatus.notFound.code;
            res.json({
                message:SlotImageUpdateStatus.notFound.message
            });
            return;
        }
        
        // Deleting old Img Files.
        try {
            let prevImgParts=slotImageResp.url.split('/');
            let prevImgName=prevImgParts[prevImgParts.length-1];

            fs.unlinkSync(slotImagesOrgPath+"/"+prevImgName);
            if(slotImageResp.type==SlotImageType.Main){
                fs.unlinkSync(slotImagesThmbPath+"/"+prevImgName);
            }
        } catch (error) {
            console.log(error);
        }
        let imgOldName=req.files[0].filename;

        let imageOrgPathUrl=null;
        let imageThmbPathUrl=null;
        
        let oldImgParts=imgOldName.split('.');
        let fileExt=oldImgParts[oldImgParts.length-1];
        let imgNewName;
        if(slotImageResp.type==SlotImageType.Main){
            // MainImage is named on slotId.
            imgNewName=slotImageResp.slotId+"."+fileExt;

            fs.renameSync(slotImagesTempPath+"/"+imgOldName, slotImagesTempPath+"/"+imgNewName);
            req.files[0]=imgNewName;

            // Compression and thumbnail creations.
            let imgPath=slotImagesTempPath+"/"+imgNewName;
            const imgThmbResp=await imgCompUtils.compress(imgPath, slotImagesThmbPath+"/", 100, 100);
            if(imgThmbResp.status==0){
                console.log(imgThmbResp.error);
                try {
                    const imgCpyFile=await imgCompUtils.copyImgFile(imgPath, slotImagesThmbPath+"/"+imgNewName);
                } catch (error) {
                    console.log(error);
                    fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
                    res.statusCode=slotImagePostStatus.serverError.code;
                    res.json({
                        message:slotImagePostStatus.serverError.message,
                        error:excp
                    });
                    return;
                }
            }
            imageThmbPathUrl=slotImageUtils.thumbnailPath+"/"+imgNewName;
        }   
        else{
            // MainImage is named on slotId.+ current time.
            imgNewName=slotImageResp.id+"_"+Date.now()+"."+fileExt;
            
            fs.renameSync(slotImagesTempPath+"/"+imgOldName, slotImagesTempPath+"/"+imgNewName);
            req.files[0].filename=imgNewName;
        }     
        

        // Compression of Image
        let orgImgPath=slotImagesTempPath+"/"+imgNewName;
        const imgCompRes=await imgCompUtils.compress(orgImgPath, slotImagesOrgPath+"/", 2048, 2000);
        if(imgCompRes.status==0){
            console.log(imgCompRes.error);
            try {
                const imgCpyFile=await imgCompUtils.copyImgFile(imgPath, slotImagesOrgPath+"/"+imgNewName);
            } catch (error) {
                console.log(error);
                fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
                res.statusCode=slotImagePostStatus.serverError.code;
                res.json({
                    message:slotImagePostStatus.serverError.message,
                    error:excp
                });
                return;
            }
        }
        fs.unlinkSync(slotImagesTempPath+"/"+imgNewName);
        imageOrgPathUrl=slotImageUtils.orgPath+"/"+imgNewName;        

        const slotImageUpdate=await prisma.slotImages.update({
            where:{
                id:slotImageResp.id
            },
            data:{
                url:imageOrgPathUrl,
                thumbnailUrl:imageThmbPathUrl
            }
        });

        if(slotImageUpdate){
            res.statusCode=slotImagePostStatus.success.code;
            res.json({
                message:slotImagePostStatus.success.message,
                data:slotImageUpdate
            });
            return;
        }

        // Delete all file
        try {
            fs.unlinkSync(slotImagesOrgPath+'/'+imgNewName);
            if(req.body.type==SlotImageType.Main){
                fs.unlinkSync(slotImagesThmbPath+'/'+imgNewName);
            }
        } catch (error) {
            console.log(error);
        }
        res.statusCode=slotImagePostStatus.serverError.code;
        res.json({
            message:slotImagePostStatus.serverError.message,
            error:excp
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotImagePostStatus.serverError.code;
        res.json({
            error:error,
            message:slotImagePostStatus.serverError.message
        });
    }
});

const SlotImageUpdateStatus={
    success:{
        code:200,
        message:"Slot Image Updated successfully.."
    },
    notFound:{
        code:400,
        message:"Slot Image not found..."
    },
    serverError:{
        code:500,
        message:"internal Server Error..."
    }
};

router.delete('/', tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const slotImageResp=await prisma.slotImages.findUnique({
            where:{
                id:parseInt(req.body.slotImageId)
            }
        });
        // If no image present.
        if(!slotImageResp){
            res.statusCode=slotImageDeleteStatus.notFound.code;
            res.json({
                message:slotImageDeleteStatus.notFound.message,
            });
            return;
        }

        // If its the main image.
        if(slotImageResp.type==SlotImageType.Main){
            res.statusCode=slotImageDeleteStatus.nonDeletable.code;
            res.json({
                message:slotImageDeleteStatus.nonDeletable.message
            });
            return;
        }

        try {
            let prevImgParts=slotImageResp.url.split('/');
            let prevImgName=prevImgParts[prevImgParts.length-1];

            fs.unlinkSync(slotImagesOrgPath+"/"+prevImgName);
            if(slotImageResp.type==SlotImageType.Main){
                fs.unlinkSync(slotImagesThmbPath+"/"+prevImgName);
            }
        } catch (error) {
            console.log(error);
        }

        const slotImageDelete=await prisma.slotImages.delete({
            where:{
                id:slotImageResp.id
            }
        });
        res.statusCode=slotImageDeleteStatus.success.code;
        res.json({
            data:slotImageDelete,
            message:slotImageDeleteStatus.success.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode=slotImageDeleteStatus.serverError.code;
        res.json({
            message:slotImageDeleteStatus.serverError.message,
            error:error
        });
    }
});

const slotImageDeleteStatus={
    success:{
        code:200,
        message:"Slot Image deleted successfully..."
    },
    nonDeletable:{
        code:422,
        message:"Slot Main Image cannot be deleted..."
    },
    notFound:{
        code:400,
        message:"Slot Image not found..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.get('/orgPic/:fileName', async (req, res) => {
    res.sendFile(slotImagesOrgPath+'/'+req.params.fileName);
});

router.get('/thmb/:fileName', async (req, res) => {
    res.sendFile(slotImagesThmbPath+'/'+req.params.fileName);
});

module.exports=router;