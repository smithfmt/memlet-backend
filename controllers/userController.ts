import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import prisma from "../libs/prisma";
import { genPassword, issueJWT, validatePassword } from "../libs/passwordUtils";

export const validateSignup = [
    body("username", "You must supply a username").notEmpty(),
    body("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    body("password", "You must supply a password").notEmpty(),
    body("confirmedPassword", "Passwords do not match!").custom((value, { req }) => {
        return value === req.body.password;
    }),
    // Error Handler //
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        };
        next();
    },
];

export const signup = async (req, res) => {
    const saltHash = genPassword(req.body.password);
    const { salt, hash} = saltHash;
    console.log(saltHash)
    try {
        const user = await prisma.user.create({
            data: {
                username: req.body.username,
                hash,
                salt,
                name: req.body.name,
            },
        })
        const jwt = issueJWT(user)
        res.status(200).json({ success: true, user, token: jwt.token, expiresIn: jwt.expires });
    } catch (e) {
        console.log(e);
        res.status(401).json({ success: false, msg: "Error contacting Database", error: e })
    };
};

export const validateLogin = [
    body("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    // Error Handler //
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        };
        next();
    },
];

export const login = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username: req.body.username,
            },
        })
        if (!user) {
            res.status(401).json({ success: false, msg: "Sorry! No user exists with this username" });
        };
        const isValid = validatePassword(req.body.password, user.hash, user.salt);

        if (isValid) {
            const tokenObject = issueJWT(user);
            res.status(200).json({ success: true, user, token: tokenObject.token, expiresIn: tokenObject.expires });
        } else {
            res.status(401).json({ success: false, msg: "Sorry! You entered the wrong username or password" });
        };
    } catch (err) {next(err)};
};

export const validateUpdate = [
    body("username", "Please only use numbers and letters for your username").isAlphanumeric(),
    body("name", "Please only use numbers and letters for your name").custom((value) => {return value.match(/^[A-Za-z ]+$/)}),
    body("oldPassword", "You must supply your old password").notEmpty(),
    body("confirmedNewPassword", "New passwords do not match!").custom((value, { req }) => {
        return value === req.body.newPassword;
    }),
    // Error Handler //
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return errors.array().forEach(err => res.status(401).json({ success: false, msg: err.msg }));
        };
        next();
    },
];

export const updateProfile = async (req, res, next) => {
    console.log("updating!!!")
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const { name, username, newPassword, oldPassword, avatar } = req.body;
    const user = await prisma.user.findUnique({
        where :{
            id: parseInt(id),
        },
    });
    const isValid = validatePassword(oldPassword, user.hash, user.salt);
    if (!isValid) {
        res.status(401).json({ success: false, msg: "Sorry your password is incorrect!" });
    };
    const saltHash = genPassword(newPassword);
    const { salt, hash} = saltHash;

    try {
        const user = prisma.user.update({
            where :{
                id: parseInt(id),
            },
            data :{
                salt,
                hash,
                name,
                username,
                avatar,
            },
        })
        res.status(200).json({ success: true, msg: "Successfully updated user!", user })
    } catch(e) {res.status(401).json({ success: false, msg: "Sorry! That username is already taken!", error: e })};
};

export default {
    validateSignup,
    signup,
    validateLogin,
    login,
    validateUpdate,
    updateProfile,
};