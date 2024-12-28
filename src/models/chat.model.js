import mongoose, { mongo } from 'mongoose';

const ChatSchema = new mongoose.Schema({
  title: mongoose.Schema.Types.String,
  messages: [{
    _id: mongoose.Schema.Types.String,
    text: mongoose.Schema.Types.String,
    image: mongoose.Schema.Types.ObjectId,
    timestamp: mongoose.Schema.Types.Date,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nickname: mongoose.Schema.Types.String,
  }],
});

export const Chat = mongoose.model('Chat', ChatSchema);