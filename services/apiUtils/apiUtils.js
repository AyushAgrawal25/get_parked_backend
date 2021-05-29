const cryptoUtils = require('./../operations/cryptoUtils');
const usc=require('./../UniversalStatusCodes');

// TODO: keep it in env file.
const universalAPIToken = "fd252f2f0fc5b4243957e934886d8b481b0ee2262cee2320bc979d3968263699a7096e73135caa02a48eec02b0adc225ae03de182e34059a46215f712672687dbecc57bfed4c1c3093ec0e05a9ae83401338e2eec3cf9876c59c231c1964b6ec9221ea46bc553a17f1a90feb125d4d01707cbf1da2fcf02389a01d0ad08a803f0fd93e8157e7d661d87d5f3ad4ff99d9";
const apiValidation = function (req, res, next) {
    const apiToken = req.headers.apitoken;
    // TODO: create a proper API token for registration type of things.
    // var decryptedToken = cryptoUtils.decryption(universalAPIToken);
    const decryptedToken = universalAPIToken;
    if (apiToken != decryptedToken) {
        res.statusCode = usc.unauthorized.code;
        res.json({
            "message": usc.unauthorized.message
        });
    }
    next();
}

module.exports = {
    apiValidation: apiValidation
};