const mongoose = require('mongoose');

const{ Schema } = mongoose;
const roomSchema = new Schema({
    // title: {
    //     type: String,
    //     required: true,
    // },
    // max: {
    //     type: Number,
    //     required: true,
    //     default: 10,
    //     min: 2,
    // },
    // owner: {
    //     type: String,
    // },
    // password: String,
    gif: {
        type: Boolean,
        default: false,
        required: true,
    },
    lastMessage: {
        type: String,
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    leavedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Room', roomSchema);