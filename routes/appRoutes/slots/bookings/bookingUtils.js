function getTotalAmt(duration, exceedDuration, fair){
    // Duration should be in minutes.
    const durationAmt=(duration/60)*fair;
    const exceedDurationAmt=(exceedDuration/60)*2*fair;

    // Exceed duration will be charged thrice thats it is multiplied by 2.
    const totalAmt=durationAmt+exceedDurationAmt;
    return {
        userToSlot:totalAmt,
        slotToApp:totalAmt*0.3
    }
}

module.exports={
    getTotalAmt
};