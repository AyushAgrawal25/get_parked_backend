require('dotenv').config();
const express = require('express');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');

const fcmUtils=require('./../../../../services/notifications/FCM-Notifications/fcmUtils');
const slotUtils = require('../slotUtils');
const userUtils = require('../../users/userUtils');
const tokenUtils = require('../../../../services/tokenUtils/tokenUtils');
const vehicleUtils = require('../../vehicles/vehicleUtils');
const parkingSocketUtils=require('../../../../services/sockets/parkings/parkingSocketUtils');
const notificationUtils=require('./../../notifications/notificationUtils');
const domain = require('../../../../services/domain');
const ratingReviewUtils=require('./ratingReviewUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/:slotId", tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        const vehicles=await prisma.slotVehicle.findMany({
            where:{
                slotId:parseInt(req.params.slotId)
            },
            distinct:['type'],
            select:vehicleUtils.selectionWithTypeData
        });

        let reviewsProms=[];
        for(let i=0; i<vehicles.length; i++){
            const prom=new Promise(async(resolve)=>{
                const vehicleRatingReiview={
                    type:vehicles[i].type,
                }

                vehicleRatingReiview["rating"]=await ratingReviewUtils.vehicleRating(vehicles[i].id);
                vehicleRatingReiview["reviews"]=await ratingReviewUtils.vehicleReviews({
                    vehicleType:vehicles[i].type,
                    slotId:req.params.slotId
                })

                resolve(vehicleRatingReiview);
            });
            reviewsProms.push(prom);
        }

        const vehilcesRatingReviews=await Promise.all(reviewsProms);

        res.statusCode=ratingReviewsGetStatus.success.code;
        res.json({
            messsage:ratingReviewsGetStatus.success.messsage,
            data:vehilcesRatingReviews
        });
    } catch (error) {
        console.log(error);
        res.statusCode=ratingReviewsGetStatus.serverError.code;
        res.json({
            messsage:ratingReviewsGetStatus.serverError.messsage,
            error:error
        });
    }
});

const ratingReviewsGetStatus={
    success:{
        code:200,
        messsage:"Rating And Reviews Fetched Successfully..."
    },
    serverError:{
        code:500,
        messsage:"Internal Server Error..."
    }
}

router.post('/', tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try{
        const parkingData=await prisma.slotParking.findUnique({
            where:{
                id:parseInt(req.body.parkingId)
            },
            include:{
                slotRatingReview:true
            }
        });

        if(!parkingData){
            res.statusCode=ratingReviewPostStatus.unprocessableEntity.code;
            res.json({
                messsage:ratingReviewPostStatus.unprocessableEntity.messsage
            });
            return;
        }

        if(parkingData.status==1){
            res.statusCode=ratingReviewPostStatus.unprocessableEntity.code;
            res.json({
                messsage:ratingReviewPostStatus.unprocessableEntity.messsage
            });
            return;
        }

        if(parkingData.slotRatingReview){
            res.statusCode=ratingReviewPostStatus.unprocessableEntity.code;
            res.json({
                messsage:ratingReviewPostStatus.unprocessableEntity.messsage
            });
            return;
        }
        const ratingReviewCreate=await prisma.slotRatingReview.create({
            data:{
                slotId: parkingData.slotId,
                parkingId:parkingData.id,
                userId:parkingData.userId,
                vehicleId:parkingData.vehicleId,
                ratingValue:parseInt(req.body.ratingValue),
                review:req.body.review,
                status:1
            }
        });

        if(!ratingReviewCreate){
            res.statusCode=ratingReviewPostStatus.serverError.code;
            res.json({
                messsage:ratingReviewPostStatus.serverError.messsage
            });
            return;
        }

        res.statusCode=ratingReviewPostStatus.success.code;
        res.json({
            messsage:ratingReviewPostStatus.success.messsage,
            data:ratingReviewCreate
        });
    }
    catch(error){
        console.log(error);
        res.statusCode=ratingReviewPostStatus.serverError.code;
        res.json({
            messsage:ratingReviewPostStatus.serverError.messsage,
            error:error
        });
        return;
    }
});

const ratingReviewPostStatus={
    success:{
        code:200,
        messsage:"Rating and Review successful..."
    },
    unprocessableEntity:{
        code:422,
        messsage:"This cannot be prcocessed..."
    },
    serverError:{
        code:500,
        messsage:"Internal Server Error...."
    }
}

module.exports=router;