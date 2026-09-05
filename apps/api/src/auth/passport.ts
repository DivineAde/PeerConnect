import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env, googleOAuthEnabled } from "../config/env";

// Google OAuth is optional: the brief explicitly requires that
// email/password auth keeps working if OAuth isn't configured, so we
// only register the strategy when credentials are actually present.
// See auth.routes.ts for how requests are rejected gracefully otherwise.
if (googleOAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google account has no email address."));
        }
        done(null, {
          googleId: profile.id,
          email,
          name: profile.displayName || email.split("@")[0],
          avatarUrl: profile.photos?.[0]?.value,
        });
      }
    )
  );
}

export { passport };
