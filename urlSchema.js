var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

var Url = mongoose.model("Url", urlSchema);

module.exports = Url;
