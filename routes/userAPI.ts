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
    const { words, title, langs, priv } = req.body.wordlist;
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
          private: priv
        },
      });
      const newWords = words.map(item => {
        item.wordlistId = result.id;
        item.langs = langs;
        delete item.id;
        item.translation = item.translation.trim();
        item.word = item.word.trim();
        return item;
      });
      console.log(newWords)
      await prisma.wordlist_item.createMany({
        data: [
          ...newWords
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
    const jwtId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, title, langs, id, wordlist, toDelete, priv } = req.body;
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
            private: priv,
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
          const wordlistItems = await prisma.wordlist_item.findMany({
            where: {
              id: {in:toDelete},
            },
            include: {
              test_answers: true,
            },
          });
          const testAnswerIds = [];
          wordlistItems.forEach(item => {
            item.test_answers.forEach(ans => testAnswerIds.push(ans.id))
          });
          await prisma.test_answer.deleteMany({
            where: {
              id: {
                in: testAnswerIds,
              },
            },
          });
          await prisma.wordlist_item.deleteMany({
            where: {
              id: {
                in: toDelete,
              },
            },
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
    let wordlist;
    let folderId = parseInt(req.query.folderId as string);
    if (folderId) {
      const wordlists = await prisma.wordlist.findMany({
        where :{
          folderId,
        },
        include: {
          words: true,
        },
      });
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
      });
      let folderList = {words: [], userId: folder.userId, length: 0, langs: "english-english", title: "folderlist"};
      wordlists.forEach(listObj => {
        folderList.words = [...folderList.words, ...listObj.words];
        folderList.length = folderList.length + listObj.words.length;
        folderList.langs = listObj.langs
        folderList.title = folder.name
      });
      if (parseInt(id) === folder.userId) {
        res.status(200).json({ success: true, msg: "Here is your folderList!", wordlist: folderList });
      } else {
        res.status(401).json({ success: false, msg: "This folder does not belong to this user!" });
      };
    } else {
      wordlist = await prisma.wordlist.findUnique({
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

router.get("/folder-stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const folder = await prisma.folder.findUnique({
      where :{
        id: parseInt(req.query.id as string),
      },
      include : {
        wordlists: true,
      },
    });
    const wordlistIds = folder.wordlists.map(list => {return list.id});
    if (folder.userId === parseInt(id)) {
      const wordlistItems = await prisma.wordlist_item.findMany({
        where :{
          wordlistId: { in: wordlistIds },
        },
        include :{
          test_answers: true,
        },
      });
      let answers = [];
      wordlistItems.forEach(item => answers = [...answers, ...item.test_answers]);
      const sortedListItems = wordlistItems.sort((a,b) => {
        const reducer = (acc, cur) => {acc + (cur.correct ? 1 : -1); }
        return b.test_answers.reduce(reducer, 0) - a.test_answers.reduce(reducer, 0);
      });
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems: sortedListItems, answers });
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
    console.log(answers)
    const sortedListItems = wordlistItems.sort((a,b) => {
      const reducer = (acc, cur) => {acc + (cur.correct ? 1 : -1); }
      return b.test_answers.reduce(reducer, 0) - a.test_answers.reduce(reducer, 0);
    });
  res.status(200).json({ success: true, msg: "Here is your stats!", wordlistItems: sortedListItems, answers });
  },
);
router.get("/graph-all-stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const wordlists = await prisma.wordlist.findMany({
      where: {
        userId: parseInt(id),
      },
    });
    const wordlistIds = wordlists.map(list => {return list.id});
    let wordlistItems = await prisma.wordlist_item.findMany({
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
    answers = answers.length>400?answers.slice(answers.length-400,answers.length):answers;
  res.status(200).json({ success: true, msg: "Here is your stats!", wordlistItems: sortedListItems, answers });
  },
);

