const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
let cryptionIV = Buffer.alloc(16, 2);
let cryptionKey = "23456789234567892345678923456789";

const encryption = function (pin) {
    try {
        let cipher = crypto.createCipheriv(algorithm, cryptionKey, cryptionIV);
        let encrypted = cipher.update(pin);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    } catch (error) {
        return null;
    }
}

const decryption = function (encryptedPin) {
    try {
        let encryptedText = Buffer.from(encryptedPin, 'hex');
        let decipher = crypto.createDecipheriv(algorithm, cryptionKey, cryptionIV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        return null;
    }
}

const encryptHmac = function (pin) {
    try{
        var encryptedPin = crypto.createHmac("sha256", crypto.createHmac("sha256", pin).digest("hex")).digest("hex");
        return encryptedPin;
    }
    catch(excp){
        return null;
    }
}

const decryptFourDigitHmac = function (encryptedPin) {
    try {
        for (var i = 0; i < 9999; i++) {
            var encrypted = crypto.createHmac("sha256", crypto.createHmac("sha256", i.toString()).digest("hex")).digest("hex");
            if (encryptedPin == encrypted) {
                return i.toString();
            }
        }
    } catch (error) {
        return null;
    }
}

module.exports = {
    encryption: encryption,
    decryption: decryption,
    encryptHmac: encryptHmac,
    decryptFourDigitHmac: decryptFourDigitHmac
};