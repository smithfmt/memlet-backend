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
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const userController_1 = __importDefault(require("../controllers/userController"));
const answerController_1 = __importDefault(require("../controllers/answerController"));
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../helpers");
const router = express_1.default.Router();
router.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
// Api is Working //
router.get("/", (req, res, next) => {
    res.send(`userAPI is working properly :)`);
});
// Routes
router.post("/signup", userController_1.default.validateSignup, userController_1.default.signup);
router.post("/login", userController_1.default.validateLogin, userController_1.default.login);
router.get("/dashboard", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
}, passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const user = yield prisma.user.findUnique({
        where: {
            id: parseInt(id),
        },
        select: {
            id: true,
            username: true,
            name: true,
            wordlists: true,
            avatar: true,
            folders: true,
        },
    });
    res.status(200).json({ success: true, msg: `Welcome to your Dashboard`, user });
}));
router.get("/bigtest", (req, res) => {
    res.status(200).json({ success: true, msg: "WORKING WELL INDEED" });
});
router.post("/create", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const { words, title, langs } = req.body.wordlist;
    if (!words.length) {
        res.status(401).json({ success: false, msg: `No Words Submitted` });
    }
    else if (!title) {
        res.status(401).json({ success: false, msg: `No Title Submitted` });
    }
    else {
        const ref = (0, helpers_1.slugify)(title);
        const result = yield prisma.wordlist.create({
            data: {
                title,
                langs,
                reference: ref,
                userId: parseInt(id),
                length: words.length,
            },
        });
        words.map(item => {
            item.wordlistId = result.id;
            item.langs = langs;
            delete item.id;
            return item;
        });
        yield prisma.wordlist_item.createMany({
            data: [
                ...words
            ],
        });
        res.status(200).json({ success: true, msg: `Successfully Posted to DB` });
    }
    ;
}));
router.get("/edit", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = yield prisma.wordlist.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
        include: {
            words: true,
        },
    });
    if (parseInt(id) === wordlist.userId) {
        res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.put("/edit", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const jwtId = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, title, langs, id, wordlist, toDelete } = req.body;
    if (jwtId === userId) {
        if (!title) {
            res.status(401).json({ success: false, msg: `No Title Submitted` });
        }
        else {
            yield prisma.wordlist.updateMany({
                where: {
                    userId,
                    id: parseInt(id),
                },
                data: {
                    title,
                    langs,
                    reference: (0, helpers_1.slugify)(title),
                    length: wordlist.length,
                },
            });
            wordlist.forEach((entry) => __awaiter(void 0, void 0, void 0, function* () {
                if (entry.wordlistId) {
                    yield prisma.wordlist_item.update({
                        where: {
                            id: entry.id,
                        },
                        data: {
                            word: entry.word,
                            translation: entry.translation,
                            langs,
                        },
                    });
                }
                else {
                    yield prisma.wordlist_item.create({
                        data: Object.assign(Object.assign({}, entry), { wordlistId: parseInt(id), langs }),
                    });
                }
                ;
            }));
            if (toDelete) {
                toDelete.forEach((id) => __awaiter(void 0, void 0, void 0, function* () {
                    yield prisma.wordlist_item.delete({
                        where: {
                            id
                        },
                    });
                }));
            }
            ;
            res.status(200).json({ success: true, msg: "Successfully Updated your wordlist!" });
        }
        ;
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.delete("/edit", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, wordlistId } = req.query;
    if (parseInt(id) === parseInt(userId)) {
        const wordlistItems = yield prisma.wordlist_item.findMany({
            where: {
                wordlistId: parseInt(wordlistId),
            }
        });
        const wordlistItemsIdList = wordlistItems.map(item => { return item.id; });
        yield prisma.test_answer.deleteMany({
            where: {
                wordlistItemId: { in: wordlistItemsIdList },
            },
        });
        yield prisma.wordlist_item.deleteMany({
            where: {
                wordlistId: parseInt(wordlistId),
            },
        });
        yield prisma.wordlist.delete({
            where: {
                id: parseInt(wordlistId),
            },
        });
        res.status(200).json({ success: true, msg: "Successfully Deleted your wordlist!" });
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.get("/play", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = yield prisma.wordlist.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
        include: {
            words: true,
        },
    });
    if (parseInt(id) === wordlist.userId) {
        res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.post("/answer", passport_1.default.authenticate("jwt", { session: false }), answerController_1.default.checkAnswer);
router.get("/stats", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlistItems = yield prisma.wordlist_item.findMany({
        where: {
            wordlistId: parseInt(req.query.id),
        },
        include: {
            test_answers: true,
        },
    });
    const wordlist = yield prisma.wordlist.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
    });
    if (wordlist.userId === parseInt(id)) {
        res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems });
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.get("/all-stats", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlists = yield prisma.wordlist.findMany({
        where: {
            userId: parseInt(id),
        },
    });
    const wordlistIds = wordlists.map(list => { return list.id; });
    const wordlistItems = yield prisma.wordlist_item.findMany({
        where: {
            wordlistId: { in: wordlistIds },
        },
        include: {
            test_answers: true,
        },
    });
    let answers = [];
    wordlistItems.forEach(item => answers = [...answers, ...item.test_answers]);
    const sortedListItems = wordlistItems.sort((a, b) => {
        const reducer = (acc, cur) => { acc + (cur.correct ? 1 : -1); };
        return b.test_answers.reduce(reducer, 0) - a.test_answers.reduce(reducer, 0);
    });
    // if (wordlist.userId === id) {
    res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems: sortedListItems, answers });
    // } else {
    //   res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    // };
}));
router.get("/dynamic", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlistItems = yield prisma.wordlist_item.findMany({
        where: {
            wordlistId: parseInt(req.query.id),
        },
        include: {
            test_answers: true,
        },
    });
    const wordlist = yield prisma.wordlist.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
    });
    wordlist.words = wordlistItems.sort((prev, next) => {
        let prevScore = 0;
        let nextScore = 0;
        prev.test_answers.forEach(ans => {
            prevScore = prevScore + (ans.correct_percentage / 100);
            if (!ans.correct)
                prevScore--;
        });
        next.test_answers.forEach(ans => {
            nextScore = nextScore + (ans.correct_percentage / 100);
            if (!ans.correct)
                nextScore--;
        });
        return prevScore - nextScore;
    });
    if (wordlist.userId === id) {
        res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    }
    else {
        res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    }
    ;
}));
router.put("/profile", passport_1.default.authenticate("jwt", { session: false }), userController_1.default.validateUpdate, userController_1.default.updateProfile);
router.get("/everything", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlists = yield prisma.wordlist.findMany({
        where: {
            userId: parseInt(id),
        },
        include: {
            words: true,
        },
    });
    let wordlistItems = [];
    wordlists.forEach(list => wordlistItems = [...wordlistItems, ...list.words]);
    if (wordlistItems.length) {
        const wordlist = { title: "Learn", langs: "word-translation", words: wordlistItems };
        res.status(200).json({ success: true, msg: "Here are all your words!", wordlist });
    }
    else {
        res.status(401).json({ success: false, msg: "You have no words!" });
    }
    ;
}));
router.get("/everything-dynamic", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlists = yield prisma.wordlist.findMany({
        where: {
            userId: parseInt(id),
        },
    });
    let wordlistItems = [];
    const idList = wordlists.map(list => { return list.id; });
    const items = yield prisma.wordlist_item.findMany({
        where: {
            wordlistId: { in: idList },
        },
        include: {
            test_answers: true,
        },
    });
    wordlistItems = [...wordlistItems, ...items];
    ;
    const dynamicWords = wordlistItems.sort((prev, next) => {
        let prevScore = 0;
        let nextScore = 0;
        prev.test_answers.forEach(ans => {
            prevScore = prevScore + (ans.correct_percentage / 100);
            if (!ans.correct)
                prevScore--;
        });
        next.test_answers.forEach(ans => {
            nextScore = nextScore + (ans.correct_percentage / 100);
            if (!ans.correct)
                nextScore--;
        });
        return prevScore - nextScore;
    });
    if (dynamicWords.length) {
        const wordlist = { title: "Learn", langs: "word-translation", words: dynamicWords };
        res.status(200).json({ success: true, msg: "Here are all your words!", wordlist });
    }
    else {
        res.status(401).json({ success: false, msg: "You have no words!" });
    }
    ;
}));
router.get("/explore", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let wordlists = yield prisma.wordlist.findMany();
    if (!wordlists) {
        res.status(401).json({ success: false, msg: "Error contacting database!" });
    }
    const users = yield prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
        },
    });
    wordlists.map(list => {
        list.user = users.filter(user => user.id === list.userId)[0];
        return list;
    });
    wordlists = wordlists.filter(list => !list.private).sort((a, b) => {
        if (b.upvoted.length === a.upvoted.length) {
            return b.copied - a.copied;
        }
        else {
            return b.upvoted.length - a.upvoted.length;
        }
        ;
    });
    res.status(200).json({ success: true, msg: "Here are all wordlists!", wordlists });
}));
router.put("/copy", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, copied } = req.body;
    prisma.wordlist.update({
        where: {
            id,
        },
        data: {
            copied: copied + 1,
        },
    })
        .then(() => res.status(200).json({ success: true, msg: "Successfully added 1 to copied!" }))
        .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
}));
router.put("/upvote", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const { id, upvoted } = req.body;
    const newUpvoted = !upvoted.includes(userId) ? [...upvoted, userId] : upvoted.filter(id => id !== userId);
    prisma.wordlist.update({
        where: {
            id,
        },
        data: {
            upvoted: newUpvoted,
        },
    })
        .then((response) => {
        console.log(response.upvoted);
        res.status(200).json({ success: true, msg: "Successfully upvoted!", response });
    })
        .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
}));
router.get("/explore-list", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = yield prisma.wordlist.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
        include: {
            words: true,
        },
    });
    if (wordlist.words) {
        res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist, user: id });
    }
    else {
        res.status(401).json({ success: false, msg: "No wordlist found!" });
    }
    ;
}));
router.post("/create-folder", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { folder } = req.body;
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const createdFolder = yield prisma.folder.create({
        data: {
            name: folder.name,
            length: folder.length,
            userId: parseInt(id),
        },
    });
    const success = yield prisma.wordlist.updateMany({
        where: {
            id: { in: folder.wordlists },
        },
        data: {
            folderId: createdFolder.id,
        },
    });
    if (success) {
        res.status(200).json({ successful: true, msg: "Successfully created Folder", createdFolder, success });
    }
    else {
        res.status(401).json({ success: false, msg: "Failure to create Folder!" });
    }
    ;
}));
router.get("/folderById", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const folder = yield prisma.folder.findUnique({
        where: {
            id: parseInt(req.query.id),
        },
        include: {
            wordlists: true,
        },
    })
        .catch(err => {
        res.status(401).json({ success: false, msg: "No Folder Found!" });
    });
    if (folder.userId === id) {
        res.status(200).json({ success: true, msg: "Here is your folder", folder });
    }
    else {
        res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    }
    ;
}));
router.put("/removeWordlistsFromFolder", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    const folder = yield prisma.folder.findUnique({
        where: {
            id: parseInt(req.body.folderId),
        },
    });
    if (parseInt(id) !== folder.userId) {
        res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    }
    else {
        const updateFolder = prisma.folder.update({
            where: {
                id: parseInt(req.body.folderId),
            },
            data: {
                length: req.body.length,
            },
        })
            .catch(err => {
            res.status(401).json({ success: false, msg: "No Folder Found!" });
        });
        const updateWordlists = prisma.wordlist.updateMany({
            where: {
                id: { in: req.body.idArray },
            },
            data: {
                folderId: null,
            },
        })
            .catch(err => {
            res.status(401).json({ success: false, msg: "No Folder Found!" });
        });
        yield Promise.all([updateFolder, updateWordlists]);
        res.status(200).json({ success: true, msg: "Here is your folder", folder });
    }
    ;
}));
router.delete("/deleteFolder", passport_1.default.authenticate("jwt", { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = jsonwebtoken_1.default.decode(req.headers.authorization.split(" ")[1]).sub;
    console.log(req.query);
    yield prisma.folder.deleteMany({
        where: {
            id: parseInt(req.query.wordlistId),
            userId: parseInt(id),
        },
    })
        .catch(err => {
        res.status(401).json({ success: false, msg: "You don't own this folder!" });
    });
    res.status(200).json({ success: true, msg: "Successfully deleted folder!" });
}));
exports.default = router;
