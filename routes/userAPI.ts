import express from "express";
import { PrismaClient } from "@prisma/client";
import userController from "../controllers/userController";
import answerController from "../controllers/answerController";
import passport from "passport";
import jwt from "jsonwebtoken";
import { slugify } from "../helpers";
const router = express.Router();
router.use(express.json());

const prisma = new PrismaClient();

// Api is Working //

router.get("/", (req, res, next) => {
  res.send(`userAPI is working properly :)`);
});

// Routes

router.post("/signup",
  userController.validateSignup,
  userController.signup,
);

router.post("/login",
  userController.validateLogin,
  userController.login,
);

router.get("/dashboard",
  (req,res,next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next()
  },
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const user = await prisma.user.findUnique({
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
    res.status(200).json({ success: true, msg: `Welcome to your Dashboard`, user })
  },
);

router.get("/bigtest", (req,res) => {
  res.status(200).json({success: true, msg: "WORKING WELL INDEED"})
})

router.post("/create",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const { words, title, langs } = req.body.wordlist;
    if (!words.length) {
      res.status(401).json({ success: false, msg: `No Words Submitted` });
    } else if (!title) {
      res.status(401).json({ success: false, msg: `No Title Submitted` });
    } else {
      const ref = slugify(title)
      const result = await prisma.wordlist.create({
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
      await prisma.wordlist_item.createMany({
        data: [
          ...words
        ],
      });
      res.status(200).json({ success: true, msg: `Successfully Posted to DB` })
    };
  },
);

router.get("/edit",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
      include :{
        words: true,
      },
    });
    if (parseInt(id) === wordlist.userId) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.put("/edit",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    console.log(req.body)
    const jwtId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, title, langs, id, wordlist, toDelete } = req.body;
    if (jwtId === userId) {
      if (!title) {
        res.status(401).json({ success: false, msg: `No Title Submitted` });
      } else {
        await prisma.wordlist.updateMany({
          where: {
            userId,
            id: parseInt(id),
          },
          data: {
            title,
            langs,
            reference: slugify(title),
            length: wordlist.length,
          },
        });
        wordlist.forEach(async entry => {
          if (entry.wordlistId) {
            await prisma.wordlist_item.update({
              where: {
                id: entry.id,
              },
              data: {
                word: entry.word,
                translation: entry.translation,
                langs,
              },
            });
          } else {
            await prisma.wordlist_item.create({
              data: {
                ...entry,
                wordlistId: parseInt(id),
                langs,
              },
            });
          };
        });
        if (toDelete) {
          toDelete.forEach(async id => {
            await prisma.wordlist_item.delete({
              where: {
                id
              },
            });
          });
        };
        res.status(200).json({ success: true, msg: "Successfully Updated your wordlist!" });
      };
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.delete("/edit",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const { userId, wordlistId } = req.query;
    if (parseInt(id) === parseInt(userId as string)) {
      const wordlistItems = await prisma.wordlist_item.findMany({
        where: {
          wordlistId: parseInt(wordlistId as string),
        }
      });
      const wordlistItemsIdList = wordlistItems.map(item => {return item.id});
      await prisma.test_answer.deleteMany({
        where: {
          wordlistItemId: { in: wordlistItemsIdList },
        },
      });
      await prisma.wordlist_item.deleteMany({
        where: {
          wordlistId: parseInt(wordlistId as string),
        },
      });
      await prisma.wordlist.delete({
        where: {
          id: parseInt(wordlistId as string),
        },
      });
      res.status(200).json({ success: true, msg: "Successfully Deleted your wordlist!" });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.get("/play",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
      include :{
        words: true,
      },
    });
    if (parseInt(id) === wordlist.userId) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.post("/answer",
  passport.authenticate("jwt", {session: false}),
  answerController.checkAnswer
);

router.get("/stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlistItems = await prisma.wordlist_item.findMany({
      where :{
        wordlistId: parseInt(req.query.id as string),
      },
      include :{
        test_answers: true,
      },
    });
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
    });
    if (wordlist.userId === parseInt(id)) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.get("/all-stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlists = await prisma.wordlist.findMany({
      where: {
        userId: parseInt(id),
      },
    });
    const wordlistIds = wordlists.map(list => {return list.id});
    const wordlistItems = await prisma.wordlist_item.findMany({
      where: {
        wordlistId: { in: wordlistIds },
      },
      include: {
        test_answers: true,
      },
    });
    let answers = [];
    wordlistItems.forEach(item => answers = [...answers, ...item.test_answers]);
    const sortedListItems = wordlistItems.sort((a,b) => {
      const reducer = (acc, cur) => {acc + (cur.correct ? 1 : -1); }
      return b.test_answers.reduce(reducer, 0) - a.test_answers.reduce(reducer, 0);
    });
    // if (wordlist.userId === id) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems: sortedListItems, answers });
    // } else {
    //   res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    // };
  },
);

router.get("/dynamic",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlistItems = await prisma.wordlist_item.findMany({
      where :{
        wordlistId: parseInt(req.query.id as string),
      },
      include :{
        test_answers: true,
      },
    });
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
    }) as any;
    wordlist.words = wordlistItems.sort((prev, next) => {
        let prevScore = 0;
        let nextScore = 0;
        prev.test_answers.forEach(ans => {
            prevScore = prevScore + (ans.correct_percentage/100);
            if (!ans.correct) prevScore--
        });
        next.test_answers.forEach(ans => {
            nextScore = nextScore + (ans.correct_percentage/100);
            if (!ans.correct) nextScore--
        });
        return prevScore - nextScore;
    });
    if (wordlist.userId === id) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.put("/profile",
  passport.authenticate("jwt", {session: false}),
  userController.validateUpdate,
  userController.updateProfile,
);

