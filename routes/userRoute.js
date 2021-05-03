/** @format */

const express = require("express");
const router = express.Router();
let jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/userModel");
const Image = require("../models/imageModel");
const passport = require("passport");
const gravatar = require("gravatar");
require("./passport")(passport);
require("./googleAuth")(passport);
const { v4: uuidv4 } = require("uuid");

router.post("/login", (req, res) => {
  passport.authenticate("local", { session: false }, function (err, user) {
    if (err) {
      return console.log(err);
    }
    if (!user) {
      return res.json({ auth: false, message: "User not found" });
    }
    req.logIn(user, { session: false }, function (err) {
      if (err) {
        return console.log(err);
      }
      const userData = {
        username: user.name,
        email: user.email,
        profileUrl: user.profileUrl,
      };
      let token = jwt.sign({ user: userData.email }, process.env.SECRECT_KEY);

      return res.json({ auth: true, value: userData, token: token });
    });
  })(req, res);
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let profileUrl = gravatar.url(email, { s: "100", r: "x", d: "retro" }, true);
  let username = name.replace(/ /g, "");

  try {
    const userNameExists = await User.findOne({ name: username });
    if (userNameExists) return res.json({ message: "username exists" });

    const userExists = await User.findOne({ email: email });
    if (userExists) return res.json({ message: "Email exists" });

    let date = new Date();

    const user = new User({
      name: username,
      email,
      profileUrl: profileUrl,
      password,
      date: date.toLocaleDateString(),
    });

    bcrypt.hash(user.password, saltRounds, async function (err, hash) {
      if (err) console.log(err);
      user.password = hash;
      await user.save();
    });

    res.json({ auth: true, message: "user saved" });
  } catch (error) {
    res.status(401);
  }
});

router.get(
  "/search",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user) {
      res.json({ auth: true });
    } else {
      res.json({ auth: false });
    }
  }
);

router.get(
  "/userdetails",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user) {
      res.json({ auth: true, value: req.user });
    } else {
      res.json({ auth: false });
    }
  }
);
router.post(
  "/update/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    console.log(data);
    try {
      if (req.user) {
        const update = await User.updateOne(
          { name: id },
          {
            faceId: data.facebookid,
            instaId: data.instaid,
            twitterId: data.twitterid,
            userDesp: data.userdesp,
          }
        );
      }
      res.json({ update: true });
    } catch (error) {
      console.log(error);
      res.json({ error: error });
    }
  }
);

router.get("/person/:id", (req, res) => {
  if (req.user) {
    return res.json({ auth: true, value: req.user });
  } else {
    return res.json({ auth: false });
  }
});
router.get(
  "/user/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const name = req.params.id;

    let userDeatils = await User.findOne({ name: name });

    if (req.user.name === userDeatils.name) {
      return res.json({ auth: true, user: userDeatils });
    } else {
      return res.json({ auth: false, user: userDeatils });
    }

    // if (req.user) {
    //   return res.json({ auth: true, value: req.user });
    // } else {
    //   return res.json({ auth: false });
    // }
  }
);
router.get("/otheruser/:id", async (req, res) => {
  const name = req.params.id;
  console.log(name);
  let userDeatils = await User.findOne({ name: name });
  if (userDeatils) {
    return res.json({ user: userDeatils });
  }
});
router.get("/logout", (req, res) => {
  res.redirect("https://imagesapp.netlify.app/");
});

router.post("/user/:id", async (req, res) => {
  const username = req.params.id;

  const body = req.body;

  let imageId = uuidv4();
  try {
    const data = await User.updateOne(
      { name: username },
      {
        $push: {
          imageData: {
            $each: [
              {
                id: imageId,
                description: body.description,
                imageUrl: body.url,
              },
            ],
          },
        },
      }
    );
    const userExists = await User.findOne({ name: username });
    if (userExists) {
      const image = new Image({
        name: userExists.name,
        imageid: imageId,
        profileUrl: userExists.profileUrl,
        imageUrl: body.url,
        description: body.description,
      });
      await image.save();
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/user/:id", async (req, res) => {
  const name = req.params.id;

  try {
    const Update = await User.updateOne(
      { name: name },
      { profileUrl: req.body.url }
    );
    const imageUpdate = await Image.updateOne(
      { name: name },
      { profileUrl: req.body.url }
    );
  } catch (error) {
    console.log(error);
  }
});

router.get("/uploads", async (req, res) => {
  try {
    const data = await Image.find({});
    res.json({ imageData: data });
  } catch (error) {
    console.log(data);
  }
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
  }),
  (req, res) => {}
);

router.get(
  "/auth/google/main",
  passport.authenticate("google", {
    session: false,
  }),
  (req, res) => {
    let token = jwt.sign({ user: req.user.email }, process.env.SECRECT_KEY);
    res.redirect("https://imagesapp.netlify.app/?user=" + token);
  }
);
router.delete("/delete", async (req, res) => {
  const user = req.query.user;
  const imageId = req.query.images;

  try {
    const data = await User.findOneAndUpdate(
      { name: user },
      {
        $pull: {
          imageData: {
            id: imageId,
          },
        },
      },
      { useFindAndModify: false }
    );

    const img = await Image.findOneAndDelete({
      imageid: imageId,
    });
    res.json({ value: true });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
