const { PrismaClient } = require('@prisma/client');
const ioUtils = require('../ioUtils');

const tokenUtils = require('./../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function joinUserStream(socket, userAuth){
    if(!userAuth){
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
        socket.disconnect();
        return;
    }            
    
    socket.join('user_'+userData.id);
    console.log('user_'+userData.id);
}

module.exports={
    joinUserStream
}