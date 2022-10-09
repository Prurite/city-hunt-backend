var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  uid: {type: String, required: true },
  password: {type: String, required: true },
  type: {type: String, required: true }
})

module.exports = mongoose.model("User", UserSchema);