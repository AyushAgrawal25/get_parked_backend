const express = require('express');
const cors = require('cors');
const parseArgs = require('minimist');

const appRoute = require('./routes/appRoutes/appRoutes.js');
const imagesRoute = require('./routes/images/imagesRoute');
const vehicleUtils = require('./routes/appRoutes/vehicles/vehicleUtils.js');
const adminUtils = require('./services/admin/adminUtils.js');
const socketUtils = require('./services/sockets/socketUtils');
const socketSlotUtils = require('./services/sockets/slots/socketSlotUtils');

const app = express();
const args = parseArgs(process.argv.slice(2));
const { name = 'default', port = '5000' } = args;

const server=require('http').createServer(app);

// Sockets
const io = require('socket.io')(server, {
    cors:{
        origin:['http://localhost:5000/']
    },
});

//Adding services
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
    try {
        res.json("Running... this is the name : " + name + ".");
        io.to("room123").emit("room-test", {
            "data":"You nailed it..."
        });
    }
    catch (excp) {
        console.log(excp);
        res.json(excp);
    }
});

app.use('/app', appRoute);
app.use('/images', imagesRoute);

server.listen(+port, () => {
    console.log("Server is running...");
    console.log(name + " " + port);
    vehicleUtils.init();
    adminUtils.init();
});


io.on('connection', (socket) => { 
    socket.on('join-user-stream', async function (userAuth) {
        socket.join("room123");
        socketUtils.joinUserStream(socket, userAuth);
    });

    socket.on('CameraPosition-change', async function (data) {
        socketSlotUtils.onChangeCameraPosition(socket, data);
    });
});