router.get("/everything",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlists = await prisma.wordlist.findMany({
      where :{
        userId: parseInt(id),
      },
      include :{
        words: true,
      },
    });
    let wordlistItems = [];
    wordlists.forEach(list => wordlistItems = [...wordlistItems, ...list.words]);
    if (wordlistItems.length) {
      const wordlist = { title: "Learn", langs: "word-translation", words: wordlistItems }
      res.status(200).json({ success: true, msg: "Here are all your words!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "You have no words!" });
    };
  },
);

router.get("/everything-dynamic",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlists = await prisma.wordlist.findMany({
      where :{
        userId: parseInt(id),
      },
    });
    let wordlistItems = [];
    const idList = wordlists.map(list => {return list.id});
    const items = await prisma.wordlist_item.findMany({
      where :{
        wordlistId: { in: idList },
      },
      include :{
        test_answers: true,
      },
    });
    wordlistItems = [...wordlistItems, ...items];;
    const dynamicWords = wordlistItems.sort((prev, next) => {
      let prevScore = 0;
      let nextScore = 0;
      prev.test_answers.forEach(ans => {
          prevScore = prevScore + (ans.correct_percentage/100);
          if (!ans.correct) prevScore--
      });
      next.test_answers.forEach(ans => {
          nextScore = nextScore + (ans.correct_percentage/100);
          if (!ans.correct) nextScore--
      });
      return prevScore - nextScore;
    });
    if (dynamicWords.length) {
      const wordlist = { title: "Learn", langs: "word-translation", words: dynamicWords }
      res.status(200).json({ success: true, msg: "Here are all your words!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "You have no words!" });
    };
  },
);

router.get("/explore",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    let wordlists = await prisma.wordlist.findMany() as any;
    if (!wordlists) {res.status(401).json({ success: false, msg: "Error contacting database!" })}
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    });
    wordlists.map(list => {
      list.user = users.filter(user => user.id===list.userId)[0];
      return list;
    });
    wordlists = wordlists.filter(list => !list.private).sort((a, b) => {
      if (b.upvoted.length === a.upvoted.length) {
        return b.copied - a.copied;
      } else {
        return b.upvoted.length - a.upvoted.length;
      };
    });
    res.status(200).json({ success: true, msg: "Here are all wordlists!", wordlists });
  },
);

router.put("/copy",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const { id, copied } = req.body;
    prisma.wordlist.update({
      where: {
        id,
      },
      data: {
        copied: copied+1,
      },
    })
    .then(() => res.status(200).json({ success: true, msg: "Successfully added 1 to copied!" }))
    .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
  },
);

router.put("/upvote",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const userId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { id, upvoted } = req.body;
    const newUpvoted = !upvoted.includes(userId) ? [...upvoted, userId] : upvoted.filter(id => id!==userId);
    prisma.wordlist.update({
      where: {
        id,
      },
      data: {
        upvoted: newUpvoted,
      },
    })
    .then((response) => {console.log(response.upvoted)
    res.status(200).json({ success: true, msg: "Successfully upvoted!", response })})
    .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
  },
);

router.get("/explore-list",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
      include :{
        words: true,
      },
    });
    if (wordlist.words) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist, user: id });
    } else {
      res.status(401).json({ success: false, msg: "No wordlist found!" });
    };
  },
);

router.post("/create-folder",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const { folder } = req.body;
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const createdFolder = await prisma.folder.create({
      data: {
        name: folder.name,
        length: folder.length,
        userId: parseInt(id),
      },
    });
    const success = await prisma.wordlist.updateMany({
      where: {
        id: { in: folder.wordlists },
      },
      data: {
        folderId: createdFolder.id,
      },
    });
    if (success) {
      res.status(200).json({ successful: true, msg: "Successfully created Folder", createdFolder, success });
    } else {
      res.status(401).json({ success: false, msg: "Failure to create Folder!" });
    };
  },
);

router.get("/folderById",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const folder = await prisma.folder.findUnique({
      where: {
        id: parseInt(req.query.id as string),
      },
      include: {
        wordlists: true,
      },
    })
    .catch(err => {
      res.status(401).json({ success: false, msg: "No Folder Found!" });
    }) as any
    if (folder.userId===id) {
      res.status(200).json({ success: true, msg: "Here is your folder", folder });
    } else {
      res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    };
  },
);

router.put("/removeWordlistsFromFolder",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const folder = await prisma.folder.findUnique({
      where: {
        id: parseInt(req.body.folderId),
      },
    });
    if (parseInt(id)!==folder.userId) {
      res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    } else {
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
          id: {in: req.body.idArray},
        },
        data: {
          folderId: null,
        },
      })
      .catch(err => {
        res.status(401).json({ success: false, msg: "No Folder Found!" });
      });
      await Promise.all([updateFolder, updateWordlists]);
      res.status(200).json({ success: true, msg: "Here is your folder", folder });
    };
  },
);

router.delete("/deleteFolder",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    console.log(req.query)
    await prisma.folder.deleteMany({
      where: {
        id: parseInt(req.query.wordlistId as string),
        userId: parseInt(id),
      },
    })
    .catch(err => {
      res.status(401).json({ success: false, msg: "You don't own this folder!" });
    });
    res.status(200).json({ success: true, msg: "Successfully deleted folder!" });
  },
);

export default router;
