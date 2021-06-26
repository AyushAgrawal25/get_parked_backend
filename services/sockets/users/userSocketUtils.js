const { PrismaClient } = require('@prisma/client');
const ioUtils = require('../ioUtils');

const tokenUtils = require('./../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function joinUserStream(socket, userAuth){
    if(!userAuth){
        console.log("Denying... 2");
        socket.disconnect();
        return;
    }
    
    const userData=await prisma.user.findFirst({
        where:{
            id: userAuth.id,
            email:userAuth.email,
        }
    });

    if(!userData){
        console.log("Denying... 3");
        socket.disconnect();
        return;
    }            
    
    socket.join('user_'+userData.id);
    console.log('user_'+userData.id);
}

module.exports={
    joinUserStream
}