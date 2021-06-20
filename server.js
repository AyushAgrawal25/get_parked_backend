const express = require('express');
const cors = require('cors');
const parseArgs = require('minimist');
const { PrismaClient } = require('@prisma/client')

const appRoute = require('./routes/appRoutes/appRoutes.js');
const imagesRoute = require('./routes/images/imagesRoute');
const vehicleUtils = require('./routes/appRoutes/vehicles/vehicleUtils.js');
const adminUtils = require('./services/admin/adminUtils.js');

const app = express();
const prisma = new PrismaClient();
const args = parseArgs(process.argv.slice(2));
const { name = 'default', port = '5000' } = args;

//Adding services
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
    try {
        res.json("Running... this is the name : " + name + ".");
    }
    catch (excp) {
        res.json(excp);
    }
});

app.use('/app', appRoute);
app.use('/images', imagesRoute);

var server = app.listen(+port, () => {
    console.log("Server is running...");
    console.log(name + " " + port);
    vehicleUtils.init();
    adminUtils.init();
});