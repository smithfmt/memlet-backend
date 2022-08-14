const base64url = require("base64url");
const crypto = require("crypto");
const verifyFunction = crypto.createVerify("RSA-SHA256");
const fs = require("fs");
const { createJWT } = require("./createJWT");

const JWT = createJWT();

const [ headerInBase64Url, payloadInBase64Url, signatureInBase64Url ] = JWT.split(".");

verifyFunction.write(`${headerInBase64Url}.${payloadInBase64Url}`);
verifyFunction.end();

const jwtSignatureBase64 = base64url.toBase64(signatureInBase64Url);

const PUB_KEY = fs.readFileSync(__dirname + "/pub_key.pem", "utf8");

const signatureIsValid = verifyFunction.verify(PUB_KEY, jwtSignatureBase64, "base64");

console.log(signatureIsValid);