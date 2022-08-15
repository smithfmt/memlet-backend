import fs from "fs";
import path from "path";
import { Strategy as JwtStrategy, ExtractJwt} from "passport-jwt";
import prisma from "../libs/prisma";

const pathToKey = path.join(__dirname, "..", "PUB_KEY.pem");
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ["RS256"],
};

const strategy = new JwtStrategy(options, async (payload, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: payload.sub,
              },
        })
        if (user) return done(null, user);
        return done(null, false);
    } catch(err) {done(err, null)};
});

export default passport => passport.use(strategy);
