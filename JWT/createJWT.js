const base64url = require("base64url");
const crypto = require("crypto");
const signatureFunction = crypto.createSign("RSA-SHA256");
const fs = require("fs");

module.exports.createJWT = () => {
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
    
    const base64UrlHeader = base64url(headerObjString);
    const base64UrlPayload = base64url(payloadObjString);
    
    signatureFunction.write(`${base64UrlHeader}.${base64UrlPayload}`);
    signatureFunction.end();
    
    const PRIV_KEY = fs.readFileSync(__dirname + "/priv_key.pem", "utf8");
    const signatureBase64 = signatureFunction.sign(PRIV_KEY, "base64");
    
    const base64UrlSignature = base64url.fromBase64(signatureBase64);
    
    JWT = `${base64UrlHeader}.${base64UrlPayload}.${base64UrlSignature}`;
    return JWT;
};

