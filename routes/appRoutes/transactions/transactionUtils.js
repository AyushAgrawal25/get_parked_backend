require('dotenv').config();

const crypto=require('crypto');
const { PrismaClient, TransactionType, MoneyTransferType, TransactionNonRealType, UserAccountType } = require('@prisma/client');
const Razorpay= require('razorpay');

const algorithm = 'aes-256-cbc';
const cryptionIV = Buffer.alloc(16, 0);
const cryptionKey= Buffer.from((process.env.ENCRYPTION_KEY).substring(0, 32), "utf-8");

const prisma = new PrismaClient();
const rzpInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

function encryptData(data){
    try {
        let cipher = crypto.createCipheriv(algorithm, cryptionKey, cryptionIV);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    } catch (error) {
        console.log(error);
        return "";
    }
}

function decryptData(data){
    try {
        let encryptedText = Buffer.from(data, 'base64');
        let decipher = crypto.createDecipheriv(algorithm, cryptionKey, cryptionIV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        return null;
    }
}

function getTransactionData(txCode){
    let decrypedDataAsString=decryptData(txCode);
    decrypedDataAsString=decryptData(decrypedDataAsString);
    return JSON.parse(decrypedDataAsString);
}

async function getTransactionCode({
    userId, amount
}){
    const orderData=await createOrderInRazorpay({
        amount:amount,
        receiptId:generateTransactionRefId()
    });
    let txnData={
        userId:userId,
        orderId:orderData.id,
        ref:null,
        paymentId:null,
        status:0
    }
    // console.log(txnData);

    const txnAsString=JSON.stringify(txnData);
    let txnCode=encryptData(txnAsString);
    return encryptData(txnCode);
}

function generateTransactionRefId(data){
    return "Txn_"+crypto.randomBytes(5).toString('hex')+Date.now();
}

async function createOrderInRazorpay({
    receiptId, amount
}){
    try {
        var options={
            amount:parseInt(amount),
            receipt:receiptId,
            currency:"INR"
        };

        const order=await rzpInstance.orders.create(options);
        if(order){
            // console.log(order);
            return order;
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const createPaymentSignature=function({
    order_id, razorpay_payment_id, 
}){
    const hmac=crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(order_id + "|" + razorpay_payment_id);
    return hmac.digest('hex');
}

async function walletBalance(userId){
    const addTxns=await prisma.transaction.aggregate({
        _sum:{
            amount:true,
        },
        where:{
            userId:parseInt(userId),
            accountType:UserAccountType.User,
            transferType: MoneyTransferType.Add,
            status:1
        }
    });

    const removeTxns=await prisma.transaction.aggregate({
        _sum:{
            amount:true,
        },
        where:{
            userId:parseInt(userId),
            accountType:UserAccountType.User,
            transferType: MoneyTransferType.Remove,
            status:1
        }
    });

    return addTxns._sum.amount-removeTxns._sum.amount;
}

async function vaultBalance(userId){
    const addTxns=await prisma.transaction.aggregate({
        _sum:{
            amount:true,
        },
        where:{
            userId:parseInt(userId),
            accountType:UserAccountType.Slot,
            transferType: MoneyTransferType.Add,
            status:1
        }
    });

    const removeTxns=await prisma.transaction.aggregate({
        _sum:{
            amount:true,
        },
        where:{
            userId:parseInt(userId),
            accountType:UserAccountType.Slot,
            transferType: MoneyTransferType.Remove,
            status:1
        }
    });

    return addTxns._sum.amount-removeTxns._sum.amount;
}

module.exports={
    getTransactionData,
    getTransactionCode,
    generateTransactionRefId,
    walletBalance,
    vaultBalance,
    createPaymentSignature
}