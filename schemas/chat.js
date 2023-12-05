const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema;

const chatSchema = new Schema({
    room: {
        type: ObjectId,
        required: true,
        ref: 'Room', // Room 모델을 참조
    },
    user: {
        type: ObjectId,
        ref: 'User', // User 모델을 참조
    },
    type: {
        type: String,
        required: true,
        enum: ['user', 'system'], // 'user' 또는 'system'
    },
    inout: {
        type: String,
        enum: ['in', 'out'], // 입장 또는 퇴장
    },
    chat: String,
    gif: String,
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Chat', chatSchema);