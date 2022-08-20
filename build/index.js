"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const userAPI_1 = __importDefault(require("./api/userAPI"));
const passport_2 = __importDefault(require("./config/passport"));
const app = (0, express_1.default)();
// Passport
(0, passport_2.default)(passport_1.default);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, cors_1.default)());
app.all('/*', (req, res, next) => {
    console.log("ADDING HEADER");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use("/", userAPI_1.default);
// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    console.log(err);
    // render the error page
    res.status(err.status || 500).send("error");
});
app.listen(7000, () => {
    console.log("Running on port 7000.");
});
exports.default = app;
