var admin = require("firebase-admin");
var serviceAccount = require("./fcm-config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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