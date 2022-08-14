const compare = require("../helpers").compare;
const prisma = require("../libs/prisma");
//const jwt = require("jsonwebtoken");

exports.checkAnswer = async (req, res, next) => {
    //const authorId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { answer, correct, wordlistItemId } = req.body;
    const result = compare(answer, correct);
    let isCorrect = false;
    if (result[1]===100) {isCorrect=true}; 
    await prisma.test_answer.create({
        data: {
            answer,
            correct_answer: correct,
            correct: isCorrect,
            correct_percentage: result[1],
            wordlistItemId,
            //authorId,
        },
    });
    //if (id === wordlist.userId) {
        res.status(200).json({ success: true, msg: "Here is your result!", result });
    // } else {
    //     res.status(401).json({ success: false, msg: "There was a problem submitting your result" });
    // };
};