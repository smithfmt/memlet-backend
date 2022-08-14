const fs = require("fs");
const path = require("path");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const prisma = require("../libs/prisma");

const pathToKey = path.join(__dirname, "..", "PUB_KEY.pem");
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ["RS256"], 
};

const strategy = new JwtStrategy(options, (payload, done) => {
    prisma.user.findUnique({
        where: {
            id: payload.sub,
          },
    })
    .then((user) => {
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        };
    })
    .catch(err => done(err, null));
});

module.exports = (passport) => {passport.use(strategy)};
