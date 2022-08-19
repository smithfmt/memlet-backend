"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base64url_1 = __importDefault(require("base64url"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const createJWT_1 = require("./createJWT");
const verifyFunction = crypto_1.default.createVerify("RSA-SHA256");
const JWT = (0, createJWT_1.createJWT)();
const [headerInBase64Url, payloadInBase64Url, signatureInBase64Url] = JWT.split(".");
verifyFunction.write(`${headerInBase64Url}.${payloadInBase64Url}`);
verifyFunction.end();
const jwtSignatureBase64 = base64url_1.default.toBase64(signatureInBase64Url);
const PUB_KEY = fs_1.default.readFileSync(__dirname + "/pub_key.pem", "utf8");
const signatureIsValid = verifyFunction.verify(PUB_KEY, jwtSignatureBase64, "base64");
console.log(signatureIsValid);
