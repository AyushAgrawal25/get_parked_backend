var admin = require("firebase-admin");
var serviceAccount = require("./fcm-config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

function toProperDataForFCM(fcmData) {
    var dataInStringFormat = {
        "click_action": "FLUTTER_NOTIFICATION_CLICK",
    };
    for (const [key, value] of Object.entries(fcmData)) {
        if (key != "regToken") {
            if (value == null) {
                // console.log(key + " this key has null value..");
            }
            else if(typeof value=="number"){
                dataInStringFormat[key.toString()]=value.toString();
            }
            else if(typeof value=="string"){
                dataInStringFormat[key.toString()]=value;
            }
            else if(typeof value=="object"){
                dataInStringFormat[key.toString()] = JSON.stringify(value);
            }
        }
    }

    return dataInStringFormat;
}

async function sendTo({
    token, title, body, imgUrl, data
}){
    try {
        admin.messaging().send({
            token:token,
            notification:{
                imageUrl:((imgUrl)&&(imgUrl!=null)) ? imgUrl : undefined,
                body:body,
                title:title
            },
            data:toProperDataForFCM(data), 
        }).then((resp)=>{
            console.log(resp);
        }).catch((err)=>{
            console.log(err);
        });
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    sendTo
}