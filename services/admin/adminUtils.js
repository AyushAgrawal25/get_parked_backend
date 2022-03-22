require('dotenv').config();
const { PrismaClient, UserGender } = require('@prisma/client');
const userUtils = require('../../routes/appRoutes/users/userUtils');

const prisma = new PrismaClient();
const adminDetails={
    "id":1,
    "email":"admin@getparked.com",
    "signUpStatus":0,
    "status":1,
    "userDetails":{
    }
}

const amdinUserDetails={
    "id":1,
    "email":"admin@getparked.com",
    "dialCode":"+91",
    "phoneNumber":"8085873059",
    "firstName":"App",
    "lastName":"Admin",
    "gender":UserGender.Male,
    "status":1
};

async function initAdmin(){
    try {
        const userData=await prisma.user.findUnique({
            where:{
                id:1
            }
        });

        if(!userData){
            const adminData=Object.assign({}, adminDetails);
            adminData["userToken"]=userUtils.encryptUserToken(process.env.ADMIN_USER_TOKEN);
            adminData["userDetails"]={
                "create":amdinUserDetails
            }

            const adminCreate=await prisma.user.create({
                data:adminData
            });
            console.log(adminCreate);
        }
        else{
            const adminData=Object.assign({}, adminDetails);
            adminData.userToken=userUtils.encryptUserToken(process.env.ADMIN_USER_TOKEN);
            const adminUpdate=await prisma.user.update({
                where:{
                    id:adminData.id
                },
                data:{
                    email:adminData.email,
                    userToken:adminData.userToken,
                    signUpStatus:adminData.signUpStatus,
                    status:adminData.status,
                    userDetails:{
                        update:amdinUserDetails
                    }
                }
            });

            console.log(adminUpdate);
        }
    } catch (excp) {
        console.log(excp);
    }
}

module.exports={
    init:initAdmin,
    details:adminDetails
}