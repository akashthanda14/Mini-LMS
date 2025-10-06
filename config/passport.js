import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateUserFromGoogle, findUserById } from '../services/googleAuthService.js';

const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_REDIRECT_URI;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
    const avatar = profile.photos?.[0]?.value;

    const user = await findOrCreateUserFromGoogle({ googleId, email, name, avatar, accessToken, refreshToken });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// The file configures passport on import; do not export anything.
