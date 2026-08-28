const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },

    async (req, accessToken, refreshToken, profile, done) => {
      try {

        const mode = req.query.state; // login / signup

        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        // ==========================
        // SIGNUP WITH GOOGLE
        // ==========================
        if (mode === "signup") {

          if (user) {
            return done(null, false, {
              message: "already_registered",
            });
          }

          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            provider: "google",
            avatar: profile.photos?.[0]?.value || "",
          });

          return done(null, user);
        }

        // ==========================
        // LOGIN WITH GOOGLE
        // ==========================

        if (user) {
          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          provider: "google",
          avatar: profile.photos?.[0]?.value || "",
        });

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);