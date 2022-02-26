const express=require('express')
const notifySMS=require('./../../services/notifications/AWS-SMS/AWS-SMS');

const router = express.Router();

router.post('/send', async(req, res)=>{
    try {
        const phNumber=req.body.phoneNumber;
        const smsText=req.body.smsText;
        notifySMS.sendTextSMS(smsText, phNumber, ()=>{
            res.status(200).json({
                status: "SMS Sent"
            });
        }, ()=>{
            res.status(500).json({
                status: "Failed.."
            })
        });
   
        
    } catch (error) {
        res.status(500).json({
            status: "Failed",
            error: error
        });
    }
});

module.exports=router