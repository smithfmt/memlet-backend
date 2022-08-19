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
exports.updateProfile = exports.validateUpdate = exports.login = exports.validateLogin = exports.signup = exports.validateSignup = void 0;
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../libs/prisma"));
const passwordUtils_1 = require("../libs/passwordUtils");
exports.validateSignup = [
    (0, express_validator_1.body)("username", "You must supply a username").notEmpty(),
    (0, express_validator_1.body)("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    (0, express_validator_1.body)("password", "You must supply a password").notEmpty(),
    (0, express_validator_1.body)("confirmedPassword", "Passwords do not match!").custom((value, { req }) => {
        return value === req.body.password;
    }),
    // Error Handler //
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        }
        ;
        next();
    },
];
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const saltHash = (0, passwordUtils_1.genPassword)(req.body.password);
    const { salt, hash } = saltHash;
    console.log(saltHash);
    try {
        const user = yield prisma_1.default.user.create({
            data: {
                username: req.body.username,
                hash,
                salt,
                name: req.body.name,
            },
        });
        const jwt = (0, passwordUtils_1.issueJWT)(user);
        res.status(200).json({ success: true, user, token: jwt.token, expiresIn: jwt.expires });
    }
    catch (e) {
        console.log(e);
        res.status(401).json({ success: false, msg: "Sorry! That username is already taken!", error: e });
    }
    ;
});
exports.signup = signup;
exports.validateLogin = [
    (0, express_validator_1.body)("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    // Error Handler //
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        }
        ;
        next();
    },
];
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: {
                username: req.body.username,
            },
        });
        if (!user) {
            res.status(401).json({ success: false, msg: "Sorry! No user exists with this username" });
        }
        ;
        const isValid = (0, passwordUtils_1.validatePassword)(req.body.password, user.hash, user.salt);
        if (isValid) {
            const tokenObject = (0, passwordUtils_1.issueJWT)(user);
            res.status(200).json({ success: true, user, token: tokenObject.token, expiresIn: tokenObject.expires });
        }
        else {
            res.status(401).json({ success: false, msg: "Sorry! You entered the wrong username or password" });
        }
        ;
    }
    catch (err) {
        next(err);
    }
    ;
});
exports.login = login;
exports.validateUpdate = [
    (0, express_validator_1.body)("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    (0, express_validator_1.body)("name", "Please only use numbers and letters for your name").custom((value) => { return value.match(/^[A-Za-z ]+$/); }),
    (0, express_validator_1.body)("oldPassword", "You must supply your old password").notEmpty(),
    (0, express_validator_1.body)("confirmedNewPassword", "New passwords do not match!").custom((value, { req }) => {
        return value === req.body.newPassword;
    }),
    // Error Handler //
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        }
        ;
        next();
    },
];
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("updating!!!");
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const { name, username, newPassword, oldPassword, avatar } = req.body;
    const user = yield prisma_1.default.user.findUnique({
        where: {
            id: parseInt(id),
        },
    });
    const isValid = (0, passwordUtils_1.validatePassword)(oldPassword, user.hash, user.salt);
    if (!isValid) {
        res.status(401).json({ success: false, msg: "Sorry your password is incorrect!" });
    }
    ;
    const saltHash = (0, passwordUtils_1.genPassword)(newPassword);
    const { salt, hash } = saltHash;
    try {
        const user = prisma_1.default.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                salt,
                hash,
                name,
                username,
                avatar,
            },
        });
        res.status(200).json({ success: true, msg: "Successfully updated user!", user });
    }
    catch (e) {
        res.status(401).json({ success: false, msg: "Sorry! That username is already taken!", error: e });
    }
    ;
});
exports.updateProfile = updateProfile;
exports.default = {
    validateSignup: exports.validateSignup,
    signup: exports.signup,
    validateLogin: exports.validateLogin,
    login: exports.login,
    validateUpdate: exports.validateUpdate,
    updateProfile: exports.updateProfile,
};
