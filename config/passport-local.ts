import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local"; 'passport-local';
import { validatePassword } from "../libs/passwordUtils";
import fetch from "node-fetch";

const customFields = {
    usertnameField: "username",
    passwordField: "password",
};

const verifyCallback = async (username:string, password:string, done:Function) => {
    try {
        const user:any = await fetch(`http://localhost:9000/userAPI/byUsername/${username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!user) return done(null, false);
        const isValid = validatePassword(password, user.hash, user.salt);
        if (isValid) return done(null, user);
        return done(null, false);
    } catch (err) {done(err)};
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (user:any, done) => {
    try{
        const userResponse = await fetch(`http://localhost:9000/userAPI/byId/${user.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        done(null, userResponse);
    } catch (err) {done(err)};
});
