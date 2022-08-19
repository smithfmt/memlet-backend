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
exports.checkAnswer = void 0;
const helpers_1 = require("../helpers");
const prisma_1 = __importDefault(require("../libs/prisma"));
const checkAnswer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { answer, correct, wordlistItemId } = req.body;
    const result = (0, helpers_1.compare)(answer, correct);
    let isCorrect = false;
    if (result[1] === 100) {
        isCorrect = true;
    }
    ;
    try {
        yield prisma_1.default.test_answer.create({
            data: {
                answer,
                correct_answer: correct,
                correct: isCorrect,
                correct_percentage: result[1],
                wordlistItemId,
            },
        });
        res.status(200).json({ success: true, msg: "Here is your result!", result });
    }
    catch (e) {
        res.status(401).json({ success: false, msg: "error contacting DB", error: e });
    }
    ;
});
exports.checkAnswer = checkAnswer;
exports.default = {
    checkAnswer: exports.checkAnswer,
};
