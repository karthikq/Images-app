/** @format */

const mongoose = require("mongoose");

const db = async () =>
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

module.exports = db;
