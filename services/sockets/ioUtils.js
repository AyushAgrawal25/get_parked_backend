let io;
function initIO(httpServer){
    io=require('socket.io')(httpServer, {
        cors:{
            // origin:['http://localhost:5000/']
            origin:"*"
        },
    });

    return io;
}

function getIO(){
    if(!io){
        console.log("Socket IO not initialized....");
    }
    else{
        console.log("Giving...");
    }

    return io;
}

module.exports={
    init:initIO,
    get:getIO
}