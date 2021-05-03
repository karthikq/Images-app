/** @format */

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const db = require("./Mongoose/connect");
let cors = require("cors");

const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const MongoStore = require("connect-mongo");

const port = process.env.PORT || 4000;
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.static("public"));

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
db();

app.use("/", require("./routes/userRoute"));

app.listen(port, function () {
  console.log("server is running " + port);
});
