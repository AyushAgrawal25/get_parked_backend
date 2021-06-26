require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const adminDetails={
    "id":1,
    "email":"admin@getparked.com",
    "signUpStatus":0,
    "status":1
}

async function initAdmin(){
    try {
        const userData=await prisma.user.findUnique({
            where:{
                id:1
            }
        });

        if(!userData){
            const adminData=adminDetails;
            adminData["userToken"]=process.env.ADMIN_USER_TOKEN;
            const adminCreate=await prisma.user.create({
                data:adminData
            });
        }
    } catch (excp) {
        console.log(excp);
    }
}

module.exports={
    init:initAdmin,
    details:adminDetails
}