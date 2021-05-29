const express=require('express');
const cors=require('cors');
const { PrismaClient } = require('@prisma/client')

const appRoute=require('./routes/appRoutes/appRoutes.js');

const app=express();
const prisma = new PrismaClient();

//Adding services
app.use(cors());
app.use(express.json());

app.get("/",async (req, res)=>{
    try{
        const allUsers = await prisma.user.findMany();
        res.json(allUsers)
    }
    catch(excp){
        res.json(excp);
    }
});

app.use('/app', appRoute);

var server=app.listen(5000, ()=>{
    console.log("Server is running...");
});