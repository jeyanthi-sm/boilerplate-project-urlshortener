require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
//added these lines
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const dns = require("dns");
const url = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let shorturlSchema = new mongoose.Schema({
  original_url: { type: String, required: true, unique: false },
  short_url: { type: Number, required: true },
});
let Shorturl = mongoose.model("Shorturl", shorturlSchema);

const isValidUrl = (inpUrl) => {
  try {
    const newUrl = new URL(inpUrl);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (e) {
    return false;
  }
};

const createAndSaveShortUrl = (inputUrl, done) => {
  console.log(isValidUrl(inputUrl));
  let shortUrlNextVal = 1;
  console.log("inside createAndSaveShortUrl");
  if (isValidUrl(inputUrl)) {
    let sortShortUrl = Shorturl.findOne()
      .sort("-short_url")
      .exec(function (err, data) {
        console.log("execute inside");
        console.log(data);
        if (err) return console.log(err);
        if (!err && data !== undefined && data !== null) {
          console.log(data["short_url"]);
          shortUrlNextVal = data["short_url"] + 1;
        } else shortUrlNextVal = 1;

        console.log(`shortUrlNextVal is ${shortUrlNextVal}`);
        let shortUrl = new Shorturl({
          original_url: inputUrl, //"https://freeCodeCamp.org",
          short_url: shortUrlNextVal,
        });
        shortUrl.save(function (err, data) {
          if (err) return console.error(err);
          done(null, data);
        });
      });
  }

  /*Shorturl.find({ short_url: shortUrl }, function (err, data) {
    if (err) return console.log(err);
    done(null, data);
  });
  */
};

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});
const TIMEOUT = 10000;

const findshortUrlByshortUrl = (shortUrl, done) => {
  console.log(`shortUrl is ${shortUrl}`);
  if (shortUrl !== undefined && isNaN(shortUrl) === false) {
    Shorturl.find({ short_url: shortUrl }, function (err, data) {
      if (err) return console.log(err);
      done(null, data);
    });
  }
};

app.get("/api/shorturl/:shortUrl", function (req, res, next) {
  /*let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
*/
  console.log("Inside get");
  console.log(req.params);

  findshortUrlByshortUrl(req.params.shortUrl, function (err, data) {
    //  clearTimeout(t);
    if (err) {
      return next(err);
    }
    if (!data) {
      console.log("Missing `done()` argument");
      return next({ message: "Missing callback argument" });
    }
    console.log(data[0]["original_url"]);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin,X-Requested-With,Content-Type,Accept"
    );
    res.redirect(data[0]["original_url"]);
    //res.json(data);
  });
});

let bodyParser = require("body-parser");
// Your POST API endpoint
app.post(
  "/api/shorturl/",
  bodyParser.urlencoded({ extended: false }),
  function (req, res) {
    // in case of incorrect function use wait timeout then respond
    /*let t = setTimeout(() => {
    next({ message: "timeout" });
  }, TIMEOUT);
  */
    let inputUrl = req.body["url"];
    if (isValidUrl(inputUrl)) {
      createAndSaveShortUrl(inputUrl, function (err, data) {
        //clearTimeout(t);
        if (err) {
          return next(err);
        }
        if (!data) {
          console.log("Missing `done()` argument");
          return next({ message: "Missing callback argument" });
        }
        let query = Shorturl.findById(data._id);
        query.select({ _id: 0, original_url: 1, short_url: 1 });
        query.exec(function (err, shorturs) {
          if (err) {
            //return next(err);
            console.log(err);
          }
          console.log(shorturs);
          res.json({
            original_url: shorturs.original_url,
            short_url: shorturs.short_url,
          });
        });
      });

      //createAndSavePerson
      //res.json({ original_url: "https://freeCodeCamp.org", short_url: 1 });
      //res.json({ greeting: "hello API" });
    } else res.json({ error: "invalid url" });
  }
);
//http://localhost:3000/api/shorturl/1

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
