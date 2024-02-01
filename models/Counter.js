const mongoose = require("mongoose");

const CounterSchema = mongoose.Schema(
    {
        id: {
            type: Number,
        },
       
    }
);



const Counter = mongoose.model("Counter", CounterSchema);

module.exports = Counter;
