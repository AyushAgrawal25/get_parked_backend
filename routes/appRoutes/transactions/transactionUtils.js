require('dotenv').config();

const crypto=require('crypto');

const algorithm = 'aes-256-cbc';
const cryptionIV = Buffer.alloc(16, 0);
const cryptionKey= Buffer.from((process.env.ENCRYPTION_KEY).substring(0, 32), "utf-8");

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

function getTransactionCode(data){
    let txnData={
        userId:data.userId,
        code:generateTransactionRefId(), 
        ref:null,
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

module.exports={
    getTransactionData,
    getTransactionCode,
    generateTransactionRefId
}