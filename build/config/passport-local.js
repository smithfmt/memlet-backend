"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
'passport-local';
const passwordUtils_1 = require("../libs/passwordUtils");
const node_fetch_1 = __importDefault(require("node-fetch"));
const customFields = {
    usertnameField: "username",
    passwordField: "password",
};
const verifyCallback = (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, node_fetch_1.default)(`http://localhost:9000/userAPI/byUsername/${username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!user)
            return done(null, false);
        const isValid = (0, passwordUtils_1.validatePassword)(password, user.hash, user.salt);
        if (isValid)
            return done(null, user);
        return done(null, false);
    }
    catch (err) {
        done(err);
    }
    ;
});
const strategy = new passport_local_1.Strategy(customFields, verifyCallback);
passport_1.default.use(strategy);
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser((user, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userResponse = yield (0, node_fetch_1.default)(`http://localhost:9000/userAPI/byId/${user.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        done(null, userResponse);
    }
    catch (err) {
        done(err);
    }
    ;
}));
