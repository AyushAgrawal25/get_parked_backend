require('dotenv').config();
const cryptoUtils = require('./../operations/cryptoUtils');
const usc=require('./../UniversalStatusCodes');

// TODO: keep it in env file.
const apiValidation = function (req, res, next) {
    try {
        const apiToken = req.headers.apitoken;
        // TODO: create a proper API token for registration type of things.
        // var decryptedToken = cryptoUtils.decryption(apiToken);
        const decryptedToken = process.env.ENCRYPTION_KEY;
        if (apiToken != decryptedToken) {
            res.statusCode = usc.unauthorized.code;
            res.json({
                "message": usc.unauthorized.message
            });
            return;
        }
        next();
    } catch (error) {
        console.log(error);
        res.statusCode = usc.unauthorized.code;
        res.json({
            "message": usc.unauthorized.message
        });
        return;
    }
}

module.exports = {
    apiValidation: apiValidation
};