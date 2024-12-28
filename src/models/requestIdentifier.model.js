import mongoose from "mongoose";

const RequestIdentifierSchema = new mongoose.Schema({
  claimedAt: mongoose.Schema.Types.Date,
  claimedBy: mongoose.Schema.Types.ObjectId,
  identifier: mongoose.Schema.Types.String,
});

export const RequestIdentifier = mongoose.model('RequestIdentifier', RequestIdentifierSchema);