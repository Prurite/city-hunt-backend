var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var AlertSchema = new Schema({
  uid: {type: String, required: true },
  date: {type: Date, required: true },
  content: {type: String, required: true }
})

// Return the time in hh:mm:ss format
AlertSchema.virtual("time").get(function () {
  return this.date.toTimeString().split(' ')[0];
});

module.exports = mongoose.model("Alert", AlertSchema);