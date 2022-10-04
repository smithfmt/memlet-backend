import { compare } from "../helpers";
import prisma from "../libs/prisma";

export const checkAnswer = async (req, res, next) => {
    const { answer, correct, wordlistItemId, langs, strict } = req.body;
    const result = compare(answer, correct, langs, strict);
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
            },
        });
        res.status(200).json({ success: true, msg: "Here is your result!", result });
    } catch (e) {
        res.status(401).json({ success: false, msg: "error contacting DB", error: e })
    };
};

export default {
    checkAnswer,
};