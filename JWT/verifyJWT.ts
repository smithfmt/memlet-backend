import base64url from "base64url";
import crypto from "crypto";
import fs from "fs";
import { createJWT } from "./createJWT";
const verifyFunction = crypto.createVerify("RSA-SHA256");
const JWT = createJWT();
const [ headerInBase64Url, payloadInBase64Url, signatureInBase64Url ] = JWT.split(".");

verifyFunction.write(`${headerInBase64Url}.${payloadInBase64Url}`);
verifyFunction.end();

const jwtSignatureBase64 = base64url.toBase64(signatureInBase64Url);

const PUB_KEY = fs.readFileSync(__dirname + "/pub_key.pem", "utf8");

const signatureIsValid = verifyFunction.verify(PUB_KEY, jwtSignatureBase64, "base64");

console.log(signatureIsValid);