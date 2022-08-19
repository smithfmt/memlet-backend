"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJWT = void 0;
const base64url_1 = __importDefault(require("base64url"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const signatureFunction = crypto_1.default.createSign("RSA-SHA256");
const createJWT = () => {
    const headerObj = {
        alg: "RS256",
        typ: "JWT"
    };
    const payloadObj = {
        sub: "1234567890",
        name: "John Doe",
        admin: true,
        iat: 1516239022
    };
    const headerObjString = JSON.stringify(headerObj);
    const payloadObjString = JSON.stringify(payloadObj);
    const base64UrlHeader = (0, base64url_1.default)(headerObjString);
    const base64UrlPayload = (0, base64url_1.default)(payloadObjString);
    signatureFunction.write(`${base64UrlHeader}.${base64UrlPayload}`);
    signatureFunction.end();
    const PRIV_KEY = fs_1.default.readFileSync(__dirname + "/priv_key.pem", "utf8");
    const signatureBase64 = signatureFunction.sign(PRIV_KEY, "base64");
    const base64UrlSignature = base64url_1.default.fromBase64(signatureBase64);
    const JWT = `${base64UrlHeader}.${base64UrlPayload}.${base64UrlSignature}`;
    return JWT;
};
exports.createJWT = createJWT;
