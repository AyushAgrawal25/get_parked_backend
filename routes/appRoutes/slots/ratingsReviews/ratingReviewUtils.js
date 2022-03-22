require('dotenv').config();

const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType, NotificationType } = require('@prisma/client');
const userUtils = require('../../users/userUtils');
const prisma = new PrismaClient();

async function vehicleRating(vehicleId){
    try {
        const ratingData=await prisma.slotRatingReview.aggregate({
            where:{
                vehicleId:parseInt(vehicleId)
            },
            _avg:{
                ratingValue:true,
            }
        });
    
        
        return ratingData._avg.ratingValue;
    } catch (error) {
        return null;
    }
}

async function vehicleReviews({vehicleType, slotId}){
    try {
        let userSelectionModel=userUtils.selection;
        userSelectionModel.userNotification=false;
        const reviews=await prisma.slotRatingReview.findMany({
            where:{
                AND:[
                    {
                        vehicle:{
                            type:vehicleType,
                        },
                    },
                    {
                        slotId:parseInt(slotId),
                    },
                    {
                        review:{
                            not:null
                        }
                    }
                ]
            },
            take:100,
            select:{
                id:true,
                parkingId:true,
                ratingValue:true,
                review:true,
                status:true,
                slotId:true,
                time:true,
                userId:true,
                user:{
                    select:userSelectionModel
                },
                vehicleId:true,
            }
        });

        return reviews;
    } catch (error) {
        console.log(error);
        return [];
    }
}

module.exports={
    vehicleRating,
    vehicleReviews
}