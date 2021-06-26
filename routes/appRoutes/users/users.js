const express = require('express');
const { PrismaClient } = require('@prisma/client');
const notifySMS=require('./../../../services/notifications/AWS-SMS/AWS-SMS');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const apiUtils = require('./../../../services/apiUtils/apiUtils');
const slotUtils = require('../slots/slotUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", apiUtils.apiValidation, async (req, res) => {
    try {
        const resp = await prisma.user.create({
            data: {
                email: req.body.email,
                userToken: req.body.userToken,
                signUpStatus: 0,
                status: 1
            },
            select: {
                userToken: false,
                email: true,
                id: true,
                signUpStatus: true,
                status: true
            }
        });
        res.statusCode = createStatus.success.code;
        res.json({
            "message": createStatus.success.message,
            resp
        });
    } catch (excp) {
        let resp = {};
        if ((excp) && (excp.meta) && (excp.meta.target == "email_unique")) {
            res.statusCode = createStatus.duplicateEmail.code;
            resp = {
                message: createStatus.duplicateEmail.message
            }
        }
        else {
            res.statusCode = createStatus.serverError.code;
            resp = {
                message: createStatus.serverError.code,
                error: excp
            }
        }
        res.json(resp);
    }
});

const createStatus = {
    success: {
        code: "200", message: "User Created Successfully..."
    },
    unauthorized: {
        code: "401", message: "Unauthorized"
    },
    duplicateEmail: {
        code: "409", message: "Duplicate Email"
    },
    serverError: {
        code: "500", message: "Internal Server Error"
    }
}

router.post("/phoneNumberVerification", tokenUtils.verify, async(req, res)=>{
    try {
        var successFunction = function (smsResp) {
            // console.log(smsResp);
            res.statusCode=phNumVerificationStatus.success.code;
            res.json({
                "statusText": "OTP Send",
                "sendStatusCode": 1,
                "otp": req.body.otp,
                "phoneNumber": req.body.phoneNumber,
                "response": smsResp,
                message:phNumVerificationStatus.success.message,
            });
            return ;
        }
        var failFunction = function (smsResp) {
            res.statusCode=phNumVerificationStatus.serverError.code;
            res.json({
                "statusText": "OTP Not Send",
                "sendStatusCode": 0,
                "response": smsResp,
                message:phNumVerificationStatus.serverError.message,
                status: 0
            });
            return ;
        }

        notifySMS.sendOTPSMS(req.body.otp, req.body.phoneNumber, successFunction, failFunction);
        return;
    } catch (error){
        res.statusCode=phNumVerificationStatus.serverError.code;
        res.json({
            message:phNumVerificationStatus.serverError.message,
            error:error
        });
    }
});

const phNumVerificationStatus={
    success:{
        code:200,
        message:"OTP sent successfuly to the user.",
    },
    serverError:{
        code:500,
        message:"Internal Server Error.."
    }
}

router.post("/userDetails", tokenUtils.verify, async(req, res)=>{
    let userData=req.tokenData;
    try {
        const udResp=await prisma.userDetails.create({
            data:{
                status:1,
                email:userData.email,
                dialCode:req.body.dialCode,
                firstName:req.body.firstName,
                gender:req.body.gender,
                lastName:req.body.lastName,
                phoneNumber:req.body.phoneNumber,
                userId:userData.id,
            }
        });

        if(!udResp){
            res.statusCode=addUserDetailsStatus.serverError.code;
            res.json({
                message:addUserDetailsStatus.serverError.message
            });
            return ;
        }
  
        // Promise for Notifications Table
        let unCreate=prisma.userNotification.create({
            data:{
                userId: userData.id,
                token:req.body.fcmToken,
                status:1,
            }
        });

        // Promise for User Data Update
        let uUpdate=prisma.user.update({
            data:{
                signUpStatus:1
            },
            where:{
                id:userData.id
            },
            select:{
                email:true,
                signUpStatus:true
            }
        });

        let allResp=await Promise.all([
            unCreate, uUpdate
        ]);

        // console.log(udResp);
        res.statusCode=addUserDetailsStatus.success.code;
        res.json({
            message:addUserDetailsStatus.success.message,
            data:[...allResp, udResp]
        });
    } catch (error) {
        // console.log(error);
        res.statusCode=addUserDetailsStatus.serverError.code;
        res.json({
            message:addUserDetailsStatus.serverError.message,
            error:error
        });
    }
});

const addUserDetailsStatus={
    success:{
        code:200,
        message:"User Created Successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server Error.."
    }
}

