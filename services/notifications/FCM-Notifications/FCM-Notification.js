var FCMAdmin = require('firebase-admin');
var domainUtils = require('./../../domain');
var serviceAccount = require('./fcm-config.json');

FCMAdmin.initializeApp({
    credential: FCMAdmin.credential.cert(serviceAccount),
    databaseURL: "https://get-parked-67c8f.firebaseio.com"
});

var regToken = "e-wLlmgtVS0:APA91bG4d7ETvxi4aCF3qtSiQJkIQd5itbEadgsCgPNtd0LCBHNlloFM4MQAG3OvTiCLxleKt1NZndsejgcBFfpcxdJiw78J3uhoqcG7v-m-mUi-HtJ8N-BDX0YWymiiCA8Wo9od97Yb";

var msg = {
    notification: {
        title: "This is Good..",
        body: "Some body ",
        image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-1.2.1&w=1000&q=80"
    },
    data: {
        image: "some image",
    },
    android: {
        notification: {
            channel_id: "get_parked-notify",
            click_action: "FLUTTER_NOTIFICATION_CLICK"
        }
    },
    token: regToken
};

const sendPushNotification = function (msgData, successFun, failureFun) {

    var msg = {
        notification: {
            title: msgData.title,
            body: msgData.body,
            image: "http://3.21.53.195:3000/images/profilePics/1590419404104-image_cropper_1590418899032.jpg"
        },
        data: msgData,
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: msgData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });

}

const parkingRequest = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: {
            "click_action": "FLUTTER_NOTIFICATION_CLICK",

            "iconImage": notificationData.userProfilePicUrl,
            "notificationType": notificationData.notificationType.toString(),
            "userId": notificationData.userId.toString(),
            "userProfilePicUrl": notificationData.userProfilePicUrl,
            "userName": notificationData.userName,
            "parkingType": notificationData.parkingType.toString(),
            "parkingHour": notificationData.parkingHour.toString(),
            "parkingRequestId": notificationData.parkingRequestId.toString(),
            "slotVehicleId": notificationData.slotVehicleId.toString()

        },
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const parkingRequestResponse = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: {
            "click_action": "FLUTTER_NOTIFICATION_CLICK",

            "iconImage": notificationData.slotImageUrl,
            "notificationType": notificationData.notificationType.toString(),
            "slotId": notificationData.slotId.toString(),
            "slotImageUrl": notificationData.slotImageUrl,
            "slotName": notificationData.slotName,
            "parkingType": notificationData.parkingType.toString(),
            "parkingHour": notificationData.parkingHour.toString(),
            "parkingRequestId": notificationData.parkingRequestId.toString(),
            "slotVehicleId": notificationData.slotVehicleId.toString()

        },
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const transactionNotification = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body
        },
        data: {
            "click_action": "FLUTTER_NOTIFICATION_CLICK",

            "notificationType": notificationData.notificationType.toString(),
            "transactionRefNo": notificationData.transactionRefNo.toString(),
            "transactionRefId": notificationData.transactionRefId.toString()
        },
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const transactionRequestNotification = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: {
            "click_action": "FLUTTER_NOTIFICATION_CLICK",

            "iconImage": notificationData.imageUrl,
            "notificationType": notificationData.notificationType.toString(),
            "transactionRequestRefNote": notificationData.transactionRequestRefNote.toString(),
            "transactionRequestAmount": notificationData.transactionRequestAmount.toString(),
        },
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const transactionRequestResponseNotification = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: {
            "click_action": "FLUTTER_NOTIFICATION_CLICK",

            "iconImage": notificationData.imageUrl,
            "notificationType": notificationData.notificationType.toString(),
            "transactionRequestNote": notificationData.transactionRequestNote.toString(),
            "transactionRequestAmount": notificationData.transactionRequestAmount.toString(),
        },
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const bookingNotification = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: notificationData.data,
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

const parkingNotification = function (notificationData, successFun, failureFun) {

    var msg = {
        notification: {
            title: notificationData.title,
            body: notificationData.body,
            image: notificationData.image
        },
        data: notificationData.data,
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };

    FCMAdmin.messaging().send(msg).then(function (response) {
        successFun(response);
    }).catch(function (err) {
        failureFun(err);
    });
}

// Its not a future function but can be made using async.
const parkNotify = (notificationData, successFun, failureFun) => {
    var properNotifyData = toProperDataForFCM(notificationData);
    var msg = {
        notification: {
            title: properNotifyData.title,
            body: properNotifyData.body,
            image: domainUtils.domainName + properNotifyData.imageUrl
        },
        data: properNotifyData,
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };
    try {
        FCMAdmin.messaging().send(msg).then(function (response) {
            successFun(response);
        }).catch(function (err) {
            console.log(err);
            failureFun(err);
        });
    }
    catch (err) {
        console.log(err);
        failureFun(err);
    }
}


// Its not a future function but can be made using async.
const transactionNotify = (notificationData, successFun, failureFun) => {
    var properNotifyData = toProperDataForFCM(notificationData);
    var msg = {
        notification: {
            title: properNotifyData.title,
            body: properNotifyData.body,
        },
        data: properNotifyData,
        android: {
            notification: {
                channel_id: "get_parked-notify",
            }
        },
        token: notificationData.regToken
    };
    if (properNotifyData.imageUrl) {
        msg.notification.image = domainUtils.domainName + properNotifyData.imageUrl;
    }
    try {
        FCMAdmin.messaging().send(msg).then(function (response) {
            successFun(response);
        }).catch(function (err) {
            console.log(err);
            failureFun(err);
        });
    }
    catch (err) {
        console.log(err);
        failureFun(err);
    }
}
const toProperDataForFCM = (fcmData) => {
    var dataInStringFormat = {
        "click_action": "FLUTTER_NOTIFICATION_CLICK",
    };
    for (const [key, value] of Object.entries(fcmData)) {
        if (key != "regToken") {
            if (value == null) {
                console.log(key + " this key has null value..");
            }
            else {
                dataInStringFormat[key.toString()] = value.toString();
            }
        }
    }

    return dataInStringFormat;
}

const notificationMethods = {
    sendPushNotification: sendPushNotification,
    parkNotify: parkNotify,
    transactionNotify: transactionNotify,
    parkingRequest: parkingRequest,
    parkingRequestResponse: parkingRequestResponse,
    transactionNotification: transactionNotification,
    transactionRequestNotification: transactionRequestNotification,
    transactionRequestResponseNotification: transactionRequestResponseNotification,
    bookingNotification: bookingNotification,
    parkingNotification: parkingNotification,
    toProperData: toProperDataForFCM,
    testRegToken: regToken
};

module.exports = notificationMethods;