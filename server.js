require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Url = require("./urlSchema");
const dns = require("dns");
const url = require("url");
const valid = require("validator");

app.use(bodyParser.urlencoded());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

mongoose
  .connect(process.env.DB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("connected");
  }) 
  .catch((err) => {
    console.log(err)
  })

app.post("/api/shorturl/new", async function (req, res) {
  const isValid = (url) => {
    var objUrl = new URL(req.body.url);

    if (
      valid.isURL(req.body.url) &&
      dns.lookup(objUrl.hostname, (err, address, family) => {
        if (err) {
          return false;
        } else {
          return true;
        }
      })
    ) {
      return true;
    } else {
      return false;
    }
  };

  if (isValid(req.body.url)) {
    await Url.findOne(
      { original_url: req.body.url },
      { original_url: 1, short_url: 1, _id: 0 }
    ).then(async (resp) => {
      if (resp) {
        res.json(resp);
      } else {
        var count = await Url.estimatedDocumentCount(); // using count as unique id for shortUrl as i am not deleting any urls ... otherwise i could have used auto-incremnet package
        const url = new Url({
          original_url: req.body.url,
          short_url: count,
        });

        url.save((err, response) => {
          if (err) console.log(err);
          else {
            res.send({
              original_url: response.original_url,
              short_url: response.short_url,
            });
          }
        });
      }
    });
  } else {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:id", async (req, res) => {
  const short_url = parseInt(req.params.id);

  await Url.findOne({ short_url }).then((resp) => {
    if (resp) {
      res.redirect(resp.original_url);
    } else {
      res.json({
        error: "No short URL found for the given input",
      });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
