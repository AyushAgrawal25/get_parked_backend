require('dotenv').config();
const nodemailer=require('nodemailer');

async function sendCustomerMail({
    displayName, query, description, queryId
}){
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.CUSTOMER_MAIL_ID,
                pass: process.env.CUSTOMER_MAIL_PASSWORD
            }
        });
    
        const mailOptions = {
            from: "Customer Query "+process.env.CUSTOMER_MAIL_ID,
            // TODO: change it to help email
            to: 'agrawal.ayush25000@gmail.com',
            
            subject: query,
            
            // TODO: create html page for it,
            html:"<h3>From "+displayName+"</h3><h2>"+query+"</h2><h4>"+description+"</h4><h3> Query Id : "+queryId+"</h3>",
            sender:"Customer Care",
            priority:"high"
        };
    
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (error) {
        console.log("Mailer Utils : Customer Query Mail Block..");
        console.log(error);
    }
}

module.exports={
    customerQuery:sendCustomerMail
}