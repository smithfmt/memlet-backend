import express from 'express';
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
app.use(cors());
app.all('/*', (req, res, next) => {
  console.log("ADDING HEADER")
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.use(logger('dev'));
app.use(express.json());
app.use("/", userAPIRouter);

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err)
  // render the error page
  res.status(err.status || 500).send("error")
});

app.listen(7000, () => {
  console.log("Running on port 7000.");
});

export default app;
