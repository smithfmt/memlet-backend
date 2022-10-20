import { compare } from "../helpers";
import prisma from "../libs/prisma";
import jwt from "jsonwebtoken";

export const checkAnswer = async (req, res, next) => {
    const { answer, correct, wordlistItemId, langs, strict } = req.body;
    const result = compare(answer, correct, langs, strict);
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub as string;
    let isCorrect = false;
    if (result[1]===100) {isCorrect=true};
    try {
        await prisma.test_answer.create({
            data: {
                answer,
                correct_answer: correct,
                correct: isCorrect,
                correct_percentage: result[1] as number,
                wordlistItemId,
                userId: parseInt(id),
            },
        });
        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(id),
            },
            include: {
                testAnswers: true,
            }
        });
        console.log("USER", user)
        const testAnswerList = user.testAnswers.map(ans => {return {id: ans.id, created: ans.created}}).sort((a,b) => {return a.created.getTime()-b.created.getTime()});
        console.log("testAnswerList", testAnswerList)
        if (testAnswerList.length>500) {
            const toDelete = testAnswerList.slice(0,testAnswerList.length-500).map(obj => {return obj.id})
            console.log("toDelete",toDelete)
            await prisma.test_answer.deleteMany({
                where: {
                    id: {in: toDelete}
                },
            });
        };
        res.status(200).json({ success: true, msg: "Here is your result!", result });
    } catch (e) {
        res.status(401).json({ success: false, msg: "error contacting DB", error: e })
    };
};

export default {
    checkAnswer,
};