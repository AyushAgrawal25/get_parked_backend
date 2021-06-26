const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const vehicleMasterData = {
    "BIKE": {
        vehicleMasterId: 1,
        name: "Bike",
        length: 5,
        breadth: 2,
        height: 3.5,
        area: 10,
        typeId: 1,
        type: "BIKE"
    },
    "MINI": {
        vehicleMasterId: 2,
        name: "Mini",
        length: 6,
        breadth: 5,
        height: 5,
        area: 30,
        typeId: 2,
        type: "MINI"
    },
    "SEDAN": {
        vehicleMasterId: 3,
        name: "Sedan",
        length: 7,
        breadth: 6,
        height: 5,
        area: 42,
        typeId: 3,
        type: "SEDAN"
    },
    "VAN": {
        vehicleMasterId: 4,
        name: "Van",
        length: 7,
        breadth: 5,
        height: 7,
        area: 35,
        typeId: 4,
        type: "VAN"
    },
    "SUV": {
        vehicleMasterId: 5,
        name: "SUV",
        length: 7,
        breadth: 6,
        height: 7,
        area: 42,
        typeId: 5,
        type: "SUV"
    }
}

function parseVehicleData(vehicleData) {
    const typeData = vehicleMasterData[vehicleData.type];
    Object.entries(typeData).forEach((entry) => {
        const [key, value] = entry;
        if (key != 'type') {
            vehicleData[key] = value;
        }
    });
    return vehicleData;
}

function getVehicleTypeDatas() {
    let vehiclesArray = [];
    Object.entries(vehicleMasterData).forEach((entry) => {
        const [key, value] = entry;
        vehiclesArray.push(value);
    });
    return vehiclesArray;
}

function getType(type) {
    return vehicleMasterData[type];
}

async function initVehiclesTypeData() {
    try {
        const vehicleTypeDatas = await prisma.slotVehicleTypeData.findMany();
        const vehicleDatas = [];
        var idVal = 1;
        Object.entries(vehicleMasterData).forEach((vehicle) => {
            const [key, value] = vehicle;
            vehicleDatas.push({
                id: idVal,
                area: value.area,
                breadth: value.breadth,
                length: value.length,
                height: value.height,
                name: value.name,
                status: 1,
                type: value.type,
            });
            idVal++;
        });

        if (vehicleTypeDatas.length > 0) {
            //TODO: Call updation.
            // const vehicleDels = await prisma.slotVehicleTypeData.deleteMany();
        }
        else{
            // Call creation.
            const vehicleTypesCreate = await prisma.slotVehicleTypeData.createMany({
                data: vehicleDatas
            });
        }
    } catch (error) {
        console.log(error);
    }
}

async function getAllotedArea(slotId, time){
    if(!time){
        time=(new Date()).toISOString();
    }
    const vehiclesArea=await prisma.slotVehicleTypeData.aggregate({
        where:{
            vehicles:{
                some:{
                    AND:[
                        {
                            slotId: slotId
                        },
                        {
                            bookings:{
                                some:{
                                    AND:[
                                        {
                                            time:{
                                                lt:time
                                            }
                                        },
                                        {
                                            OR:[
                                                {
                                                    status:1
                                                },
                                                {
                                                    status:3
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }   
                        }
                    ]
                }
            }
        },
        _sum:{
            area:true            
        }
    })

    if(!vehiclesArea._sum.area){
        return 0;
    }
    return vehiclesArea._sum.area;
}

module.exports = {
    getTypesData: getVehicleTypeDatas,
    init: initVehiclesTypeData,
    getType,
    getAllotedArea,
    selectionWithTypeData:{
        id:true,
        fair:true,
        slotId:true,
        typeData:true,
        type:true,
        typeId:true,
        status:true
    }
}