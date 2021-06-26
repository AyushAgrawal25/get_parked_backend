const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const awsConfig = require('./aws-sms-config');
const appDetails = require('./../../appDetails');

dotenv.config();

AWS.config.update({
    accessKeyId: awsConfig.awsAccessKeyId,
    secretAccessKey: awsConfig.awsSecretAccessKey,
    region: awsConfig.awsRegion
});

const sendOTPSMS = function (otp, phoneNumber, successFun, failFun) {

    var msgParams = {
        Message: otp + " is your " + appDetails.appName + " phone number verification One Time Password (OTP)",
        PhoneNumber: phoneNumber,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'GPTest'
            },
        }
    }

    var msgAttr = {
        attributes: {
            'DefaultSMSType': 'Transactional',
        }
    }

    var setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(msgAttr).promise().then(function () {
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(msgParams).promise().then(function (data) {
            successFun(data);
        }).catch(function (err) {
            failFun(err);
        });
    }).catch(function (err) {
        failFun(err);
    });
};

const sendForgotPinOTPSMS = function (otp, phoneNumber, successFun, failFun) {
    var msgParams = {
        Message: otp + " is your " + appDetails.appName + " Forgot Pin One Time Password (OTP)",
        PhoneNumber: phoneNumber,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'GPTest'
            },
        }
    }

    var msgAttr = {
        attributes: {
            'DefaultSMSType': 'Transactional',
        }
    }

    var setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(msgAttr).promise().then(function () {
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(msgParams).promise().then(function (data) {
            successFun(data);
        }).catch(function (err) {
            failFun(err);
        });
    }).catch(function (err) {
        failFun(err);
    });
};

const sendTextSMS = function (text, phoneNumber, successFun, failureFun) {
    var msgParams = {
        Message: text,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'GPTest'
            },
        }
    }

    var msgAttr = {
        attributes: {
            'DefaultSMSType': 'Transactional',
        }
    }

    var setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(msgAttr).promise().then(function () {
        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(msgParams).promise().then(function (data) {
            successFun(data);
        }).catch((err) => {
            failureFun(err);
        });
    });
}

module.exports = {
    sendOTPSMS: sendOTPSMS,
    sendForgotPinOTPSMS: sendForgotPinOTPSMS,
    sendTextSMS: sendTextSMS,
    sendSMSAttr: function (otp, phoneNumber) {
        var msgParams = {
            Message: otp + " is your " + appDetails.appName + " phone number verification One Time Paasword (OTP)",
            PhoneNumber: phoneNumber,
            MessageAttributes: {
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'GPTest'
                },
            }
        }

        var publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(msgParams).promise().then(function (data) {
            console.log(data);
        });
    },
    initSMS: function () {
        var msgAttr = {
            attributes: {
                'DefaultSMSType': 'Transactional',
            }
        }

        var setSMSTypePromise = new AWS.SNS({ apiVersion: '2010-03-31' }).setSMSAttributes(msgAttr).promise().then(function (data) {
            console.log(data);
        });
    }
}