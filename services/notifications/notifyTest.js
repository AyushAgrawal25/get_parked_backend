const admin=require('firebase-admin');

const serviceAccount=require('./FCM Config/fcm-config.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://firestoretest-97801.firebaseio.com"
});

var regToken="fZ9OLwDyQuyrECPfZPSwH4:APA91bEZXBffMRSCM8gsqNZsMKX0zFsKFqgxjAp18QnaXdiaAIRjPq4qNxnUwtsVhsktll4HY4624qeglQpjHXZYHPVRt-Bd_YCwar-VEPguQuv1LBPX5N3FnPXRSYlPTV-QK4089WMN";

var msg={
    notification:{
        title:"This is Good..",
        body:"Some body ",
        image:"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-1.2.1&w=1000&q=80"
    },
    data:{
        image:"some image"
    },
    android: {
      notification: {
        channel_id: "get_parked-notify",
        click_action:"FLUTTER_NOTIFICATION_CLICK"
      }
    },
    token: regToken
};

const notify={
    send: function(){
        admin.messaging().send(msg)
        .then(function(response){
            console.log("Success : ", response);
        })
        .catch(function(err){
            console.log("Error : ", err);
        });
    }
};

module.exports=notify;

