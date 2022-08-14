const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const validatePassword = require("../libs/passwordUtils").validatePassword;
const fetch = require("node-fetch");

const customFields = {
    usertnameField: "username",
    passwordField: "password",
};

const verifyCallback = (username, password, done) => {
    fetch(`http://localhost:9000/userAPI/byUsername/${username}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    .then((user) => {
        if (!user) {
            return done(null, false)
        };
        const isValid = validatePassword(password, user.hash, user.salt);
        
        if (isValid) {
            return done(null, user);
        } else {
            return done(null, false);
        };
    })
    .catch((err) => {
        done(err);
    });
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((user, done) => {
    fetch(`http://localhost:9000/userAPI/byId/${user.id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    .then((user) => {
        done(null, user);
    })
    .catch(err => done(err));
});
