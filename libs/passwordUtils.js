const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "..", "PRIV_KEY.pem");
const PRIV_KEY = fs.readFileSync(pathToKey, "utf8");

module.exports.genPassword = (password) => {
    const salt = crypto.randomBytes(32).toString("hex");
    const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return {
        salt: salt,
        hash: genHash,
    };
};

module.exports.validatePassword = (password, hash, salt) => {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === hashVerify;
};

module.exports.issueJWT = (user) => {
    const { id } = user;
    const expiresIn = "1d";
    const payload = {
        sub: id,
        iat: Date.now(),
    };

    const signedToken = jwt.sign(payload, PRIV_KEY, { expiresIn, algorithm: "RS256" });

    return {
        token: `Bearer ${signedToken}`,
        expires: expiresIn,
    };
};