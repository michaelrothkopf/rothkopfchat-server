import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.String,
  rank: mongoose.Schema.Types.String,
  group: mongoose.Schema.Types.ObjectId,

  rsaKey: mongoose.Schema.Types.String,
  UID: mongoose.Schema.Types.String,
  expoPushToken: mongoose.Schema.Types.String,

  activated: mongoose.Schema.Types.Boolean,
  locked: mongoose.Schema.Types.Boolean,
  lastLogin: mongoose.Schema.Types.Date,
  lastLogout: mongoose.Schema.Types.Date,
});

export const User = mongoose.model('User', UserSchema);