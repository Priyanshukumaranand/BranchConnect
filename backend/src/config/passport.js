const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const APPROVED_DOMAIN = '@iiit-bh.ac.in';
const BRANCH_UPGRADE_WHITELIST = ['b222003@iiit-bh.ac.in'];

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, { message: 'Email not registered.' });
      }

      if (!user.password) {
        return done(null, false, { message: 'Account uses Google sign-in. Continue with Google.' });
      }

      const validPassword = await user.comparePassword(password);
      if (!validPassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.CALLBACK_URL) {
    passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
          return done(null, false, { message: 'Email permission is required.' });
        }

        const normalizedEmail = email.toLowerCase();
        const isBranchUpgrade = BRANCH_UPGRADE_WHITELIST.includes(normalizedEmail);
        const isInstituteEmail = normalizedEmail.endsWith(APPROVED_DOMAIN) || normalizedEmail.startsWith('b52');

        if (!isBranchUpgrade && !isInstituteEmail) {
          return done(null, false, { message: 'Institute email required.' });
        }

        const updates = {
          googleId: profile.id,
          name: profile.displayName,
          collegeId: normalizedEmail.substring(0, 7)
        };

        const user = await User.findOneAndUpdate(
          { email: normalizedEmail },
          updates,
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }
};
