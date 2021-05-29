const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const apiUtils = require('./../../../services/apiUtils/apiUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.post("/create", apiUtils.apiValidation, async (req, res) => {
    try {
        const resp = await prisma.user.create({
            data: {
                email: req.body.email,
                userToken: req.body.userToken,
                signUpStatus: 1,
                status: 1
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

router.post('/login', async (req, res) => {
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
        });
        if (user) {
            res.statusCode = loginStatus.success.code;
            res.json({
                message: loginStatus.success.message,
                accessToken: tokenUtils.generate(user.id, user.email)
            });
            return;
        }
        res.statusCode = loginStatus.invalid.code;
        res.json({
            message: loginStatus.invalid.message,
        });
    }
    catch (excp) {
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

router.get("/getUser", tokenUtils.verify, async(req, res)=>{
    // TODO: complete when user details and profile pictures table created.
    const tokenUser=req.tokenData;
    const user=await prisma.user.findFirst({
        where:{
            id:tokenUser.id,
            email:tokenUser.email,
            status:1
        },        
    });

    res.json(user);
});

router.post("/addDetails", tokenUtils.verify, async (req, res) => {
    // Check login Status
    // Insert User Details,
    // Update signUpStatus to 1
    // Insert a column with null in user profile pics.
});

module.exports = router;