const express = require('express');
const cors = require('cors');

const appRoute = require('./routes/appRoutes/appRoutes.js');
const imagesRoute = require('./routes/images/imagesRoute');
const vehicleUtils = require('./routes/appRoutes/vehicles/vehicleUtils.js');
const adminUtils = require('./services/admin/adminUtils.js');
const ioUtils = require('./services/sockets/ioUtils');
const slotSocketUtils = require('./services/sockets/slots/slotSocketUtils');
const userSocketUtils = require('./services/sockets/users/userSocketUtils');
const tokenUtils = require('./services/tokenUtils/tokenUtils.js');
const fileUtils = require('./services/fileUtils/fileUtils');

const app = express();

const SERVER_NAME=process.env.SERVER_NAME||'Default';
const PORT=process.env.PORT|| 5000;

const server=require('http').createServer(app);

// Sockets
const io = ioUtils.init(server);

//Adding services
app.use(cors());
app.use(express.json({
    limit:'50mb'
}));

app.get("/", async (req, res) => {
    try {
        res.json("Running... this is the name : " + SERVER_NAME + ".");
    }
    catch (excp) {
        console.log(excp);
        res.json(excp);
    }
});

app.use('/app', appRoute);
app.use('/images', imagesRoute);

server.listen(+PORT, () => {
    console.log("Server is running...");
    console.log(SERVER_NAME + " " + PORT);
    vehicleUtils.init();
    adminUtils.init();
    fileUtils.initUploads();
});
io.use((socket, next)=>{
    const token = socket.handshake.auth[tokenUtils.AUTHORIZATION_TOKEN];
    const authData=tokenUtils.getData(token);
    if(!authData){
        console.log("Denying... 1");
        socket.disconnect();
    }
    // Add it to user stream.
    userSocketUtils.joinUserStream(socket, authData);
    next();
});

io.on('connection', (socket) => { 
    socket.join("room123");
    socket.on('CameraPosition-change', async function (data) {
        slotSocketUtils.onChangeCameraPosition(socket, data);
    });
});