let mongoose = require("mongoose");

let Schema = new mongoose.Schema({
    players: {
    	type: Array,
    	required: true
    },
    load: {
    	type: Array,
    	required: true,
    },
    balance: {
    	type: Number,
    	required: true,
    },
    createdAt: {
    	type: Date,
    	default: Date.now()
    },
    startedAt: {
        type: Date,
    },
    counter: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("room", Schema);