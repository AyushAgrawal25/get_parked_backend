const express = require('express');
const { PrismaClient } = require('@prisma/client');

const tokenUtils = require('./../../../services/tokenUtils/tokenUtils');
const userUtils = require('../users/userUtils');
const vehicleUtils = require('../vehicles/vehicleUtils');

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", tokenUtils.verify, async(req, res)=>{
    const userData=req.tokenData;
    try {
        const notifications=await prisma.notifications.findMany({
            where:{
                recieverUserId:parseInt(userData.id)
            },
            select:{
                id:true,
                recieverUserId:true,
                recieverAccountType:true,
                senderUserId:true,
                senderAccountType:true,
                senderUser:{
                    select:userUtils.selectionWithSlot
                },
                type:true,
                time:true,
                status:true,

                // It includes txns of slots.
                bookingCancellation_ForSlot:{
                    include:{
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // It includes of txns of user only.
                bookingCancellation_ForUser:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // It includes txns of slot only.
                booking_ForSlot:{
                    include:{
                        fromSlotToAppTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        fromSlotToUserTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // it includes txns of user only.
                booking_ForUser:{
                    include:{
                        fromUserToSlotTransaction:{
                            include:{
                                transactionNonReal:true,
                                transactionReal:true
                            }
                        },
                        parking:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // This is recieved by slot 
                // It includes slot txns only.
                parkingRequest:{
                    include:{
                        booking:{
                            include:{
                                fromSlotToAppTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },
                                fromSlotToUserTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },
                                parking:true,
                            }
                        },
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        },
                    },
                },
                // This is recieved by user 
                // It includes user txns only.
                parkingRequest_withResponse:{
                    include:{
                        booking:{
                            include:{
                                fromUserToSlotTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },
                                parking:true        
                            }
                        },
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // This includes booking and slot txns only.
                parking_ForSlot:{
                    include:{
                        booking:{
                            include:{
                                fromSlotToAppTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },
                                fromSlotToUserTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },        
                            }
                        },
                        slotRatingReview:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // This is recieved by user and includes only user txns
                parking_ForUser:{
                    include:{
                        booking:{
                            include:{
                                fromUserToSlotTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },        
                            }
                        },
                        slotRatingReview:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // This is recieved by slot booking and txns.
                parkingWithdraw_ForSlot:{
                    include:{
                        booking:{
                            include:{
                                fromSlotToAppTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },
                                fromSlotToUserTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },        
                            }
                        },
                        slotRatingReview:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                // This is recieved by user and includes booking user txns
                parkingWithdraw_ForUser:{
                    include:{
                        booking:{
                            include:{
                                fromUserToSlotTransaction:{
                                    include:{
                                        transactionNonReal:true,
                                        transactionReal:true
                                    }
                                },        
                            }
                        },
                        slotRatingReview:true,
                        vehicle:{
                            select:vehicleUtils.selectionWithTypeData
                        }
                    }
                },
                transaction:{
                    include:{
                        user:{
                            select:userUtils.selectionWithSlot,
                        },
                        transactionNonReal:{
                            include:{
                                withUser:{
                                    select:userUtils.selectionWithSlot,
                                }
                            }
                        },
                        transactionReal:true,
                    }
                },
                transactionRequest:{
                    include:{
                        requestedFromTransaction:true,
                        requestedFromUser:{
                            select:userUtils.selectionWithSlot
                        },
                        requesterTransaction:true,
                        requesterUser:{
                            select:userUtils.selectionWithSlot
                        },
                    }
                },
                transactionRequest_withResponse:{
                    include:{
                        requestedFromTransaction:true,
                        requestedFromUser:{
                            select:userUtils.selectionWithSlot
                        },
                        requesterTransaction:true,
                        requesterUser:{
                            select:userUtils.selectionWithSlot
                        },
                    }
                }
            }
        });

        res.json({
            data:notifications
        });

    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

const notificationGetStatus={
    success:{
        code:200,
        message:"Notifications fetched successfully..."
    },
    serverError:{
        code:500,
        message:"Internal Server error..."
    }
}

router.put("/fcmToken", tokenUtils.verify, async (req, res) => {
    const userData = req.tokenData;
    try {
        const unData=await prisma.user.findFirst({
            where:{
                id:userData.id
            },
            include:{
                userNotification:true
            }
        });
        const upResp = await prisma.userNotification.update({
            data: {
                token: req.body.fcmToken
            },
            where:{
                id:unData.userNotification.id
            }
        });
        // console.log(upResp);
        res.statusCode=fcmTokenUpdate.success.code;
        res.json({
            data: upResp,
            message:fcmTokenUpdate.success.message
        });
        return;
    } catch (error) {
        res.statusCode=fcmTokenUpdate.serverError.code;
        res.json({
            error: error,
            message:fcmTokenUpdate.serverError.message
        });
        return;
    }
});

const fcmTokenUpdate={
    success:{
        code:200,
        message:"FCM Token updated successfully.."
    },
    serverError:{
        code:500,
        message:"Internal Server error..."
    }
}

module.exports = router;