const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({

    dateofBirth: {
        type: String,
    },
    gender: {
        type: String,

    },
    about: {
        type: String,
        trim: true,
    },

    contactNumber: {
        type: Number,
        trim: true,
    },



})

module.exports = mongoose.model("Profile", profileSchema);