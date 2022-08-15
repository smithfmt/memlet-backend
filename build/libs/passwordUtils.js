"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueJWT = exports.validatePassword = exports.genPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pathToKey = path_1.default.join(__dirname, "..", "PRIV_KEY.pem");
const PRIV_KEY = fs_1.default.readFileSync(pathToKey, "utf8");
const genPassword = password => {
    const salt = crypto_1.default.randomBytes(32).toString("hex");
    const genHash = crypto_1.default.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return {
        salt,
        hash: genHash,
    };
};
exports.genPassword = genPassword;
const validatePassword = (password, hash, salt) => {
    const hashVerify = crypto_1.default.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === hashVerify;
};
exports.validatePassword = validatePassword;
const issueJWT = user => {
    const { id } = user;
    const expiresIn = "1d";
    const payload = {
        sub: id,
        iat: Date.now(),
    };
    const signedToken = jsonwebtoken_1.default.sign(payload, PRIV_KEY, { expiresIn, algorithm: "RS256" });
    return {
        token: `Bearer ${signedToken}`,
        expires: expiresIn,
    };
};
exports.issueJWT = issueJWT;
