/** @format */

const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  imageid: String,
  name: String,
  profileUrl: String,
  description: String,
  imageUrl: String,
});

const Image = mongoose.model("Image", ImageSchema);
module.exports = Image;
