import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from "cors";
import passport from 'passport';
import userAPIRouter from "./routes/userAPI";
import passportConfig from "./config/passport";

const app = express();

// Passport
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({origin:"https://memlet-frontend.vercel.app"}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/", userAPIRouter);
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).send("error")
});

export default app;
