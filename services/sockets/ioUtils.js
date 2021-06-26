let io;
let ioEmit;
function initIO(httpServer){
    io=require('socket.io')(httpServer, {
        cors:{
            // origin:['http://localhost:5000/']
            origin:"*"
        },
    });
    const { createClient } = require("redis");
    const { createAdapter } = require("@socket.io/redis-adapter");
    const pubClient = createClient({ host: "localhost", port: 6379 });
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));

    initEmit();
    return io;
}

function initEmit(){
    const { createClient } = require("redis");
    const { Emitter } = require("@socket.io/redis-emitter");
    ioEmit = new Emitter(createClient({ host: "localhost", port: 6379 }));
    return ioEmit;
}

function getIO(){
    if(!io){
        console.log("Socket IO not initialized....");
    }

    return io;
}

function getEmitter(){
    if(!ioEmit){
        console.log("Socket IO Emitter not initialized....");
    }
    return ioEmit;
}

module.exports={
    init:initIO,
    get:getIO,
    emitter:getEmitter
}