const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const prisma = require("../libs/prisma");
const { genPassword, issueJWT, validatePassword } = require("../libs/passwordUtils");

exports.validateSignup = [
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

exports.signup = (req, res, next) => {
    const saltHash = genPassword(req.body.password);
    const { salt, hash} = saltHash;
    console.log(saltHash)
    prisma.user.create({
        data: {
          username: req.body.username,
          hash,
          salt,
          name: req.body.name,
        },
    })
    .then((user) => {
        const jwt = issueJWT(user)
        res.status(200).json({ success: true, user, token: jwt.token, expiresIn: jwt.expires });
    })
    .catch((e) => {
        console.log(e);
        res.status(401).json({ success: false, msg: "Sorry! That username is already taken!" })
    });
};

exports.validateLogin = [
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

exports.login = async (req, res, next) => {
    prisma.user.findUnique({
        where: {
            username: req.body.username,
        },
    })
    .then((user) => {
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
    })
    .catch((err) => {
        next(err);
    });
};

exports.validateUpdate = [
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

exports.updateProfile = async (req, res, next) => {
    console.log("updating!!!")
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { name, username, newPassword, oldPassword, avatar } = req.body;
    const user = await prisma.user.findUnique({
        where :{
            id,
        },
    });
    const isValid = validatePassword(oldPassword, user.hash, user.salt);
    if (!isValid) {
        res.status(401).json({ success: false, msg: "Sorry your password is incorrect!" });
    };
    const saltHash = genPassword(newPassword);
    const { salt, hash} = saltHash;

    prisma.user.update({
        where :{
            id,
        },
        data :{
            salt,
            hash,
            name,
            username,
            avatar,
        },
    })
    .then((user) => {
        res.status(200).json({ success: true, msg: "Successfully updated user!", user })
    })
    .catch(() => res.status(401).json({ success: false, msg: "Sorry! That username is already taken!" }));
};