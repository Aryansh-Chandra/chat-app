import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
                scope: ['profile', 'email'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        // Update last login
                        user.lastSeen = new Date();
                        await user.save();
                        return done(null, user);
                    }

                    // Check if email already exists (user registered with email/password)
                    const existingEmailUser = await User.findOne({ email: profile.emails[0].value });

                    if (existingEmailUser) {
                        // Link Google account to existing user
                        existingEmailUser.googleId = profile.id;
                        if (!existingEmailUser.avatar) {
                            existingEmailUser.avatar = profile.photos[0]?.value;
                        }
                        await existingEmailUser.save();
                        return done(null, existingEmailUser);
                    }

                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0]?.value,
                        isVerified: true, // Google accounts are pre-verified
                    });

                    done(null, user);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
