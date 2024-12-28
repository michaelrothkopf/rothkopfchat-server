import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  createdAt: mongoose.Schema.Types.Date,
  createdBy: mongoose.Schema.Types.ObjectId,
  resourceId: mongoose.Schema.Types.String,
  extension: mongoose.Schema.Types.String,

  contentHash: mongoose.Schema.Types.String,
});

export const Image = mongoose.model('Image', ImageSchema);