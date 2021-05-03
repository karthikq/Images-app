/** @format */

const GoogleStratergy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

const passportJWT = require("passport-jwt");
const JWTStratergy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = (passport) => {
  passport.use(
    new GoogleStratergy(
      {
        clientID:
          "116712494595-i2piqmau4qt60ll87lfue8i99hrd2eqs.apps.googleusercontent.com",
        clientSecret: "MXuIWILPwrV72a8Iqj-LmUxM",
        callbackURL:
          "https://shielded-sierra-36025.herokuapp.com/auth/google/main",
        passReqToCallback: true,
      },
      async (request, accessToken, refreshToken, profile, done) => {
        const data = await User.findOne({
          googleId: profile.id,
        });
        if (data) {
          return done(null, data);
        } else {
          let date = new Date();
          let user = new User({
            googleId: profile.id,
            name: profile.displayName.replace(/\s/g, ""),
            email: profile.emails[0].value,
            profileUrl: profile.photos[0].value,
            data: date.toLocaleDateString(),
          });
          await user.save();

          return done(null, user);
        }
      }
    )
  );
  passport.use(
    new JWTStratergy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRECT_KEY,
      },
      (jwtPayload, done) => {
        return User.findOne({ email: jwtPayload.user })
          .then((user) => {
            return done(null, user);
          })
          .catch((err) => {
            return done(err);
          });
      }
    )
  );
};