router.get("/dynamic",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    let folderId = parseInt(req.query.folderId as string);
    if (folderId) {
      const wordlists = await prisma.wordlist.findMany({
        where :{
          folderId,
        },
        include: {
          words: true,
        },
      });
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
      });
      let folderList = {words: [], userId: folder.userId, length: 0, langs: "english-english", title: folder.name};
      wordlists.forEach(listObj => {
        folderList.length = folderList.length + listObj.words.length;
        folderList.langs = listObj.langs
      });
      const wordlistIds = wordlists.map(list => {return list.id});
      const wordlistItems = await prisma.wordlist_item.findMany({
        where: {
          wordlistId: {
            in: wordlistIds,
          },
        },
        include: {
          test_answers: true,
        },
      });
      folderList.words = wordlistItems.sort((prev, next) => {
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
      if (parseInt(id) === folder.userId) {
        res.status(200).json({ success: true, msg: "Here is your folderList!", wordlist: folderList });
      } else {
        res.status(401).json({ success: false, msg: "This folder does not belong to this user!" });
      };
    } else {
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
    const { id, copied, folder } = req.body;
    if (folder) {
      const userId = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
      await prisma.folder.update({
        where: {
          id,
        },
        data: {
          copied: copied+1,
        },
      }).catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
      const newFolder = await prisma.folder.create({
        data: {
          name: folder.name,
          length: folder.length,
          userId: parseInt(userId),
        },
      })
      const newWordlists = folder.wordlists.map(list => {
        list.userId = userId;
        list.upvoted = [];
        list.copied = 0;
        list.folderId = newFolder.id;
        list.private = true;
        delete list.created;
        delete list.id;
        return list;
      });
      await prisma.wordlist.createMany({
        data: [
          ...newWordlists,
        ],
      }).catch(() => res.status(401).json({ success: false, msg: "Error creating new" }));
      const createdWordlists = await prisma.wordlist.findMany({
        where: {
          folderId: newFolder.id,
        },
      }).catch(() => res.status(401).json({ success: false, msg: "Error creating new" })) as any;
      let words = [];
      const folderWordlists = await prisma.wordlist.findMany({
        where: {
          folderId: folder.id,
        },
        include: {
          words: true,
        },
      });
      folderWordlists.forEach(list => {
        const newListId = createdWordlists.filter(ls => {return ls.title===list.title})[0].id;
        list.words.forEach(word => {
          const newWord = {...word};
          newWord.wordlistId = newListId;
          delete newWord.id;
          words.push(newWord);
        });
      })
      await prisma.wordlist_item.createMany({
        data: [
          ...words,
        ],
      }).catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
      res.status(200).json({ success: true, msg: "Successfully added 1 to copied!" });
    } else {
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
    };
  },
);

router.put("/upvote",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const userId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { id, upvoted, wordlists } = req.body;
    const newUpvoted = !upvoted.includes(userId) ? [...upvoted, userId] : upvoted.filter(id => id!==userId);
    if (wordlists) {
      prisma.folder.update({
        where: {
          id,
        },
        data: {
          upvoted: newUpvoted,
        },
      })
      .then((response) => {
      res.status(200).json({ success: true, msg: "Successfully upvoted!", response })})
      .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
    } else {
      prisma.wordlist.update({
        where: {
          id,
        },
        data: {
          upvoted: newUpvoted,
        },
      })
      .then((response) => {
      res.status(200).json({ success: true, msg: "Successfully upvoted!", response })})
      .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
    };
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

router.get("/folderByIdExplore",
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
    res.status(200).json({ success: true, msg: "Here is your folder", folder, user: id });
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
      res.status(200).json({ success: true, msg: "Here is your folder", folder, user: id });
    } else {
      res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    };
  },
);

router.get("/publicFolders",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    let folders = await prisma.folder.findMany()
    .catch(err => {
      res.status(401).json({ success: false, msg: "No Folder Found!" });
    }) as any;
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
    })
    .catch(err => {
      res.status(401).json({ success: false, msg: "No users Found!" });
    });
    folders&&users ? folders.forEach(folder => {
      folder.user = users.filter(user => {return user.id === folder.userId})[0];
    }) : folders = [];
    res.status(200).json({ success: true, msg: "Here are public folders", folders });
  },
);

router.put("/updateFolder",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const { folderId, idArray } = req.body;
    const folder = await prisma.folder.findUnique({
      where: {
        id: parseInt(folderId),
      },
      include: {
        wordlists: true,
      },
    });
    if (parseInt(id)!==folder.userId) {
      res.status(401).json({ success: false, msg: "That folder doesn't belong to you!" });
    } else {
      const updateFolder = prisma.folder.update({
        where: {
          id: parseInt(folderId),
        },
        data: {
          length: idArray.length,
        },
      })
      .catch(err => {
        res.status(401).json({ success: false, msg: "No Folder Found!" });
      });
      const currentlyAdded = folder.wordlists.map(list => {return list.id});
      const toDelete = currentlyAdded.filter(id => {return !idArray.includes(id)});
      const toAdd = idArray.filter(id => {return !currentlyAdded.includes(id)});
      const removeWordlists = prisma.wordlist.updateMany({
        where: {
          id: {in: toDelete},
        },
        data: {
          folderId: null,
        },
      })
      .catch(err => {
        res.status(401).json({ success: false, msg: "error removing" });
      });
      const addWordlists = prisma.wordlist.updateMany({
        where: {
          id: {in: toAdd},
        },
        data: {
          folderId: parseInt(folderId),
        },
      })
      .catch(err => {
        res.status(401).json({ success: false, msg: "error adding" });
      });
      await Promise.all([updateFolder, removeWordlists, addWordlists]);
      res.status(200).json({ success: true, msg: "Here is your folder", folder });
    };
  },
);

