const express = require("express"),
      app = express(),
      http = require("http").Server(app),
      fileUpload = require("express-fileupload"),
      logger = require("morgan"),
      helmet = require("helmet"),
      path = require("path"),
      mongoose = require("mongoose");
const config = require("./config.json");
const router = require("./routes/router");

global.io = require("socket.io")(http);

mongoose.connect(config.db_url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(logger(config.dev ? "dev" : "tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(fileUpload());

app.use("/", router);
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

/* app.use((err, req, res, next) => {
  if (!err)
    next(createError(404));
}); */

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = config.dev ? err : {};
  res.status(err.status || 500);
  res.send(err.toString());
});

var port = parseInt(config.port);
http.listen(port, config.hostname, () => {
  console.log(`CityHunt is listening on ${config.hostname}:${port}...`);
});
