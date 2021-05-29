require('dotenv').config();
const jwt=require('jsonwebtoken');
const usc=require('./../UniversalStatusCodes');

function generateToken(id, email){
    const generated_at=Date.now();
    const user={
        id, email, generated_at
    };

    const accessToken=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
}

const verifyToken=function(req, res, next){
    try{
        const token=req.headers[AUTHORIZATION_TOKEN];
        const data=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // TODO: create time difference of 15 days.
        req.tokenData=data;
        const timeDiff=Date.now()-(new Date(data.generated_at));
        if(timeDiff>MAX_TIME_DIFFERENCE){
            res.statusCode=usc.invalidToken.code;
            res.json({
                message:usc.invalidToken.message
            });
            return;
        }
        next();
    }
    catch(excp){
        console.log(excp);
        res.statusCode=usc.invalidToken.code;
        res.json({
            message:usc.invalidToken.message
        });
        return;
    }
}

module.exports={
    generate:generateToken,
    verify:verifyToken
}

const MAX_TIME_DIFFERENCE=1296000000;
const AUTHORIZATION_TOKEN="authorization";