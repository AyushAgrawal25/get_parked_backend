const { PrismaClient } = require('@prisma/client');
const slotUtils = require('../../../routes/appRoutes/slots/slotUtils');
const vehicleUtils = require('../../../routes/appRoutes/vehicles/vehicleUtils');
const bookingUtils=require('./../../../routes/appRoutes/slots/bookings/bookingUtils');

const tokenUtils = require('./../../tokenUtils/tokenUtils');
const ioUtils=require('./../ioUtils');

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

    const slotsUpdateFns=[];
    slots.forEach((slot)=>{
        const slotUpdate=new Promise(async(resolve)=>{
            const slotAllotedSpace=await vehicleUtils.getAllotedArea(slot.id);
            const availableSpace=slot.length*slot.breadth-slotAllotedSpace;
            slot["availableSpace"]=availableSpace;
            // console.log(slot);

            socket.join("slot_"+slot.id);
            socket.emit("slots-update", [slot]);
            // console.log("slot_"+slot.id);
            resolve();
        });

        slotsUpdateFns.push(slotUpdate);
    });

    // console.log("Updated....");

    // slots.forEach((slot)=>{
    //     // console.log("slot_"+slot.id);
    // });

    // socket.emit('slots-update', slots);
}

async function updateSlotOnMap(slotId){
    try {
        let slotSelect=slotUtils.selection;
        slotSelect["vehicles"]={
            select:vehicleUtils.selectionWithTypeData
        };
        const slotData=await prisma.slot.findUnique({
            where:{
                id:parseInt(slotId)
            },
            select:slotSelect
        });

        if(!slotData){
            return;
        }

        const slotAllotedSpace=await vehicleUtils.getAllotedArea(slotData.id);
        const availableSpace=slotData.length*slotData.breadth-slotAllotedSpace;
        slotData["availableSpace"]=availableSpace;
        
        ioUtils.emitter().to("slot_"+slotId).emit("slots-update", [slotData]);
    } catch (error) {
        console.log("Update Slots on Map");
        console.log(error);
    }
}

module.exports={
    onChangeCameraPosition,
    updateSlotOnMap
}