const mongoose = require("mongoose");


const calculationFileSchema = mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true
    },
    r_id: {
        type: Number,
        required: true
    },
    file : {
        type : String,
        required : true
    },
    status: {
        type: Boolean,
        default: true
    },
    locked: {
        type: Boolean,
        default: false
    }
    
});

const CalculationFile = mongoose.model('CalculationFile', calculationFileSchema);
module.exports = CalculationFile;