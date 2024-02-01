const mongoose = require("mongoose");

const restaurantSchema = mongoose.Schema({
    r_id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    CodeEBP: {
        type: Number,
        required: true,
        unique: true
    },
    Type: {
        type: String,
        enum: ["franchise", "succursale"],
        required: true
    },
    Region: {
        type: String,
        enum: ["Banlieue", "Paris", "Province"],
        required: true
    },
    Zone: {
        type: Number,
        required: true
    },
    DateOuverture: {
        type: Date,
        required: true
    },
    // Reference to Calculation File
    calculationFiles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CalculationFile'
        }
    ]
});
const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
