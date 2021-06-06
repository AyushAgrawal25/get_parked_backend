const vehicleMasterData={
    "BIKE":{
        vehicleMasterId:1,
        name:"Bike",
        length:5,
        breadth:2,
        height:3.5,
        type:"BIKE"
    },
    "MINI":{
        vehicleMasterId:2,
        name:"Mini",
        length:6,
        breadth:5,
        height:5,
        type:"MINI"
    },
    "SEDAN":{
        vehicleMasterId:3,
        name:"Sedan",
        length:7,
        breadth:6,
        height:5,
        type:"SEDAN"
    },
    "VAN":{
        vehicleMasterId:4,
        name:"Van",
        length:7,
        breadth:5,
        height:7,
        type:"VAN"
    },
    "SUV":{
        vehicleMasterId:5,
        name:"SUV",
        length:7,
        breadth:6,
        height:7,
        type:"SUV"
    }
}

function parseVehicleData(vehicleData){
    const typeData=vehicleMasterData[vehicleData.type];
    Object.entries(typeData).forEach((entry) => {
        const [key, value] = entry;
        if(key!='type'){
            vehicleData[key]=value;
        }
    });
    return typeData;
}

function getVehicleTypeDatas(){
    let vehiclesArray=[];
    Object.entries(vehicleMasterData).forEach((entry) => {
        const [key, value] = entry;
        vehiclesArray.push(value);
    });
    return vehiclesArray;
}

module.exports={
    getTypesData:getVehicleTypeDatas,
    parse:parseVehicleData
}