router.get("/noFolderLists",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlists = await prisma.wordlist.findMany({
      where: {
        folderId: null,
        userId: parseInt(id as string),
      },
    }).catch(err => {
      res.status(401).json({ success: false, msg: "No lists Found!" });
    });
    res.status(200).json({ success: true, msg: "Here are your folderless wordlists", wordlists });
  },
);

router.delete("/deleteFolder",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const folder = await prisma.folder.findMany({
      where: {
        id: parseInt(req.query.folderId as string),
        userId: parseInt(id),
      },
      include: {
        wordlists: true,
      },
    }).catch(err => {
      return res.status(401).json({ success: false, msg: "You don't own this folder!" });
    }) as any;
    if (folder.wordlists&&folder.wordlists.length) {
      const idArray = folder.wordlists.map(list => {return list.id});
      await prisma.wordlist.updateMany({
        where: {
          id: {in: idArray}
        },
        data: {
          folderId: null,
        },
      });
    };
    
    await prisma.folder.delete({
      where: {
        id: parseInt(req.query.folderId as string),
      },
    });

    res.status(200).json({ success: true, msg: "Successfully deleted folder!" });
  },
);

router.put("/privatize",
passport.authenticate("jwt", {session: false}),
async (req, res, next) => {
  const { id, priv } = req.body;
  prisma.wordlist.update({
    where: {
      id,
    },
    data: {
      private: !priv,
    },
  })
  .then((response) => {
  res.status(200).json({ success: true, msg: "Successfully privatized!", response })})
  .catch(() => res.status(401).json({ success: false, msg: "Error contacting database!" }));
  },
);

router.delete("/stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    const ownedLists = await prisma.wordlist.findMany({
      where: {
        userId: parseInt(id),
      },
      include: {
        words: true,
      },
    }) as any;
    let listOfWords = [];
    ownedLists.forEach(list => listOfWords = [...listOfWords, ...list.words]);
    const listItemIds = listOfWords.map(wordlistItem => {return wordlistItem.id});
    const wordlistItems = await prisma.wordlist_item.findMany({
      where: {
        id: {in:listItemIds},
      },
      include: {
        test_answers: true,
      },
    }) as any;
    let listOfAnswers = [];
    wordlistItems.forEach(item => listOfAnswers = [...listOfAnswers, ...item.test_answers]);
    const answerIds = listOfAnswers.map(answer => {return answer.id});
    await prisma.test_answer.deleteMany({
      where: {
        id: {in:answerIds},
      },
    }).catch(err => {return res.status(403).json({ success: false, msg: "Failed to delete stats"})});
    res.status(200).json({ success: true, msg: "Successfully deleted stats!" });
  },
);

router.get("/study",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    let folderId = parseInt(req.query.folderId as string);
    if (folderId) {
      const wordlists = await prisma.wordlist.findMany({
        where :{
          folderId,
        },
        include: {
          words: true,
        },
      });
      const folder = await prisma.folder.findUnique({
        where: {
          id: folderId,
        },
      });
      let folderList = {words: [], userId: folder.userId, length: 0, langs: "english-english", title: folder.name};
      wordlists.forEach(listObj => {
        folderList.length = folderList.length + listObj.words.length;
        folderList.langs = listObj.langs
      });
      const wordlistIds = wordlists.map(list => {return list.id});
      const wordlistItems = await prisma.wordlist_item.findMany({
        where: {
          wordlistId: {
            in: wordlistIds,
          },
        },
        include: {
          test_answers: true,
        },
      });
      folderList.words = wordlistItems.filter((item) => {
        const score = item.test_answers.reduce((acc, cur) => {
          if (cur.correct_percentage<100) return acc-((100-cur.correct_percentage)/100);
          return acc+cur.correct_percentage/100;
        }, 0);
        if (score>0.99) return false;
        return true;
      }).sort((prev, next) => {
        let prevScore = 0;
        let nextScore = 0;
        prev.test_answers.forEach(ans => {
          if (ans.correct) {
            prevScore++;
          } else prevScore = prevScore - ((100-ans.correct_percentage)/100);  
        });
        next.test_answers.forEach(ans => {
          if (ans.correct) {
            nextScore++;
          } else nextScore = nextScore - ((100-ans.correct_percentage)/100); 
        });
        return prevScore - nextScore;
      });
      folderList.length = folderList.words.length;
      if (parseInt(id) === folder.userId) {
        res.status(200).json({ success: true, msg: "Here is your folderList!", wordlist: folderList });
      } else {
        res.status(401).json({ success: false, msg: "This folder does not belong to this user!" });
      };
    } else {
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
      wordlist.words = wordlistItems.filter((item) => {
        const score = item.test_answers.reduce((acc, cur) => {
          if (cur.correct_percentage<100) return acc-((100-cur.correct_percentage)/100);
          return acc+cur.correct_percentage/100;
        }, 0);
        if (score>0.99) return false;
        return true;
      }).sort((prev, next) => {
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
    };
  },
);

export default router;
