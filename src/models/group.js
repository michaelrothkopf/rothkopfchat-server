import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.String,
  city: mongoose.Schema.Types.String,
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
});

export const Group = mongoose.model('Group', GroupSchema);