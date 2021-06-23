const { PrismaClient } = require('@prisma/client');

const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const userUtils = require('../../../routes/appRoutes/users/userUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');
const transactionUtils = require('../../../routes/appRoutes/transactions/transactionUtils');
const ioUtils = require('../ioUtils');
const tokenUtils = require('../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function updateUser(userId, transactionId){
    try {
        const transactionData=await prisma.transaction.findUnique({
            where:{
                id:parseInt(transactionId)
            },
            include:{
                transactionReal:{
                    include:{
                        user:{
                            select:userUtils.selectionWithSlot
                        }
                    }
                },
                transactionNonReal:{
                    include:{
                        withUser:{
                            select:userUtils.selectionWithSlot
                        },
                        fromUser:{
                            select:userUtils.selectionWithSlot
                        }
                    }
                }                
            }
        });

        const walletBalance=await transactionUtils.walletBalance(userId);
        const vaultBalance=await transactionUtils.vaultBalance(userId);

        const respData={
            walletAmout:walletBalance,
            vaultAmount:vaultBalance,
            transactions:[transactionData]
        }

        ioUtils.emitter().to("user_"+userId).emit('transaction-update', respData);
    } catch (error) {
        console.log("Transactions Sockets Update...");
        console.log(error);
    }
}

module.exports={
    updateUser
}