router.put('/userDetails', tokenUtils.verify, async(req, res)=>{
    const userData = req.tokenData;
    try {
        let updateData={};
        if((req.body.firstName)&&(req.body.firstName!=null)){
            updateData.firstName=req.body.firstName;
        }
        if((req.body.lastName)&&(req.body.lastName!=null)){
            updateData.lastName=req.body.lastName;
        }
        if((req.body.phoneNumber)&&(req.body.phoneNumber!=null)){
            updateData.phoneNumber=req.body.phoneNumber;
        }
        if((req.body.dialCode)&&(req.body.dialCode!=null)){
            updateData.dialCode=req.body.dialCode;
        }
        const userDetailsUpdate=await prisma.user.update({
            where:{
                id:parseInt(userData.id)
            },
            data:{
                userDetails:{
                    update:updateData
                }
            },
            select:{
                userDetails:true
            }
        });

        if(userDetailsUpdate){
            res.statusCode=userDetailsUpdateStatus.success.code;
            res.json({
                message:userDetailsUpdateStatus.success.message,
                data:userDetailsUpdate.userDetails
            });
            return;
        }
        
        res.statusCode=userDetailsUpdateStatus.serverError.code;
        res.json({
            message:userDetailsUpdateStatus.serverError.message,
        });
    } catch (error) {
        res.statusCode=userDetailsUpdateStatus.serverError.code;
        res.json({
            message:userDetailsUpdateStatus.serverError.message,
            error:error
        });    
    }
});

const userDetailsUpdateStatus={
    success:{
        code:200,
        message:"User Details Updated successfully"
    },
    notFound:{
        code:400,
        message:"User Details not found.."
    },
    serverError:{
        code:500,
        message:"Internal Server Error..."
    }
}

router.post('/login', async (req, res) => {
    console.log(req.body);
    try {
        if ((req.body.email == undefined) || (!req.body.userToken == undefined)) {
            res.statusCode = loginStatus.invalid.code;
            res.json({
                message: loginStatus.invalid.message
            });
            return;
        }

        const user = await prisma.user.findFirst({
            where: {
                email: req.body.email,
                userToken: req.body.userToken,
                status: 1
            },
            select: {
                userToken: false,
                email: true,
                id: true,
                signUpStatus: true,
                status: true
            }
        });

        if (user) {
            res.statusCode = loginStatus.success.code;
            let respBody = {
                message: loginStatus.success.message,
                user:user
            }
            respBody[tokenUtils.AUTHORIZATION_TOKEN] = tokenUtils.generate(user.id, user.email);
            res.json(respBody);
            return;
        }
        res.statusCode = loginStatus.invalid.code;
        res.json({
            message: loginStatus.invalid.message,
        });
    }
    catch (excp) {
        console.log(excp);
        res.statusCode = loginStatus.serverError.code;
        res.json({
            message: loginStatus.serverError.message,
            error: excp
        });
    }
});

const loginStatus = {
    success: {
        code: "200", message: "User Logged in successfully..."
    },
    invalid: {
        code: "422", message: "Invalid Email or User Token"
    },
    serverError: {
        code: "500", message: "Internal Server Error"
    }
}

router.get("/checkEmail/:email", apiUtils.apiValidation, async (req, res) => {
    try {
        if (req.params.email == undefined) {
            res.statusCode = checkEmailStatus.invalid.code;
            res.json({
                message: checkEmailStatus.invalid.message
            });
            return;
        }

        const userCount = await prisma.user.count({
            where: {
                email: req.params.email
            }
        });
        if (userCount > 0) {
            res.statusCode = checkEmailStatus.alreadyExist.code;
            res.json({
                message: checkEmailStatus.alreadyExist.message
            });
            return;
        }

        res.statusCode = checkEmailStatus.notFound.code;
        res.json({
            message: checkEmailStatus.notFound.message
        });
    } catch (excp) {
        console.log(excp);
        res.statusCode = checkEmailStatus.serverError.code;
        res.json({
            message: checkEmailStatus.serverError.message
        });
    }
});

const checkEmailStatus = {
    notFound: {
        code: "200",
        message: "No matching emails found..."
    },
    invalid: {
        code: "422",
        message: "Invalid email..."
    },
    alreadyExist: {
        code: "409",
        message: "Email Already Exists..."
    },
    serverError: {
        code: "500",
        message: "Internal Server Error..."
    }
}

router.get("/getUser", tokenUtils.verify, async (req, res) => {
    try {
        const tokenUser = req.tokenData;
        const refreshToken = tokenUtils.generate(tokenUser.id, tokenUser.email);
        const user = await prisma.user.findFirst({
            where: {
                id: tokenUser.id,
                email: tokenUser.email,
                status: 1
            },
            select: {
                userToken: false,
                email: true,
                id: true,
                signUpStatus: true,
                status: true,
                userDetails:true,
            }
        });

        if (user == null) {
            res.statusCode = getUserStatus.notFound.code;
            res.json({
                message: getUserStatus.notFound.message
            });
            return;
        }
        res.statusCode = getUserStatus.success.code;
        res.json({
            user: user,
            refreshToken: refreshToken,
            message: getUserStatus.success.message
        });
    } catch (error) {
        console.log(error);
        res.statusCode = getUserStatus.serverError.code;
        res.json({
            message: getUserStatus.serverError.message
        });
    }
});

const getUserStatus = {
    success: {
        code: 200, message: "User fetched Successfully..."
    },
    notFound: {
        code: 404, message: "User not found...",
    },
    serverError: {
        code: 500, message: "Internal Server Error..."
    }
}

router.post("/addDetails", tokenUtils.verify, async (req, res) => {
    // Check login Status
    // Insert User Details,
    // Update signUpStatus to 1
    // Insert a column with null in user profile pics.
});

module.exports = router;