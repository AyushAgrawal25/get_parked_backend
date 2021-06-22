const { PrismaClient } = require('@prisma/client');
const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');

const tokenUtils = require('./../../tokenUtils/tokenUtils');

const prisma = new PrismaClient();

async function onChangeCameraPosition(socket, data){
    if(!data){
        return;
    }

    if((!data.latitude) || (!data.longitude) || (!data.zoom)){
        return;
    }

    // Lat Long Var
    var latLongVar = 360 / Math.pow(2, (parseFloat(data.zoom)));

    // Latitudes
    var maxLatitude = (parseFloat(data.latitude) + latLongVar);
    var minLatitude = (parseFloat(data.latitude) - latLongVar);

    // Longitudes
    var minLongitude = (parseFloat(data.longitude) - latLongVar);
    var maxLongitude = (parseFloat(data.longitude) + latLongVar);

    let slotSelect=slotUtils.selection;
    slotSelect["vehicles"]={
        select:vehicleUtils.selectionWithTypeData
    };

    const slots=await prisma.slot.findMany({
        where:{
            AND:[
                {
                    latitude:{
                        gte:minLatitude,
                    }
                },
                {
                    latitude:{
                        lte:maxLatitude
                    }
                },
                {
                    longitude:{
                        gte:minLongitude,
                    }
                },
                {
                    longitude:{
                        lte:maxLongitude
                    }
                }
            ]
        },
        select:slotSelect
    });

    if(!slots){
        return;
    }

    slots.forEach((slot)=>{
        socket.join("slot_"+slot.id);
        // console.log("slot_"+slot.id);
    });

    socket.emit('slots-update', slots);
}

module.exports={
    onChangeCameraPosition
}